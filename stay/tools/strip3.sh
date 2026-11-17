#!/bin/bash
# A v3 shot's proof sheet: every STEPth frame of out/v3/shots/ID.mp4 in rows of six.   bash tools/strip3.sh ID [STEP=6] [OUT.jpg]
cd "$(dirname "$0")/.."
id=$1; step=${2:-6}; out=${3:-out/v3/proof/$id.jpg}; mkdir -p "$(dirname "$out")"
ffmpeg -y -loglevel error -i out/v3/shots/$id.mp4 -vf "select='not(mod(n\,$step))',scale=400:-1,tile=6x8" -frames:v 1 -q:v 3 "$out" && echo "$out"
