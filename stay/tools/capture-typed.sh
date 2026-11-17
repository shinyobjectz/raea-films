#!/bin/bash
# The comment cards a state at a time (tools/capture/typed.mjs), from the capture clone tools/capture-app.sh made:
#   bash tools/capture-typed.sh SCRATCH_DIR "text 1" "text 2" ...   ->  media/app/cards/
set -euo pipefail
cd "$(dirname "$0")/.."
work=$1; shift
app=$work/repo/apps/app demo=$work/stay-demo out=$work/typed
[[ -d $app && -d $demo ]] || { echo "run tools/capture-app.sh $work FILM.mp4 first"; exit 1; }
cp tools/capture/typed.mjs "$app/capture-stay-typed.mjs"; rm -rf "$out"; mkdir -p "$out"
port=5188
(cd "$app" && RAEA_DEMO=$demo npx vite --port $port --strictPort --host 127.0.0.1 > "$work/vite.log" 2>&1) & vite=$!
trap 'kill $vite 2>/dev/null || true' EXIT
for _ in $(seq 1 120); do curl -sf -o /dev/null "http://127.0.0.1:$port/" && break; kill -0 $vite 2>/dev/null || { tail -5 "$work/vite.log"; exit 1; }; sleep 0.5; done
(cd "$app" && node capture-stay-typed.mjs "http://127.0.0.1:$port/#/feed/f-stay-all/i-stay-v2" "$out" "$@")
rev=$(git -C ~/raea rev-parse --short HEAD)
rm -rf media/app/cards; mkdir -p media/app/cards; cp "$out"/*.png "$out/cards.json" media/app/cards/
printf '{"made":"captured from the raea app (apps/app, clone made at an earlier commit; repo now %s) in Chrome by tools/capture-typed.sh: the Stay item in Watch, a pin dropped, each comment typed a letter at a time into its composer card, then posted (the pin thread); each alone on a clear background, 4x","source":"raea","license":"raea'"'"'s own"}\n' "$rev" > media/app/cards/cards.json.source.json
echo "media/app/cards: $(ls media/app/cards/*.png | wc -l | tr -d ' ') states"
