#!/usr/bin/env python3
"""v9's read (tutorial-v9.script.ts, after the director's notes on v8, a feed post, approved 11-16): a line whose words
are unchanged from v8 (tutorial.script.ts, read as assets/vo7/) keeps its approved take; a new line is read on Fish,
voice A on drama-3, with the narrator's direction, one step a line.

python3 -I tools/vo9.py flow            writes out/tut/fish/v9/flow.json with a step for each new line, and lists them
python3 -I tools/vo9.py collect DIR[,DIR] files the takes as assets/vo9/NN-MM-K.wav with assets/vo9/read.json, which
                                        tools/beats.py reads (raea gen's output folders; a later folder's take wins)
"""
import json, shutil, subprocess, sys
from pathlib import Path

here = Path(__file__).resolve().parent.parent
FF = "/opt/homebrew/bin/ffmpeg"
VOICE = "4ded85577e3243dcae310903d0ae75cc"
DIRECTION = "[dry, measured, unhurried] "
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse"

def spec(path):
    out = subprocess.run(["raea", "spec", str(path)], cwd=here, capture_output=True, text=True, check=True).stdout
    return json.loads(out.strip().splitlines()[0])
def lines(sc):
    for scene in sc["scenes"]:
        ch = scene["heading"].split(" ")[0]
        for k, b in enumerate(scene["beats"]):
            for i, ln in enumerate(b.get("lines", [])):
                yield f"{ch}.{k + 1:02d}.{i + 1}", ln
def dur(f):
    out = subprocess.run([FF, "-i", str(f), "-f", "null", "-"], capture_output=True, text=True).stderr
    t = [l for l in out.splitlines() if "time=" in l][-1].split("time=")[1].split()[0]
    h, m, s = t.split(":"); return int(h) * 3600 + int(m) * 60 + float(s)

v8 = spec(here / "tutorial.script.ts")
v9 = spec(here / "tutorial-v9.script.ts")
old = json.loads((here / "assets/vo7/read.json").read_text())["lines"]
by_words = {}
for lid, ln in lines(v8):
    if lid in old: by_words.setdefault(ln["says"].strip(), lid)
step_of = lambda lid: "b" + lid.replace(".", "_")

if sys.argv[1] == "flow":
    steps, kept = {}, 0
    for lid, ln in lines(v9):
        if ln["says"].strip() in by_words: kept += 1; continue
        steps[step_of(lid)] = {"op": "audio.speech", "model": "fish:drama-3", "in": {"text": DIRECTION + ln["says"], "voice": VOICE}}
        print(f"  {lid}: {ln['says']}")
    out = here / "out/tut/fish/v9"; out.mkdir(parents=True, exist_ok=True)
    (out / "flow.json").write_text(json.dumps({"flow": 1, "steps": steps}, indent=1))
    print(f"{len(steps)} new lines to read, {kept} kept from v8: out/tut/fish/v9/flow.json")
elif sys.argv[1] == "collect":
    takes = {}
    for gen in [Path(g) for g in sys.argv[2].split(",")]:
        for line in (gen / "gen.jsonl").read_text().splitlines():
            j = json.loads(line); takes[j["step"]] = gen / j["files"][0]
    dst_dir = here / "assets/vo9"; dst_dir.mkdir(exist_ok=True)
    read, kept, new = {}, 0, 0
    for lid, ln in lines(v9):
        dst = dst_dir / f"{lid.replace('.', '-')}.wav"
        src = by_words.get(ln["says"].strip())
        if src:
            shutil.copy(here / "assets" / old[src]["file"], dst); kept += 1
            read[lid] = {"file": f"vo9/{dst.name}", "seconds": old[src]["seconds"], "take": old[src]["take"], "from": src}
        else:
            st = step_of(lid)
            if st not in takes: sys.exit(f"no take for {lid} ({st}): {ln['says']}")
            subprocess.run([FF, "-v", "error", "-y", "-i", str(takes[st]), "-af", TRIM, "-ar", "48000", "-ac", "1", str(dst)], check=True); new += 1
            read[lid] = {"file": f"vo9/{dst.name}", "seconds": round(dur(dst), 2), "take": f"v9/{st}"}
    (dst_dir / "read.json").write_text(json.dumps({"voice": f"fish {VOICE} (A), drama-3", "lines": dict(sorted(read.items()))}, indent=1))
    print(f"{len(read)} lines ({kept} kept from v8, {new} new), {round(sum(v['seconds'] for v in read.values()), 1)} s of voice")
