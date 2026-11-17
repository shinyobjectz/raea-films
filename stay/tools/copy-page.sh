#!/bin/bash
# The sheet on the copier's glass in the intro (v3/intro.tsx), seen from under the glass, so its printed face is toward
# us: a photocopied collage. The threshold's archway (media/title/arch.png, v3/arch-still.tsx) xeroxed hard, its
# blacks crushed and its greys gone to toner grain, scan streaks across it; over it, in white straight on the copy (no
# label behind them since 11-12), "› made in" in a typewriter's mono and "raea" as a tiny bitmap blown up until the
# toner rounds its pixels. the director, 11-12: "the intro text sucks ... i want something cleaner sexier ... that film reels looking photocopy
# text where its warped", and a frame of "› make it pop" as the look ("the text i was thinking of was liek this but at
# the mbegginning of made in").
#   bash tools/copy-page.sh  ->  media/title/copy-page.png (3300 x 2640: 0.165 m x 0.132 m of the sheet, 20 px a mm;
#   the lens sees its middle 0.15 m x 0.12 m, the film's frame)
set -euo pipefail
cd "$(dirname "$0")/.."
# (KEEP=DIR keeps every step's picture there, to look at)
if [[ -n "${KEEP:-}" ]]; then T=$KEEP; mkdir -p $T; else T=$(mktemp -d); trap 'rm -rf $T' EXIT; fi
W=3300; H=2640; M=media/fonts/GeistMono.ttf
# --- the photograph, xeroxed: the frame's 3000 x 2400 in the middle (the door where the next shot has it), black paper
# round it; greys crushed toward black and white and broken into toner grain; a little smear down the scan
# (the still is a moonlit night: lifted to its stone, then a hard S so the door and the shadows crush to black and the
# torch's wash and the stone's faces go to the copy's white; a gentler S, 3-30% then 6x48%, left the whole page a pale
# grey, nothing like a xerox)
# (the floor lifted a hair before the noise: on the crushed black's exact zeros ImageMagick's Gaussian noise gives NaN,
# which the blurs spread into black dashes down the whole page)
magick media/title/arch.png -resize 3000x2400 -colorspace gray -level 4%,34% -gamma 0.8 -sigmoidal-contrast 14x58% -unsharp 0x3+1.2+0 \
  -clamp +level 1%,99% -attenuate 0.6 +noise Gaussian -clamp -blur 0x1.0 -motion-blur 0x3+90 \
  -gravity center -background black -extent ${W}x${H} $T/photo.png
# scan streaks: a few rows broken into white dashes, and two faint dark bands down the drum
magick -size ${W}x${H} xc:black -fill white \
  -draw "rectangle 0,610 3300,613" -draw "rectangle 0,1915 3300,1917" -draw "rectangle 0,2290 3300,2291" \
  \( -size ${W}x${H} xc:gray +noise Random -colorspace gray -motion-blur 0x60+0 -threshold 58% \) -compose multiply -composite $T/streaks.png
magick $T/photo.png $T/streaks.png -compose screen -composite \
  \( -size ${W}x${H} xc:white -fill "gray(78%)" -draw "rectangle 820,0 860,2640" -draw "rectangle 2410,0 2432,2640" -blur 0x6 \) -compose multiply -composite $T/photo2.png
# --- no label: the words are white straight on the copy (the director, 11-12: "remove the white backgroudn behind the text use
# white text"); SY is where the strip was, the words' line
SY=1290
# --- the words: "› made in" in the mono, set at 130 px
magick -size ${W}x${H} xc:none -font $M -pointsize 130 -fill white -annotate +420+$((SY + 162)) "› made in" $T/mono.png
# "raea": set at 30 px into a tiny bitmap, blown up 22 times with no smoothing, then the toner rounds its pixels (as a
# photocopied low-res print does); it stands over the strip's top and its foot runs off the bottom
# (in one command: saved between steps, the tiny bitmap is a 1-bit picture, and the blur that rounds it does nothing)
# (alpha off at once: the text's black came out of -annotate fully transparent, and the word vanished on the page)
magick -size 140x40 xc:white -font $M -pointsize 30 -fill black -annotate +4+29 "raea" -alpha off -colorspace gray -threshold 70% \
  -filter point -resize 2000% -blur 0x6.5 -threshold 50% -type TrueColor PNG24:$T/big.png
# (its x-height, 320 px, from 30 px over the strip's top to 50 px under its foot)
magick -size ${W}x${H} xc:none \( $T/big.png -negate -alpha set -fuzz 10% -transparent black \) -geometry +1130+$((SY - 290)) -compose over -composite $T/raea.png
# --- the collage, copied: photo, the strip's shadow and the strip, the words; then the copy's own toner edge on all of it
# (a soft dark halo round the words, no box: on the hallway's drawing the white words were lost in its white lines)
magick $T/mono.png $T/raea.png -compose over -composite -alpha extract -morphology Dilate Disk:22 -blur 0x34 -level 0,70% \
  \( -size ${W}x${H} xc:black \) +swap -alpha off -compose copy_opacity -composite PNG32:$T/halo.png
magick $T/photo2.png $T/halo.png -compose over -composite \
  $T/mono.png -compose over -composite $T/raea.png -compose over -composite -colorspace gray $T/collage.png
magick -size ${W}x${H} xc:gray +noise Random -colorspace gray -blur 0x0.8 -level 35%,65% $T/grain.png
# (a soft re-threshold that keeps the photo's greys: the edges of the black go ragged, the flats keep their tone)
magick $T/collage.png -blur 0x1.2 $T/grain.png -compose blend -define compose:args=12 -composite -sigmoidal-contrast 6x50% $T/copy.png
# --- on paper: the copy's black is toner (#161514), its white the sheet (#efebe2) with its fibres
# (the fibres a multiply between 94% and 100%: the faintest texture. Stretched to full range they were crosshatching,
# and ImageMagick's softlight brightened the whole sheet even against a mid grey)
magick -size 1650x1320 xc:gray +noise Random -colorspace gray -motion-blur 0x12+35 $T/f1.png
magick -size 1650x1320 xc:gray +noise Random -colorspace gray -motion-blur 0x14+120 $T/f2.png
magick $T/f1.png $T/f2.png -compose blend -define compose:args=50 -composite -auto-level +level 94%,100% -resize ${W}x${H}! $T/fibre.png
magick $T/copy.png -colorspace sRGB -type TrueColor +level-colors "#161514","#efebe2" $T/fibre.png -compose multiply -composite -type TrueColor PNG24:media/title/copy-page.png
# and the glass's dust: a few specks and a hair, white on clear, for the platen (media/title/copier-dust.png, the same
# 0.165 m x 0.132 m)
magick -size 1650x1320 xc:gray +noise Random -colorspace gray -threshold 99.97% -morphology Dilate Disk:1.2 -blur 0x0.6 $T/dust-a.png
magick -size 1650x1320 xc:black -stroke white -strokewidth 1.4 -fill none -draw "bezier 220,1050 560,960 720,1160 1010,1100" -blur 0x0.5 $T/hair.png
magick $T/dust-a.png $T/hair.png -compose lighten -composite -resize ${W}x${H}! $T/dust-alpha.png
magick -size ${W}x${H} xc:"#f4f1ea" $T/dust-alpha.png -alpha off -compose copy_opacity -composite PNG32:media/title/copier-dust.png
echo "media/title/copy-page.png: $(identify -format '%wx%h' media/title/copy-page.png); copier-dust.png: $(identify -format '%wx%h' media/title/copier-dust.png)"
