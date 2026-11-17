#!/bin/bash
# Renders art.tsx's compositions to media/v2/ (the notes, prints, contact strip and thumbprint the set lays on the
# desk). The thumbprint keeps its transparency. Usage: tools/art.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p media/v2
for id in note-0 note-1 note-2 note-blank print-0 print-1 print-2 strip strip-fixed; do
  raea render art.tsx --composition "$id" --frame 0 -o "media/v2/$id.png" 2>&1 | grep -E "REFUSED|rror" || true
done
raea render art.tsx --composition thumb --frame 0 --alpha -o media/v2/thumb.png 2>&1 | grep -E "REFUSED|rror" || true
ls -la media/v2
