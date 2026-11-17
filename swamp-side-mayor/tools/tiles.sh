#!/bin/bash
# tools/tiles.sh: the cutaway's two tiles (film.tsx#tile-frog, #tile-heron), their own renders, into assets/tiles/<w>
# for the frames the cutaway is on (plan.ts TILES). Run it after anything the tiles show changes (v8: v7's tiles were
# never rendered again and kept v6's logo and the heron out of frame: the director 11-16).
cd "$(dirname "$0")/.." || exit 1
R=out/tiles; mkdir -p "$R"
# (the frame files only: a stray render.json there once emptied Z, and seq counted down from A to 0)
A=$(ls assets/tiles/frog | grep -E '^f[0-9]+\.png$' | head -1 | tr -dc 0-9 | sed 's/^0*//'); Z=$(ls assets/tiles/frog | grep -E '^f[0-9]+\.png$' | tail -1 | tr -dc 0-9 | sed 's/^0*//')
[ -n "$A" ] && [ -n "$Z" ] && [ "$Z" -ge "$A" ] || { echo "no tile frames in assets/tiles/frog ($A-$Z)"; exit 1; }
# in calls of 15 frames: a tile call's memory grew with its frames (9 GB at 50, v8), and the Mac is shared
for w in frog heron; do for a in $(seq "$A" 15 "$Z"); do z=$((a + 14 > Z ? Z : a + 14)); find "${R:?}" -name '*.png' -delete
  raea render compositions/film.tsx --composition "tile-$w" --at "$(seq "$a" "$z" | paste -sd, -)" -o "$R/" > "$R/render.log" 2>&1 < /dev/null
  GOT=$(ls "$R"/frame-*.png 2>/dev/null); [ "$(echo "$GOT" | grep -c png)" -eq $((z-a+1)) ] || { echo "FAILED: tile-$w $a-$z gave $(echo "$GOT" | grep -c png)"; tail -5 "$R/render.log"; exit 1; }
  k=0; for f in $(seq "$a" "$z"); do k=$((k+1)); mv "$(echo "$GOT" | sed -n "${k}p")" "assets/tiles/$w/f$(printf %05d "$f").png" || exit 1; done
  echo "tile-$w: frames $a-$z"
done; done
