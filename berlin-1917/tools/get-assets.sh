#!/usr/bin/env bash
# Gets everything this film renders with: into assets/, the finished shots and the bare 3D renders under them, the
# narration, the record scans, the canvas stills, the fonts, and the 3D city (its tiles, houses, rooms, props, trees,
# people's places, skies and textures); into map/1917/, the map layers the city was built from. A 5.2 GB download
# (9.2 GB unpacked), checked against its sha256 before it's unpacked. ASSETS.md says where each piece came from and
# its licence.
#
# The media comes with a raea account, which is free: sign in at https://media.raea.io/#berlin-1917, press
# Get the media, and it gives you this command with your link (good for an hour):
#   tools/get-assets.sh 'https://api.raea.io/v1/blob?...'
# or download the archive there and give its path:
#   tools/get-assets.sh ~/Downloads/berlin-1917-assets-ec1cf673.tar.zst
# A download that stops carries on where it stopped when you run it again, with a fresh link if this one ran out.
set -euo pipefail
cd "$(dirname "$0")/.."
name=berlin-1917-assets-ec1cf673.tar.zst
want=ec1cf6736b087334c6a634f231d9beb5d0aa4a6640052e7e10f2abe30d8bed0e
bytes=5240225105
command -v zstd >/dev/null || { echo "get-assets: needs zstd (brew install zstd, or apt install zstd)" >&2; exit 1; }
src=${1:-}
if [ -z "$src" ]; then
  echo "get-assets: the media comes with a raea account, which is free. Sign in at https://media.raea.io/#berlin-1917," >&2
  echo "get-assets: press Get the media, and run the command it gives you (this script with your link)." >&2
  exit 2
fi
if [ -f "$src" ]; then
  file=$src
else
  case "$src" in https://*|http://*) ;; *) echo "get-assets: $src is neither a file nor a link: give the link from media.raea.io or the archive's path" >&2; exit 2 ;; esac
  mkdir -p out
  file=out/$name
  have=$( [ -f "$file" ] && wc -c <"$file" | tr -d ' ' || echo 0)
  if [ "$have" != "$bytes" ]; then
    echo "get-assets: downloading $name"
    if ! curl -fL --retry 5 --retry-all-errors -C - -o "$file" "$src"; then
      echo "get-assets: the download stopped. If the link ran out (it lasts an hour), get a new one at" >&2
      echo "get-assets: https://media.raea.io/#berlin-1917 and run this again: it carries on where it stopped." >&2
      exit 1
    fi
  fi
fi
if command -v sha256sum >/dev/null; then got=$(sha256sum "$file"); else got=$(shasum -a 256 "$file"); fi
got=${got%% *}
if [ "$got" != "$want" ]; then
  echo "get-assets: $file isn't this film's media (its sha256 is $got, expected $want)" >&2
  [ "$file" = "out/$name" ] && rm -f "$file"
  exit 1
fi
zstd -dc "$file" | tar -xf -
[ "$file" = "out/$name" ] && rm -f "$file"
echo "get-assets: assets/ and map/1917/ ready"
