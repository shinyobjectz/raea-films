#!/bin/zsh
export PATH=/opt/homebrew/bin:$PATH
cd "$(dirname "$0")/.."
F=compositions/rebuilt-v5-build.tsx; O=assets/rebuilt/shots5
raea render $F --composition build-clay -o $O/build-clay.mp4 --quality master 2>&1 | grep -E 'REFUSED|error|raea render: [0-9]' | tail -2
raea render $F --composition build-tex -o $O/build-tex.mp4 --quality master 2>&1 | grep -E 'REFUSED|error|raea render: [0-9]' | tail -2
raea render $F --composition build-final -o $O/build-final.mp4 --quality master 2>&1 | grep -E 'REFUSED|error|raea render: [0-9]' | tail -2
for s in clay tex final; do echo "$s $(ffprobe -v error -show_entries format=duration -of csv=p=0 $O/build-$s.mp4)"; done
echo DONE
