#!/bin/zsh
# Film v4: each shot of the cut (components/cut.ts, in order) rendered in its own process at 1920x1080, joined, with
# the v4 sound mix laid under.
# usage: FILM=out/film-v4 scripts/render_film_v4.sh OUT.mp4 [shot ids to render...]
#   (shots already in $FILM are kept; delete one to redo it; with ids given, only those are rendered and nothing joined)
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH
out=${1:?out file}; shift
F=${FILM:-out/film-v4}
MIX=${MIX:-out/v4/sound/hype-v4-mix.wav}
mkdir -p $F
ALL=(01-water 02-key 03-wake 03b-lens 04-rail 04b-dialog 05-type-a 06-keys 07-type-b 08-return 08b-sent 08c-pulse 09-tasks 09-made 10-slider 11-sun 12-swatch 13-water 14-canopy 15-leaves 16-open 16b-tool 17-pin 18-draw 19-answer 20-mist 21-wipe 22-scrub 23-pull 24-send 25-crack 25b-beam 26-rise 27-orbit 28-port 29-arrive 29-room 30-hands 30b-glyphs 31-note 32-end)
ids=(${@:-$ALL})
for id in $ids; do
  [ -s $F/$id.mp4 ] && { echo "kept $id"; continue; }
  raea render compositions/hype.tsx --composition s$id --quality high -o $F/.$id.mp4 2>&1 | grep -i "REFUSED\|panic\|error\|frames" | cut -c1-300
  [ -s $F/.$id.mp4 ] && mv $F/.$id.mp4 $F/$id.mp4 && echo "shot $id done" || { echo "FAILED shot $id"; exit 1; }
done
[ $# -gt 0 ] && exit 0
: > $F/list.txt
for id in $ALL; do echo "file '$id.mp4'" >> $F/list.txt; done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $F/list.txt -i $MIX -c:v copy -c:a aac -b:a 256k -movflags +faststart "$out" && echo "film $out"
