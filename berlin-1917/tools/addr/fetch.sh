#!/bin/bash
# Pages of the Berliner Adreßbuch 1917 (ZLB, digital.zlb.de, PPN 34115495_1917, public domain) at full resolution.
# The ZLB's viewer has no text for this volume, and it sends a whole page at full size to a bot check, so each page
# comes as four quarters by IIIF region (pct:) and is stitched here.
#   fetch.sh ORDER..   physical page numbers (the viewer's ORDER; Part III's Leipziger Str. is 4322-4325)
# Writes cache/adressbuch/1917/ORDER.jpg.
set -euo pipefail
root=$(cd "$(dirname "$0")/../.." && pwd)
out=$root/cache/adressbuch/1917
mkdir -p "$out"
base=https://digital.zlb.de/viewer/api/v1/records/34115495_1917/files/images
tmp=$(mktemp -d)
trap 'rm -r "${tmp:?}"' EXIT
for p in "$@"; do
  [[ -s $out/$p.jpg ]] && { echo "$p cached"; continue; }
  f=$(printf "%08d.png" "$p")
  for q in "0,0" "50,0" "0,50" "50,50"; do
    curl -sS -m 180 --retry 2 -o "$tmp/$q.jpg" "$base/$f/pct:$q,50,50/full/0/default.jpg"
    [[ $(head -c 2 "$tmp/$q.jpg" | xxd -p) == ffd8 ]] || { echo "$p: quarter $q is not a JPEG (bot check?)" >&2; exit 1; }
  done
  magick \( "$tmp/0,0.jpg" "$tmp/50,0.jpg" +append \) \( "$tmp/0,50.jpg" "$tmp/50,50.jpg" +append \) -append -colorspace gray -quality 92 "$out/$p.jpg"
  echo "$p $(identify -format '%wx%h' "$out/$p.jpg")"
done
