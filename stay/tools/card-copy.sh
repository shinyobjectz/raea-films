#!/bin/bash
# The end card photocopied (v3/card-copy.ts says when): CARD.mp4's render kept as CARD-clean.mp4 and CARD.mp4 written
# over it with the copier's pass: the lamp's band sweeping across left to right, the card behind it turned to its
# photocopy (grey, crushed to toner, grain, two faint drum bands and a few streaks), the exposure's flash as it ends.
# A file already copied (its comment says so) is copied again from its clean render, never from itself.
#   bash tools/card-copy.sh [out/v3/shots/card.mp4]
set -euo pipefail
cd "$(dirname "$0")/.."
f=${1:-out/v3/shots/card.mp4}; clean=${f%.mp4}-clean.mp4
if [[ "$(ffprobe -v error -show_entries format_tags=comment -of csv=p=0 "$f")" == card-copy ]]; then
  [[ -f $clean ]] || { echo "$f is a copy and there is no $clean: render the card again" >&2; exit 1; }
else
  mv "$f" "$clean"
fi
read -r at sw < <(bun -e 'import { COPY } from "./v3/card-copy"; console.log(COPY.at, COPY.sweep)')
end=$(bun -e "console.log(($at + $sw).toFixed(3))")
P="((T-$at)/$sw*W*1.3-W*0.15)"
expr="min(255,if(lt(T,$at),A,if(lt(X,$P),B,A))+if(between(T,$at,$end),235*exp(-pow((X-$P)/(W*0.05),2))+40*exp(-pow((X-$P+W*0.12)/(W*0.1),2)),0)+if(gte(T,$end),255*exp(-(T-$end)/0.14),0))"
IFS=, read -r w h < <(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$clean")
# the copy: grey, the toner bled (a blur) and pushed to black and paper white; big blacks come out as toner does, a
# mottled dark grey (a coarse noise blurred into blotches, strongest where it is darkest) with fine grain over all;
# the sheet a hair off square and off centre on the glass; two faint drum bands and a few streaks
# the copier's insides faintly in the glass, the carriage riding the beam (blender/copier-under.py renders them from
# COPY.at on; the director, 11-12: "a reflection on the pane faintly behind the light beam as if we can see behind us in the
# glass at the machine"); with no frames, a black input and no reflection
R=out/v3/copier-under
if [[ -f $R/0000.png ]]; then refl=(-framerate 30 -i "$R/%04d.png"); else refl=(-f lavfi -i "color=c=black:s=${w}x${h}:r=30:d=1"); fi
ffmpeg -nostdin -y -loglevel error -i "$clean" \
  -f lavfi -i "color=c=gray:s=$((w / 9))x$((h / 9)):r=30,noise=alls=100:allf=u,scale=$w:$h:flags=bicubic,gblur=sigma=$((w / 140)),format=gray" \
  -f lavfi -i "color=c=gray:s=${w}x${h}:r=30,noise=alls=70:allf=u,format=gray" \
  "${refl[@]}" \
  -filter_complex "[0:v]split=2[a][b];\
[b]format=gray,rotate=0.006:c=black,scale=iw*1.012:-1,crop=$w:$h:(iw-$w)/2+5:(ih-$h)/2-3,gblur=sigma=0.8,curves=all='0/0.07 0.3/0.1 0.55/0.86 1/0.97'[g];\
[g][1:v]blend=all_expr='A+(B-128)*0.16*pow(1-A/255,2)',format=gray[m];\
[m][2:v]blend=all_expr='A+(B-128)*0.13',\
drawbox=x=iw*0.21:y=0:w=iw*0.035:h=ih:color=black@0.14:t=fill,drawbox=x=iw*0.74:y=0:w=iw*0.02:h=ih:color=black@0.1:t=fill,\
drawbox=x=0:y=ih*0.31:w=iw:h=2:color=white@0.3:t=fill,drawbox=x=0:y=ih*0.67:w=iw:h=1:color=white@0.25:t=fill,format=gbrp[c];\
[a]format=gbrp[o];[o][c]blend=all_expr='$expr':shortest=1[w];\
[3:v]scale=$w:$h,format=gray,gblur=sigma=1.4,tpad=start_duration=$at:stop=-1:color=black,format=gbrp[r];\
[w][r]blend=all_expr='min(255,A+B*${REFL:-0.3})':shortest=1,format=yuv420p[v]" -map "[v]" -map 0:a? -t "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$clean")" -c:v libx264 -preset slow -crf 12 -c:a copy -metadata comment=card-copy "$f"
echo "$f: the card photocopied from $at s, the lamp across in $sw s (its clean render: $clean)"
