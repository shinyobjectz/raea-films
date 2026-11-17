#!/usr/bin/env python3
"""v11's read (tutorial-v11.script.ts, after the director's notes on v10, a feed post: a line whose words are unchanged
from v10 keeps its v10 take (assets/vo10/, its pauses already tightened); a new line is read on Fish, voice A on
drama-3, with the narrator's direction, and its pauses tightened as v10's were (tools/vo10.py tighten).

python3 -I tools/vo11.py flow        writes out/tut/fish/v11/flow.json with a step for each new line, and lists them
python3 -I tools/vo11.py collect DIR  files the takes as assets/vo11/NN-MM-K.wav with assets/vo11/read.json (beats.py)
"""
import json, shutil, subprocess, sys
from pathlib import Path
here = Path(__file__).resolve().parent.parent
FF = "/opt/homebrew/bin/ffmpeg"
VOICE = "4ded85577e3243dcae310903d0ae75cc"
DIRECTION = "[dry, measured, unhurried] "
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse"
src = (here / "tools/vo10.py").read_text()
ns = {"__file__": str(here / "tools/vo10.py")}
exec(src.split("v8 = spec(")[0], ns)   # vo10's helpers (tighten, spec, lines, dur), not its run
tighten, spec, lines, dur = ns["tighten"], ns["spec"], ns["lines"], ns["dur"]

v10 = spec(here / "tutorial-v10.script.ts")
v11 = spec(here / "tutorial-v11.script.ts")
old = json.loads((here / "assets/vo10/read.json").read_text())["lines"]
by_words = {}
for lid, ln in lines(v10):
    if lid in old: by_words.setdefault(ln["says"].strip(), lid)
step_of = lambda lid: "b" + lid.replace(".", "_")

if sys.argv[1] == "flow":
    steps, kept = {}, 0
    for lid, ln in lines(v11):
        if ln["says"].strip() in by_words: kept += 1; continue
        steps[step_of(lid)] = {"op": "audio.speech", "model": "fish:drama-3", "in": {"text": DIRECTION + ln["says"], "voice": VOICE}}
        print(f"  {lid}: {ln['says']}")
    out = here / "out/tut/fish/v11"; out.mkdir(parents=True, exist_ok=True)
    (out / "flow.json").write_text(json.dumps({"flow": 1, "steps": steps}, indent=1))
    print(f"{len(steps)} new lines to read, {kept} kept from v10: out/tut/fish/v11/flow.json")
elif sys.argv[1] == "collect":
    takes = {}
    for gen in [Path(g) for g in sys.argv[2].split(",")]:
        for line in (gen / "gen.jsonl").read_text().splitlines():
            j = json.loads(line); takes[j["step"]] = gen / j["files"][0]
    dst_dir = here / "assets/vo11"; dst_dir.mkdir(exist_ok=True)
    read, kept, new = {}, 0, 0
    for lid, ln in lines(v11):
        dst = dst_dir / f"{lid.replace('.', '-')}.wav"
        was = by_words.get(ln["says"].strip())
        if was:
            shutil.copy(here / "assets" / old[was]["file"], dst); kept += 1
            read[lid] = {**old[was], "file": f"vo11/{dst.name}", "from10": was}
        else:
            st = step_of(lid)
            if st not in takes: sys.exit(f"no take for {lid} ({st}): {ln['says']}")
            subprocess.run([FF, "-v", "error", "-y", "-i", str(takes[st]), "-af", TRIM, "-ar", "48000", "-ac", "1", str(dst)], check=True); new += 1; cut = tighten(dst)
            read[lid] = {"file": f"vo11/{dst.name}", "seconds": round(dur(dst), 2), "take": f"v11/{st}", "tightened": cut}
    (dst_dir / "read.json").write_text(json.dumps({"voice": f"fish {VOICE} (A), drama-3", "lines": dict(sorted(read.items()))}, indent=1))
    print(f"{len(read)} lines ({kept} kept from v10, {new} new), {round(sum(v['seconds'] for v in read.values()), 1)} s of voice")
