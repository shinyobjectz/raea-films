#!/bin/bash
# tools/flashsplice.sh VIDEO.mp4 STILLS_DIR A-B [A-B...]: raea check's flash screen on fixed frames in context. Each A-B
# is a run of film frames; the stills for it come from STILLS_DIR/fNNNNN.png where there is one, else from VIDEO (so a
# second of the export either side keeps the cuts into and out of a fixed shot counted), encoded and checked alone.
cd "$(dirname "$0")/.." || exit 1
V=${1:?video.mp4}; D=${2:?stills dir}; shift 2; T=$(mktemp -d /tmp/flashsplice.XXXXXX)
export PATH=/opt/homebrew/bin:$PATH; FF=ffmpeg   # (raea check calls ffprobe from PATH)
for run in "$@"; do
  a=${run%-*}; z=${run#*-}; mkdir -p "$T/e" "$T/s"; find "$T" -name '*.png' -delete
  "$FF" -v error -i "$V" -vf "select='between(n\,$a\,$z)'" -fps_mode passthrough -start_number "$a" "$T/e/f%05d.png" < /dev/null
  i=0; for f in $(seq "$a" "$z"); do n=$(printf %05d "$f"); src="$D/f$n.png"; [ -f "$src" ] || src="$T/e/f$n.png"
    [ -f "$src" ] || { echo "missing frame $f"; exit 1; }; cp "$src" "$T/s/g$(printf %05d $i).png"; i=$((i+1)); done
  "$FF" -v error -y -framerate 30 -i "$T/s/g%05d.png" -c:v libx264 -crf 12 -pix_fmt yuv420p "$T/clip.mp4" < /dev/null
  out=$(raea check "$T/clip.mp4" --shape 9:16 -o "$T/c.json" 2>&1 < /dev/null); echo "== frames $a-$z ($i in the clip): $(echo "$out" | grep -iE "flash" | tr "\n" " ")"; [ -n "$DEBUG" ] && echo "$out" | tail -5
done
rm -rf "${T:?}"
