#!/bin/bash
# The printed and painted surfaces of our own props (blender/ours.py reads them from blender/src/tex/): a clock dial,
# a pull station's face, pads and forms, binder spines, a records box's print, plant leaves, the extinguisher's label
# and inspection tag. Drawn here with ImageMagick, so every one is ours and reproducible.
#   tools/tex.sh
set -euo pipefail
cd "$(dirname "$0")/.."
O=blender/src/tex; mkdir -p "$O"
SUP=/System/Library/Fonts/Supplemental
AB="$SUP/Arial Bold.ttf"; ABK="$SUP/Arial Black.ttf"; AN="$SUP/Arial Narrow Bold.ttf"; AR="$SUP/Arial.ttf"
DIN="$SUP/DIN Condensed Bold.ttf"; HAND="$SUP/Bradley Hand Bold.ttf"; HV=/System/Library/Fonts/Helvetica.ttc

# paper grain: a faint mottle to multiply over any paper
magick -size 1024x1024 xc:gray50 -seed 3 +noise Gaussian -blur 0x1.5 -level 40%,60% -fill white -colorize 82% "$O/_grain.png"
paper() { magick "$1" \( "$O/_grain.png" -resize "$(magick identify -format %wx%h! "$1")" \) -compose multiply -composite "$1"; }

# --- the wall clock's dial: minute ticks, hour bars, numerals, a maker's line
D=$O/clock-dial.png
ticks=""; for i in $(seq 0 59); do
  a=$(echo "$i*6" | bc -l); r0=$([ $((i % 5)) -eq 0 ] && echo 418 || echo 446); w=$([ $((i % 5)) -eq 0 ] && echo 9 || echo 3)
  x0=$(echo "512+s($a*3.14159265/180)*$r0" | bc -l); y0=$(echo "512-c($a*3.14159265/180)*$r0" | bc -l)
  x1=$(echo "512+s($a*3.14159265/180)*478" | bc -l); y1=$(echo "512-c($a*3.14159265/180)*478" | bc -l)
  ticks="$ticks stroke-width $w line $x0,$y0 $x1,$y1"
done
nums=""; for h in $(seq 1 12); do
  a=$(echo "$h*30" | bc -l); x=$(echo "512+s($a*3.14159265/180)*350" | bc -l); y=$(echo "512-c($a*3.14159265/180)*350" | bc -l)
  nums="$nums -annotate +$(printf %.0f "$(echo "$x-512" | bc -l)")+$(printf %.0f "$(echo "$y-512" | bc -l)") $h"
done
magick -size 1024x1024 xc:"#f2efe6" -stroke "#151515" -draw "$ticks" -stroke none \
  -fill "#151515" -font "$HV" -pointsize 96 -gravity center $nums \
  -font "$AN" -pointsize 30 -fill "#3a3a3a" -annotate +0+170 "QUARTZ" "$D"
paper "$D"

# --- the pull station's face (it is red plastic; this is its white print, on red)
magick -size 400x580 xc:"#b3171b" -fill white -font "$ABK" -pointsize 108 -gravity north -annotate +0+26 "FIRE" \
  -font "$AB" -pointsize 34 -annotate +0+168 "PULL DOWN" -fill "#f4f1ea" -draw "roundrectangle 70,230 330,330 14,14" \
  -fill "#b3171b" -font "$AB" -pointsize 30 -annotate +0+262 "PULL" -fill white -font "$AR" -pointsize 22 -gravity south -annotate +0+34 "PUSH IN  •  PULL DOWN" \
  "$O/alarm-face.png"

