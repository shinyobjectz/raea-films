#!/usr/bin/env bash
# The micro shots' scans, cut from Poly Haven's 8k sets (CC0) to the patch each shot sees, at full resolution, for
# blender/micro.py (which displaces a grid by the height map and exports the surface) and v3/micro-moss.tsx (which grows
# the moss over it). the director, 11-12: "a ghigh res tree and have a super closeup of the bark or something with moss ...
# maybe something like rock with moss after that", "the moss is moving on these surfaces".
#   bark  Jolcham Oak Bark 01 (1 x 2 m at 8192 x 16384): 35 x 45 cm from its left edge, 30 cm down: moss in its furrows,
#         pale lichen, a sap wound
#   rock  Dry Riverbed Rock (2 x 2 m at 16384, 0.12 mm a texel like the bark; Mossy Rock's 0.37 mm was soft at this
#         range): 60 cm round the joint left of its middle, a crack down between two blocks and the ledges either side
# Writes blender/src/micro/NAME-{diff,nor,rough}.jpg (the crop), NAME-disp.u16 (its heights on the surface's grid,
# 16-bit little-endian, top row first) and NAME-field.rgb (its colour on the moss's coarser grid); and
# media/micro/moss-{atlas.png,nor.jpg} (Moss 01's scanned shoots, with their alpha) and media/micro/moss-sprigs.txt
# (each shoot's box in the atlas).
#   bash tools/micro-tex.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PH=blender/src/polyhaven/tex
OUT=blender/src/micro
mkdir -p "$OUT" media/micro

# NAME ASSET CROP GRID FIELD: CROP is WxH+X+Y in the 8k's pixels; GRID and FIELD are the vertex and moss grids
cut() {
  local name=$1 a=$2 crop=$3 grid=$4 field=$5 res=${6:-8k}
  magick "$PH/$a/${a}_diff_${res}.jpg" -crop "$crop" +repage -quality 92 "$OUT/$name-diff.jpg"
  magick "$PH/$a/${a}_nor_gl_${res}.jpg" -crop "$crop" +repage -quality 95 "$OUT/$name-nor.jpg"
  magick "$PH/$a/${a}_rough_${res}.jpg" -crop "$crop" +repage -colorspace gray -quality 92 "$OUT/$name-rough.jpg"
  magick "$PH/$a/${a}_disp_${res}.png" -alpha off -colorspace gray -crop "$crop" +repage -filter box -resize "$grid!" -depth 16 -endian LSB "gray:$OUT/$name-disp.u16"
  magick "$OUT/$name-diff.jpg" -filter box -resize "$field!" -depth 8 "rgb:$OUT/$name-field.rgb"
  echo "$name: $(magick identify -format '%wx%h' "$OUT/$name-diff.jpg") texels, grid $grid, field $field"
}
cut bark jolcham_oak_bark_01 2867x3686+0+2458 701x901 176x226
cut rock dry_riverbed_rock 4915x4915+6543+5743 1001x1001 241x241 16k

# the moss: the diffuse with its alpha, 2k (a shoot is a tenth of the frame at most)
M=blender/src/polyhaven/models/moss_01/textures
magick "$M/moss_01_diff_4k.jpg" \( "$M/moss_01_alpha_4k.png" -colorspace gray \) -alpha off -compose CopyOpacity -composite -resize 2048x2048 PNG32:media/micro/moss-atlas.png
magick "$M/moss_01_nor_gl_4k.jpg" -resize 2048x2048 -quality 92 media/micro/moss-nor.jpg
# each shoot's box (x y w h, in the 2048 atlas), from the alpha's connected parts, the big ones
magick "$M/moss_01_alpha_4k.png" -colorspace gray -resize 2048x2048 -threshold 25% -morphology Close Disk:6 \
  -define connected-components:verbose=true -define connected-components:area-threshold=4000 -connected-components 8 null: \
  | awk '$NF ~ /gray\(255\)|srgb\(255/ { split($2, b, /[x+]/); print b[3], b[4], b[1], b[2] }' > media/micro/moss-sprigs.txt
echo "moss: $(wc -l < media/micro/moss-sprigs.txt | tr -d ' ') shoots"
cat media/micro/moss-sprigs.txt
