#!/bin/zsh
export PATH=/opt/homebrew/bin:$PATH
cd "$(dirname "$0")/.."
for c in rebuilt-v5-canvas rebuilt-v5-canvas-photo rebuilt-v5-canvas-map rebuilt-v5-canvas-book rebuilt-v5-canvas-under rebuilt-v5-canvas-winter; do
  raea render compositions/rebuilt-v5-canvas.tsx --composition $c -o out/rebuilt/v5/canvas/$c.mp4 --manifest out/rebuilt/v5/canvas/$c.manifest.json 2>&1 | grep -E "REFUSED|error|raea render: [0-9]"
  echo "== $c"
  raea check out/rebuilt/v5/canvas/$c.mp4 --manifest out/rebuilt/v5/canvas/$c.manifest.json -o out/rebuilt/v5/canvas/$c.check.json 2>&1 | grep -E "^(error|ok)|raea check: [0-9]" | grep -v '^ok' | head -12
done
