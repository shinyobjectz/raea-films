#!/bin/bash
# Fetches every source for one slice into cache/<slice>/. Files already there are kept, so a rerun only fills gaps.
#   rasters/<key>/<tile>.<ext>  WMS GetMap per tile (layers and resolution from slice.json)
#   alkis/<tile>.json           ALKIS buildings of today (WFS), per tile
#   ohm.json                    OpenHistoricalMap ways and relations with dates (Overpass)
#   boreholes.json              borehole points (WFS bohrdaten)
#   dgm1/DGM1_<x>_<y>.zip       1 m terrain, 2 km tiles (ATOM)
# usage: fetch.sh [SLICE.json] [rasters|alkis|ohm|boreholes|dgm1 ...]
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
slice=$here/slice.json
if [[ ${1:-} == *.json ]]; then slice=$1; shift; fi
parts=("$@")
[[ ${#parts[@]} -gt 0 ]] || parts=(rasters alkis ohm boreholes dgm1)
source "$here/slicevars.sh"
slice_vars "$slice"
gdi=https://gdi.berlin.de

fetch_rasters() {
  local n
  n=$(jq '.rasters | length' "$slice")
  for ((i = 0; i < n; i++)); do
    read -r key svc layer mpp ext < <(jq -r ".rasters[$i] | [.key, .svc, .layer, .mpp, .ext] | @tsv" "$slice")
    mkdir -p "$cache/rasters/$key"
    "$here/tiles.sh" "$slice" | while read -r id x0 y0 x1 y1; do
      out=$cache/rasters/$key/$id.$ext
      [[ -s $out ]] || echo "$svc $layer $x0 $y0 $x1 $y1 $mpp $out"
    done
  done | xargs -P 4 -L 1 "$here/wms.sh"
}

# One WFS GetFeature as GeoJSON in EPSG:25833, paged so no server limit cuts it short.
wfs() { # SERVICE TYPENAME X0 Y0 X1 Y1 OUT
  local svc=$1 type=$2 out=$7 page=0 size=5000 got
  local bbox="$3,$4,$5,$6,urn:ogc:def:crs:EPSG::25833"
  local tmp=$out.part
  echo '[]' > "$tmp"
  while :; do
    curl -sS -m 180 --fail -o "$tmp.page" "$gdi/services/wfs/$svc?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=$type&SRSNAME=urn:ogc:def:crs:EPSG::25833&BBOX=$bbox&COUNT=$size&STARTINDEX=$((page * size))&OUTPUTFORMAT=application/json"
    got=$(jq '.features | length' "$tmp.page")
    jq -s '.[0] + .[1].features' "$tmp" "$tmp.page" > "$tmp.next" && mv "$tmp.next" "$tmp"
    [[ $got -lt $size ]] && break
    page=$((page + 1))
  done
  jq '{type: "FeatureCollection", features: .}' "$tmp" > "$out"
  rm -f "$tmp" "$tmp.page"
  echo "ok $out $(jq '.features | length' "$out") features"
}

fetch_alkis() { # four tiles at a time
  mkdir -p "$cache/alkis"
  export -f wfs
  export gdi
  "$here/tiles.sh" "$slice" | while read -r id x0 y0 x1 y1; do
    [[ -s $cache/alkis/$id.json ]] || echo "$x0 $y0 $x1 $y1 $cache/alkis/$id.json"
  done | xargs -P 4 -L 1 bash -c 'wfs alkis_gebaeude alkis_gebaeude:gebaeude "$@"' _
}

fetch_boreholes() {
  [[ -s $own/boreholes.json ]] || wfs bohrdaten bohrdaten:bohrpunkte "$X0" "$Y0" "$X1" "$Y1" "$own/boreholes.json"
}

fetch_ohm() {
  [[ -s $own/ohm.json ]] && return
  # The slice's corners in lon/lat, widened by 50 m so ways crossing the edge come whole.
  local ll
  ll=$(duckdb -noheader -list -c "LOAD spatial; WITH c AS (SELECT ST_Transform(ST_Point(x, y), 'EPSG:25833', 'EPSG:4326', always_xy := true) AS p FROM (VALUES ($X0 - 50, $Y0 - 50), ($X1 + 50, $Y1 + 50)) v(x, y)) SELECT string_agg(printf('%.6f,%.6f', ST_Y(p), ST_X(p)), ',') FROM c;")
  local s w n e
  IFS=, read -r s w n e <<< "$ll"
  local q="[out:json][timeout:180];(nwr[building]($s,$w,$n,$e);way[highway]($s,$w,$n,$e);way[railway]($s,$w,$n,$e);nwr[waterway]($s,$w,$n,$e);nwr[natural=water]($s,$w,$n,$e);nwr[landuse]($s,$w,$n,$e);nwr[leisure]($s,$w,$n,$e);nwr[amenity]($s,$w,$n,$e);nwr[historic]($s,$w,$n,$e););out geom;"
  curl -sS -m 240 --fail --data-urlencode "data=$q" -o "$own/ohm.json.part" https://overpass-api.openhistoricalmap.org/api/interpreter
  mv "$own/ohm.json.part" "$own/ohm.json"
  echo "ok $own/ohm.json $(jq '.elements | length' "$own/ohm.json") elements"
}

fetch_dgm1() {
  mkdir -p "$cache/dgm1"
  local x y f
  for ((y = Y0 / 2000 * 2000; y < Y1; y += 2000)); do
    for ((x = X0 / 2000 * 2000; x < X1; x += 2000)); do
      f=DGM1_$((x / 1000))_$((y / 1000)).zip
      [[ -s $cache/dgm1/$f ]] && continue
      curl -sS -m 300 --fail -o "$cache/dgm1/$f.part" "$gdi/data/dgm1/atom/$f" && mv "$cache/dgm1/$f.part" "$cache/dgm1/$f"
      echo "ok $cache/dgm1/$f $(wc -c < "$cache/dgm1/$f" | tr -d ' ') bytes"
    done
  done
}

for p in "${parts[@]}"; do "fetch_$p"; done
echo "cache: $(du -sh "$cache" | cut -f1) in $cache"
