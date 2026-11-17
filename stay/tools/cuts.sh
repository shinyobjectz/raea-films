#!/bin/bash
# The film's cuts, a pair a cut: the last frame of each shot beside the first frame of the next, with the thirds drawn,
# so a match cut can be judged where it happens ->  out/v2/proof/cuts-N.jpg (six cuts a sheet)
cd "$(dirname "$0")/.."
ids=(); while IFS= read -r l; do ids+=("$l"); done < <(bun -e 'import { SHOTS } from "./v2/plan"; for (const s of SHOTS) console.log(s.id)')
mkdir -p out/v2/proof/cut
G="drawgrid=w=iw/3:h=ih/3:t=1:c=white@0.5"
n=0
for ((i = 0; i + 1 < ${#ids[@]}; i++)); do
  a=${ids[$i]}; b=${ids[$((i + 1))]}
  ffmpeg -y -loglevel error -sseof -0.05 -i out/v2/shots/$a.mp4 -update 1 -frames:v 1 -vf "scale=400:-1,$G" out/v2/proof/cut/a.jpg
  ffmpeg -y -loglevel error -i out/v2/shots/$b.mp4 -frames:v 1 -vf "scale=400:-1,$G" out/v2/proof/cut/b.jpg
  ffmpeg -y -loglevel error -i out/v2/proof/cut/a.jpg -i out/v2/proof/cut/b.jpg -filter_complex "hstack,pad=iw+16:ih+10:8:5:black" out/v2/proof/cut/p$(printf %02d $i).jpg
done
for s in 0 1 2 3; do
  list=(); for ((i = s * 7; i < s * 7 + 7 && i + 1 < ${#ids[@]}; i++)); do list+=(-i out/v2/proof/cut/p$(printf %02d $i).jpg); done
  ffmpeg -y -loglevel error "${list[@]}" -filter_complex "vstack=${#list[@]}" out/v2/proof/cuts-$s.jpg 2>/dev/null || ffmpeg -y -loglevel error "${list[@]}" -filter_complex "vstack=$(( ${#list[@]} / 2 ))" out/v2/proof/cuts-$s.jpg
  echo out/v2/proof/cuts-$s.jpg
done
