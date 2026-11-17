#!/bin/bash
# Stills to look at, one render each (a render keeps its first frame's sun, and a jump of more than ~4.5 s between
# frames of one render loses it), then a sheet: bash tools/still.sh OUTDIR F1 F2 ...  ->  OUTDIR/fNNNN.png, sheet.png
set -euo pipefail
cd "$(dirname "$0")/.."
out=$1; shift; mkdir -p "$out"
for f in "$@"; do
  mkdir -p "$out/tmp-$f"
  raea render stay.tsx --composition stay --at "$f" -o "$out/tmp-$f/" > "$out/tmp-$f.log" 2>&1 || { echo "FAILED $f"; grep -v "^WARN" "$out/tmp-$f.log" | tail -8; continue; }
  grep -E "clipping|clips|inside" "$out/tmp-$f.log" | head -3 || true
  mv "$out/tmp-$f/frame-00000.png" "$out/f$(printf %04d "$f").png"; rm -rf "$out/tmp-$f" "$out/tmp-$f.log"
  echo "$out/f$(printf %04d "$f").png"
done
magick montage -font "$PWD/media/fonts/GeistMono.ttf" -label "%t" -pointsize 14 -fill "#aaa" "$out"/f*.png -tile 4x -geometry 540x432+4+4 -background "#111" "$out/sheet.png" && echo "$out/sheet.png"
