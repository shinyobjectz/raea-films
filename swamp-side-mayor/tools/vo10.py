#!/usr/bin/env python3
"""v10's read (tutorial-v10.script.ts, after the director's notes on v9, a feed post: a line whose words are unchanged
from v9 keeps its v9 take (assets/vo9/); a new line is read on Fish, voice A on drama-3, with the narrator's direction.
Every take then has its pauses tightened a note, "the whole VO ... doesn't feel like it was timed well": in v9 a
sentence's pause inside a line ran 0.8 to 1 s, as long as the breath between lines, so nothing marked a new thought):
a pause of 0.7 s or more inside a line becomes 0.5 s, one of 0.4 to 0.7 s becomes 0.32 s; the cut is from the middle of
the silence, crossfaded.

python3 -I tools/vo10.py flow             writes out/tut/fish/v10/flow.json with a step for each new line, and lists them
python3 -I tools/vo10.py collect DIR[,DIR] files the takes as assets/vo10/NN-MM-K.wav with assets/vo10/read.json, which
                                         tools/beats.py reads (raea gen's output folders; a later folder's take wins)
"""
import json, re, shutil, subprocess, sys
import numpy as np, soundfile as sf
from pathlib import Path

here = Path(__file__).resolve().parent.parent
FF = "/opt/homebrew/bin/ffmpeg"
VOICE = "4ded85577e3243dcae310903d0ae75cc"
DIRECTION = "[dry, measured, unhurried] "
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse"

def tighten(f):
    """shorten the pauses inside a take (see above); returns how much it took out"""
    err = subprocess.run([FF, "-i", str(f), "-af", "silencedetect=noise=-34dB:d=0.3", "-f", "null", "-"], capture_output=True, text=True).stderr
    y, sr = sf.read(str(f)); n = len(y)
    s0 = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]; e0 = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    cuts = []
    for a, b in zip(s0, e0):
        if a < 0.05 or b > n / sr - 0.05: continue
        L = b - a; target = 0.5 if L >= 0.7 else 0.32 if L >= 0.4 else L
        if L - target > 0.02: m = (a + b) / 2; cuts.append((m - (L - target) / 2, m + (L - target) / 2))
    X = int(0.015 * sr)
    for a, b in sorted(cuts, reverse=True):
        i, j = int(a * sr), int(b * sr)
        fade = np.linspace(1, 0, X)
        mid = y[i - X:i] * fade + y[j - X:j] * (1 - fade)
        y = np.concatenate([y[:i - X], mid, y[j:]])
    sf.write(str(f), y, sr, subtype="PCM_24")
    return round(sum(b - a for a, b in cuts), 2)

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

v8 = spec(here / "tutorial-v9.script.ts")
v9 = spec(here / "tutorial-v10.script.ts")
old = json.loads((here / "assets/vo9/read.json").read_text())["lines"]
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
    out = here / "out/tut/fish/v10"; out.mkdir(parents=True, exist_ok=True)
    (out / "flow.json").write_text(json.dumps({"flow": 1, "steps": steps}, indent=1))
    print(f"{len(steps)} new lines to read, {kept} kept from v9: out/tut/fish/v10/flow.json")
elif sys.argv[1] == "collect":
    takes = {}
    for gen in [Path(g) for g in sys.argv[2].split(",")]:
        for line in (gen / "gen.jsonl").read_text().splitlines():
            j = json.loads(line); takes[j["step"]] = gen / j["files"][0]
    dst_dir = here / "assets/vo10"; dst_dir.mkdir(exist_ok=True)
    read, kept, new = {}, 0, 0
    for lid, ln in lines(v9):
        dst = dst_dir / f"{lid.replace('.', '-')}.wav"
        src = by_words.get(ln["says"].strip())
        if src:
            shutil.copy(here / "assets" / old[src]["file"], dst); kept += 1; cut = tighten(dst)
            read[lid] = {"file": f"vo10/{dst.name}", "seconds": round(dur(dst), 2), "take": old[src]["take"], "from": src, "tightened": cut}
        else:
            st = step_of(lid)
            if st not in takes: sys.exit(f"no take for {lid} ({st}): {ln['says']}")
            subprocess.run([FF, "-v", "error", "-y", "-i", str(takes[st]), "-af", TRIM, "-ar", "48000", "-ac", "1", str(dst)], check=True); new += 1; cut = tighten(dst)
            read[lid] = {"file": f"vo10/{dst.name}", "seconds": round(dur(dst), 2), "take": f"v10/{st}", "tightened": cut}
    (dst_dir / "read.json").write_text(json.dumps({"voice": f"fish {VOICE} (A), drama-3", "lines": dict(sorted(read.items()))}, indent=1))
    print(f"{len(read)} lines ({kept} kept from v9, {new} new), {round(sum(v['seconds'] for v in read.values()), 1)} s of voice")
