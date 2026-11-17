#!/bin/bash
# tools/mix.sh FILM.mp4 OUT.mp4: the film's sound (v6: tools/mix.sh out/goose-v6-picture.mp4 out/goose-v6.mp4). tools/foley.ts mixes the song and the foley; this brings the mix
# to -14 LUFS integrated under a limiter (sample peaks held under -3 dBFS: the keys rattling up, dense sharp clicks,
# came out of the AAC 2 dB over a -2 dBFS ceiling, so the true peak needs that room to stay under -1.5),
# then puts it on the picture, copied, not encoded again. v7: the louder key hits and ENTER came out of the AAC at
# -0.8 dBFS true peak under a -3.1 dBFS ceiling, so the ceiling is -4.4 dBFS (limit 0.60). PICK='{"step":2,...}' chooses takes (tools/foley.ts).
cd "$(dirname "$0")/.." || exit 1
IN=${1:?film.mp4}; OUT=${2:?out.mp4}
bun tools/foley.ts out/foley.wav || exit 1
ffmpeg -v error -y -f f32le -ar 48000 -ac 2 -i out/foley.f32 -c:a pcm_f32le out/foley.wav && rm -f out/foley.f32
lufs() { ffmpeg -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 | awk '/I:/{i=$2} /Peak:/{p=$2} END{print i, p}'; }
read -r I _ <<< "$(lufs out/foley.wav)"; G=$(echo "-14 - ($I)" | bc -l)
for pass in 1 2; do   # the limiter takes a little loudness back: measure and correct once
  ffmpeg -v error -y -i out/foley.wav -af "volume=${G}dB,alimiter=limit=0.60:attack=2:release=60:level=disabled" -c:a pcm_s24le out/mix.wav
  read -r I2 _ <<< "$(lufs out/mix.wav)"; G=$(echo "$G + (-14 - ($I2))" | bc -l)
done
ffmpeg -v error -y -i "$IN" -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest "$OUT" || exit 1
read -r IF TP <<< "$(lufs "$OUT")"; echo "wrote $OUT: $IF LUFS integrated, true peak $TP dBFS (the mix before levelling: $I LUFS)"
