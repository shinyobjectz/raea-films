#!/bin/bash
# DA3 depth layers for every stock shot v2 keeps (tools/depth.py), each from the second the shot uses (thermal/shots.tsx
# CLIPS' `at`) for as long as it can be on screen. A shot whose layers exist is skipped. Run from the project.
set -euo pipefail
cd "$(dirname "$0")/.."
S=media/thermal/stock
# name  file  start  seconds
while read -r name file at secs; do
  [ -z "$name" ] && continue
  out=media/thermal/depth/$name
  if [ -f "$out/cams.json" ]; then echo "have $name"; continue; fi
  KMP_DUPLICATE_LIB_OK=TRUE uv run -q --python 3.11 $(cat tools/depth.deps) python3 -I tools/depth.py "$S/$file" "$at" "$secs" "$out" </dev/null 2>&1 | grep -v -i -E "warn|INFO|resolver"
done <<'EOF'
sunset silhouette-of-a-hand-being-held-up-in-front-of-46762.mp4 6 9
night pixabay-editor-night-345077.mp4 2 6
thumbs pixabay-thumbs-up-20855.mp4 4 6
mouse close-shot-of-a-guy-editing-a-video-on-a-44074.mp4 4 7
notebook close-up-a-hand-writing-notes-on-a-notebook-with-99890.mp4 0 8
fog drawing-a-heart-on-a-foggy-window-on-a-rainy-18308.mp4 8 6
glasses reflection-of-a-screen-in-glasses-221.mp4 10 7
eye eye-of-a-woman-looking-at-a-tablet-41180.mp4 6 4
phones editing-a-video-on-an-audiovisual-workstation-41276.mp4 6 5
team young-creatives-making-working-on-video-editing-23148.mp4 4 9
EOF
