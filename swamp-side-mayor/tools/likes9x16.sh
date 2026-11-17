#!/bin/bash
# tools/likes9x16.sh: the watchers' hero cards for the 9:16 cut (compositions/screens.tsx#likes-*-9x16), a picture per
# film frame of each hero shot (plan.ts S(119), S(120), S(121), as tools/screens.sh renders the wide ones), into
# assets/likes-9x16/<watcher> for film.tsx#goose-9x16.
cd "$(dirname "$0")/.." || exit 1
R=out/screens9; mkdir -p "$R"
for job in deer:2385:2411 heron:2405:2431 frog:2425:2451; do
  IFS=: read -r w a z <<< "$job"; dst="assets/likes-9x16/$w"; mkdir -p "$dst"; find "${R:?}" -name '*.png' -delete
  raea render compositions/screens.tsx --composition "likes-$w-9x16" --at "$(seq "$a" "$z" | paste -sd, -)" -o "$R/" > "$R/render.log" 2>&1 < /dev/null
  GOT=$(ls "$R"/frame-*.png 2>/dev/null); [ "$(echo "$GOT" | grep -c png)" -eq $((z-a+1)) ] || { echo "FAILED: likes-$w-9x16 gave $(echo "$GOT" | grep -c png) of $((z-a+1))"; tail -5 "$R/render.log"; exit 1; }
  k=0; for f in $(seq "$a" "$z"); do k=$((k+1)); mv "$(echo "$GOT" | sed -n "${k}p")" "$dst/f$(printf %05d "$f").png" || exit 1; done
  echo "likes-$w-9x16: $((z-a+1)) frames into $dst"
done
