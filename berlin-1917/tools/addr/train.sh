#!/bin/bash
# Fine-tunes a Kraken recognition model on the 1917 Adreßbuch's own print, so this machine reads the book for free:
# Opus's readings of the pieces (cache/adressbuch/1917/read) on Kraken's line outlines (gt.ts), starting from a Fraktur
# model and adding the characters it lacks. A tenth of the lines are kept back to stop training once they stop
# improving; the pieces named by HOLD are never trained on, so score.ts can judge the model on them afterwards.
#   KRAKEN_BIN=dir/with/kraken+ketos [KRAKEN_DEVICE=mps] [HOLD=4322-6-,4323-3-] tools/addr/train.sh BASE.mlmodel ALTO_DIR NAME
#   ALTO_DIR: kraken.sh's alto folder for the pieces Opus read. Writes cache/adressbuch/kraken/NAME/: gt/ (the training
#   lines), train.arrow, and the run's folder with best_SCORE.safetensors (the model, for kraken.sh) and checkpoints.
# On the Mac's GPU (mps) the CTC loss runs on the CPU (PyTorch has no MPS kernel for it); the rest stays on the GPU.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
book="$here/../../cache/adressbuch/1917"
base=$1 alto=$2 name=$3
bin=${KRAKEN_BIN:-$(dirname "$(command -v ketos)")}
work="$book/../kraken/$name"
mkdir -p "$work"

bun "$here/gt.ts" "$alto" "$work/gt" --hold "${HOLD:-4322-6-,4323-3-}"
"$bin/ketos" compile -f alto -o "$work/train.arrow" "$work"/gt/*.xml
PYTORCH_ENABLE_MPS_FALLBACK=1 "$bin/ketos" ${KRAKEN_DEVICE:+-d "$KRAKEN_DEVICE"} train -f binary -i "$base" --resize union \
  -B 8 -q early --lag 5 --min-epochs 3 -N 40 -p 0.9 -o "$work/run" "$work/train.arrow"
ls -la "$work/run"
