#!/usr/bin/env python3
"""Where each word falls in v10's read, so the shots can cue on words (a logo lit on its name, an outline on the control
a line names): components/tut/words.json, {line id: [[word, t0, t1], ...]}, seconds from the line's own start.

No transcriber is on this machine, so it aligns by the take itself: the line is cut into phrases at its punctuation
(, . : ; ? !), the take into voiced runs at its pauses (ffmpeg silencedetect), and when they agree each phrase gets its
run; the words in a phrase share it by their letters. A line whose pauses don't match its punctuation falls back to the
pauses that are longest, one per break, and then to letters over the whole take.

python3 -I tools/words10.py
"""
import json, re, subprocess
from pathlib import Path

here = Path(__file__).resolve().parent.parent
FF = "/opt/homebrew/bin/ffmpeg"
READ = json.loads((here / "assets/vo10/read.json").read_text())["lines"]

def pauses(f: Path, db=-34, least=0.09):
    err = subprocess.run([FF, "-i", str(f), "-af", f"silencedetect=noise={db}dB:d={least}", "-f", "null", "-"], capture_output=True, text=True).stderr
    s = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    e = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    return list(zip(s, e))

def spread(words, t0, t1):
    n = sum(len(re.sub(r"\W", "", w)) + 1 for w in words) or 1
    out, at = [], t0
    for w in words:
        d = (t1 - t0) * (len(re.sub(r"\W", "", w)) + 1) / n
        out.append([w, round(at, 3), round(at + d, 3)]); at += d
    return out

def align(text, f, seconds):
    phrases = [p.split() for p in re.split(r"(?<=[,.:;?!])\s+", text.strip()) if p.split()]
    gaps = [(a, b) for a, b in pauses(f) if a > 0.05 and b < seconds - 0.05]   # inside the take
    need = len(phrases) - 1
    if need and len(gaps) >= need:
        if len(gaps) > need:   # the longest pauses are the punctuation's; the rest are breaths inside a phrase
            gaps = sorted(sorted(gaps, key=lambda g: g[1] - g[0], reverse=True)[:need])
        bounds = [0.0] + [x for g in gaps for x in g] + [seconds]
        out = []
        for i, p in enumerate(phrases): out += spread(p, bounds[2 * i], bounds[2 * i + 1])
        return out, "pauses"
    return spread([w for p in phrases for w in p], 0.0, seconds), "letters"

spec = json.loads(subprocess.run(["raea", "spec", "tutorial-v10.script.ts"], cwd=here, capture_output=True, text=True, check=True).stdout.splitlines()[0])
out, how = {}, {}
for scene in spec["scenes"]:
    ch = scene["heading"].split(" ")[0]
    for k, b in enumerate(scene["beats"]):
        for i, ln in enumerate(b.get("lines", [])):
            lid = f"{ch}.{k + 1:02d}.{i + 1}"
            r = READ[lid]
            out[lid], how[lid] = align(ln["says"], here / "assets" / r["file"], r["seconds"])
(here / "components/tut/words.json").write_text(json.dumps(out, separators=(",", ":")))
print(f"{len(out)} lines: {sum(v == 'pauses' for v in how.values())} by their pauses, the rest by letters: " + ", ".join(k for k, v in how.items() if v == "letters"))
