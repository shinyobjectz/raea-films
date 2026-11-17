#!/bin/bash
# The film's sound under a picture: the song, laid PAD seconds in (v3/plan.ts: the intro is before it), with the foley
# stem (out/v3/stems/foley.wav, tools/foley-make.sh and tools/foley-mix.sh) laid in too once it is made. The picture's
# video is copied, its own sound (if any) left out, so this re-lays the sound under a film without rendering it again.
#   bash tools/sound.sh PICTURE.mp4 OUT.mp4
# The intro is silent: its hiss is out (the director, 11-11, on assembly 23: "remove white noise"). HISS=17 lays it back in,
# that many dB down (about -40 LUFS), up to the cut on the song's first sound. FOLEY=0 leaves the foley out; the transitions (out/v3/stems/trans.wav, tools/trans-mix.sh) go in with it, TRANS=0 leaves
# them out. CLOCK=1
# lays in the cursor's clock (tools/ticks.ts: a tick and a tock on the picture's clicks) CLOCK_DB down (12): off since
# the director, 11-11, "the clicking noise is really off beat" and "for foley dont add any sound effects for now mute them and
# focus on gettign picture lock".
# The intro's photocopier (media/foley/lock/intro.wav, tools/intro-sound.sh: the director, 11-12, "with some sound to thit")
# is laid at the film's second 0, set to INTRO_LUFS (-24, ten under the song) by a measured gain, with a 0.1 s fade at
# its end. INTRO=0 leaves it out. The same take closes the film, from its relay on, under the end card's photocopy
# (v3/card-copy.ts, tools/card-copy.sh).
set -euo pipefail
cd "$(dirname "$0")/.."
pic=$1; outfile=$2
read -r pad cut < <(bun -e 'import { FPS, INTRO_OVER, PAD } from "./v3/plan"; console.log(PAD, (PAD + INTRO_OVER / FPS).toFixed(3))')
padms=$(bun -e "console.log(Math.round($pad * 1000))")
mkdir -p out/v3/stems
ins=(-i "$pic" -i media/music/stay.wav); filt="[1:a]volume=1.4dB,adelay=${padms}|${padms}[s];"; mix="[s]"; n=1; said="the song"
if [[ -n "${HISS:-}" ]]; then
  hiss=out/v3/stems/hiss.wav
  ffmpeg -nostdin -y -loglevel error -f lavfi -i "anoisesrc=color=pink:amplitude=0.5:sample_rate=48000:duration=$cut:seed=11" -af "highpass=f=220,lowpass=f=6500,volume=-${HISS}dB,afade=t=in:d=0.5,afade=t=out:st=$(bun -e "console.log(($cut - 0.025).toFixed(3))"):d=0.025" -ac 2 -c:a pcm_s24le $hiss
  ins+=(-i $hiss); mix+="[$((n + 1)):a]"; n=$((n + 1)); said+=", the intro's hiss"
fi
if [[ "${INTRO:-1}" != 0 && -f media/foley/lock/intro.wav ]]; then
  # (a 2 s take is too short for loudnorm's integrated mode: measure it and set a fixed gain)
  il=$(ffmpeg -nostdin -nostats -i media/foley/lock/intro.wav -af ebur128 -f null - 2>&1 | awk '/Integrated loudness:/{f=1} f&&/I:/{print $2; exit}')
  ig=$(bun -e "console.log((${INTRO_LUFS:--24} - ($il)).toFixed(2))")
  idur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 media/foley/lock/intro.wav)
  ins+=(-i media/foley/lock/intro.wav); filt+="[$((n + 1)):a]volume=${ig}dB,afade=t=out:st=$(bun -e "console.log(($idur - 0.1).toFixed(3))"):d=0.1[i];"; mix+="[i]"; n=$((n + 1)); said+=", the intro's copier"
fi
if [[ "${INTRO:-1}" != 0 && -f media/foley/lock/intro.wav ]]; then
  # the same copier closing the film: its take from the relay on, laid so its whir is under the end card's lamp and its
  # clunk on the flash (v3/card-copy.ts), at the intro's gain
  read -r cat cfrom < <(bun -e 'import { COPY, COPY_SOUND_FROM } from "./v3/card-copy"; import { PAD, shot } from "./v3/plan"; console.log(Math.round((PAD + shot("card").f0 / 30 + COPY.at - 0.05) * 1000), COPY_SOUND_FROM)')
  ins+=(-i media/foley/lock/intro.wav); filt+="[$((n + 1)):a]atrim=start=${cfrom},asetpts=PTS-STARTPTS,volume=${ig}dB,afade=t=in:d=0.02,adelay=${cat}|${cat}[o];"; mix+="[o]"; n=$((n + 1)); said+=", the end card's copier"
fi
if [[ "${FOLEY:-1}" != 0 && -f out/v3/stems/foley.wav ]]; then
  ins+=(-i out/v3/stems/foley.wav); filt+="[$((n + 1)):a]adelay=${padms}|${padms}[f];"; mix+="[f]"; n=$((n + 1)); said+=", the foley"
fi
if [[ "${TRANS:-1}" != 0 && -f out/v3/stems/trans.wav ]]; then
  ins+=(-i out/v3/stems/trans.wav); filt+="[$((n + 1)):a]adelay=${padms}|${padms}[t];"; mix+="[t]"; n=$((n + 1)); said+=", the transitions"
fi
if [[ "${CLOCK:-0}" == 1 ]]; then
  bun tools/ticks.ts > /dev/null
  ins+=(-i out/v3/stems/ticks.wav); filt+="[$((n + 1)):a]volume=-${CLOCK_DB:-12}dB,adelay=${padms}|${padms}[k];"; mix+="[k]"; n=$((n + 1)); said+=", the cursor's clock"
fi
ffmpeg -nostdin -y -loglevel error "${ins[@]}" -filter_complex "${filt}${mix}amix=inputs=$n:normalize=0:duration=longest,alimiter=limit=0.79:attack=3:release=60:level=disabled,apad[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -shortest $outfile
echo "$outfile: $(ffprobe -v error -show_entries format=duration -of csv=p=0 $outfile) s ($said)"
