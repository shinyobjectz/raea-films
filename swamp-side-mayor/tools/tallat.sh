#!/bin/bash
# tools/tallat.sh DIR F,F,...[ F,F,...]: stills of the 9:16 (film.tsx#goose-9x16) at those film frames, one render call per
# comma list (start a new list where the look changes: under the water and back), named DIR/fNNNNN.png
cd "$(dirname "$0")/.." || exit 1
D=${1:?dir}; shift; mkdir -p "$D"
n=0; for set in "$@"; do c="$D/c$n"; mkdir -p "${c:?}"; find "${c:?}" -name '*.png' -delete
  have=1; for f in $(echo "$set" | tr , ' '); do [ -f "$D/f$(printf %05d $f).png" ] || have=0; done; [ $have = 1 ] && { echo "kept $set"; n=$((n+1)); continue; }
  raea render compositions/film.tsx --composition goose-9x16 --at "$set" -o "$c/" > "$c.log" 2>&1 < /dev/null || { tail -5 "$c.log"; exit 1; }
  i=0; for f in $(echo "$set" | tr , ' '); do mv "$c/frame-$(printf %05d $i).png" "$D/f$(printf %05d $f).png"; i=$((i+1)); done; n=$((n+1)); echo "rendered $set"; done
echo "stills in $D"
