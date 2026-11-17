#!/bin/bash
# tools/replay.sh OUT.mp4: after a whole render kept its stills (KEEP=1 tools/film.sh), the film in the app's player on
# the big screen is still the last version's. This cuts the player's frames from this render's own stills, pastes them
# into the player captures again (tools/played.ts), renders again only the frames where the player is on screen and
# the lens is over the water (under it the screen isn't drawn), and encodes the picture from out/seq again.
cd "$(dirname "$0")/.." || exit 1
OUT=${1:?out.mp4}; D=out/seq
[ -f "$D/f02696.png" ] || { echo "no kept stills in $D (render with KEEP=1 first)"; exit 1; }
for j in assets/app/film/f*.jpg; do n=$(basename "$j" .jpg); n=${n#f}; magick "$D/f0$n.png" -resize 800x400 -quality 88 "$j" || exit 1; done
find assets/app/played -name '*.png' -delete
bun tools/played.ts || exit 1
AT=$(bun -e 'import { FRAMES, FPS, beatAt, camera, shownAt } from "./compositions/plan"; const a = []; for (let f = 0; f < FRAMES; f++) { const t = f / FPS, s = shownAt(beatAt(t)); if (s?.film && beatAt(t) >= 92 && !camera(t).under) a.push(f); } console.log(a.join(","))')
echo "again: $(echo "$AT" | tr ',' '\n' | wc -l | tr -d ' ') frames"
# one call per unbroken run of frames: a call steps through the frames between the ones it's given, so one call over
# the orbit's dip under the water kept the underwater fog on every frame after it (the note shot came out teal)
R=out/replay; mkdir -p "$R"; i=0
# and, as film.sh does, a frame where the look changes (plan.ts lookCuts: out from under the water) goes alone and a
# call starts after it: a call that began on the frame the orbit came up drew a teal void after it
CUTS=" $(bun -e 'import { lookCuts } from "./compositions/plan"; console.log(lookCuts().join(" "))') "
for run in $(echo "$AT" | tr ',' '\n' | awk -v cuts="$CUTS" 'BEGIN{n=split(cuts,c," "); for(i=1;i<=n;i++) k[c[i]]=1} NR==1{s=$1;p=$1;next} $1!=p+1 || ($1 in k){print s"-"p; s=$1} {p=$1} END{print s"-"p}'); do
  a=${run%-*}; z=${run#*-}; find "${R:?}" -name '*.png' -delete
  raea render compositions/film.tsx --composition goose --at "$(seq "$a" "$z" | paste -sd, -)" -o "$R/" > "$R/render.log" 2>&1 < /dev/null
  GOT=$(ls "$R"/frame-*.png 2>/dev/null); [ "$(echo "$GOT" | grep -c png)" -eq $((z-a+1)) ] || { echo "FAILED: frames $run gave $(echo "$GOT" | grep -c png) stills"; tail -5 "$R/render.log"; exit 1; }
  k=0; for f in $(seq "$a" "$z"); do k=$((k+1)); mv "$(echo "$GOT" | sed -n "${k}p")" "$D/f$(printf %05d "$f").png" || exit 1; i=$((i+1)); done
  echo "frames $run again"
done
echo "replaced $i frames"
ffmpeg -loglevel error -y -framerate 30 -i "$D/f%05d.png" -i assets/music/swamp-side-mayor-90.wav -c:v libx264 -pix_fmt yuv420p -crf 19 -c:a aac -b:a 256k -shortest "$OUT" && echo "wrote $OUT"
