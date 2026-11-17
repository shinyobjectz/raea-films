#!/bin/bash
# The faces shot (v3/faces.tsx), finished: rendered, then re-shaded by the DLSS neural pass (MLX-DLSS, the "natural"
# profile, as the faces reel settled on 11-05: detail 1.5, colour 1.5), faded in on the shot's last stage (the
# drawing, the clay and the plain skin before it are kept as rendered); then the film's grain over all of it.   bash tools/faces.sh  ->  out/v3/faces/faces.mp4
# FULL=1: the same at full size (compositions faces-0-x .. faces-2-x, 2700 x 2160) for tools/v3.sh --full  ->  out/v3/faces/faces-x.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
# (the frame's size from v3/size.json: the tall frame under tools/tall.sh writes out/v3t)
read -r fw fh tall < <(bun -e 'import { W, H, TALL } from "./v3/plan"; console.log(W, H, TALL ? 1 : 0)')
base=out/v3; [[ $tall == 1 ]] && base=out/v3t
d=$base/faces; mkdir -p $d
x=""; size=$fw:$fh; grain=7; shots=${SHOTS_DIR:-$base/shots}; q=(--quality master)
# (full size: grain of the same share of the picture is twice as many pixels, so a little more of it; the raw render at
# the film's full-size bit rate, tools/v3.sh)
if [[ "${FULL:-0}" == 1 ]]; then x=-x; size=$((fw * 2)):$((fh * 2)); grain=8; shots=${SHOTS_DIR:-$base/full}; q=(--kbps ${KBPS:-120000}); fi
# the neural pass (MLX-DLSS, not part of this repository: MLXDLSS and DLSS_MODEL point at yours); without it the faces
# keep their plain render
DLSS=${MLXDLSS:-~/src/MLX-DLSS/.build/release/mlxdlss}; MODEL=${DLSS_MODEL:-~/src/dlssmac-dl/x/DLSSMac.app/Contents/Resources/models/NeuralRendering.dlssmodel}
# (in three segments, a stage's material each: a render keeps its first frame's materials; v3/faces.tsx)
for seg in 0 1 2; do
  raea render v3/faces.tsx --composition faces-$seg$x "${q[@]}" -o $d/raw-$seg$x.mp4 > $d/raw-$seg$x.log 2>&1 || { grep -E "REFUSED|rror" $d/raw-$seg$x.log | head -5; exit 1; }
done
printf "file 'raw-%s$x.mp4'\n" 0 1 2 > $d/raw$x.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i $d/raw$x.txt -c copy $d/raw$x.mp4
rm -f $d/dlss$x.mp4
if [[ -x $DLSS && -f $MODEL ]]; then
  $DLSS process-video $d/raw$x.mp4 --output $d/dlss$x.mp4 --model "$MODEL" --profile natural --detail-strength 1.5 --colour-strength 1.5 > $d/dlss$x.log 2>&1 || { tail -5 $d/dlss$x.log; exit 1; }
else
  echo "faces: no MLX-DLSS at $DLSS, so the faces keep their plain render" >&2; cp $d/raw$x.mp4 $d/dlss$x.mp4
fi
# the plain render up to the DLSS beat (the drawing, the clay and the skin as they are), then the DLSS pass fading in
# over DLSS_FADE frames and held to the cut (v3/faces-cuts.ts)
read -r dl fade < <(bun -e 'import { DLSS, DLSS_FADE } from "./v3/faces-cuts"; console.log(DLSS, DLSS_FADE)')
ffmpeg -y -loglevel error -i $d/dlss$x.mp4 -i $d/raw$x.mp4 -filter_complex "[0:v]scale=$size:flags=lanczos,format=gbrp[a];[1:v]scale=$size:flags=lanczos,format=gbrp[b];[a][b]blend=all_expr='A*clip((N-$dl)/$fade\,0\,1)+B*(1-clip((N-$dl)/$fade\,0\,1))',noise=alls=$grain:allf=t+u,format=yuv420p[v]" -map "[v]" -r 30 -c:v libx264 -crf 13 $d/faces$x.mp4
mkdir -p $shots && cp $d/faces$x.mp4 $shots/faces.mp4      # (it is a shot of the film: v3/plan.ts "faces"; tools/v3.sh joins it with the rest)
echo "$d/faces$x.mp4: $(ffprobe -v error -show_entries format=duration -of csv=p=0 $d/faces$x.mp4) s"
