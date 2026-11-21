#!/bin/bash
# The whole of Straube's 1910 plan, as sheets of up to 7 x 7 tiles (3.5 km) on the friedrichstadt slice's grid, so
# friedrichstadt is one of them and keeps its own survey checks. Each sheet shares the city's tile cache
# (cache/berlin: rasters, reader predictions, ALKIS tiles, terrain) and writes its layers to map/1917/sheets/<name>/.
#   city.sh sheets               write sheets/<name>.json (friedrichstadt is slice.json and not repeated)
#   city.sh run STEP [P] [NAME..] run a step over every sheet (or the named ones), P at a time (default 3): trace, fetch, build, ground,
#                                use1910, outside, skeleton, heights, ground1917, landmarks, trees, soil, surfaces, graybox (in that order, as
#                                rebuild.sh runs friedrichstadt's); each prints "<sheet> ok" or "<sheet> FAILED <log>"
#   city.sh merge                every sheet's layers (and friedrichstadt's) into map/1917/city/*.parquet
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
xs=(384400 385900 389400 392900 396400 398400)
ys=(5814800 5817300 5820800 5824300 5826800)

sheets() {
  mkdir -p "$here/sheets"
  local i j n=0
  for ((j = 0; j + 1 < ${#ys[@]}; j++)); do
    for ((i = 0; i + 1 < ${#xs[@]}; i++)); do
      local x0=${xs[i]} y0=${ys[j]} x1=${xs[i + 1]} y1=${ys[j + 1]}
      [[ $x0 == 389400 && $y0 == 5817300 ]] && continue # friedrichstadt
      local name=s-$((x0 / 100))-$((y0 / 100))
      jq -n --arg name "$name" --argjson b "[$x0, $y0, $x1, $y1]" --slurpfile city "$here/berlin.json" \
        '{name: $name, cache: "berlin", crs: "EPSG:25833", bbox: $b, tile: 500, out: ("map/1917/sheets/" + $name),
          align: "../../cache/berlin/align_straube_alkis.json", berlin1900: "../../cache/friedrichstadt/berlin1900",
          note: "A sheet of the city: the scan offset is the city'"'"'s (align.ts berlin.json, one field for every sheet so seams agree); the 1900 vectors are friedrichstadt'"'"'s.",
          rasters: $city[0].rasters}' > "$here/sheets/$name.json"
      n=$((n + 1))
    done
  done
  echo "$n sheets in $here/sheets"
}

step() { # STEP SHEET.json
  local s=$2 name
  name=$(jq -r .name "$s")
  case $1 in
    trace) "$here/trace.sh" "$s" ;;
    fetch) "$here/fetch.sh" "$s" ohm boreholes ;;
    build) "$here/build.sh" "$s" ;;
    ground) "$here/ground.sh" "$s" ;;
    ground1917) bun "$here/ground1917.ts" "$s" ;;
    use1910) [[ -s $root/map/1917/sheets/$name/open.geojson ]] && bun "$here/use1910.ts" "$s" && "$here/beyond.sh" "$s" || [[ ! -s $root/map/1917/sheets/$name/open.geojson ]] ;; # build.sh's last steps again, alone (none on a blank sheet)
    outside) "$here/outside.sh" "$s" ;; # build.sh's last step again, alone (a sheet the plan leaves blank starts from empty layers)
    bands) "$here/bands.sh" "$s" ;; # after outside: the plan's misread pieces of the Hochbahn and its station halls off its band
    stations) "$here/stations.sh" "$s" ;; # after bands: the Hochbahn's own station buildings beside the deck, stair houses held
    skeleton) bun "$here/skeleton.ts" "$s" ;;
    denkmale) bash "$here/denkmale.sh" "$s" && bun "$here/denkmale.ts" "$s" ;; # P=1, pages one at a time; a sheet prints only to its log, so give antsy a --stall over a sheet's fetch
    heights) bun "$here/heights.ts" "$s" ;;
    landmarks) bun "$here/landmarks.ts" "$s" ;;
    trees) bun "$here/trees.ts" "$s" ;;
    shops) bun "$here/shops.ts" "$s" ;;
    soil) bun "$here/soil.ts" "$s" ;;
    checkstreets) bun "$here/checkstreets.ts" "$s" ;; # open ground on OHM's 1917 street centrelines is street
    surfaces) "$here/graybox.sh" "$s" ;;
    graybox) LOD=city bun "$here/graybox.ts" "$s" ;;
    *) echo "unknown step $1" >&2; return 2 ;;
  esac > "$root/cache/berlin/sheets/$name/$1.log" 2>&1
}

run() {
  local what=$1 p=${2:-3}
  shift 2 || shift $#
  local list=("$@")
  ((${#list[@]})) || list=($(cd "$here/sheets" && ls *.json | sed "s/.json$//"))
  export -f step
  export here root
  export what
  # macOS xargs -I caps the command it builds at 255 bytes, so each sheet comes in as $1.
  printf "$here/sheets/%s.json\n" "${list[@]}" | xargs -P "$p" -n 1 bash -c '
    s=$1; name=$(jq -r .name "$s"); mkdir -p "$root/cache/berlin/sheets/$name"
    if step '"$what"' "$s"; then echo "$name ok"; else echo "$name FAILED $root/cache/berlin/sheets/$name/'"$what"'.log"; fi' _
}

merge() {
  local out=$root/map/1917/city
  mkdir -p "$out"
  local layer
  for layer in buildings open water green rail labels shops; do
    # by column name: friedrichstadt carries columns the sheets lack (heights, lots, institutions), NULL elsewhere
    local parts=() d
    [[ -s $root/map/1917/$layer.geojson ]] && parts+=("SELECT 'friedrichstadt' AS sheet, * FROM ST_Read('$root/map/1917/$layer.geojson')")
    for d in "$root"/map/1917/sheets/*/; do
      [[ -s $d/$layer.geojson ]] && parts+=("SELECT '$(basename "$d")' AS sheet, * FROM ST_Read('$d/$layer.geojson')")
    done
    [[ ${#parts[@]} -gt 0 ]] || continue
    {
      printf "LOAD spatial; CREATE TABLE t AS %s" "${parts[0]}"
      [[ ${#parts[@]} -gt 1 ]] && printf "\nUNION ALL BY NAME %s" "${parts[@]:1}"
      echo ";"
      echo "COPY t TO '$out/$layer.parquet' (FORMAT parquet, COMPRESSION zstd);"
      echo "SELECT '$layer' AS layer, count(*) AS n, count(DISTINCT sheet) AS sheets FROM t;"
    } | duckdb -bail -noheader -list
  done
}

case ${1:-} in
  sheets) sheets ;;
  run) shift; run "$@" ;;
  merge) merge ;;
  *) echo "usage: city.sh sheets | run STEP [P] | merge" >&2; exit 2 ;;
esac
