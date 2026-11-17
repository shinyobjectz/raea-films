#!/bin/bash
# The opening's words, "› made in raea", white with a soft dark halo, on clear, the size of the frame (1350 x 1080):
# the copy page's words (tools/copy-page.sh) without the page, for the threshold's photocopy (v3/worlds.tsx Copier).
# the director, 11-12: "we literally dont distingush two scenes its phtocopier look on the scene with thre torch".
#   bash tools/made-in.sh       ->  media/title/made-in-white.png       (the 5:4 frame, the words on one line)
#   bash tools/made-in.sh tall  ->  media/title/made-in-white-tall.png  (1080 x 1920, laid out again for it)
# The tall frame's words are set for that frame, not the 5:4 picture stretched to it (the director, 11-14: "it looks like you
# squashed the title ... redesigned for 9x16"): "› made in" over "raea", left-aligned together and centred on the
# networks' safe box (x 65..940, y 269..1248), "raea" about 800 px across and "› made in" 67 px. They are drawn at the
# copy page's scale (2.22 px a frame pixel), as the 5:4 words are, so the toner rounds them the same, then brought down.
set -euo pipefail
cd "$(dirname "$0")/.."
K=$(mktemp -d); trap 'rm -rf $K' EXIT
if [[ ${1:-} != tall ]]; then
  KEEP=$K bash tools/copy-page.sh > /dev/null
  # (the words as the copier lays toner: their edge softened and taken back to a hard one, a little ragged)
  magick $K/halo.png $K/mono.png -compose over -composite $K/raea.png -compose over -composite \
    -gravity center -crop 3000x2400+0+0 +repage -resize 1350x1080 PNG32:media/title/made-in-white.png
  echo "media/title/made-in-white.png: $(identify -format '%wx%h' media/title/made-in-white.png)"
  exit 0
fi
M=media/fonts/GeistMono.ttf
S=2.2222                                   # (copy-page px per frame px: its 3000 px are the 5:4 frame's 1350)
W=2400; H=4267                             # (the tall frame, 1080 x 1920, at that scale)
# "raea": the same tiny bitmap as the copy page's, blown up 25 times (20 there) and rounded by the same blur, scaled
# to match; trimmed to its letters
magick -size 140x40 xc:white -font $M -pointsize 30 -fill black -annotate +4+29 "raea" -alpha off -colorspace gray -threshold 70% \
  -filter point -resize 2500% -blur 0x8.1 -threshold 50% -negate -trim +repage -type TrueColor PNG24:$K/big.png
magick $K/big.png -alpha set -fuzz 10% -transparent black PNG32:$K/raea-cut.png
# "› made in" in the mono, white, trimmed to its letters
magick -background none -fill white -font $M -pointsize 150 label:"› made in" -trim +repage PNG32:$K/mono-cut.png
read -r rw rh < <(identify -format '%w %h\n' $K/raea-cut.png)
read -r mw mh < <(identify -format '%w %h\n' $K/mono-cut.png)
gap=$(awk -v s=$S 'BEGIN { printf "%d", 34 * s }')
bw=$(( rw > mw ? rw : mw )); bh=$(( mh + gap + rh ))
# the block centred on the safe box's middle (502.5, 758.5)
x0=$(awk -v s=$S -v w=$bw 'BEGIN { printf "%d", 502.5 * s - w / 2 }')
y0=$(awk -v s=$S -v h=$bh 'BEGIN { printf "%d", 758.5 * s - h / 2 }')
magick -size ${W}x${H} xc:none $K/mono-cut.png -geometry +$x0+$y0 -compose over -composite PNG32:$K/mono.png
magick -size ${W}x${H} xc:none $K/raea-cut.png -geometry +$x0+$((y0 + mh + gap)) -compose over -composite PNG32:$K/raea.png
# the copy page's soft dark halo round the words, at the same reach
magick $K/mono.png $K/raea.png -compose over -composite -alpha extract -morphology Dilate Disk:22 -blur 0x34 -level 0,70% \
  \( -size ${W}x${H} xc:black \) +swap -alpha off -compose copy_opacity -composite PNG32:$K/halo.png
magick $K/halo.png $K/mono.png -compose over -composite $K/raea.png -compose over -composite \
  -resize 1080x1920! PNG32:media/title/made-in-white-tall.png
echo "media/title/made-in-white-tall.png: $(identify -format '%wx%h' media/title/made-in-white-tall.png); words $(awk -v s=$S -v w=$bw -v h=$bh 'BEGIN { printf "%d x %d px", w / s, h / s }') at $(awk -v s=$S -v x=$x0 -v y=$y0 'BEGIN { printf "%d, %d", x / s, y / s }')"
