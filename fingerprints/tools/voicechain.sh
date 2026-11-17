#!/bin/bash
# The voice's channel strip, as a file: each Fish line high-passed at 80 Hz, compressed 2.5:1 from -30 dB (3 ms attack,
# 80 ms release, 12 dB make-up), then held by a fast peak compressor (20:1 from -9 dB, 0.1 ms attack) and lifted 2.5 dB,
# so speech's 18 dB of peak over loudness comes down to about 11 and the master reaches -14 LUFS under a -1.5 dBTP
# ceiling. A compressor, not a brickwall limiter: a limiter pinned the peaks at one value, which raea check reads as
# flat-topped clipping. The originals stay as they
# are; this writes media/voice/NN.mix.wav and prints each line's peak, loudness and peak-to-loudness ratio.
# Usage: tools/voicechain.sh [voice|voice2]   (the folder under media/)
set -euo pipefail
cd "$(dirname "$0")/../media/${1:-voice}"
for f in [0-9][0-9].wav; do
  id="${f%.wav}"
  ffmpeg -nostdin -v error -y -i "$f" -af "highpass=f=80,acompressor=threshold=0.032:ratio=2.5:attack=3:release=80:makeup=4,acompressor=threshold=0.35:ratio=20:attack=0.1:release=40:knee=2:detection=peak,volume=2.5dB" -ar 48000 "$id.mix.wav"
  ffmpeg -nostdin -hide_banner -i "$id.mix.wav" -af "volumedetect,ebur128=framelog=quiet" -f null - 2>&1 | awk -v id="$id" '/max_volume/{p=$5} /I:/{i=$2} END{printf "%s  peak %5.1f dBFS  %6.1f LUFS  PLR %4.1f\n", id, p, i, p-i}'
done
