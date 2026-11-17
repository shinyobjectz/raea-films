#!/bin/bash
# Graybox v2, a shot a render (a render holds its first frame's lights and materials), joined in the chain's order
# with the song under it:  bash tools/v2.sh [SHOT_ID ...]   (no ids: every shot)  ->  out/v2/shots/ID.mp4, out/v2/film.mp4
# Each shot's render log is kept beside it (ID.log) and its refusals and warnings are printed, never dropped.
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/v2/shots
ids=(); while IFS= read -r l; do ids+=("$l"); done < <(bun -e 'import { SHOTS } from "./v2/plan"; for (const s of SHOTS) console.log(s.id, s.f1 - s.f0)')
want=("$@")
for line in "${ids[@]}"; do
  id=${line% *}; frames=${line#* }
  if [[ ${#want[@]} -gt 0 && ! " ${want[*]} " == *" $id "* ]]; then continue; fi
  file=v2/film.tsx; comp=v2-$id
  case $id in 02-office) file=v2/office.tsx; comp=v2-office-1;; 03-office-2) file=v2/office.tsx; comp=v2-office-2;; 04-office-3) file=v2/office.tsx; comp=v2-office-3;; 05-office-4) file=v2/office.tsx; comp=v2-office-4;; esac
  raea render $file --composition $comp --quality master -o out/v2/shots/$id.mp4 > out/v2/shots/$id.log 2>&1
  if grep -q "^APPLIED" out/v2/shots/$id.log; then echo "ok   $id ($frames frames)"; else echo "FAIL $id"; fi
  grep -E "^REFUSED|^  warn|^  error|^error|clipping|clips|inside" out/v2/shots/$id.log | cut -c1-240 | sed 's/^/     /'
done
: > out/v2/list.txt
for line in "${ids[@]}"; do id=${line% *}; [[ -f out/v2/shots/$id.mp4 ]] && echo "file 'shots/$id.mp4'" >> out/v2/list.txt || echo "missing $id"; done
ffmpeg -y -loglevel error -f concat -safe 0 -i out/v2/list.txt -an -c copy out/v2/picture.mp4 || exit 1
bun tools/sound.ts || exit 1
ffmpeg -y -loglevel error -i out/v2/picture.mp4 -i out/v2/sound.wav -map 0:v -map 1:a -c:v copy -af "apad" -c:a aac -b:a 256k -shortest out/v2/film.mp4 || exit 1
echo "out/v2/film.mp4: $(ffprobe -v error -show_entries format=duration -of csv=p=0 out/v2/film.mp4) s"
