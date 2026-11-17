#!/bin/bash
# tools/flashscan.sh VIDEO.mp4 [SHAPE]: every second raea check's flash screen fails, not just the worst one (it names
# only the worst second in a file, plan.org t-dylfin26). The film is cut into 3 s pieces every 1.5 s, each checked on
# its own; a failing piece prints its worst second as a film frame. Overlapping pieces can name the same window twice.
cd "$(dirname "$0")/.." || exit 1
export PATH=/opt/homebrew/bin:$PATH   # (raea check calls ffprobe from PATH)
V=${1:?video.mp4}; SHAPE=${2:-9:16}; T=$(mktemp -d /tmp/flashscan.XXXXXX)
DUR=$(/opt/homebrew/bin/ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
s=0; while awk -v s="$s" -v d="$DUR" 'BEGIN{exit !(s < d - 0.5)}'; do
  /opt/homebrew/bin/ffmpeg -v error -y -ss "$s" -t 3 -i "$V" -an -c:v libx264 -crf 12 -pix_fmt yuv420p "$T/p.mp4" < /dev/null
  line=$(raea check "$T/p.mp4" --shape "$SHAPE" -o "$T/c.json" 2>&1 < /dev/null | grep -E '^error flash|^warn flash')
  if [ -n "$line" ]; then f=$(echo "$line" | sed -nE 's/.*frame ([0-9]+).*/\1/p'); echo "piece at ${s}s: film frame $(awk -v s="$s" -v f="$f" 'BEGIN{printf "%d", s*30+f}') ($(awk -v s="$s" -v f="$f" 'BEGIN{t=s+f/30; printf "%d:%05.2f", t/60, t-60*int(t/60)}')): ${line#*: }"; else echo "piece at ${s}s: ok"; fi
  s=$(awk -v s="$s" 'BEGIN{print s+1.5}')
done
rm -rf "${T:?}"