# --- a yellow legal pad: blue rules, a red double margin, a few lines of ballpoint
L=$O/legal-pad.png
rules=""; for y in $(seq 150 34 1500); do rules="$rules line 0,$y 1024,$y"; done
magick -size 1024x1560 xc:"#f6eb9a" -stroke "#8fb0d6" -strokewidth 2 -draw "$rules" -stroke "#d65a5a" -draw "line 150,0 150,1560 line 158,0 158,1560" -stroke none \
  -fill "#22305a" -font "$HAND" -pointsize 40 -annotate -1x-1+180+212 "call Dave re: Q4 figures" -annotate 0x0+180+246 "- toner (copy rm)" \
  -annotate 1x1+180+280 "- badge renewal Fri" -annotate 0x0+180+348 "3rd floor keys??" -annotate -2x-2+180+416 "11:40 still here" "$L"
paper "$L"

# --- a pink While You Were Out slip
W=$O/message-slip.png
magick -size 640x400 xc:"#f4b8c6" -fill "#7a1830" -font "$ABK" -pointsize 44 -gravity north -annotate +0+18 "WHILE YOU WERE OUT" -gravity northwest \
  -font "$AB" -pointsize 22 -annotate +28+92 "FOR" -annotate +28+140 "M" -annotate +28+188 "OF" -annotate +28+236 "PHONE" \
  -stroke "#7a1830" -strokewidth 2 -draw "line 90,112 610,112 line 70,160 610,160 line 80,208 610,208 line 120,256 610,256" -stroke none \
  -font "$AR" -pointsize 18 -annotate +28+300 "TELEPHONED [x]   PLEASE CALL [x]   WILL CALL AGAIN [ ]" \
  -fill "#21305a" -font "$HAND" -pointsize 34 -annotate +110+106 "you" -annotate +60+154 "nobody - line 3" -annotate +140+250 "x 3003" "$W"
paper "$W"

# --- printed memo sheets: a heading and grey lines of type, three variants
for v in 1 2 3; do
  M=$O/memo-$v.png; t=("" "MEMORANDUM" "FLOOR 3 - WEEKLY REPORT" "BUILDING SERVICES NOTICE")
  lines=""; y=300; for i in $(seq 1 26); do w=$(( 560 + (i * 97 * v % 280) )); [ $((i % 7)) -eq 0 ] && w=300; lines="$lines rectangle 110,$y $((110 + w)),$((y + 9))"; y=$((y + 36)); done
  magick -size 1024x1325 xc:"#f4f3ee" -fill "#202020" -font "$AB" -pointsize 44 -annotate +110+170 "${t[$v]}" \
    -font "$AR" -pointsize 22 -annotate +110+222 "TO: All staff    FROM: Facilities    RE: After-hours access" \
    -stroke "#202020" -strokewidth 2 -draw "line 110,246 914,246" -stroke none -fill "#5b5b5b" -draw "$lines" "$M"
  paper "$M"
done

# --- the clipboard's sheet: an after-hours sign-out log, half filled in
G=$O/clip-log.png
grid=""; for y in $(seq 300 52 1250); do grid="$grid line 80,$y 944,$y"; done
magick -size 1024x1325 xc:"#f5f4ef" -fill "#1d1d1d" -font "$AB" -pointsize 42 -annotate +80+150 "AFTER-HOURS SIGN-OUT" -font "$AR" -pointsize 24 -annotate +80+200 "Floor 3  •  All staff leaving after 7 PM must sign out" \
  -stroke "#333" -strokewidth 2 -draw "$grid line 80,248 944,248 line 80,248 80,1236 line 944,248 944,1236 line 300,248 300,1236 line 640,248 640,1236" -stroke none \
  -font "$AB" -pointsize 24 -annotate +96+284 "DATE" -annotate +316+284 "NAME" -annotate +656+284 "TIME OUT" \
  -fill "#1f2b52" -font "$HAND" -pointsize 34 -annotate +96+340 "11/12" -annotate +316+340 "R. Mills" -annotate +656+340 "7:15p" \
  -annotate +96+392 "11/12" -annotate +316+392 "D. Kerr" -annotate +656+392 "8:02p" -annotate +96+444 "11/13" -annotate +316+444 "T. Bryce" -annotate +656+444 "7:40p" \
  -annotate +96+496 "11/13" -annotate +316+496 "R. Mills" -annotate +656+496 "9:31p" "$G"
