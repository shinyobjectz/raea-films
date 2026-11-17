#!/usr/bin/env bash
# Fetches the ten stock clips the thermal film traces into media/thermal/stock, each checked against its sha256 in
# tools/stock.txt. Their licences let anyone use them in a film but not pass the files on, so they aren't in this
# repository or its download: eight come straight from Mixkit (Mixkit Stock Video Free License), and two from Pixabay
# (Pixabay Content License), which only serves people at a browser: the script says which to save, and where.
#   tools/get-stock.sh
set -euo pipefail
cd "$(dirname "$0")/.."
dir=media/thermal/stock
mkdir -p "$dir"
sha() { if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1; }
url() {
  local id=${1##*-}; id=${id%.mp4}
  case "$id" in
    99890) echo "https://assets.mixkit.co/active_storage/video_items/99890/1717186770/99890-video-720.mp4" ;;
    46762|23148) echo "https://assets.mixkit.co/videos/$id/$id-720.mp4" ;;
    *) echo "https://assets.mixkit.co/videos/$id/$id-1080.mp4" ;;
  esac
}
missing=0
while read -r name size want; do
  [ -z "$name" ] && continue
  f=$dir/$name
  if [ -f "$f" ] && [ "$(sha "$f")" = "$want" ]; then echo "get-stock: have $name"; continue; fi
  case "$name" in
    pixabay-*)
      id=${name##*-}; id=${id%.mp4}
      echo "get-stock: save https://pixabay.com/videos/id-$id/ (its 1920x1080 file, $size bytes) as $f" >&2
      missing=1; continue ;;
  esac
  echo "get-stock: $name"
  curl -fL --retry 3 -o "$f.part" "$(url "$name")"
  got=$(sha "$f.part")
  [ "$got" = "$want" ] || { rm -f "$f.part"; echo "get-stock: $name's checksum is $got, expected $want" >&2; exit 1; }
  mv "$f.part" "$f"
done < tools/stock.txt
if [ "$missing" = 1 ]; then echo "get-stock: save the Pixabay clips above, then run this again to check them" >&2; exit 1; fi
echo "get-stock: all ten clips ready in $dir"
