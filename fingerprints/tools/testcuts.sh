#!/usr/bin/env bash
# Three versions of the coffee film the explainer follows, so what it shows Fingerprint saying is what
# `raea fingerprint score` really says:
#   cut-v1.mp4  the AI's first cut: shot 3 soft (blurred), shot 5 too dark, hiss under the voice from 5.5 to 10 s
#   cut-v2.mp4  a disguised fix: shot 3 blurred then sharpened, shot 5 brightened back, the hiss at a third of its level
#   cut-v3.mp4  the real fix: every shot clean, no hiss
# Each is 6 shots of 2 s, 1920x1080, 24 fps, with lines 02 and 04 of the narration as the film's voice.
set -euo pipefail
cd "$(dirname "$0")/.."
S=media/stock
O=media/cuts
mkdir -p "$O"

# shot, its in-point (s)
SHOTS=("coffee-82604.mp4 2" "coffee-72492.mp4 3" "coffee-15484.mp4 4" "coffee-51212.mp4 1" "coffee-330339.mp4 3" "coffee-236256.mp4 2")
BASE="scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24,setsar=1,format=yuv420p"

shot() { # index, extra filter, out
  read -r file at <<<"${SHOTS[$1]}"
  ffmpeg -nostdin -v error -y -ss "$at" -i "$S/$file" -t 2 -an -vf "$BASE${2:+,$2}" -c:v libx264 -crf 14 -preset fast "$3"
}

make() { # name, shot3 filter, shot5 filter, hiss gain (0 = none)
  local name=$1 f3=$2 f5=$3 hiss=$4 tmp
  tmp=$(mktemp -d)
  for i in 0 1 2 3 4 5; do
    local f=""
    [ "$i" = 2 ] && f=$f3
    [ "$i" = 4 ] && f=$f5
    shot "$i" "$f" "$tmp/s$i.mp4"
    echo "file '$tmp/s$i.mp4'" >>"$tmp/list.txt"
  done
  ffmpeg -nostdin -v error -y -f concat -safe 0 -i "$tmp/list.txt" -c copy "$tmp/picture.mp4"
  # the film's voice: line 02 from 0.4 s, line 04 from 6.2 s; hiss (white noise, high-passed) from 5.5 to 10 s
  local mix="[1]adelay=400|400[a];[2]adelay=6200|6200[b];[a][b]amix=inputs=2:normalize=0,apad=whole_dur=12[v]"
  if [ "$hiss" != 0 ]; then
    ffmpeg -nostdin -v error -y -i "$tmp/picture.mp4" -i media/voice/02.wav -i media/voice/04.wav \
      -f lavfi -i "anoisesrc=color=white:amplitude=1:sample_rate=48000:duration=12" \
      -filter_complex "$mix;[3]highpass=f=2500,volume=$hiss,volume='if(between(t,5.5,10),1,0)':eval=frame[n];[v][n]amix=inputs=2:normalize=0[o]" \
      -map 0:v -map "[o]" -c:v copy -c:a aac -b:a 192k -ar 48000 -t 12 "$O/$name.mp4"
  else
    ffmpeg -nostdin -v error -y -i "$tmp/picture.mp4" -i media/voice/02.wav -i media/voice/04.wav \
      -filter_complex "$mix" -map 0:v -map "[v]" -c:v copy -c:a aac -b:a 192k -ar 48000 -t 12 "$O/$name.mp4"
  fi
  rm -rf "${tmp:?}"
  echo "$O/$name.mp4"
}

make cut-v1 "gblur=sigma=9" "eq=brightness=-0.30:gamma=0.55:saturation=0.8" 0.35
make cut-v2 "gblur=sigma=9,unsharp=7:7:2.5" "" 0.12
make cut-v3 "" "" 0
