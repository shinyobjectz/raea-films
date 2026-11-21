#!/bin/zsh
# Kling O3 Pro edit for each id given (src: shots5/bare/ID.mp4, or shots/rb-dive.mp4), in parallel; installs to shots5/ID.mp4
export PATH=/opt/homebrew/bin:$PATH
G="$(cd "$(dirname "$0")/.." && pwd)"
cd $G/out/rebuilt/real/kling5c
one() {
  id=$1
  [ -f out/$id/vace.mp4 ] && { echo "have $id"; return; }
  s=$G/assets/rebuilt/shots5/bare/$id.mp4; [ $id = rb-dive ] && s=$G/assets/rebuilt/shots/rb-dive.mp4
  ffmpeg -v error -y -i $s -an -c:v libx264 -crf 17 -preset fast -threads 4 -pix_fmt yuv420p src/$id.mp4
  /opt/homebrew/bin/python3.12 tools/fal_run.py $id.json out/$id > out-$id.log 2>&1 && { cp out/$id/vace.mp4 $G/assets/rebuilt/shots5/$id.mp4; echo "done $id $(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 out/$id/vace.mp4)"; } || { echo "FAILED $id"; tail -2 out-$id.log; }
}
for id in "$@"; do one $id & done
wait
echo ALL
