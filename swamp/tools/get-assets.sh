#!/usr/bin/env bash
# Gets the media this film renders with into assets/: the scans, skies, textures, recordings, sampled instruments,
# plates and app captures. A 1.3 GB download (1.8 GB unpacked), checked against its sha256 before it's unpacked.
# ASSETS.md says where each piece came from and its licence.
#
# The media comes with a raea account, which is free: sign in at https://media.raea.io/#swamp, press
# Get the media, and it gives you this command with your link (good for an hour):
#   tools/get-assets.sh 'https://api.raea.io/v1/blob?...'
# or download the archive there and give its path:
#   tools/get-assets.sh ~/Downloads/swamp-assets-1a46546c.tar.zst
# A download that stops carries on where it stopped when you run it again, with a fresh link if this one ran out.
set -euo pipefail
cd "$(dirname "$0")/.."
name=swamp-assets-1a46546c.tar.zst
want=1a46546c87e7fbd2a1409efa8af60011f5e1f832bde645c959d2baafdc2e43c9
bytes=1308217001
command -v zstd >/dev/null || { echo "get-assets: needs zstd (brew install zstd, or apt install zstd)" >&2; exit 1; }
src=${1:-}
if [ -z "$src" ]; then
  echo "get-assets: the media comes with a raea account, which is free. Sign in at https://media.raea.io/#swamp," >&2
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
      echo "get-assets: https://media.raea.io/#swamp and run this again: it carries on where it stopped." >&2
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
echo "get-assets: assets/ ready"
