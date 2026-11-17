#!/usr/bin/env bash
# The papers the player reads, as page images (A4 at 150 dpi): the facilities notice on the corridor's board, and the
# copier's page (out/stills/photo.png, rendered from compositions/photo.tsx, photocopied under a fax header). Their words
# come from game/lines.ts's PAPERS; keep the two in step.
#   bash tools/papers.sh
set -euo pipefail
cd "$(dirname "$0")/.."
F=/System/Library/Fonts/Supplemental
OUT=assets/papers
mkdir -p "$OUT" .cache/papers
W=1240 H=1754

# paper: warm off-white with a faint tooth
magick -size ${W}x${H} xc:'#efece2' -attenuate 0.35 +noise Gaussian -blur 0x0.8 .cache/papers/paper.png

# ---- the notice -------------------------------------------------------------------------------------------------------
BODY="Occupancy lighting is now active on Floor 3. Lights switch off when no movement is detected.

Staff working late: please keep moving.

Do not answer phones at desks other than your own."
magick -background none -fill '#1d1c1a' -font "$F/Arial Bold.ttf" -pointsize 84 label:'FACILITIES NOTICE' .cache/papers/n-title.png
magick -background none -fill '#1d1c1a' -font "$F/Arial.ttf" -pointsize 50 -interline-spacing 14 -size 1000x caption:"$BODY" .cache/papers/n-body.png
magick -background none -fill '#3a3834' -font "$F/Arial Italic.ttf" -pointsize 44 label:'Building Management' .cache/papers/n-sign.png
magick .cache/papers/paper.png \
  .cache/papers/n-title.png -gravity north -geometry +0+170 -composite \
  -fill '#1d1c1a' -draw "rectangle 120,300 1120,306" \
  .cache/papers/n-body.png -gravity north -geometry +0+390 -composite \
  .cache/papers/n-sign.png -gravity southeast -geometry +130+260 -composite \
  -fill '#1d1c1a' -draw "rectangle 700,1418 1110,1421" \
  -quality 92 "$OUT/notice.png"

# ---- the copier's page ------------------------------------------------------------------------------------------------
HEADER="FROM: OKAFOR, D.  IT-3F  EXT 314     NOV 13  11:52 PM     P.01"
# the photo, photocopied: grey, crushed, a little soft, then toner grain and a halftone
magick out/stills/photo.png -gravity center -crop 1660x1080+0+0 +repage -colorspace Gray -resize 1100x \
  -auto-level -gamma 2.1 -level 4%,72% -sigmoidal-contrast 6x48% -blur 0x0.7 \
  \( +clone -attenuate 1.4 +noise Gaussian \) -compose multiply -composite \
  -ordered-dither o8x8,6 -blur 0x0.45 .cache/papers/p-photo.png
magick -background none -fill '#141414' -font "$F/Courier New Bold.ttf" -pointsize 30 label:"$HEADER" .cache/papers/p-head.png
magick .cache/papers/paper.png \
  .cache/papers/p-head.png -gravity north -geometry +0+70 -composite \
  -fill '#141414' -draw "rectangle 70,120 1170,123" \
  .cache/papers/p-photo.png -gravity north -geometry +0+190 -composite \
  -colorspace Gray .cache/papers/p-page.png
# the drum's marks: a pale streak down the page, a few toner specks, the page a hair askew
magick .cache/papers/p-page.png \
  \( -size ${W}x${H} xc:black -fill white -draw "rectangle 842,0 856,${H}" -blur 0x6 -evaluate multiply 0.18 \) -compose screen -composite \
  \( -size ${W}x${H} xc:white -seed 7 -attenuate 0.9 +noise Impulse -threshold 2% -negate -morphology dilate disk:1 -negate \) -compose multiply -composite \
  -background '#efece2' -rotate 0.5 -gravity center -extent ${W}x${H} \
  -quality 92 "$OUT/printout.png"
# the board shows it on a cuboid face whose u runs right to left as seen, so it is drawn from a mirrored copy
magick "$OUT/notice.png" -flop "$OUT/notice-m.png"
echo "wrote $OUT/notice.png $OUT/notice-m.png $OUT/printout.png"
