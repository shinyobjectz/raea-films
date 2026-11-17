#!/bin/bash
# tools/tallsheet.sh DIR [FRAMES]: stills of the 9:16 (film.tsx#goose-9x16): every shot's middle frame, or the frames
# given (comma separated), each render call kept inside one look (plan.ts lookCuts: under the water and back, the
# freeze cards, the tiles), and a contact sheet of them, DIR/sheet.jpg
cd "$(dirname "$0")/.." || exit 1
D=${1:?dir}; mkdir -p "$D"; [ -z "$RESUME" ] && find "${D:?}" -name '*.png' -delete   # RESUME=1 keeps the stills a stopped run made
LIST=${2:-$(bun -e 'import { camera, FPS, FRAMES } from "./compositions/plan"; const m = []; let cur = -1, a = 0; for (let f = 0; f <= FRAMES; f++) { const i = f < FRAMES ? camera(f / FPS).i : -2; if (i !== cur) { if (cur >= 0) m.push(Math.floor((a + f - 1) / 2)); cur = i; a = f; } } console.log(m.join(","))')}
SETS=$(bun -e "import { lookCuts } from './compositions/plan'; const cuts = lookCuts(), fs = '$LIST'.split(',').map(Number).sort((a, b) => a - b), seg = (f) => cuts.filter((c) => c <= f).length; const g = new Map(); for (const f of fs) { const k = seg(f); g.set(k, [...(g.get(k) ?? []), f]); } console.log([...g.values()].map((v) => v.join(',')).join(' '))")
tools/tallat.sh "$D" $SETS || exit 1
/opt/homebrew/bin/ffmpeg -v error -y -pattern_type glob -i "$D/f*.png" -vf "scale=216:384,tile=10x6" -frames:v 1 "$D/sheet.jpg" && echo "wrote $D/sheet.jpg"