paper "$G"

# --- binder spines: an atlas of 8 (each 128 x 1024), colours of the period, a typed label window
B=$O/binder-spines.png; cols=("#2e4a7a" "#7a2b2b" "#2f5a3a" "#1f1f22" "#c9c3b0" "#3d5f8f" "#6a5a3a" "#8a8a86")
labs=("Q3 1997" "INVOICES" "PERSONNEL" "MINUTES" "VENDORS" "Q4 1997" "LEASES" "FLOOR 3")
args=(); for i in $(seq 0 7); do x=$((i * 128)); args+=(-fill "${cols[$i]}" -draw "rectangle $x,0 $((x + 127)),1023" -fill "#efece2" -draw "rectangle $((x + 22)),180 $((x + 105)),520" \
  -fill "#d8d4c8" -draw "circle $((x + 64)),880 $((x + 64)),904"); done
magick -size 1024x1024 xc:black "${args[@]}" "$B"
for i in $(seq 0 7); do x=$((i * 128)); magick "$B" \( -background none -fill "#1d1d1d" -font "$AN" -pointsize 34 label:"${labs[$i]}" -rotate -90 \) -gravity northwest -geometry +$((x + 46))+$((350 - 4 * ${#labs[$i]} * 4)) -composite "$B"; done
magick "$B" \( -size 1024x1024 xc:gray50 -seed 9 +noise Gaussian -blur 0x0.8 -level 42%,58% -fill white -colorize 75% \) -compose multiply -composite "$B"

# --- a records box: kraft card, a printed end panel with a handwritten label
X=$O/records-box.png
magick -size 1024x1024 xc:"#b08a5a" -seed 5 +noise Gaussian -blur 0x0.7 -modulate 100,85 \
  -fill "#3b2a1e" -font "$ABK" -pointsize 64 -gravity north -annotate +0+70 "RECORDS STORAGE" -font "$AB" -pointsize 30 -annotate +0+150 "LETTER / LEGAL  •  LIFT-OFF LID" \
  -fill "#efe9d8" -draw "rectangle 262,330 762,640" -stroke "#3b2a1e" -strokewidth 3 -fill none -draw "rectangle 262,330 762,640" -stroke none \
  -gravity northwest -fill "#3b2a1e" -font "$AB" -pointsize 24 -annotate +280+346 "CONTENTS" -annotate +280+560 "DESTROY AFTER" \
  -fill "#1d1d1d" -font "$HAND" -pointsize 54 -annotate -2x-2+300+400 "Floor 3 - 1995" -annotate 0x0+300+470 "personnel" -annotate 1x1+560+560 "2002" \
  -fill "#3b2a1e" -draw "roundrectangle 412,760 612,830 30,30" "$X"

# --- leaves: across the width u (0..1), along the length v (0 at the stem); both sides alike
# a corn plant's (dracaena): dark edges, a pale lime stripe down the middle, dry brown tips
magick -size 256x1024 xc: \
  -fx "ee=abs(i/w-0.5)*2; ss=exp(-(ee*ee)/0.09); dd=max(0,(j/h-0.9)*10); channel(0.13+0.42*ss, 0.27+0.38*ss, 0.10+0.10*ss)*(1-dd)+channel(0.45,0.33,0.16)*dd" \
  -seed 11 -attenuate 0.25 +noise Gaussian -blur 0x0.6 "$O/leaf-dracaena.png"
# a snake plant's: dark green with pale grey-green wavy bands across it, yellow margins
magick -size 256x1024 xc: \
  -fx "ee=abs(i/w-0.5)*2; bb=0.5+0.5*sin(j/h*90+sin(i/w*6)*1.6); mm=ee>0.88?1:0; (channel(0.10,0.24,0.12)*(1-0.55*bb)+channel(0.42,0.52,0.38)*0.55*bb)*(1-mm)+channel(0.78,0.72,0.28)*mm" \
  -seed 12 -attenuate 0.2 +noise Gaussian -blur 0x0.5 "$O/leaf-snake.png"

# --- the extinguisher: its wrap-around label (front panel only printed) and its inspection tag
E=$O/ext-label.png
magick -size 1024x512 xc:"#b5161b" -fill "#f2f0e8" -draw "rectangle 300,30 724,482" \
  -fill "#1f2d6b" -draw "rectangle 300,30 724,150" -fill white -font "$ABK" -pointsize 40 -gravity north -annotate +0+44 "FIRE EXTINGUISHER" \
  -fill "#f2c230" -font "$ABK" -pointsize 44 -annotate +0+94 "5 LB   ABC" \
  -fill "#1d1d1d" -font "$AB" -pointsize 26 -annotate +0+168 "DRY CHEMICAL" \
  -stroke "#c62828" -strokewidth 8 -fill white -draw "circle 402,262 402,226" -draw "circle 512,262 512,226" -draw "circle 622,262 622,226" -stroke none \
  -gravity northwest -font "$ABK" -pointsize 40 -fill "#1d7a3a" -annotate +388+240 "A" -fill "#c62828" -annotate +498+240 "B" -fill "#1f5fa8" -annotate +609+240 "C" \
  -fill "#6a6a6a" -draw "rectangle 326,322 698,328 rectangle 326,340 668,346 rectangle 326,358 690,364 rectangle 326,376 640,382 rectangle 326,394 684,400 rectangle 326,412 660,418" \
  -fill "#1d1d1d" -font "$AB" -pointsize 24 -annotate +326+440 "UL RATED 2-A:10-B:C" "$E"
T=$O/ext-tag.png
rows=""; for i in $(seq 0 8); do y=$((330 + i * 38)); rows="$rows line 40,$y 472,$y"; done
magick -size 512x700 xc:"#f1efe6" -fill "#c8312c" -draw "rectangle 20,20 492,680" -fill "#f1efe6" -draw "rectangle 32,120 480,668" -fill "#222" -draw "circle 256,62 256,48" \
  -fill white -font "$ABK" -pointsize 30 -gravity north -annotate +0+76 "INSPECTION RECORD" -gravity northwest \
  -fill "#1d1d1d" -font "$AB" -pointsize 20 -annotate +44+160 "LOCATION" -annotate +44+204 "UNIT NO." -annotate +44+290 "DATE" -annotate +190+290 "BY" -annotate +360+290 "OK" \
  -stroke "#333" -strokewidth 2 -draw "line 40,180 472,180 line 40,224 472,224 line 40,272 472,272 $rows line 180,272 180,672 line 350,272 350,672" -stroke none \
  -fill "#1e2a4a" -font "$HAND" -pointsize 28 -annotate +170+152 "3rd fl. corridor" -annotate +170+198 "3-07" \
  -annotate +48+362 "6/10" -annotate +192+362 "R. Mills" -annotate +366+362 "ok" -annotate +48+400 "7/8" -annotate +192+400 "R. Mills" -annotate +366+400 "ok" \
  -annotate +48+438 "8/12" -annotate +192+438 "D. Kerr" -annotate +366+438 "ok" -annotate +48+476 "9/9" -annotate +192+476 "D. Kerr" -annotate +366+476 "ok" \
  -annotate +48+514 "10/14" -annotate +192+514 "R. Mills" -annotate +366+514 "ok" "$T"
paper "$T"



# --- the desks' laminate: a warm putty linen speckle, tiled every 0.6 m
magick -size 1024x1024 xc:"#c4bca9" -seed 21 -attenuate 0.35 +noise Gaussian -blur 0x0.6 \
  \( -size 1024x1024 xc:gray50 -seed 22 +noise Random -blur 0x9 -level 46%,54% \) -compose overlay -composite \
  \( -size 1024x1024 xc: -seed 23 +noise Random -channel G -separate +channel -threshold 99.4% -negate -blur 0x0.5 \) -compose multiply -composite \
  -modulate 100,80 "$O/laminate.png"
rm -f "$O/_grain.png"
ls -1 "$O"
