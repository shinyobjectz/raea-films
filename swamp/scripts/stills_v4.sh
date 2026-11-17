#!/bin/zsh
# Stills of v4's shots at the preview size: stills_v4.sh OUTDIR SHOT:LOCAL,LOCAL ... (each shot's frames from its start)
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH
out=${1:?outdir}; shift
for spec in $@; do
  id=${spec%%:*}; at=${spec#*:}
  mkdir -p $out/$id
  raea render compositions/hype.tsx --composition p$id --at $at -o $out/$id/ 2>&1 | grep -E "APPLIED|REFUSED|rror" | cut -c1-200
done
