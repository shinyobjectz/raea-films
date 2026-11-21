#!/usr/bin/env bash
# The slice's listed monuments (Denkmalkarte WFS, dl-de/zero-2.0) and each one's entry in the Denkmaldatenbank
# (title, date, designer, description), for denkmale.ts to read materials from. The entry texts are the Landesdenkmalamt's
# writing: kept in cache/ for reading facts off them, never shipped. Polite: one request at a time, each page once.
#   tools/map/denkmale.sh            -> cache/denkmale/slice.json, cache/denkmale/pages/ID.html
#   tools/map/denkmale.sh SHEET.json -> cache/denkmale/sheets/NAME.json (a city sheet), the same pages
set -euo pipefail
cd "$(dirname "$0")/../.."
slice=${1:-tools/map/slice.json}
read -r X0 Y0 X1 Y1 < <(jq -r '.bbox | map(tostring) | join(" ")' "$slice")
list=cache/denkmale/slice.json
if [[ -n ${1:-} ]]; then mkdir -p cache/denkmale/sheets; list=cache/denkmale/sheets/$(jq -r .name "$slice").json; fi
mkdir -p cache/denkmale/pages
[ -s "$list" ] || curl -sf -A "map-research/1.0" "https://gdi.berlin.de/services/wfs/denkmale?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=denkmale:denkmale&OUTPUTFORMAT=application/json&SRSNAME=EPSG:25833&BBOX=$X0,$Y0,$X1,$Y1,EPSG:25833&COUNT=5000" -o "$list"
n=0
for id in $(jq -r '[.features[].properties.id] | unique | .[]' "$list"); do
  [ -s "cache/denkmale/pages/$id.html" ] && continue
  curl -sf --retry 3 -A "map-research/1.0" "https://denkmaldatenbank.berlin.de/daobj.php?obj_dok_nr=$id" -o "cache/denkmale/pages/$id.html" || echo "failed $id"
  n=$((n + 1)); echo "$n $id"
done
echo "pages: $(ls cache/denkmale/pages | wc -l)"
