#!/bin/bash
# OCR of fetched Adreßbuch pages, one text column at a time (tools/addr/columns.ts). Each column is cut from 8 px
# left of its rule (the house numbers sit against it), the printed rules are painted out, it is doubled in size
# (Lanczos), and read with UB Mannheim's frak2021 model for tesseract (trained on historical German print, GT4HistOCR;
# fetched once into cache/adressbuch/tessdata). It reads names and numbers in this print far better than tesseract's
# own deu_latf (compared on page 4322, column 6).
#   ocr.sh ORDER..   writes cache/adressbuch/1917/ocr/ORDER-COL.txt (COL 1-8, left to right)
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
td=$root/cache/adressbuch/tessdata
[[ -s $td/frak2021.traineddata ]] || { mkdir -p "$td"; curl -sSL -m 300 -o "$td/frak2021.traineddata" https://ub-backup.bib.uni-mannheim.de/~stweil/tesstrain/frak2021/tessdata_best/frak2021-0.905.traineddata; }
out=$root/cache/adressbuch/1917/ocr
mkdir -p "$out"
tmp=$(mktemp -d)
trap 'rm -r "${tmp:?}"' EXIT
for p in "$@"; do
  img=$root/cache/adressbuch/1917/$p.jpg
  read -r w h < <(identify -format "%w %h\n" "$img")
  c=0
  while read -r x0 x1; do
    c=$((c + 1))
    a=$((x0 > 16 ? x0 - 16 : 0)); b=$((x1 + 4 < w ? x1 + 4 : w))
    magick "$img" -crop "$((b - a))x${h}+${a}+0" +repage \( +clone -negate -threshold 50% -morphology Open rectangle:1x60 \) \
      -compose lighten -composite -filter Lanczos -resize 200% "$tmp/c.png"
    tesseract "$tmp/c.png" "$out/$p-$c" --tessdata-dir "$td" -l frak2021 --psm 6 2>/dev/null
  done < <(bun "$here/columns.ts" "$img")
  echo "$p: $c columns"
done
