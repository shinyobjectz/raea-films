#!/bin/bash
# The montage's circles, to look at: frame 2 of each place asked for (or all), in one sheet.  bash tools/cal.sh [ID ...]
cd "$(dirname "$0")/.."
ids=("$@"); [[ ${#ids[@]} -eq 0 ]] && ids=($(bun -e 'import { MONTAGE } from "./v3/plan"; console.log(MONTAGE.map(([id]) => id).join(" "))'))
for id in "${ids[@]}"; do
  rm -rf out/v3/cal/$id; raea render v3/film.tsx --composition v3-$id --at 2 -o out/v3/cal/$id/ > out/v3/cal/$id.log 2>&1
  grep -E "REFUSED|^  error|rror:" out/v3/cal/$id.log | cut -c1-260 | head -3
  [[ -f out/v3/cal/$id/frame-00000.png ]] && magick out/v3/cal/$id/frame-00000.png -resize 480x out/v3/cal/$id.jpg || echo "no frame: $id"
done
magick montage -font "$PWD/media/fonts/GeistMono.ttf" -label "%t" -pointsize 13 -fill "#aaa" $(for id in "${ids[@]}"; do echo out/v3/cal/$id.jpg; done) -tile 5x -geometry +3+3 -background "#111" out/v3/cal/sheet.jpg && echo out/v3/cal/sheet.jpg
