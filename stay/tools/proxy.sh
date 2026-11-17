#!/bin/bash
# The picture the foley model is sent, cut as v3/foley-cuts.ts says: out/v3/proxy/ID.mp4, one place a clip, from the
# shots' own renders (so no neighbour's frame can get in), its first frame held EDGE+lead seconds before it and its
# last held EDGE+tail after, 640 wide, 30 fps, no sound; and out/v3/proxy/clips.json, each clip with the line, the
# negative line and the seed it is sent with and where its sound is laid. No upload and no spend.
#   bash tools/proxy.sh [SHOTS_DIR=out/v3/shots]
set -euo pipefail
cd "$(dirname "$0")/.."
src=${1:-out/v3/shots}; out=out/v3/proxy; mkdir -p $out
bun -e '
import { resolved, NONE, NEGATIVE, EDGE } from "./v3/foley-cuts";
import { PAD, shot } from "./v3/plan";
const r = resolved();
const clips = r.map((c) => ({ id: c.id, file: c.file, shots: c.shots, sees: c.sees,
  song: { from: +(c.f0 / 30).toFixed(3), to: +(c.f1 / 30).toFixed(3) }, film: { from: +(c.f0 / 30 + PAD).toFixed(3), to: +(c.f1 / 30 + PAD).toFixed(3) },
  sent: { seconds: +((Math.round(c.pre * 30) + c.f1 - c.f0 + Math.round(c.post * 30)) / 30).toFixed(3), held_before: +(Math.round(c.pre * 30) / 30).toFixed(3), held_after: +(Math.round(c.post * 30) / 30).toFixed(3), thrown_each_end: EDGE },
  // (keep: the seconds of the returned sound that are heard, in the clip time; laid: where they go, in song time)
  keep: { from: +(Math.round(c.pre * 30) / 30 - c.lead).toFixed(3), to: +(Math.round(c.pre * 30) / 30 + (c.f1 - c.f0) / 30 + c.tail).toFixed(3) },
  laid: { at: +c.at.toFixed(3), until: +c.until.toFixed(3), fade_in: c.lead, fade_out: c.tail },
  request: { text_prompt: c.say, negative_prompt: c.negative ?? NEGATIVE, seed: c.seed, guidance_scale: 4.5, num_inference_steps: 50 } }));
await Bun.write("out/v3/proxy/clips.json", JSON.stringify({ model: "fal-ai/hunyuan-video-foley", clips, none: NONE }, null, 2) + "\n");
// (the holds in whole frames: a half-frame hold rounds differently in the tpad filter)
for (const c of r) console.log(c.id, c.shots.join(","), c.f0 - shot(c.shots[0]).f0, c.f1 - c.f0, Math.round(c.pre * 30), Math.round(c.post * 30));
' > $out/.cuts
# (-nostdin: ffmpeg reading the loop's input ate the next clip's line)
while read -r id shots skip frames pre post; do
  IFS=, read -ra ss <<< "$shots"; ins=(); cat=""
  for i in "${!ss[@]}"; do ins+=(-i "$src/${ss[$i]}.mp4"); cat+="[$i:v]"; done
  ffmpeg -nostdin -y -loglevel error "${ins[@]}" -filter_complex "${cat}concat=n=${#ss[@]}:v=1:a=0,trim=start_frame=$skip:end_frame=$((skip + frames)),setpts=PTS-STARTPTS,tpad=start=$pre:start_mode=clone:stop=$post:stop_mode=clone,scale=640:-2:flags=lanczos,fps=30,format=yuv420p[v]" \
    -map "[v]" -c:v libx264 -preset slow -crf 20 -movflags +faststart -an $out/$id.mp4
  got=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 $out/$id.mp4 < /dev/null)
  [[ $got == "$((pre + frames + post))" ]] || { echo "$id: $got frames, wanted $((pre + frames + post))" >&2; exit 1; }
  printf '%-11s %-17s %6.2f s sent (%d frames held before, %d after)\n' "$id" "$shots" "$(bun -e "console.log($got / 30)" < /dev/null)" "$pre" "$post"
done < $out/.cuts
rm -f $out/.cuts
echo "$out/clips.json: $(ls $out/*.mp4 | wc -l | tr -d ' ') clips, $(bun -e 'const j = await Bun.file("out/v3/proxy/clips.json").json(); const s = j.clips.reduce((a, c) => a + c.sent.seconds, 0); console.log(s.toFixed(1) + " s in all, about $" + (s / 10 * 0.1).toFixed(2) + " at $0.10 per 10 s (or $" + (j.clips.reduce((a, c) => a + Math.ceil(c.sent.seconds / 10), 0) * 0.1).toFixed(2) + " if each clip is billed by the started 10 s)")')"
