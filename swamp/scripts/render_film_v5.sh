#!/bin/zsh
# Film v5: each shot of the cut (components/cut.ts, in order) rendered in its own process at 1920x1080 as PNG frames,
# encoded with x264 (the dark shots blotch near black through the hardware encoder; this project's rule is that dark
# material goes out through a lossless render into x264), joined by stream copy, with the v5 mix laid under.
# v5's cut: 16-open holds to the cut into 16b-tool, which runs on to the pin (17-pin is gone); 20-mist holds through the
# wipe (21-wipe is gone).
# usage: FILM=out/film-v5 scripts/render_film_v5.sh OUT.mp4 [shot ids to render...]
#   (shots already in $FILM are kept; delete one to redo it; with ids given, only those are rendered and nothing joined)
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH
out=${1:?out file}; shift
F=${FILM:-out/film-v5}
MIX=${MIX:-out/v5/sound/hype-v5-mix.wav}
mkdir -p $F
ALL=(01-water 02-key 03-wake 03b-lens 04-rail 04b-dialog 05-type-a 06-keys 07-type-b 08-return 08b-sent 08c-pulse 09-tasks 09-made 10-slider 11-sun 12-swatch 13-water 14-canopy 15-leaves 16-open 16b-tool 18-draw 19-answer 20-mist 22-scrub 23-pull 24-send 25-crack 25b-beam 26-rise 27-orbit 28-port 29-arrive 29-room 30-hands 30b-glyphs 31-note 32-end)
ids=(${@:-$ALL})
# the same x264 settings for every shot, so the joins can be stream copies
X264=(-c:v libx264 -preset slow -crf 13 -x264-params aq-mode=3:aq-strength=0.9 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -r 30)
for id in $ids; do
  [ -s $F/$id.mp4 ] && { echo "kept $id"; continue; }
  fr=$F/.frames-$id
  rm -rf $fr && mkdir -p $fr
  raea render compositions/hype.tsx --composition s$id --quality high -o $fr/ 2>&1 | grep -i "REFUSED\|panic\|error\|frames" | cut -c1-300
  n=$(ls $fr/frame-*.png 2>/dev/null | wc -l | tr -d ' ')
  [ "$n" -gt 0 ] || { echo "FAILED shot $id: no frames"; exit 1; }
  ffmpeg -hide_banner -loglevel error -y -framerate 30 -i $fr/frame-%05d.png $X264 $F/.$id.mp4 || { echo "FAILED encode $id"; exit 1; }
  mv $F/.$id.mp4 $F/$id.mp4 && rm -rf $fr && echo "shot $id done ($n frames)"
done
[ $# -gt 0 ] && exit 0
: > $F/list.txt
for id in $ALL; do echo "file '$id.mp4'" >> $F/list.txt; done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $F/list.txt -i $MIX -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart "$out" && echo "film $out"
