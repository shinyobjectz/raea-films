#!/bin/bash
# The film, a segment a chunk (stay.tsx chunk-NN, parts/plan.ts SEGMENTS: every shot, split where a glow goes out; an
# engine render keeps its first frame's sun, textures and glows, so each is its own render from its first whole
# frame), joined under the song. Every cut is a hard
# cut and Solari resets on each, so the join loses nothing. Each chunk's frames go through x264 (VideoToolbox starves
# near-blacks into blocks) and the join re-encodes once (stream-copied chunks left a frame with no timestamp at a seam).
# A chunk already on disk is kept unless FRESH=1 or it is named:  bash tools/film.sh OUT.mp4 [NN ...]
set -euo pipefail
cd "$(dirname "$0")/.."
out=$1; shift
dir=out/chunks; mkdir -p "$dir"
redo=" $* "
chunk() {
  local f="$dir/chunk-$1.mp4" png="$dir/png-$1"
  rm -rf "$png"
  local ok=0
  RAEA_READBACK=rgba raea render stay.tsx --composition "chunk-$1" -o "$png/" > "$dir/chunk-$1.log" 2>&1 || ok=$?
  if ls "$png"/frame-*.png > /dev/null 2>&1; then
    # frames, but the render refused them (a clip, a check): stop on it, never encode past it
    if [[ $ok != 0 ]]; then echo "chunk-$1 REFUSED:"; grep -v WARN "$dir/chunk-$1.log" | grep -E "error|REFUSED" | head -5; exit 1; fi
    ffmpeg -v error -y -framerate 30 -i "$png/frame-%05d.png" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p "$f"
  else
    # a chunk with no 3D (the black open, the card) writes no PNG folder: raea's own MP4, re-encoded to match
    raea render stay.tsx --composition "chunk-$1" -o "$dir/vt-$1.mp4" --quality master >> "$dir/chunk-$1.log" 2>&1
    ffmpeg -v error -y -i "$dir/vt-$1.mp4" -an -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p "$f"
    rm -f "$dir/vt-$1.mp4"
  fi
  rm -rf "$png"
  grep -E "clipping|clips|inside|panicked|error" "$dir/chunk-$1.log" | head -3 || true
  echo "$f"
}
keep() { [[ -f "$1" && "${FRESH:-0}" != 1 && "$redo" != *" $2 "* ]]; }
n=$(bun -e 'import { SEGMENTS } from "./parts/plan"; console.log(SEGMENTS.length)')
# the burst flies into the canyon's first frame (parts/app.tsx Through): the canyon goes first, its first frame becomes
# media/stills/canyon-in.png, and a new canyon renders the burst again
read -r burst canyon <<< "$(bun -e 'import { SEGMENTS } from "./parts/plan"; const i = SEGMENTS.findIndex((g) => g.shot === "burst"); const p = (k: number) => String(k).padStart(2, "0"); console.log(p(i), p(i + 1))')"
for i in $(seq -w 0 $((n - 1))); do
  if [[ $i == "$canyon" ]]; then continue; fi
  if [[ $i == "$burst" ]]; then
    keep "$dir/chunk-$canyon.mp4" "$canyon" || { chunk "$canyon"; redo="$redo $burst "; }
    mkdir -p media/stills
    ffmpeg -v error -y -i "$dir/chunk-$canyon.mp4" -frames:v 1 media/stills/canyon-in.png
  fi
  keep "$dir/chunk-$i.mp4" "$i" || chunk "$i"
done
for i in $(seq -w 0 $((n - 1))); do echo "file '$PWD/$dir/chunk-$i.mp4'"; done > "$dir/list.txt"
song=media/music/stay.wav
# the graybox's sound is the song alone, brought to the master's -14 LUFS by a plain gain (its true peak is -3.8 dBTP,
# so +1.4 dB leaves headroom); the build's mix replaces this
lufs=$(ffmpeg -hide_banner -nostats -i "$song" -af ebur128 -f null - 2>&1 | awk '/Summary/ {s=1} s && /I:/ {print $2; exit}')
gain=$(echo "-14 - ($lufs)" | bc -l)
ffmpeg -y -v error -f concat -safe 0 -i "$dir/list.txt" -i "$song" -map 0:v -map 1:a -af "volume=${gain}dB,apad" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart "$out"
# the film is every frame: the chunks together must be the song's length to the frame
want=$(bun -e 'import { FRAMES } from "./parts/plan"; console.log(FRAMES)')
got=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$out")
[[ "$got" == "$want" ]] || { echo "FRAMES: the film has $got frames, the song wants $want"; exit 1; }
echo "$out"
