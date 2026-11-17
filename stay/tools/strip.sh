#!/bin/bash
# A shot's proof strip: N frames evenly through out/v2/shots/ID.mp4, side by side -> out/v2/proof/ID.jpg
#   bash tools/strip.sh ID [N=6] [width of each=450]
cd "$(dirname "$0")/.."
id=$1; n=${2:-6}; w=${3:-450}
frames=$(ffprobe -v error -count_packets -select_streams v -show_entries stream=nb_read_packets -of csv=p=0 out/v2/shots/$id.mp4)
step=$(( (frames - 1) / (n - 1) )); [[ $step -lt 1 ]] && step=1
ffmpeg -y -loglevel error -i out/v2/shots/$id.mp4 -vf "select='not(mod(n\,$step))',scale=$w:-1,tile=${n}x1" -frames:v 1 -q:v 3 out/v2/proof/$id.jpg && echo out/v2/proof/$id.jpg
