#!/bin/bash
# The film at its full size, 2700x2160: every shot's v2x composition rendered at master quality, joined in the chain's
# order, the mixed sound (tools/sound.ts) under it:  bash tools/final.sh [SHOT_ID ...]  ->  out/final/shots/ID.mp4, out/final/stay.mp4
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/final/shots
ids=(); while IFS= read -r l; do ids+=("$l"); done < <(bun -e 'import { SHOTS } from "./v2/plan"; for (const s of SHOTS) console.log(s.id)')
want=("$@")
for id in "${ids[@]}"; do
  if [[ ${#want[@]} -gt 0 && ! " ${want[*]} " == *" $id "* ]]; then continue; fi
  file=v2/film.tsx; comp=v2x-$id
  case $id in 02-office) file=v2/office.tsx; comp=v2x-office-1;; 03-office-2) file=v2/office.tsx; comp=v2x-office-2;; 04-office-3) file=v2/office.tsx; comp=v2x-office-3;; 05-office-4) file=v2/office.tsx; comp=v2x-office-4;; esac
  raea render $file --composition $comp --quality master -o out/final/shots/$id.mp4 > out/final/shots/$id.log 2>&1
  if grep -q "^APPLIED" out/final/shots/$id.log; then echo "ok   $id"; else echo "FAIL $id"; fi
  grep -E "^REFUSED|^  warn|^  error|^error|clips" out/final/shots/$id.log | cut -c1-240 | sed 's/^/     /'
done
: > out/final/list.txt
for id in "${ids[@]}"; do [[ -f out/final/shots/$id.mp4 ]] && echo "file 'shots/$id.mp4'" >> out/final/list.txt || echo "missing $id"; done
ffmpeg -y -loglevel error -f concat -safe 0 -i out/final/list.txt -an -c copy out/final/picture.mp4 || exit 1
bun tools/sound.ts || exit 1
ffmpeg -y -loglevel error -i out/final/picture.mp4 -i out/v2/sound.wav -map 0:v -map 1:a -c:v copy -af "apad" -c:a aac -b:a 320k -shortest out/final/stay.mp4 || exit 1
echo "out/final/stay.mp4: $(ffprobe -v error -show_entries format=duration:stream=width,height -of csv=p=0 out/final/stay.mp4 | tr '\n' ' ')"
