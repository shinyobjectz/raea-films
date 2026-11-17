#!/bin/bash
# Renders the film a frame a process (Solari keeps a renamed mesh's old shapes, so every frame gets a process that sees
# one shape of the hand: v2/hand.tsx), JOBS at a time, then joins the frames with the mix into one MP4.
# Usage: tools/film.sh OUT.mp4 [STEP] [WIDTH] [JOBS]   (STEP 1 is every frame; 4 with WIDTH 960 is a quick look)
set -euo pipefail
cd "$(dirname "$0")/.."
out="$1"; step="${2:-1}"; w="${3:-1920}"; jobs="${4:-4}"
h=$(( w * 9 / 16 ))
frames="out/frames-$w"
mkdir -p "$frames"
total=$(bun -e 'import("./v2/time.ts").then((m) => console.log(m.DURATION))')
one() { # frame
  local n="$1" f
  f=$(printf "%s/f%05d.png" "$frames" "$n")
  [ -s "$f" ] && return 0
  if ! raea render fingerprint2.tsx --frame "$n" --w "$w" --h "$h" -o "$f" >/dev/null 2>"$f.err"; then
    echo "FAILED frame $n: $(tail -1 "$f.err")"
    return 1
  fi
  : > "$f.err"
  echo "frame $n"
}
export -f one; export frames w h
seq 0 "$step" $(( total - 1 )) | xargs -P "$jobs" -I{} bash -c 'one {}'
missing=0
for n in $(seq 0 "$step" $(( total - 1 ))); do [ -s "$(printf "%s/f%05d.png" "$frames" "$n")" ] || missing=$(( missing + 1 )); done
echo "frames: $(ls "$frames"/f*.png | wc -l | tr -d ' ') drawn, $missing missing"
[ "$missing" -eq 0 ] || exit 1
fps=$(bun -e 'import("./v2/time.ts").then((m) => console.log(m.FPS))')
audio=()
[ -s out/fingerprint2-mix.wav ] && audio=(-i out/fingerprint2-mix.wav -c:a aac -b:a 256k -shortest)
if [ "$step" -eq 1 ]; then
  ffmpeg -nostdin -v error -y -framerate "$fps" -i "$frames/f%05d.png" ${audio[@]+"${audio[@]}"} -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -movflags +faststart "$out"
else
  ffmpeg -nostdin -v error -y -framerate "$fps/$step" -pattern_type glob -i "$frames/f*.png" ${audio[@]+"${audio[@]}"} -c:v libx264 -crf 18 -pix_fmt yuv420p -r "$fps" "$out"
fi
echo "wrote $out"
