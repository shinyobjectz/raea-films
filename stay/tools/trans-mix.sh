#!/bin/bash
# The transitions (v3/transitions.ts) laid as one stem in the song's time, out/v3/stems/trans.wav: each take set to the
# foley's level (UNDER LUFS under the song's -14, 24 by default) by a measured gain, moved by its own `level`, faded in
# and out over 30 ms, its `hit` on its `at`. tools/sound.sh lays it with the foley (TRANS=0 leaves it out).
#   bash tools/trans-mix.sh [UNDER]
set -euo pipefail
cd "$(dirname "$0")/.."
under=${1:-24}; target=$(( -14 - under )); stem=out/v3/stems/trans.wav
mkdir -p out/v3/stems
ins=(); filt=""; mix=""; n=0
while read -r name take hit at level; do
  f=media/gen/trans/$take/out.mp3; [[ -f $f ]] || { echo "no $f" >&2; exit 1; }
  lufs=$(ffmpeg -nostdin -nostats -i "$f" -af ebur128 -f null - 2>&1 | awk '/Integrated loudness:/{f=1} f&&/I:/{print $2; exit}')
  gain=$(bun -e "console.log(Math.min(12, $target - ($lufs) + $level).toFixed(1))" < /dev/null)
  ms=$(bun -e "console.log(Math.max(0, Math.round(($at - $hit) * 1000)))" < /dev/null)
  len=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" < /dev/null)
  ins+=(-i "$f")
  filt+="[$n:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${gain}dB,afade=t=in:d=0.03,afade=t=out:st=$(bun -e "console.log(($len - 0.03).toFixed(3))" < /dev/null):d=0.03,adelay=${ms}|${ms}[t$n];"
  mix+="[t$n]"; n=$((n + 1))
  echo "$name ($take): its ${hit} s on ${at} s, ${gain} dB (from ${lufs} LUFS)"
done < <(bun -e 'import { TRANSITIONS } from "./v3/transitions"; for (const t of TRANSITIONS) console.log(t.name, t.take, t.hit, t.at.toFixed(3), t.level ?? 0)')
ffmpeg -nostdin -y -loglevel error "${ins[@]}" -filter_complex "${filt}${mix}amix=inputs=$n:normalize=0:duration=longest" -c:a pcm_s24le $stem
echo "$stem: $n transitions"
