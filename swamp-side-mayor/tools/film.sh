#!/bin/bash
# tools/film.sh OUT.mp4 [COMPOSITION.tsx [ID [GAIN_DB]]]: the animatic as a film. It is rendered as stills, 150 frames a call, and
# joined with the track: a video render holds the camera's field of view at one value (an engine gap), stills don't.
# KEEP=1 keeps the stills in out/seq (or $SEQ) after (to render some again with RESUME=1 once their chunks' stills are gone).
cd "$(dirname "$0")/.." || exit 1
OUT=${1:?out.mp4}; COMP=${2:-compositions/film.tsx}; ID=${3:-}; GAIN=${4:-0}; N=$(bun -e 'import {FRAMES} from "./compositions/plan"; console.log(FRAMES)')
# a render call carries some of its look from frame to frame (an engine gap): the fog under the water stays on in every
# frame after it, and v5's trip held its tone mapping. So no call spans a change of look: plan.ts lookCuts() lists the
# frames where one starts (under the water and back up, the freeze card, the cutaway's tiles); each goes alone, then a
# call starts after it
CUTS=$(bun -e 'import { lookCuts } from "./compositions/plan"; console.log(lookCuts().join(" "))')
# SEQ: another folder for the stills, so a second shape keeps the first one's; RESUME=1 keeps the frames a stopped run made
D=${SEQ:-out/seq}; mkdir -p "$D"; [ -z "$RESUME" ] && find "${D:?}" -name '*.png' -delete
a=0; while [ $a -lt $N ]; do
  b=$((a+149)); [ $b -ge $N ] && b=$((N-1)); for k in $CUTS; do [ $k -gt $a ] && [ $k -le $b ] && b=$((k-1)); done; c="$D/c$(printf %05d $a)"; mkdir -p "$c"
  if [ -f "$D/f$(printf %05d $b).png" ]; then echo "frames to $b kept"; a=$((b+1)); continue; fi
  for try in 1 2 3 4; do   # a busy GPU can time a readback out part way: the chunk is rendered again, whole
    find "${c:?}" -name '*.png' -delete
    src="$COMP"; [ $try -gt 1 ] && { src="$(dirname "$COMP")/.retry-$try.tsx"; { cat "$COMP"; echo "// retry $try of frames $a-$b"; } > "$src"; }   # raea will not render a refused file again unchanged
    raea render "$src" ${ID:+--composition "$ID"} --at "$(seq $a $b | paste -sd, -)" -o "$c/" > "$D/render.log" 2>&1 < /dev/null
    [ "$(ls "$c" | grep -c '^frame-')" -eq $((b-a+1)) ] && break; echo "frames $a-$b: try $try fell short: $(grep -E 'REFUSED' "$D/render.log" | head -1 | cut -c1-120)"
  done
  i=0; for f in "$c"/frame-*.png; do mv "$f" "$D/f$(printf %05d $((a+i))).png"; i=$((i+1)); done
  [ $i -ne $((b-a+1)) ] && { echo "FAILED: frames $a-$b gave $i stills"; exit 1; }
  echo "frames to $b done"; a=$((b+1))
done
ffmpeg -loglevel error -y -framerate 30 -i "$D/f%05d.png" -i assets/music/swamp-side-mayor-90.wav -c:v libx264 -pix_fmt yuv420p -crf 19 -af "volume=${GAIN}dB" -c:a aac -b:a 256k -shortest "$OUT" && echo "wrote $OUT: $N frames"
[ -z "$KEEP" ] && find "${D:?}" -name '*.png' -delete; rm -f compositions/.retry-2.tsx compositions/.retry-3.tsx compositions/.retry-4.tsx
