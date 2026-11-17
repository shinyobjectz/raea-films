#!/bin/bash
# Clean wall textures: keep a surface's fine grain (at reduced contrast) and take out its stains and patches, which under
# traced light read as blotchy lighting. The texture is tiled 3x3 before the blur so the high-pass has no seam at its
# edges, and the result is tinted to the source's own mean colour, so the albedo the lighting was metered against holds.
#   tools/cleantex.sh SRC.jpg OUT.jpg [detail 0..1] [blur sigma px]
set -euo pipefail
src=$1 out=$2 k=${3:-0.55} sigma=${4:-48}
w=$(ffprobe -v error -show_entries stream=width -of csv=p=0 "$src")
h=$(ffprobe -v error -show_entries stream=height -of csv=p=0 "$src")
hex=$(ffmpeg -v error -i "$src" -vf 'scale=1:1:flags=area,format=rgb24' -f rawvideo - | xxd -p)
r=$((16#${hex:0:2})) g=$((16#${hex:2:2})) b=$((16#${hex:4:2}))
ffmpeg -v error -y -i "$src" -filter_complex "
  [0:v]format=gbrp,split=2[o][t];
  [t]split=3[t1][t2][t3];[t1][t2][t3]hstack=3,split=3[r1][r2][r3];[r1][r2][r3]vstack=3,gblur=sigma=${sigma},crop=${w}:${h}:${w}:${h}[bl];
  [o][bl]blend=all_expr='clip(128+(A-B)*${k},0,255)',
  colorchannelmixer=rr=$(echo "scale=4; $r/128" | bc):gg=$(echo "scale=4; $g/128" | bc):bb=$(echo "scale=4; $b/128" | bc),format=yuvj444p" \
  -q:v 2 "$out"
echo "$out: mean #$hex, detail $k, blur $sigma px"
