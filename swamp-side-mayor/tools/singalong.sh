#!/bin/bash
# Swamp-Side Mayor v9, 16:9, with its words to sing along (compositions/singalong.tsx): the picture rendered over the
# finished v9, then v9's own sound put back on as it was (copied, not encoded again: AAC re-encoded overshoots the
# limiter's peaks), and the length checked against v9.
#
#   tools/singalong.sh            render the picture and join the sound: out/goose-v9-singalong.mp4
#   tools/singalong.sh --join     join only (the picture already rendered)
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH
SRC=out/goose-v9.mp4 PIC=out/goose-v9-singalong-picture.mp4 OUT=out/goose-v9-singalong.mp4
if [ "${1:-}" != "--join" ]; then
  raea render compositions/singalong.tsx --composition singalong -o "$PIC" --kbps 25000
fi
ffmpeg -v error -y -i "$PIC" -i "$SRC" -map 0:v -map 1:a -c copy -movflags +faststart "$OUT"
n() { ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$1"; }
a=$(n "$SRC") b=$(n "$OUT")
echo "$OUT: $b frames (v9 has $a)"
[ "$a" = "$b" ] || { echo "the sing-along isn't v9's length" >&2; exit 1; }
