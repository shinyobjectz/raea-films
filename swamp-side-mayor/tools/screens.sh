#!/bin/bash
# tools/screens.sh: the computer's screen after the film's done, and the watchers' hero cards, a picture per film frame
# (compositions/screens.tsx): the upload (frames 2349-2373, v9) and the video page (2369 to the end: it stays on the screen) into assets/app/upload and
# assets/app/yt, the likes cards into assets/likes/<watcher> (the hero shots, plan.ts S(119), S(120), S(121)).
cd "$(dirname "$0")/.." || exit 1
R=out/screens; mkdir -p "$R"
for job in upload:2349:2373:app/upload yt:2369:2696:app/yt likes-deer:2385:2411:likes/deer likes-heron:2405:2431:likes/heron likes-frog:2425:2451:likes/frog; do
  IFS=: read -r c a z dst <<< "$job"; mkdir -p "assets/$dst"; find "${R:?}" -name '*.png' -delete
  raea render compositions/screens.tsx --composition "$c" --at "$(seq "$a" "$z" | paste -sd, -)" -o "$R/" > "$R/render.log" 2>&1 < /dev/null
  GOT=$(ls "$R"/frame-*.png 2>/dev/null); [ "$(echo "$GOT" | grep -c png)" -eq $((z-a+1)) ] || { echo "FAILED: $c gave $(echo "$GOT" | grep -c png) of $((z-a+1))"; tail -5 "$R/render.log"; exit 1; }
  k=0; for f in $(seq "$a" "$z"); do k=$((k+1)); mv "$(echo "$GOT" | sed -n "${k}p")" "assets/$dst/f$(printf %05d "$f").png" || exit 1; done
  echo "$c: $((z-a+1)) frames into assets/$dst"
done
