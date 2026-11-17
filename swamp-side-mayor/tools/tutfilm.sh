#!/bin/bash
# The tutorial's picture a run at a time (compositions/tutfilm.tsx's tutfilm-rNN, from components/tut/shots.ts
# filmRuns), then joined and given its soundtrack. A run is all app (2D) or all swamp (3D): v10 rendered a chapter at a
# time, and every chapter that opened on the app lost the ink on its swamp shots (the director on v10, a note, so a 3D
# run starts on a 3D frame. Each run is a few minutes at most and a few GB; the whole film at once outgrows the memory.
#
#   tools/tutfilm.sh [RUN...]       render these runs (r00 ..) to out/tut/film/runs/RUN.mp4 (all of them when none)
#   tools/tutfilm.sh --join [OUT]   join the runs with out/tut/sound/tutsound.wav as OUT (out/tut/goose-learns-raea.mp4
#                                   when none: name each version's file, so the one before stays watchable), and check its length
# Each run is 10 Mbps (YouTube's 1080p30 asks 8), about 360 MB for the film: the disk is short.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH
P=out/tut/film/runs
mkdir -p "$P"
RUNS=$(bun --preload ./tools/stub/raea.ts tools/tut_runs.ts)
ids=$(echo "$RUNS" | awk '{print $1}')
if [ "${1:-}" = "--join" ]; then
  OUT=${2:-out/tut/goose-learns-raea.mp4}
  : > "$P/list.txt"
  for r in $ids; do
    [ -f "$P/$r.mp4" ] || { echo "missing $P/$r.mp4" >&2; exit 1; }
    echo "file '$r.mp4'" >> "$P/list.txt"
  done
  # joined and muxed in one pass, with no picture-only copy between (the disk is short)
  ffmpeg -v error -y -f concat -safe 0 -i "$P/list.txt" -i out/tut/sound/tutsound.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest -movflags +faststart "$OUT"
  frames=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$OUT")
  want=$(python3 -I -c "import json; print(round(json.load(open('$PWD/components/tut/beats.json'))['seconds'] * 30))")
  echo "$OUT: $frames frames (the beats want $want)"
  [ "$frames" = "$want" ] || { echo "the runs don't add up to the film" >&2; exit 1; }
  exit 0
fi
sel=("$@"); [ ${#sel[@]} -gt 0 ] || sel=($ids)
for r in "${sel[@]}"; do
  line=$(echo "$RUNS" | awk -v r="$r" '$1 == r')
  [ -n "$line" ] || { echo "no run $r" >&2; exit 1; }
  echo "run $line: rendering"
  if ! raea render compositions/tutfilm.tsx --composition "tutfilm-$r" -o "$P/$r.mp4" --kbps 10000 > "$P/$r.log" 2>&1; then
    tail -20 "$P/$r.log" >&2; echo "run $r: render failed" >&2; exit 1
  fi
  grep -E "APPLIED|error" "$P/$r.log" || true
  echo "run $r: done"
done
