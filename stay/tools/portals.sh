#!/bin/bash
# The doorways' pictures of the next world (v3/kit.tsx Portal): for each world, its last second and a half as the last
# world's lens sees it (composition v3p-ID), cut into pictures of PORTAL_CHUNK frames stacked top to bottom
# (media/PORTAL_DIR/ID-K.png), and the world listed (v3/portals.json, or v3/portals-tall.json for the tall frame) so the
# last world's doorway shows it. The 5:4 frame stacks 15 frames of 1080 (16200 px, under the GPU's 16384); the tall frame
# (under tools/tall.sh) 5 of 1920, in media/portal-tall.
#   bash tools/portals.sh ID ...
set -uo pipefail
cd "$(dirname "$0")/.."
read -r frames chunk pdir tall < <(bun --preload ./tools/raea-stub.ts -e 'import { PORTAL_FRAMES, PORTAL_CHUNK, PORTAL_DIR } from "./v3/kit"; import { TALL } from "./v3/plan"; console.log(PORTAL_FRAMES, PORTAL_CHUNK, PORTAL_DIR, TALL ? 1 : 0)')
list=v3/portals.json; [[ $tall == 1 ]] && list=v3/portals-tall.json
work=out/$pdir
mkdir -p media/$pdir $work
for id in "$@"; do
  # (the sea's world needs the FFT ocean: the build of raea with the film's plugin, as tools/v3.sh renders it)
  if [[ $id == kitchen ]]; then run=(env RAEA_BUNDLE_LIB=$HOME/raea/target/release/libraea_bundle.dylib vendor/bin/raea-sea motion render); else run=(raea render); fi
  if ! "${run[@]}" v3/film.tsx --composition v3p-$id --quality master -o $work/$id.mp4 > $work/$id.log 2>&1 || ! grep -q "^APPLIED" $work/$id.log; then
    echo "FAIL $id"; grep -E "REFUSED|error" $work/$id.log | cut -c1-240 | head -3; continue
  fi
  rm -rf "${work:?}/${id:?}" && mkdir -p $work/$id
  ffmpeg -y -loglevel error -i $work/$id.mp4 $work/$id/f%03d.png || { echo "FAIL $id frames"; continue; }
  n=$(ls $work/$id/*.png | wc -l | tr -d ' ')
  [[ $n -ge $frames ]] || { echo "FAIL $id: $n frames"; continue; }
  for ((k = 0; k < frames / chunk; k++)); do magick $(ls $work/$id/*.png | sed -n "$((k * chunk + 1)),$((k * chunk + chunk))p") -append media/$pdir/$id-$k.png || { echo "FAIL $id stack"; continue 2; }; done
  bun -e "const f = '$list'; const a = JSON.parse(await Bun.file(f).text()); if (!a.includes('$id')) a.push('$id'); await Bun.write(f, JSON.stringify(a) + '\n')"
  rm -rf "${work:?}/${id:?}"
  echo "ok   $id"
done
