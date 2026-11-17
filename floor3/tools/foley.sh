#!/usr/bin/env bash
# FLOOR3's foley, made locally with SAO (Stable Audio Open Small): each line is NAME|SECONDS|SEEDS|PROMPT, written to
# assets/sfx/NAME-SEED.wav. A sound already made is kept, so a rerun makes only what's missing. The electronic sounds
# (the phone's trill, the reader's beeps, the ballast hum) are synthesized by tools/mix.ts instead.
#   bash tools/foley.sh
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets/sfx
while IFS='|' read -r name secs seeds prompt; do
  [ -z "$name" ] && continue
  for seed in $seeds; do
    out="assets/sfx/$name-$seed.wav"
    [ -f "$out" ] && continue
    raea sao "$prompt" --seconds "$secs" --seed "$seed" -o "$out" >/dev/null 2>&1 && echo "made $out" || echo "FAILED $out"
  done
done <<'EOF'
steps-carpet-walk|6|1 2|footsteps walking slowly on office carpet, leather shoes, close microphone, dry indoor recording
steps-carpet-run|5|1|running footsteps on office carpet, leather shoes, close microphone, dry
steps-lino-walk|6|1 2|footsteps walking on linoleum floor, leather shoes, indoor, close microphone
steps-concrete-walk|6|1 2|footsteps walking on bare concrete floor, leather shoes, empty room, close microphone
steps-concrete-run|5|1|running footsteps on bare concrete floor, leather shoes, close microphone
tube-strike|2|1 2 3|fluorescent tube light flickering on, starter clicks, electric buzz and ping
tube-off|1|1 2 3|heavy electrical relay clunk, ceiling light switching off
phone-button|1|1 2|desk telephone button press, hard plastic click, close
cassette-play|1|1 2|cassette tape recorder play button pressed down, mechanical clunk, close
cassette-stop|1|1|cassette recorder stop button popping up, mechanical click
copier|6|1 2|office photocopier running, scanning lamp moving, paper feeding, mechanical whirring
paper-take|1|1 2|picking up a single sheet of paper, paper rustle, close
paper-down|1|1|lowering a sheet of paper, soft paper rustle
badge|1|1 2|picking up a plastic ID card on a lanyard, plastic clatter, close
knock|2|1 2|three slow knocks on a wooden door, heard from the hallway
knock-hard|2|1|two heavy hard knocks on a wooden door
handle-rattle|2|1 2|door handle rattling hard, someone trying a locked door from the other side, metal latch
handle-try|2|1 2|pushing down a metal door handle on a locked door, latch clicks
breath|5|1 2|slow heavy breathing, close, wet and unsettling, creature
creature-steps|5|1|slow heavy barefoot footsteps on carpet, uneven, dragging
drywall-strain|3|1 2|drywall and plaster cracking and creaking under strain, slow groan
building-creak|4|1 2 3|distant building creak, metal ductwork ticking, empty office at night
clothing|2|1|clothing fabric rustle, jacket movement, close
card-swipe|1|1|plastic card swiped through a card reader slot
machine-click|1|1|answering machine tape mechanism clicking on, small motor
lock-clunk|1|1|electronic door lock clunk, heavy magnetic lock engaging
breath-human|5|1 2|nervous shaky human breathing, man, close microphone, dry, frightened, quiet room
breath-run|5|1|man out of breath panting after running, close microphone, dry
EOF
echo "foley done"
