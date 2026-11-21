#!/bin/zsh
export PATH=/opt/homebrew/bin:$PATH
cd "$(dirname "$0")/../out/rebuilt/real/kling4"
one() {
  id=$1
  [ -f out/$id/vace.mp4 ] && { echo "have $id"; return; }
  ffmpeg -v error -y -i ../../../../assets/rebuilt/shots4/$id.mp4 -an -c:v libx264 -crf 17 -preset fast -threads 4 -pix_fmt yuv420p src/$id.mp4
  /opt/homebrew/bin/python3.12 tools/fal_run.py $id.json out/$id > out-$id.log 2>&1 && echo "done $id" || { echo "FAILED $id"; tail -2 out-$id.log; }
}
for id in rb-stair rb-stable rb-kochraum; do one $id & done
wait
echo ALL
