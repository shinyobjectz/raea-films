#!/bin/bash
# tools/honks9.sh: v9's goose honks (the director on v8, a note: "a honk that sounds like a goose"), made locally with
# Stable Audio Open Small (raea sao), four takes each into assets/sfx/NAME-SEED.wav; tools/honkpick.py picks the most
# tonal take of each into assets/tut-sound/. SAO's licence is Stability AI's Community License (free under USD 1M revenue).
cd "$(dirname "$0")/.." || exit 1
export PATH="/opt/homebrew/bin:$PATH"   # raea sao reads its output through ffmpeg
while IFS='|' read -r name secs prompt; do
  [ -z "$name" ] && continue
  for seed in 1 2 3 4; do
    out="assets/sfx/$name-$seed.wav"; [ -f "$out" ] && continue
    raea sao "$prompt" --seconds "$secs" --seed "$seed" -o "$out" > /dev/null 2>&1 < /dev/null || { echo "FAILED: $name seed $seed"; exit 1; }
    [ -f "$out" ] && echo "made $out"
  done
done <<'LIST'
goosehonk|1.2|a single loud domestic goose honk, one nasal honk call, close microphone, outdoors, dry, no other sounds
gooseyes|1.2|a domestic goose answering with one short bright honk, close microphone, dry, no other sounds
gooseoffended|1.5|an annoyed domestic goose giving one long indignant honk, close microphone, dry, no other sounds
LIST
echo "honks done"
