#!/bin/bash
# v3, a shot a render, joined on the plan's cuts with the sound under it:
#   bash tools/v3.sh [--full] [SHOT_ID ...]   (no ids: every shot)  ->  out/v3/shots/ID.mp4, out/v3/film.mp4
#   --full: the 2700x2160 compositions (v3x-ID) into out/v3/full/
set -uo pipefail
cd "$(dirname "$0")/.."
# (the tall frame, under tools/tall.sh, builds into out/v3t beside the 5:4 film; its shots at a bit rate rather than
# master quality, so the tall build fits beside the 5:4 one on the disk)
base=out/v3; tq=""
if [[ $(bun -e 'import { TALL } from "./v3/plan"; console.log(TALL ? 1 : 0)') == 1 ]]; then base=out/v3t; tq="--kbps ${TALL_KBPS:-80000}"; fi
pre=v3; dir=$base/shots; outfile=$base/film.mp4
if [[ "${1:-}" == "--full" ]]; then pre=v3x; dir=$base/full; outfile=$base/stay.mp4; shift; fi
mkdir -p $dir
# (the intro first: before the song, v3/intro.tsx; tools/join.ts lays it ahead of the hallway)
ids=(intro); while IFS= read -r l; do ids+=("$l"); done < <(bun -e 'import { SHOTS } from "./v3/plan"; for (const s of SHOTS) console.log(s.id)')
want=("$@")
for id in "${ids[@]}"; do
  if [[ ${#want[@]} -gt 0 && ! " ${want[*]} " == *" $id "* ]]; then continue; fi
  q="--quality master"; [[ -n $tq ]] && q=$tq; [[ $pre == v3x ]] && q="--kbps ${KBPS:-120000}"   # (KBPS=260000 for the road: its dark drawing blotches at 120000)
  # (the sea is a Bevy plugin's FFT ocean: it renders with the plugin build of raea, tools/sea-plugin.sh)
  # (the faces are their own render and a DLSS pass, tools/faces.sh; film.tsx has no picture for them, and rendering them
  # from it on 11-11 put 37 black frames into assembly 22 where the faces had been)
  if [[ $id == faces ]]; then
    full=0; [[ $pre == v3x ]] && full=1
    FULL=$full SHOTS_DIR=$dir bash tools/faces.sh > $dir/$id.log 2>&1 && echo "APPLIED faces" >> $dir/$id.log
  elif [[ $id == sea || $id == hallway || $id == kitchen || $id == intro ]]; then RAEA_BUNDLE_LIB=~/raea/target/release/libraea_bundle.dylib vendor/bin/raea-sea motion render v3/film.tsx --composition $pre-$id $q -o $dir/$id.mp4 > $dir/$id.log 2>&1
  else raea render v3/film.tsx --composition $pre-$id $q -o $dir/$id.mp4 > $dir/$id.log 2>&1; fi
  # (the end card is photocopied after its render: tools/card-copy.sh, v3/card-copy.ts)
  if [[ $id == card ]] && grep -q "^APPLIED" $dir/$id.log; then bash tools/card-copy.sh $dir/card.mp4 >> $dir/$id.log 2>&1 || sed -i '' 's/^APPLIED/COPY FAILED, APPLIED/' $dir/$id.log; fi
  if grep -q "^APPLIED" $dir/$id.log; then echo "ok   $id"; else echo "FAIL $id"; fi
  grep -E "^REFUSED|^  error|^error|clips" $dir/$id.log | cut -c1-240 | sed 's/^/     /'
done
# JOIN=0: render the shots asked for and stop (a test of two shots shouldn't write the whole film's 5 GB again; that
# filled the disk on 11-11)
[[ "${JOIN:-1}" == 0 ]] && exit 0
for id in "${ids[@]}"; do [[ -f $dir/$id.mp4 ]] || { echo "missing $id"; exit 1; }; done
bun tools/join.ts $dir $dir/picture.mp4 ${CRF:-14} || exit 1
# the sound: the song and the foley (tools/sound.sh; HISS=dB, FOLEY=0 and CLOCK=1 are read there)
bash tools/sound.sh $dir/picture.mp4 $outfile || exit 1
rm -f $dir/picture.mp4                                                      # (the join without sound: 2.8 GB that the film beside it repeats)
