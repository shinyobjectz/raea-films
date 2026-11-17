#!/bin/bash
# The voice against the bed, measured (not heard): for each line, the raw mix's loudness over the line's window and
# the line's own, and from them the bed under it (power difference) and the voice's lead over the bed. Also the bed
# alone in the gaps. Run after: raea render mixcheck.tsx -o out/rawmix-v1.wav   Usage: tools/mixcheck.sh [WAV]
set -euo pipefail
cd "$(dirname "$0")/.."
MIX="${1:-out/rawmix-v1.wav}"
lufs() { ffmpeg -nostdin -hide_banner -ss "$2" -t "$3" -i "$1" -af ebur128=framelog=quiet -f null - 2>&1 | awk '/I:/{v=$2} END{print v}'; }
FPS=24
prev=0
printf "%-6s %8s %8s %8s %8s\n" line mix voice bed lead
while IFS=$'\t' read -r id at len; do
  s=$(echo "scale=3; $at/$FPS" | bc); d=$(echo "scale=3; $len" | bc)
  m=$(lufs "$MIX" "$s" "$d")
  # the line is mono: in the stereo mix it sits 3.01 dB above its own file's reading
  v=$(lufs "media/voice/$id.mix.wav" 0 "$d" | awk '{printf "%.1f", $1 + 3.01}')
  bed=$(echo "$m $v" | awk '{pm=10^($1/10); pv=10^($2/10); r=pm-pv; if (r<=pm*0.001) print "<" ($1-30); else printf "%.1f", 10*log(r)/log(10)}')
  lead=$(echo "$v $bed" | awk '{b=$2; sub("<","",b); printf "%.1f", $1-b}')
  printf "%-6s %8s %8s %8s %8s\n" "$id" "$m" "$v" "$bed" "$lead"
  gap=$(echo "scale=3; $s - $prev" | bc)
  if (( $(echo "$gap > 1.2" | bc) )); then printf "  gap %5.1f-%5.1f s: bed %s LUFS\n" "$prev" "$s" "$(lufs "$MIX" "$prev" "$gap")"; fi
  prev=$(echo "scale=3; $s + $d" | bc)
done < <(bun -e 'const l=require("./media/voice/lines.json"); const {LINE_AT}=require("./parts/timeline"); for (const x of l) console.log([x.id, LINE_AT[x.id], x.seconds].join("\t"))')
