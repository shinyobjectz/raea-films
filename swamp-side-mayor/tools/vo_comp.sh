#!/bin/bash
# The narration, compressed for the mix: assets/vo/*.wav (Fish's takes, untouched) to assets/vo-comp/.
# The takes peak at -1.7 dBFS on a -21.8 dB RMS, a 20 dB crest; brought up to -14 LUFS by the master, every loud
# syllable hit its limiter (raea check, 11-16: "the sound clips: flat-topped runs" across the whole film). A peak
# compressor with a 2 ms attack, then a limiter for what gets past it, takes the crest to about 11 dB (-17.7 LUFS,
# peak -6.4 dBFS over all the takes), so the master's gain leaves the voice under its ceiling.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH
# the read's folder: vo (v6) or vo7 (v7's read, tools/vo7_collect.py) to its -comp
SRC="${1:-vo}"
mkdir -p "assets/$SRC-comp"
for f in "assets/$SRC"/*.wav; do
  ffmpeg -v error -y -i "$f" -af "acompressor=detection=peak:threshold=-24dB:ratio=5:attack=2:release=60:knee=4:makeup=5,alimiter=limit=0.4:attack=1:release=30:level=disabled" "assets/$SRC-comp/$(basename "$f")"
done
echo "$(ls "assets/$SRC-comp"/*.wav | wc -l | tr -d ' ') takes compressed to assets/$SRC-comp/"
