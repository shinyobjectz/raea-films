#!/bin/zsh
export PATH=/opt/homebrew/bin:$PATH
cd "$(dirname "$0")/.."
S=assets/rebuilt/shots5
mkdir -p assets/rebuilt/shots5/bare out/work/r5house out/work/r5gallery
one() { # id out
  [ -s $2 ] && { echo "have $1"; return; }
  raea render compositions/rebuilt-v5-rooms.tsx --composition $1 -o $2 --quality master 2>&1 | grep -E "REFUSED|panic|raea render: [0-9]" | tail -2
  [ -s $2 ] && echo "done $1" || echo "FAILED $1"
}
for id in s5-court-dusk s5-court-privy s5-cellar s5-cellar-coal s5-kitchen-room s5-kitchen-window s5-kitchen-lamp s5-salon s5-warkitchen s5-room-best s5-room-clerk s5-room-wing; do one $id $S/bare/$id.mp4; done
for id in s5-sewers3d-crossing s5-sewers3d-station s5-sewer-shaft; do one $id $S/$id.mp4; done
for n in -1 0 1 2 3 4 5; do one s5-house-L$n out/work/r5house/L$n.mp4; done
for i in 0 1 2 3 4 5 6 7 8 9 10 11; do
  [ -s out/work/r5gallery/g$i.png ] && continue
  raea render compositions/rebuilt-v5-rooms.tsx --composition s5-gallery-$i -o out/work/r5gallery/g$i.png 2>&1 | grep -E "REFUSED|panic" | head -2
  [ -s out/work/r5gallery/g$i.png ] && echo "done g$i" || echo "FAILED g$i"
done
echo ALL
