#!/bin/sh
# Rebake the city and its windows in the order they depend on each other:
#   1. tools/world/bake.ts writes the tiles and every pane's record (assets/world/<slice>/<tile>/windows.json, ids from
#      the map's stable building keys)
#   2. raea-fb's tools/interiors/windows.ts gives each pane a room or a trade and its lit hours
#      (assets/interiors/windows/<tile>.json, by pane id)
#   3. the bake again, which writes those assignments into the panes' vertex colours (facade.ts ASSIGN)
# Step 3 changes no geometry, so its pane records match step 2's. Run it after any map change (buildings, open
# spaces, streets) or atlas change; a bake alone leaves the tiles' rooms and trades one map behind.
#   sh tools/world/rebake.sh            (from this folder)
set -e
cd "$(dirname "$0")/../.."
(cd tools/world && bun bake.ts) | grep -E "^inputs:|^baked|^view|^bridge decks|^landmarks|^stadtbahn|^the Spree|^courts|^dressing|^trees|^water|^arch bridges"
# FORCE_ROWS: windows.ts waits out a bake on the board, and this script's own job (antsy run ... rebake.sh) is one;
# step 1 has finished by here
FORCE_ROWS=1 bun tools/interiors/windows.ts | tail -3
(cd tools/world && bun bake.ts) | grep -E "^baked"
