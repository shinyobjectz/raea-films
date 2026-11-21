#!/usr/bin/env bash
# The whole 1917 map, from the cached sources to map/1917/*.geojson and the checks, in order (each step reads what
# the ones before it wrote). Run it under antsy: about 10 min and 3.3 GB at the peak on the Friedrichstadt slice.
#   bash tools/map/rebuild.sh [SLICE.json]
# Rerun it, and tell the interiors lane (place.ts reads the footprints), whenever buildings change.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
slice=${1:-$here/slice.json}
step() { echo "rebuild: $*" >&2; "$@"; }
step bash "$here/build.sh" "$slice"
step bun "$here/skeleton.ts"
step bun "$here/heights.ts" "$slice"
step bun "$here/ground1917.ts" "$slice"
step bun "$here/landmarks.ts" "$slice"
step bun "$here/lots.ts" "$slice"
step bun "$here/stadtbahn.ts" "$slice"
step bun "$here/bridges.ts" "$slice"
step bun "$here/bridgeparts.ts" "$slice"
step bun "$here/trees.ts" "$slice"
step bun "$here/soil.ts" "$slice"
step bun "$here/soilgrid.ts" "$slice"
step bun "$here/spots.ts" "$slice"
# the monuments joined to the buildings as they now are (lots.ts renumbers them; heights.ts makes its own overlap)
if [[ $slice == "$here/slice.json" ]]; then step bun "$here/denkmale.ts"; else step bun "$here/denkmale.ts" "$slice"; fi
step bash "$here/check.sh" "$slice"
