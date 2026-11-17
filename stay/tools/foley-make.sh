#!/bin/bash
# Foley from the picture, a place a clip (the director, 11-11: "utilize hunyan foley at the end for scenes from an api on fal",
# and after picture lock, "send it when ready"). The clips are cut by tools/proxy.sh as v3/foley-cuts.ts says (one place
# each, its own frame held at the ends), and out/v3/proxy/clips.json carries each one's line, negative line and seed.
# Each clip is put in fal's storage (tools/fal-upload.sh, a private URL) and sent to fal-ai/hunyuan-video-foley directly
# (its sync endpoint, so the seed and the negative line are sent as written); the clip with its sound comes back as
# media/gen/foley-lock/ID.mp4 (with the reply, ID.json), and the seconds that are heard (clips.json `keep`) are cut out
# as media/foley/lock/ID.wav for tools/foley-mix.sh. $0.10 per 10 s of clip.
#   bash tools/foley-make.sh            the quote (no upload, no spend)
#   bash tools/foley-make.sh run [ID]   sends every clip without a wav yet (or only ID); FORCE=1 sends them again
# TAKE=N makes another take: the clip's seed plus 1000 N, its sound in media/foley/takes/ID-N.wav (the laid one,
# media/foley/lock/ID.wav, untouched); tools/foley-align.ts scores the takes against the picture's events and
# `bash tools/foley-align.sh pick` lays the best (the director, 11-12: "more hunyan foley across the board ... then seeing
# where they line up").
set -euo pipefail
cd "$(dirname "$0")/.."
man=out/v3/proxy/clips.json; raw=media/gen/foley-lock; out=media/foley/lock
[[ -f $man ]] || { echo "no $man: bash tools/proxy.sh first" >&2; exit 1; }
take=${TAKE:-0}; final=$out
if [[ $take != 0 ]]; then out=media/foley/takes; fi
mkdir -p $raw $out
ids=$(bun -e "const j = await Bun.file('$man').json(); console.log(j.clips.map(c => c.id).join(' '))")
if [[ "${1:-}" != run ]]; then
  bun -e "const j = await Bun.file('$man').json(); const s = j.clips.reduce((a, c) => a + c.sent.seconds, 0); console.log(j.clips.length + ' clips, ' + s.toFixed(1) + ' s: about \$' + (s / 10 * 0.1).toFixed(2) + ' (\$' + (j.clips.reduce((a, c) => a + Math.ceil(c.sent.seconds / 10), 0) * 0.1).toFixed(2) + ' if billed by the started 10 s). bash tools/foley-make.sh run sends them.')"
  exit 0
fi
only=${2:-}
key=$(grep -E '^FAL_KEY=' ~/.raea/env | head -1 | cut -d= -f2- | tr -d '"'"'"'')
for id in $ids; do
  [[ -n $only && $id != "$only" ]] && continue
  w=$out/$id.wav; [[ $take != 0 ]] && w=$out/$id-$take.wav
  [[ -f $w && "${FORCE:-0}" != 1 ]] && { echo "have $id (take $take)"; continue; }
  url=$(bash tools/fal-upload.sh out/v3/proxy/$id.mp4)
  body=$(bun -e "const j = await Bun.file('$man').json(); const c = j.clips.find(c => c.id === '$id'); const r = { ...c.request }; if ($take && typeof r.seed === 'number') r.seed += 1000 * $take; console.log(JSON.stringify({ video_url: '$url', ...r }))")
  t0=$(date +%s)
  code=$(curl -sS -o $raw/$id-t$take.json -w '%{http_code}' --max-time 600 -X POST "https://fal.run/fal-ai/hunyuan-video-foley" -H "Authorization: Key $key" -H "Content-Type: application/json" -d "$body" || true)
  if [[ $code != 200 ]]; then echo "FAIL $id: HTTP $code $(head -c 300 $raw/$id-t$take.json 2>/dev/null)"; continue; fi
  vurl=$(bun -e "const j = await Bun.file('$raw/$id-t$take.json').json(); console.log(j.video?.url ?? '')")
  [[ -n $vurl ]] || { echo "FAIL $id: no video in the reply"; continue; }
  curl -sS --max-time 300 -o $raw/$id-t$take.mp4 "$vurl"
  read -r from to < <(bun -e "const j = await Bun.file('$man').json(); const c = j.clips.find(c => c.id === '$id'); console.log(c.keep.from, c.keep.to)")
  got=$(ffprobe -v error -select_streams a -show_entries stream=duration -of csv=p=0 $raw/$id-t$take.mp4 < /dev/null)
  ffmpeg -nostdin -y -loglevel error -i $raw/$id-t$take.mp4 -ss $from -to $to -vn -ac 2 -ar 48000 -c:a pcm_s24le $w
  sent=$(bun -e "const j = await Bun.file('$man').json(); console.log(j.clips.find(c => c.id === '$id').sent.seconds)")
  antsy spend "$(bun -e "console.log((Math.ceil($sent / 10) * 0.1).toFixed(2))")" "Stay foley: $id take $take (hunyuan-video-foley, $sent s)" --for "Stay: foley after picture lock" > /dev/null 2>&1 || true
  echo "ok   $id: ${got} s of sound for ${sent} s sent, kept $from-$to s, $(( $(date +%s) - t0 )) s"
done
ls $out/*.wav 2>/dev/null | wc -l | xargs -I{} echo "{} of $(echo $ids | wc -w | tr -d ' ') clips have sound in $out"
