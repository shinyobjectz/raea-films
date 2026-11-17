#!/bin/bash
# The film's pictures of the raea app, captured from the real app (never drawn): an APFS clone of ~/raea/apps/app (at
# the repo's depth, its sibling folders linked read-only), served by vite on a demo world made from the film's plan
# (tools/demo-world.ts: the Stay project, the film in Watch, its six comments), driven in Chrome by Playwright:
#   the six comment cards (tools/capture/cards.mjs): a pin dropped, each comment typed into its composer card, the card
#     alone on a clear background, 3x;
#   the Watch screens (tools/capture/screens.mjs): watch-sea, watch-canyon, timeline, the whole window, 2x.
# Each lands in media/app with a sidecar naming the app's commit. tools/captures.sh then lists them for the film.
#   bash tools/capture-app.sh SCRATCH_DIR FILM.mp4      (FILM: the film the app's viewer shows, e.g. the graybox)
set -euo pipefail
cd "$(dirname "$0")/.."
work=$1 film=$2
repo=$work/repo app=$work/repo/apps/app demo=$work/stay-demo out=$work/out
if [[ ! -d $app ]]; then
  mkdir -p "$repo/apps"
  cp -c -R ~/raea/apps/app "$app"
  for d in engine examples sdk target tools; do ln -sfn ~/raea/$d "$repo/$d"; done
  for d in ~/raea/apps/*; do n=$(basename "$d"); [[ $n == app ]] || ln -sfn "$d" "$repo/apps/$n"; done
fi
cp tools/capture/cards.mjs "$app/capture-stay-cards.mjs"; cp tools/capture/screens.mjs "$app/capture-stay-screens.mjs"
mkdir -p "$demo/media" "$out"
cp -c "$film" "$demo/media/$(basename "$film")"
bun tools/demo-world.ts "$demo" "$demo/media/$(basename "$film")"
port=5188
(cd "$app" && RAEA_DEMO=$demo npx vite --port $port --strictPort --host 127.0.0.1 > "$work/vite.log" 2>&1) & vite=$!
trap 'kill $vite 2>/dev/null || true' EXIT
for _ in $(seq 1 120); do curl -sf -o /dev/null "http://127.0.0.1:$port/" && break; sleep 0.5; done
texts=(); while IFS= read -r l; do texts+=("$l"); done < <(bun -e 'import { COMMENTS } from "./parts/plan"; for (const c of COMMENTS) console.log(c.text)')
(cd "$app" && node capture-stay-cards.mjs "http://127.0.0.1:$port/#/feed/f-stay-all/i-stay-v2" "$out" "${texts[@]}")
(cd "$app" && node capture-stay-screens.mjs "http://127.0.0.1:$port" "$out")
rev=$(git -C ~/raea rev-parse --short HEAD)
side() { printf '{"made":"captured from the raea app (apps/app at %s) in Chrome by tools/capture-app.sh: %s","source":"raea","license":"raea'"'"'s own"}\n' "$rev" "$2" > "media/app/$1.png.json"; }
for f in "$out"/comment-*.png; do n=$(basename "$f" .png); cp "$f" media/app/; side "$n" "the Stay item open in Watch, the comment tool, a pin dropped, this comment typed into its composer card; the card alone on a clear background, 3x"; done
for n in watch-sea watch-canyon timeline; do cp "$out/$n.png" media/app/; side "$n" "the Stay item in Watch on the demo world (tools/demo-world.ts), the whole window, 2x"; done
bash tools/captures.sh > /dev/null
echo "media/app: $(ls media/app/*.png | wc -l | tr -d ' ') captures"
