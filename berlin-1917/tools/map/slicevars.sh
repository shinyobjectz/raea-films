#!/bin/bash
# Sourced by the map tools: where a slice's inputs and products live. A city sheet shares one tile cache.
#   cache  cache/<.cache or .name>: tile rasters, predictions, ALKIS tiles and terrain zips
#   own    the slice's own products (the cache itself, or cache/sheets/<name> for a sheet sharing a cache)
#   map    the 1917 layers it writes (.out, default map/1917)
# usage: source slicevars.sh; slice_vars SLICE.json
slice_vars() {
  local slice=$1 root shared
  root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
  name=$(jq -r .name "$slice")
  shared=$(jq -r '.cache // empty' "$slice")
  cache=$root/cache/${shared:-$name}
  own=$cache
  [[ -n $shared ]] && own=$cache/sheets/$name
  map=$root/$(jq -r '.out // "map/1917"' "$slice")
  mkdir -p "$own" "$map"
  read -r X0 Y0 X1 Y1 < <(jq -r '.bbox | @tsv' "$slice")
}
