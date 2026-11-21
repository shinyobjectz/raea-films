#!/bin/zsh
# render each id at master: model shots straight to shots5/, real shots to shots5/bare/
export PATH=/opt/homebrew/bin:$PATH
cd "$(dirname "$0")/.."
MODEL=(s5-graybox-aerial s5-stream-run)
for id in "$@"; do
  if (( ${MODEL[(Ie)$id]} )); then o=assets/rebuilt/shots5/$id.mp4; else o=assets/rebuilt/shots5/bare/$id.mp4; fi
  mkdir -p assets/rebuilt/shots5/bare
  raea render compositions/rebuilt-v5-city.tsx --composition $id -o $o --quality master 2>&1 | grep -E "REFUSED|error|raea render: [0-9]" | tail -3
  echo "== $id $(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $o)"
done
echo DONE
