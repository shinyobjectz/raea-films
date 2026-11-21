#!/bin/zsh
# each shot: the master render re-encoded under fal's 200 MB cap, then Kling O3 Pro Edit with its keyframe
export PATH=/opt/homebrew/bin:$PATH
cd "$(dirname "$0")/../out/rebuilt/real/kling"
mkdir -p src
one() {
  id=$1
  [ -f out/$id/vace.mp4 ] && { echo "have $id"; return; }
  ffmpeg -v error -y -i ../../../../assets/rebuilt/shots/$id.mp4 -an -c:v libx264 -crf 17 -preset fast -threads 4 -x264-params rc-lookahead=20 -pix_fmt yuv420p src/$id.mp4
  python3 tools/fal_run.py $id.json out/$id > out-$id.log 2>&1 && echo "done $id" || { echo "FAILED $id"; tail -2 out-$id.log; }
}
mkdir -p out
for id in rb-walk rb-shops rb-forecourt rb-friedrich rb-dusk rb-dom rb-roofs rb-fly rb-rise rb-people rb-loft rb-plan; do one $id & done
wait
