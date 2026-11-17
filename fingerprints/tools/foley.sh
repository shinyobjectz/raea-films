#!/usr/bin/env bash
# The score's sound effects, made locally with Stable Audio Open Small (raea sao), three seeds each so repeats
# don't sound copied. Writes media/sfx/NAME-SEED.wav. A take is only a candidate: tools/foley-pick.sh measures them.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p media/sfx
make() { # name seconds prompt
  local name=$1 secs=$2 prompt=$3
  for seed in 1 2 3; do
    local out="media/sfx/$name-$seed.wav"
    [ -s "$out" ] && continue
    raea sao "$prompt" --seconds "$secs" --seed "$seed" -o "$out" >/dev/null
    echo "$out"
  done
}
make pencil-scratch 1 "a graphite pencil scribbling quickly on paper, close microphone, dry, no music"
make pencil-circle 1 "a pencil drawing one quick circle on paper, close microphone, dry, no music"
make paper-slap 1 "a sticky note slapped flat onto a wooden desk, one short paper slap, dry"
make paper-slide 1 "a single sheet of paper sliding quickly across a wooden desk, short, dry"
make snip 1 "sharp metal scissors snipping paper once, one crisp snip, close, dry"
make stamp 1 "a rubber stamp pressed hard onto paper on a wooden desk, one dull thud, dry"
make key 1 "one mechanical typewriter key strike, a single crisp clack, dry"
make ding 2 "a typewriter carriage return bell, one bright ding"
make shutter 1 "a vintage film camera shutter, one mechanical click, dry"
make tape-rip 1 "masking tape ripped quickly off a roll, short, close, dry"
make tape-pat 1 "a finger pressing a strip of tape down onto paper, soft pat, dry"
make crumple 2 "a sheet of paper crumpled in a hand, close, dry"
make knob 1 "a small plastic volume knob turned with ratchety clicks, close, dry"
make pin 1 "a push pin pressed into a cork board, one short tick, dry"
make riffle 1 "a stack of index cards riffled with a thumb, short, dry"
make lid 1 "a laptop lid closing softly onto its base, one soft click"
make lock 1 "a small brass padlock snapping shut, one click, dry"
make copier 3 "a photocopier scanning one page, a mechanical slide and hum, dry"
make projector 4 "an old 16mm film projector running, steady mechanical clatter, dry"
make string-pull 1 "a thin red string pulled taut between two pins, a short twang, dry"
