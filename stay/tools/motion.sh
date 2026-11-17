#!/bin/bash
# A measure of each v3 shot's motion, since frames can't be watched: the mean change between consecutive frames, per
# frame. A steady move gives a steady number; a jerk, a jump or a held frame shows as a spike or a zero.
#   bash tools/motion.sh  ->  a line a shot: median change, the largest frame-to-frame step in it (as a multiple of the
#   median) and the frame it happens on, and how many frames hardly change at all
cd "$(dirname "$0")/.."
while read -r id; do
  f=out/v3/shots/$id.mp4; [[ -f $f ]] || continue
  ffmpeg -nostdin -v error -i "$f" -vf "scale=270:216,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - 2>/dev/null | grep YAVG | cut -d= -f2 | bun -e '
    const v = (await Bun.stdin.text()).trim().split("\n").map(Number).slice(1);
    if (v.length < 4) { console.log(process.argv[1].padEnd(12), "too short to measure"); process.exit(0); }
    const s = [...v].sort((a, b) => a - b), med = s[Math.floor(s.length / 2)] || 1e-6;
    let worst = 0, at = 0;
    for (let i = 1; i < v.length; i++) { const d = Math.abs(v[i] - v[i - 1]) / med; if (d > worst) { worst = d; at = i + 1; } }
    const still = v.filter((x) => x < med * 0.08).length;
    console.log(process.argv[1].padEnd(12), "median", med.toFixed(2).padStart(6), " largest step", worst.toFixed(1).padStart(5) + "x at frame", String(at).padStart(3), " still frames", still, worst > 4 ? "  <-- look" : "");
  ' "$id"
done < <(bun -e 'import { SHOTS } from "./v3/plan"; for (const s of SHOTS) console.log(s.id)')
