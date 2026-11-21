#!/bin/sh
# The chimney smoke's puff textures (components/world/smoke.tsx): four soft blobs, white with the blob in alpha, each
# ImageMagick's plasma (seeded 11-14, blurred) under a radial falloff. Run from this folder.
set -eu
out=assets/world/smoke
tmp=$(mktemp -d)
mkdir -p "$out"
for k in 0 1 2 3; do
  magick -size 256x256 radial-gradient:white-black -evaluate pow 1.8 \( -seed $((k + 11)) -size 256x256 plasma:gray50-gray50 -blur 0x9 -auto-level \) -compose multiply -composite -level 4%,70% "$tmp/a$k.png"
  magick -size 256x256 xc:white \( "$tmp/a$k.png" -alpha off \) -compose copy_opacity -composite "$out/puff-$k.png"
done
rm -r "${tmp:?}"
