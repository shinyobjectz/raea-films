#!/bin/bash
# Put a local file where fal can read it (fal's own storage, a private URL) and print that URL:  bash tools/fal-upload.sh FILE
# Needed because `raea gen` sends a generic fal endpoint only the prompt (11-11: the video of an audio.sfx step is dropped),
# and Hunyuan's video-to-audio model takes its clip as `video_url`. The key is read from ~/.raea/env and never printed.
set -euo pipefail
f=$1
key=$(grep -E '^FAL_KEY=' ~/.raea/env | head -1 | cut -d= -f2- | tr -d '"'"'"'')
type=video/mp4; [[ $f == *.wav ]] && type=audio/wav
init=$(curl -sS -X POST "https://rest.alpha.fal.ai/storage/upload/initiate" -H "Authorization: Key $key" -H "Content-Type: application/json" -d "{\"file_name\":\"$(basename "$f")\",\"content_type\":\"$type\"}")
up=$(printf '%s' "$init" | bun -e 'const j=JSON.parse(await Bun.stdin.text()); console.log(j.upload_url ?? "")')
url=$(printf '%s' "$init" | bun -e 'const j=JSON.parse(await Bun.stdin.text()); console.log(j.file_url ?? "")')
[[ -n $up && -n $url ]] || { echo "fal storage refused: $(printf '%s' "$init" | cut -c1-200)" >&2; exit 1; }
curl -sS -X PUT "$up" -H "Content-Type: $type" --data-binary @"$f" -o /dev/null
echo "$url"
