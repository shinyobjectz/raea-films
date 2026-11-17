#!/usr/bin/env bash
# The garden's painting (v3/painting.tsx): the garden as the painting shot begins, seen 3% wider (places.tsx gardenStill), at full size, without grain or vignette, as the
# picture on the canvas in the bedroom. Run it after any change to the garden's first half (its lens, light, oil or
# letters), before rendering the painting or the bedroom.   bash tools/painting.sh  ->  media/painting/garden.png
# For the tall version: bash tools/painting.sh tall  ->  media/painting/garden-tall.png. The canvas is 5:4 either way; the
# tall frame sees its middle, so this still is the 5:4 one with STAY drawn to fit that middle, as the tall garden draws it
# (v3/size.json's "letters": the tall frame's width, while it runs; put back after).
set -euo pipefail
cd "$(dirname "$0")/.."
name=garden
if [[ "${1:-}" == tall ]]; then
  name=garden-tall
  grep -q '"w": 1350' v3/size.json && ! grep -q letters v3/size.json || { echo "painting.sh: v3/size.json is not the plain 5:4 frame ($(cat v3/size.json))" >&2; exit 1; }
  trap 'printf "%s\n" "{ \"w\": 1350, \"h\": 1080 }" > v3/size.json' EXIT INT TERM
  printf '{ "w": 1350, "h": 1080, "letters": 0.5625 }\n' > v3/size.json
fi
d=out/v3/painting; mkdir -p $d media/painting
raea render v3/film.tsx --composition v3s-garden --frame 0 -o $d/ > $d/still.log 2>&1 || { grep -E "REFUSED|rror" $d/still.log | head -5; exit 1; }
cp $d/frame-00000.png media/painting/$name.png
echo "media/painting/$name.png: $(magick identify -format '%wx%h' media/painting/$name.png)"
