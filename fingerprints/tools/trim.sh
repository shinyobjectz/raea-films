#!/bin/bash
# Trims each SAO foley take (media/sfx/NAME-N.wav, normalised to 0 dBFS) to its sound: the lead-in cut at the first
# peak within 36 dB of full scale, the tail cut where it falls 60 dB under, 2 ms in and a short fade out so nothing
# clicks. Writes media/sfx/cut/, then prints each cut's peak and length so a take that lost its sound shows.
# Usage: tools/trim.sh
set -euo pipefail
cd "$(dirname "$0")/../media/sfx"
mkdir -p cut
T=$(mktemp -d)
for f in *-[0-9].wav; do
  ffmpeg -nostdin -v error -y -i "$f" -af "silenceremove=start_periods=1:start_threshold=-36dB:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-60dB:detection=peak,areverse,afade=t=in:d=0.002" "$T/$f"
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$T/$f")
  fo=$(awk -v d="$d" 'BEGIN{o = d < 0.12 ? d / 4 : 0.03; printf "st=%.4f:d=%.4f", d - o, o}')
  ffmpeg -nostdin -v error -y -i "$T/$f" -af "afade=t=out:$fo" "cut/$f"
  p=$(ffmpeg -nostdin -hide_banner -i "cut/$f" -af volumedetect -f null - 2>&1 | awk '/max_volume/{print $5}')
  printf "%-22s peak %6s dB  %5.2f s\n" "$f" "$p" "$d"
done
