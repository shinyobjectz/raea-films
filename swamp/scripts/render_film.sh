#!/bin/zsh
# The film: each shot rendered in its own process at 1920x1080, joined, with the sound mix laid under.
# usage: FILM=out/film-v2 SOUND=compositions/hype-sound-v2.tsx scripts/render_film.sh OUT.mp4 [shot ids...]
#   (shots already in $FILM are kept; delete one to redo it)
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH
out=${1:?out file}; shift
F=${FILM:-out/film}
SND=${SOUND:-compositions/hype-sound.tsx}
mkdir -p $F
ids=(${@:-$(grep -o 'id: "[0-9][0-9]-[a-z-]*"' components/take.ts | cut -d'"' -f2)})
for id in $ids; do
  [ -s $F/$id.mp4 ] && { echo "kept $id"; continue; }
  raea render compositions/hype.tsx --composition s$id --quality high -o $F/.$id.mp4 2>&1 | grep -i "REFUSED\|panic\|error\|frames" | cut -c1-300
  [ -s $F/.$id.mp4 ] && mv $F/.$id.mp4 $F/$id.mp4 && echo "shot $id done" || { echo "FAILED shot $id"; exit 1; }
done
all=($(grep -o 'id: "[0-9][0-9]-[a-z-]*"' components/take.ts | cut -d'"' -f2))
: > $F/list.txt
for id in $all; do echo "file '$id.mp4'" >> $F/list.txt; done
raea render $SND --composition sound -o $F/sound.wav 2>&1 | grep "LUFS" | cut -c1-200
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $F/list.txt -i $F/sound.wav -c:v copy -c:a aac -b:a 256k -movflags +faststart "$out" && echo "film $out"
