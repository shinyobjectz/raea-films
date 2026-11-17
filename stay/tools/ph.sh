#!/bin/bash
# The graybox's pictures that aren't the scene: each comment card's and app screen's placeholder (media/ph), and the
# words laid in the 3D (media/words). A capture of the real app in media/app replaces its placeholder (tools/captures.sh).
#   bash tools/ph.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p media/ph media/words
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
one() { # composition, out file, extra flags
  mkdir -p "$tmp/$1"
  raea render stay.tsx --composition "$1" $3 --at 0 -o "$tmp/$1/" > "$tmp/$1.log" 2>&1 || { echo "FAILED $1"; tail -5 "$tmp/$1.log"; return 1; }
  mv "$tmp/$1/frame-00000.png" "$2"; echo "$2"
}
for n in $(bun -e 'import {COMMENTS} from "./parts/plan"; console.log(COMMENTS.map(c=>c.n).join(" "))'); do one "ph-comment-$n" "media/ph/comment-$n.png" ""; done
for n in $(bun -e 'import {SCREENS} from "./parts/plan"; console.log([...new Set(SCREENS.map(s=>s.file))].join(" "))'); do one "ph-$n" "media/ph/$n.png" ""; done
one word-wetter media/words/wetter.png --alpha
bash tools/captures.sh > /dev/null
