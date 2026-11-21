#!/bin/bash
# Reads Adreßbuch pieces on this machine with Kraken (a free OCR engine for historical print) and a Fraktur model, into
# transcribe.ts's text format (alto.ts), so score.ts can set it against Opus's readings and parse.ts can parse it.
# The pieces are the same crops Claude reads (transcribe.ts with MODEL=png).
#   KRAKEN=path/to/kraken [KRAKEN_DEVICE=mps] tools/addr/kraken.sh MODEL.mlmodel OUT ORDER:COLS..
#   e.g. kraken.sh ~/Library/Application\ Support/htrmopo/.../german_print.mlmodel read-kraken-gp 4322:6 4323:3
# A piece already read into OUT is skipped, so a stopped run picks up where it was; CUT=0 skips cutting the pieces
# again when their images are there.
# Models (kraken get DOI): german_print 10.5281/zenodo.10519596; austriannewspapers 10.5281/zenodo.7933402.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
book="$here/../../cache/adressbuch/1917"
model=$1 out=$2
shift 2
kraken=${KRAKEN:-kraken}

[ "${CUT:-1}" = 0 ] || MODEL=png OUT=pieces bun "$here/transcribe.ts" "$@" >/dev/null
mkdir -p "$book/$out/alto"
args=()
for span in "$@"; do
  order=${span%%:*} cols=${span#*:}
  c0=${cols%-*} c1=${cols#*-}
  for ((c = c0; c <= c1; c++)); do
    for png in "$book/pieces/$order-$c-"*.png; do
      xml="$book/$out/alto/$(basename "$png" .png).xml"
      [ -s "$xml" ] || args+=(-i "$png" "$xml")
    done
  done
done
[ ${#args[@]} -eq 0 ] || "$kraken" -a ${KRAKEN_DEVICE:+-d "$KRAKEN_DEVICE"} "${args[@]}" segment -bl ocr -m "$model"
bun "$here/alto.ts" "$book/$out/alto" "$book/$out"
echo "$out: $(ls "$book/$out"/*.txt | wc -l | tr -d ' ') pieces read"
