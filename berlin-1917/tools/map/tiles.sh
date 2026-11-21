#!/bin/bash
# Prints one line per tile of a slice: "ID X0 Y0 X1 Y1" (EPSG:25833 metres). ID is X0 and Y0 in hundreds of metres.
# usage: tiles.sh [SLICE.json]
set -euo pipefail
slice=${1:-$(dirname "$0")/slice.json}
read -r x0 y0 x1 y1 t < <(jq -r '[.bbox[], .tile] | @tsv' "$slice")
for ((y = y0; y < y1; y += t)); do
  for ((x = x0; x < x1; x += t)); do
    echo "$((x / 100))_$((y / 100)) $x $y $((x + t)) $((y + t))"
  done
done
