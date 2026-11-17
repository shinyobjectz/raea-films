#!/bin/bash
# The foley (media/foley/lock/ID.wav, tools/foley-make.sh: each clip's kept seconds, its lead, its own seconds and its
# tail) laid where v3/foley-cuts.ts puts it, as one stem in the song's time: out/v3/stems/foley.wav.
# Every clip is set to the same quiet level, UNDER LUFS under the song's -14 (24 by default: the director, 11-11, "the soudn
# effects are WAY too loud and abrasive" about effects that sat 20 under), moved by its own `level`, and never boosted by
# more than 6 dB. What is heard outside a place's own seconds (its lead, heard through the door before it is crossed,
# and its tail, after it) is muffled, as through a doorway, and opens up over a tenth of a second at the crossing. The
# lead fades in over its length, the tail out over its; softened above 7 kHz.
#   bash tools/foley-mix.sh [UNDER]
set -euo pipefail
cd "$(dirname "$0")/.."
under=${1:-24}; target=$(( -14 - under )); stem=${OUT:-out/v3/stems/foley.wav}
mkdir -p out/v3/stems
ins=(); filt=""; n=0
while read -r id at lead secs tail level; do
  f=media/foley/lock/$id.wav; [[ -f $f ]] || { echo "no sound for $id yet (bash tools/foley-make.sh run $id)"; continue; }
  len=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" < /dev/null)
  bun -e "if (Math.abs($len - ($lead + $secs + $tail)) > 0.05) { console.error('$id: $len s of sound for ' + ($lead + $secs + $tail).toFixed(3) + ' s of place'); process.exit(1) }" < /dev/null
  lufs=$(ffmpeg -nostdin -hide_banner -i "$f" -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}')
  gain=$(bun -e "console.log(Math.min(6, $target - ($lufs) + $level).toFixed(1))" < /dev/null)
  ms=$(bun -e "console.log(Math.round($at * 1000))" < /dev/null)
  fi_=$(bun -e "console.log(Math.max(0.03, $lead).toFixed(3))" < /dev/null); fo=$(bun -e "console.log(Math.max(0.03, $tail).toFixed(3))" < /dev/null)
  st=$(bun -e "console.log(Math.max(0, $len - $fo).toFixed(3))" < /dev/null)
  ins+=(-i "$f")
  head="[$n:a]aformat=sample_rates=48000:channel_layouts=stereo,asetnsamples=n=240,volume=${gain}dB,highshelf=f=7000:g=-5"
  if bun -e "process.exit($lead >= 0.2 || $tail >= 0.2 ? 0 : 1)" < /dev/null; then
    # (W: 1 inside the place's own seconds, 0 outside, a tenth of a second between)
    w="clip((t-$lead+0.05)/0.1,0,1)*clip(($lead+$secs+0.05-t)/0.1,0,1)"
    filt+="$head,asplit=2[i$n][o$n];[o$n]lowpass=f=1400,lowpass=f=1400,volume='1-$w':eval=frame[oo$n];[i$n]volume='$w':eval=frame[ii$n];[ii$n][oo$n]amix=inputs=2:normalize=0,"
  else
    filt+="$head,"
  fi
  filt+="afade=t=in:d=$fi_,afade=t=out:st=$st:d=$fo,adelay=${ms}|${ms}[a$n];"
  printf '  %-11s at %7.3f s  %+6.1f dB (from %s LUFS)\n' "$id" "$at" "$gain" "$lufs"
  n=$((n + 1))
done < <(bun -e 'import { resolved } from "./v3/foley-cuts"; for (const c of resolved()) console.log(c.id, (c.f0 / 30 - c.lead).toFixed(4), c.lead, ((c.f1 - c.f0) / 30).toFixed(4), c.tail, c.level ?? 0)')
(( n > 0 )) || { echo "no foley yet" >&2; exit 1; }
song=$(bun -e 'import { LENGTH } from "./v3/plan"; console.log(LENGTH)')
mixin=""; for ((i = 0; i < n; i++)); do mixin+="[a$i]"; done
ffmpeg -nostdin -y -loglevel error "${ins[@]}" -filter_complex "${filt}${mixin}amix=inputs=$n:normalize=0:duration=longest,apad=whole_dur=$song[m]" -map "[m]" -t $song -c:a pcm_s24le $stem
echo "$stem: $n places at $target LUFS each ($under under the song), moved by their levels"
