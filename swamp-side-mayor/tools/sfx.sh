#!/bin/bash
# tools/sfx.sh: the music video's foley, made locally with Stable Audio Open Small (raea sao), two takes of each (seeds
# 1 and 2) into assets/sfx/NAME-SEED.wav; tools/foley.ts places them on the plan's own events, tools/mix.sh mixes.
# The tutorial's takes already in assets (key stomps, splash, wings, frog, heron, mud on glass) are reused as they are.
# SAO's licence is Stability AI's Community License (free under USD 1M revenue): say so before a commercial use.
cd "$(dirname "$0")/.." || exit 1
while IFS='|' read -r name secs prompt; do
  [ -z "$name" ] && continue
  for seed in 1 2; do
    out="assets/sfx/$name-$seed.wav"; [ -f "$out" ] && continue
    raea sao "$prompt" --seconds "$secs" --seed "$seed" -o "$out" > /dev/null 2>&1 < /dev/null || echo "FAILED: $name seed $seed"
    [ -f "$out" ] && echo "made $out"
  done
done <<'LIST'
step|0.5|a webbed bird foot stepping into soft wet mud, one small squelch, close, dry, no reverb
shake|1.5|a big bird shaking water off its feathers, fast feather rustle and a spray of water droplets, close, dry
shimmer|2.5|magical sparkling shimmer rising, glittering bell chimes swelling up, bright and airy, no music, no melody
rise|8|a huge heavy machine rising slowly out of a muddy pond, deep rumble, water gushing and pouring off its sides, mud bubbling, no music
crt|1.5|an old CRT computer monitor switching on, a heavy thunk then a rising high-pitched whine and soft static crackle
click|0.3|a single computer mouse click, crisp and short, dry, no reverb
whoosh|0.8|a fast whoosh rushing in toward the listener, sharp swish, dry, no reverb
scratch|0.8|a single short vinyl record scratch, comedic stop, dry
ting|1.2|a single bright magical sparkle chime, one ting with a glittering tail, no melody
keysup|2.5|a big pile of plastic keyboard keys rattling and clattering as they rise up out of wet mud, dry, no music
plunge|2|a big splash into water heard from underneath the surface, muffled plunge then a rush of bubbles, underwater
bubbles|6|underwater ambience, muffled and close, small bubbles rising, slow paddling under water, no music
paddle|6|a duck paddling on a calm pond surface, gentle water swishes and small ripples, close, steady, no music
climb|1.5|a bird climbing out of a pond onto a muddy bank, water streaming and dripping off it, a couple of small splashes
snort|1|a startled deer, one sharp snort and hooves skittering on soft grass, close, dry
sinister|3|a dark ominous low whoosh circling slowly around the listener, deep breathy wind and a sub rumble, eerie and occult, no music, no melody, no voice
risebig|7|a giant heavy stone machine rising up out of a lake, deep grinding rumble building, sheets of water pouring and gushing off it, mud sucking, getting louder, no music
keysrise|3|a heavy plastic keyboard dragged up out of thick wet mud, loud mud suction and squelch, water and mud pouring off, plastic creaking and keys rattling, no music
keyhit|0.5|a single big chunky mechanical keyboard key pressed hard, loud plastic clack with a spring ping, close, dry, no reverb
spring|1|a big heavy steel spring compressed and released, a deep trampoline boing bounce, short, dry, no music
LIST
