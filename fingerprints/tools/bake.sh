#!/bin/bash
# Bakes each card's colour into its paper texture (colour x ((1 - o) + o x texture), what a multiply at opacity o
# gives), so the cards draw a plain image: raea's renderer applies mix-blend-mode on a child in misaligned rectangles
# (the blocks the director saw in the tags and the sticky note). Writes media/textures/baked/NAME.jpg at 1024 px.
# Usage: tools/bake.sh
set -euo pipefail
cd "$(dirname "$0")/../media/textures"
mkdir -p baked
bake() { # name source hex opacity
  local r=$((16#${3:1:2})) g=$((16#${3:3:2})) b=$((16#${3:5:2})) o="$4"
  ffmpeg -nostdin -v error -y -i "$2" -vf "scale=1024:1024,format=rgb24,lutrgb=r='$r*((1-$o)+$o*val/255)':g='$g*((1-$o)+$o*val/255)':b='$b*((1-$o)+$o*val/255)'" -q:v 2 "baked/$1.jpg"
  printf "%-9s %s x %.2f  " "$1" "$3" "$o"
  ffmpeg -nostdin -hide_banner -i "baked/$1.jpg" -vf "scale=1:1,format=rgb24" -f rawvideo - 2>/dev/null | od -An -tu1 | awk 'NF>=3{printf "mean rgb %s %s %s\n", $1, $2, $3}'
}
bake tag Paper005/Paper005_2K-JPG_Color.jpg "#d9b77e" 0.55
bake sticky Paper001/Paper001_2K-JPG_Color.jpg "#f2e49a" 0.9
bake polaroid Paper001/Paper001_2K-JPG_Color.jpg "#f7f3ea" 0.7
bake tape Paper004/Paper004_2K-JPG_Color.jpg "#e9d9a6" 0.35
bake card Paper001/Paper001_2K-JPG_Color.jpg "#f8f3e8" 0.5
