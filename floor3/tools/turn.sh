#!/bin/bash
# The vertical turn film: the wide film (out/floor3.mp4) laid on its side in a 1080x1920 frame (turned a quarter
# counter-clockwise, so a phone turned clockwise shows it upright and full screen), with the title screen's upright
# "turn your phone to watch" over it (composition floor3-turn-prompt, rendered on clear). The sound is the film's own.
#   bash tools/turn.sh  ->  out/floor3-turn.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
P=.cache/turn-prompt
rm -rf "${P:?}" && mkdir -p "$P"
raea render compositions/floor3.tsx --composition floor3-turn-prompt --alpha -o "$P/" > "$P.log" 2>&1 || { grep -E "REFUSED|rror" "$P.log" | head -5; exit 1; }
n=$(ls "$P"/frame-*.png | wc -l | tr -d ' ')
echo "prompt: $n frames"
ffmpeg -v error -nostdin -stats_period 15 -progress pipe:1 -y -i out/floor3.mp4 -framerate 60 -i "$P/frame-%05d.png" -filter_complex \
  "[0:v]transpose=2[r];[1:v]scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,format=yuva420p[p];[r][p]overlay=0:0:eof_action=pass,format=yuv420p[v]" \
  -map "[v]" -map 0:a -c:v libx264 -preset slow -crf 13 -x264-params aq-mode=3:aq-strength=0.9:deblock=-1,-1 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -r 60 -c:a copy -movflags +faststart out/floor3-turn-v.mp4 | grep --line-buffered "^frame="
mv out/floor3-turn-v.mp4 out/floor3-turn.mp4
rm -rf "${P:?}" "$P.log"
echo "out/floor3-turn.mp4: $(ffprobe -v error -select_streams v -show_entries stream=width,height,nb_frames -of csv=p=0 out/floor3-turn.mp4) $(du -h out/floor3-turn.mp4 | cut -f1)"
