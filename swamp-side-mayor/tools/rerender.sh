#!/bin/bash
# tools/rerender.sh OUT.mp4 A-B[,C-D...]: renders those frames of the kept render again (out/seq, after KEEP=1
# tools/film.sh) and encodes the picture again. Calls are cut as film.sh cuts them: one per unbroken run, and a frame
# where the look changes (plan.ts lookCuts: under the water and back) alone with a call starting after it, because a
# call steps through every frame between the ones it's given and keeps some of its look from frame to frame.
cd "$(dirname "$0")/.." || exit 1
OUT=${1:?out.mp4}; SPEC=${2:?A-B,...}; D=out/seq; R=out/replay
[ -f "$D/f02696.png" ] || { echo "no kept stills in $D (render with KEEP=1 first)"; exit 1; }
CUTS=" $(bun -e 'import { lookCuts } from "./compositions/plan"; console.log(lookCuts().join(" "))') "
mkdir -p "$R"; n=0
for run in $(echo "$SPEC" | tr ',' '\n' | while IFS=- read -r a z; do seq "$a" "${z:-$a}"; done | sort -n | uniq \
    | awk -v cuts="$CUTS" 'BEGIN{m=split(cuts,c," "); for(i=1;i<=m;i++) k[c[i]]=1} NR==1{s=$1;p=$1;next} $1!=p+1 || ($1 in k){print s"-"p; s=$1} {p=$1} END{print s"-"p}'); do
  a=${run%-*}; z=${run#*-}; find "${R:?}" -name '*.png' -delete
  raea render compositions/film.tsx --composition goose --at "$(seq "$a" "$z" | paste -sd, -)" -o "$R/" > "$R/render.log" 2>&1 < /dev/null
  GOT=$(ls "$R"/frame-*.png 2>/dev/null); [ "$(echo "$GOT" | grep -c png)" -eq $((z-a+1)) ] || { echo "FAILED: frames $run gave $(echo "$GOT" | grep -c png) stills"; tail -5 "$R/render.log"; exit 1; }
  k=0; for f in $(seq "$a" "$z"); do k=$((k+1)); mv "$(echo "$GOT" | sed -n "${k}p")" "$D/f$(printf %05d "$f").png" || exit 1; n=$((n+1)); done
  echo "frames $run again"
done
echo "replaced $n frames"
ffmpeg -loglevel error -y -framerate 30 -i "$D/f%05d.png" -i assets/music/swamp-side-mayor-90.wav -c:v libx264 -pix_fmt yuv420p -crf 19 -c:a aac -b:a 256k -shortest "$OUT" && echo "wrote $OUT"
