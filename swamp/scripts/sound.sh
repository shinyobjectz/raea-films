#!/bin/zsh
# Make the film's foley and beds on this computer (Stable Audio Open) and its chord notes (TokenSynth): assets/audio/.
# A sound already made is kept; delete its file to make it again.
export PATH=/opt/homebrew/bin:$PATH  # sao needs ffmpeg
cd "$(dirname "$0")/../assets/audio"
mk() { # name seconds seed prompt
  [ -s $1.wav ] && return
  raea sao "$4" --seconds $2 --seed $3 -o $1.wav 2>&1 | tail -1 | cut -c1-160
}
mk bed-dead 11.5 3 "desolate dead swamp ambience, faint cold wind over still water, very quiet, an occasional distant water drip, no birds, no insects, no music"
mk bed-alive 11.5 5 "lush swamp ambience at midday, frogs croaking, crickets, a few birds, gentle water lapping, natural field recording, no music"
mk bed-dusk 11.5 7 "swamp at dusk field recording, dense cricket chorus, tree frogs, soft wind through leaves, calm, no music"
mk birds 8 11 "dawn chorus of small birds in a forest waking up, clear and bright, natural field recording, no music"
mk chirp 1 13 "small friendly robot servo chirp, two rising notes, cute, short, dry, no reverb"
mk key 0.6 17 "single mechanical keyboard key press clack, muffled by moss, woody, short, dry, no reverb"
mk typing 5 19 "typing a sentence on an old mechanical keyboard, a steady run of muffled woody key clacks, dry, close, no reverb"
mk pebble 1 23 "small pebble rolling off plastic and ticking twice on stone, short, dry"
mk wake 3.5 29 "low electrical hum swelling up from silence as an old monitor powers on, warm, with a soft rising tone, no music"
mk tap 0.6 31 "soft glassy UI tap tick, clean, short, with a tiny water droplet, dry"
mk slam 1.4 37 "heavy keyboard key slammed hard with a small splash of water, punchy, tight, short tail"
mk drip 0.8 41 "single clear water drip plop into a still pool, tuned, resonant, short, clean"
mk glass 2.8 43 "long smooth rising tone of a bowed wine glass, pure, swelling, no percussion, no music"
mk drop 1.2 47 "one large clear water drop falling into a deep still pool, resonant plop with a short ring"
mk wash 2.6 53 "a wash of many small water plops and ripples spreading outward across a pond, gentle, natural"
mk creak 2.4 59 "old tree wood creaking and stretching slowly, rising in pitch, close, natural, no music"
mk leaves 3.2 61 "a sudden rush of thousands of leaves rustling in a gust of wind, swelling like a breath let out, natural"
mk scrub 2.2 67 "tape fast forward whir speeding up and rising in pitch then stopping abruptly, short, dry"
mk bells 6 71 "tiny delicate glass bells twinkling sparsely, high and soft, scattered, magical but natural, no melody"
mk frog 0.7 73 "single deep bullfrog croak, close, short, dry, natural"
mk cricket 0.5 79 "single short cricket chirp, crisp, dry, close"
mk thump 0.7 83 "single soft deep thump, like a hand on a hollow wet log, low and round, short, dry"
[ -d pad ] || raea tokensynth "warm soft string ensemble pad, slow attack, gentle" --notes C3,G3,E4,B4,D5 --seconds 4.8 -o pad 2>&1 | tail -1 | cut -c1-160
ls -1 . pad | tr '\n' ' '
# SAO writes its sounds peaking at full scale, some with flat tops: keep the originals in raw/ and repair the clips
mkdir -p raw; for f in *.wav; do [ -f raw/$f ] || cp $f raw/$f; ffmpeg -hide_banner -loglevel error -y -i raw/$f -af "volume=-3dB,adeclip" $f; done
