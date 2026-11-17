#!/bin/zsh
# The look check: the plates the app's item shows (re-shot from the set as it now stands), then the review stills.
cd "$(dirname "$0")/.."
mkdir -p out/look-v2
r() { raea render compositions/review-v2.tsx --composition $1 --frame 0 -o $2 2>&1 | grep -i "REFUSED\|panic\|error:" | cut -c1-300; echo "$1"; }
for s in dead sun water alive mist dusk; do r plate-$s assets/plates/$s.png; done
for v in hero-dead hero-sun hero-alive hero-dusk keyboard-alive keyboard ivy-alive ivy-dead; do r $v out/look-v2/$v.png; done
