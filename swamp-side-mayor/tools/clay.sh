#!/bin/bash
# tools/clay.sh: the film as clay for the app's player (plan.ts SHOWN `clay`): renders the film frames the player
# shows with film.tsx#goose-clay and cuts them to 800x400 into assets/app/clay, then tools/played.ts pastes them in.
cd "$(dirname "$0")/.." || exit 1
R=out/clay; mkdir -p "$R" assets/app/clay
NEED=$(bun -e 'import { FPS, FRAMES, G, beatAt, playedBeat, shownAt } from "./compositions/plan"; const s = new Set<number>(); for (let f = 0; f < FRAMES; f++) { const b = beatAt(f / FPS); for (const bb of [b, b + 0.5]) { const x = shownAt(bb); if (x?.film && x.clay) s.add(Math.round(G(playedBeat(bb)) * 30)); } } console.log([...s].sort((a, c) => a - c).join("\n"))')
for run in $(echo "$NEED" | awk 'NR==1{s=$1;p=$1;next} $1!=p+1{print s"-"p; s=$1} {p=$1} END{print s"-"p}'); do
  a=${run%-*}; z=${run#*-}; find "${R:?}" -name '*.png' -delete
  raea render compositions/film.tsx --composition goose-clay --at "$(seq "$a" "$z" | paste -sd, -)" -o "$R/" > "$R/render.log" 2>&1 < /dev/null
  GOT=$(ls "$R"/frame-*.png 2>/dev/null); [ "$(echo "$GOT" | grep -c png)" -eq $((z-a+1)) ] || { echo "FAILED: clay $run gave $(echo "$GOT" | grep -c png)"; tail -5 "$R/render.log"; exit 1; }
  k=0; for f in $(seq "$a" "$z"); do k=$((k+1)); magick "$(echo "$GOT" | sed -n "${k}p")" -resize 800x400 -quality 88 "assets/app/clay/f$(printf %04d "$f").jpg" || exit 1; done
  echo "clay $run"
done
bun tools/played.ts
