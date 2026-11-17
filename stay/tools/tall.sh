#!/bin/bash
# The version for a phone held upright (1080x1920): runs a command with v3/size.json set to the tall frame and puts the
# 5:4 frame back when it ends, however it ends. Everything sized to the frame reads it (v3/plan.ts W, H, TALL), and the
# builds write the tall version beside the 5:4 one (out/v3t, media/portal-tall).
#   bash tools/tall.sh bash tools/v3.sh            the whole tall film  ->  out/v3t/film.mp4
#   bash tools/tall.sh bash tools/portals.sh ID    a doorway's pictures for the tall frame
set -uo pipefail
cd "$(dirname "$0")/.."
WIDE='{ "w": 1350, "h": 1080 }'
grep -q '"w": 1350' v3/size.json && ! grep -q letters v3/size.json || { echo "tall.sh: v3/size.json is not the 5:4 frame ($(cat v3/size.json)): another tall run?"; exit 1; }
trap 'printf "%s\n" "$WIDE" > v3/size.json' EXIT INT TERM
printf '{ "w": 1080, "h": 1920 }\n' > v3/size.json
"$@"
