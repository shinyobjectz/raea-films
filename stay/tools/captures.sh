#!/bin/bash
# The app's pictures the film uses, each a real capture (media/app/NAME.png, made from the raea app by
# tools/capture-app.sh) or, until there is one, its placeholder (media/ph/NAME.png), with its size in pixels, so the
# film shows a capture where there is one and sizes each card by its own picture: parts/captures.gen.ts.
#   bash tools/captures.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p media/app
shopt -s nullglob
{
  echo "// Written by tools/captures.sh from media/app (captures) and media/ph (placeholders). Never edit."
  echo "export const PICTURES: Record<string, { capture: boolean; size: [number, number] }> = {"
  for f in media/ph/*.png media/app/*.png; do
    n=$(basename "$f" .png); cap=false; [[ $f == media/app/* ]] && cap=true
    # a capture outranks its placeholder: skip the placeholder when the capture exists
    [[ $cap == false && -f media/app/$n.png ]] && continue
    read -r w h <<< "$(magick identify -format "%w %h" "$f")"
    echo "  \"$n\": { capture: $cap, size: [$w, $h] },"
  done
  echo "};"
} > parts/captures.gen.ts
cat parts/captures.gen.ts
