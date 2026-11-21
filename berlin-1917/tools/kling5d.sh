#!/bin/zsh
export PATH=/opt/homebrew/bin:$PATH
cd "$(dirname "$0")/../out/rebuilt/real/kling5d"
one() {
  id=$1
  [ -f out/$id/vace.mp4 ] && { echo "have $id"; return; }
  /opt/homebrew/bin/python3.12 tools/fal_run.py $id.json out/$id > out-$id.log 2>&1 && echo "done $id" || { echo "FAILED $id"; tail -2 out-$id.log; }
}
IDS=(s5-court-dusk s5-court-privy s5-cellar s5-cellar-coal s5-kitchen-room s5-kitchen-window s5-kitchen-lamp s5-salon s5-warkitchen s5-room-best s5-room-clerk s5-room-wing)
for id in $IDS; do ffmpeg -v error -y -i ../../../../assets/rebuilt/shots5/bare/$id.mp4 -an -c:v libx264 -crf 17 -preset fast -threads 2 -pix_fmt yuv420p src/$id.mp4 || exit 1; done
for id in s5-court-dusk s5-court-privy s5-cellar s5-cellar-coal s5-kitchen-room s5-kitchen-window s5-kitchen-lamp s5-salon s5-warkitchen s5-room-best s5-room-clerk s5-room-wing; do one $id & done
wait
echo ALL
