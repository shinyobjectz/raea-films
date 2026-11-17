#!/bin/bash
# The intro's sound: the photocopier (v3/intro.tsx). the director, 11-12: "i want somethign cleaner sexier and with some sound
# to thit ... maybe we could do the intor like a phocopier like a legitimate looking photocopier aniamtion and sound
# effect". Hunyuan Video Foley on fal, as the rest of the foley (tools/foley-make.sh), from the intro's own picture:
# out/v3/shots/intro.mp4 with half a second of its first frame held before it and of its last after (the model's own
# ramp in and out fall there and are thrown away). Each seed's take is kept as media/foley/lock/intro-SEED.wav (the
# intro's 2 s exactly), and the one chosen is copied to media/foley/lock/intro.wav, which tools/sound.sh lays at the
# film's second 0. $0.10 a take.
#   bash tools/intro-sound.sh run [SEED ...]   (default seeds 301 302 303)
#   bash tools/intro-sound.sh pick SEED
set -euo pipefail
cd "$(dirname "$0")/.."
raw=media/gen/foley-lock; out=media/foley/lock; clip=out/v3/proxy/intro.mp4
mkdir -p $raw $out out/v3/proxy
if [[ "${1:-}" == pick ]]; then cp $out/intro-$2.wav $out/intro.wav; echo "$out/intro.wav is seed $2"; exit 0; fi
[[ "${1:-}" == run ]] || { echo "bash tools/intro-sound.sh run [SEED ...] | pick SEED"; exit 1; }
shift; seeds=("$@"); [[ ${#seeds[@]} -gt 0 ]] || seeds=(301 302 303)
EDGE=0.5
len=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/v3/shots/intro.mp4 < /dev/null)
ffmpeg -nostdin -y -loglevel error -i out/v3/shots/intro.mp4 -vf "tpad=start_mode=clone:start_duration=$EDGE:stop_mode=clone:stop_duration=$EDGE,scale=-2:540" -an -c:v libx264 -crf 18 -pix_fmt yuv420p $clip
# (each line names what is on screen, in order: the sheet curling down onto the glass, the lid coming down on it, the
# lamp striking, the carriage's sweep, the flood of light as it stops)
say="an office photocopier seen from under its glass: a sheet of paper flops down onto the glass, the heavy plastic lid slams shut with a deep thump, a relay clicks and the scanning lamp buzzes on, the carriage motor whirs and the lamp slides smoothly across under the glass, then a mechanical clunk as it stops"
neg="music, melody, singing, speech, voices, mouse clicks, computer beeps, keyboard, noisy, harsh, hiss"
key=$(grep -E '^FAL_KEY=' ~/.raea/env | head -1 | cut -d= -f2- | tr -d '"'"'"'')
url=$(bash tools/fal-upload.sh $clip)
for seed in "${seeds[@]}"; do
  id=intro-$seed
  body=$(bun -e "console.log(JSON.stringify({ video_url: '$url', text_prompt: process.argv[1], negative_prompt: process.argv[2], seed: $seed, guidance_scale: 4.5, num_inference_steps: 50 }))" "$say" "$neg")
  code=$(curl -sS -o $raw/$id.json -w '%{http_code}' --max-time 600 -X POST "https://fal.run/fal-ai/hunyuan-video-foley" -H "Authorization: Key $key" -H "Content-Type: application/json" -d "$body" || true)
  if [[ $code != 200 ]]; then echo "FAIL $id: HTTP $code $(head -c 300 $raw/$id.json 2>/dev/null)"; continue; fi
  vurl=$(bun -e "const j = await Bun.file('$raw/$id.json').json(); console.log(j.video?.url ?? '')")
  [[ -n $vurl ]] || { echo "FAIL $id: no video in the reply"; continue; }
  curl -sS --max-time 300 -o $raw/$id.mp4 "$vurl"
  ffmpeg -nostdin -y -loglevel error -i $raw/$id.mp4 -ss $EDGE -t $len -vn -ac 2 -ar 48000 -c:a pcm_s24le $out/$id.wav
  antsy spend 0.10 "Stay foley: the intro's photocopier, seed $seed (hunyuan-video-foley, 3 s)" --for "Stay: the intro's sound" > /dev/null 2>&1 || true
  echo "ok   $id: $out/$id.wav"
done
