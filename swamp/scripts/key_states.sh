#!/bin/zsh
# Key the flat magenta media out of each captured app state (so the film's own picture shows through), and list where
# each state's magenta areas are: assets/app-take/keyed/NAME.png and assets/app-take/media.json.
set -e
cd "$(dirname "$0")/../assets/app-take"
M=/opt/homebrew/bin/magick
echo "{" > media.json
first=1
for f in states/*.png; do
  n=$(basename $f .png)
  $M $f -fuzz 22% -transparent "#ff00ff" keyed/$n.png
  boxes=$($M $f -fuzz 22% -fill white -opaque "#ff00ff" -fill black +opaque white -threshold 50% -morphology Close Square:3 -define connected-components:verbose=true -define connected-components:area-threshold=600 -connected-components 8 null: 2>/dev/null | awk '/srgba\(255,255,255/ {split($2,a,"[x+]"); printf "%s[%d,%d,%d,%d]", sep, a[3], a[4], a[1], a[2]; sep=","}')
  [ $first = 1 ] || echo "," >> media.json
  first=0
  printf '  "%s": [%s]' "$n" "$boxes" >> media.json
  echo "$n" >&2
done
echo "\n}" >> media.json
# then the soft key over the hard one (translucent surfaces over magenta keep their opacity), and the film's state table
cd ../..
/tmp/ivyenv/bin/python -I scripts/key_states.py >/dev/null
/tmp/ivyenv/bin/python -I scripts/app_states.py
