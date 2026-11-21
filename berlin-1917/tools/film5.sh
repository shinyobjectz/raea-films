#!/bin/zsh
export PATH=/opt/homebrew/bin:$PATH
cd "$(dirname "$0")/.."
raea render compositions/berlin-rebuilt-v5.tsx --composition berlin-rebuilt-v5 -o out/rebuilt/berlin-rebuilt-v5.mp4 --kbps 40000 --manifest out/rebuilt/berlin-rebuilt-v5.manifest.json 2>&1 | grep -E "REFUSED|error|warn|raea render: [0-9]" | tail -12
echo DONE
raea check out/rebuilt/berlin-rebuilt-v5.mp4 --manifest out/rebuilt/berlin-rebuilt-v5.manifest.json -o out/rebuilt/berlin-rebuilt-v5.check.json 2>&1 | grep -E "^(error|warn|ok)|raea check:" | tail -30
python3.12 tools/clipgate.py out/rebuilt/berlin-rebuilt-v5.manifest.json | grep -E "FAIL|clipgate:"
