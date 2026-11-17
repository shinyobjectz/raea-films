#!/usr/bin/env python3
"""The v7 read (tutorial.script.ts after the director's notes on a feed post, 11-16), filed by v7's beats: a line whose
words and direction are unchanged from v6 keeps its approved take (assets/vo/, by matching the text against v6's
script, git's HEAD:tutorial.script.ts or the path given); a new line takes its Fish take from raea gen's output folder,
trimmed of the silence around it. Written to assets/vo7/NN-MM-K.wav with assets/vo7/read.json, which tools/beats.py
reads; v6's assets/vo/ is left as it was.

python3 -I tools/vo7_collect.py GEN_OUT_DIR[,RETAKE_DIR...] [V6_SCRIPT.ts]
(several output folders, comma-separated: a later folder's take of a line wins, for retakes)
"""
import json, shutil, subprocess, sys
from pathlib import Path

here = Path(__file__).resolve().parent.parent
gens = [Path(g) for g in sys.argv[1].split(",")]
FF = "/opt/homebrew/bin/ffmpeg"
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse"
def dur(f):
    out = subprocess.run([FF, "-i", str(f), "-f", "null", "-"], capture_output=True, text=True).stderr
    t = [l for l in out.splitlines() if "time=" in l][-1].split("time=")[1].split()[0]
    h, m, s = t.split(":"); return int(h) * 3600 + int(m) * 60 + float(s)
def spec(path):
    return json.loads(subprocess.run(["raea", "spec", str(path)], cwd=here, capture_output=True, text=True, check=True).stdout.strip().splitlines()[0])
def lines(sc):
    for scene in sc["scenes"]:
        ch = scene["heading"].split(" ")[0]
        for k, b in enumerate(scene["beats"]):
            for i, ln in enumerate(b.get("lines", [])):
                yield f"{ch}.{k + 1:02d}.{i + 1}", ln
v6path = Path(sys.argv[2]) if len(sys.argv) > 2 else None
if v6path is None:
    v6path = Path("/tmp/tutorial.script.v6.ts")
v6 = spec(v6path)
v7 = spec(here / "tutorial.script.ts")
old = json.loads((here / "assets/vo/read.json").read_text())["lines"]
by_text = {(ln["says"], ln.get("how")): lid for lid, ln in lines(v6)}
takes = {}
for gen in gens:
    for line in (gen / "gen.jsonl").read_text().splitlines():
        j = json.loads(line); takes[j["step"]] = gen / j["files"][0]
out = here / "assets/vo7"; out.mkdir(exist_ok=True)
read, kept, new = {}, 0, 0
for lid, ln in lines(v7):
    dst = out / f"{lid.replace('.', '-')}.wav"
    src = by_text.get((ln["says"], ln.get("how")))
    if src and src in old:
        shutil.copy(here / "assets" / old[src]["file"], dst); kept += 1
        read[lid] = {"file": f"vo7/{dst.name}", "seconds": old[src]["seconds"], "take": old[src]["take"], "from": src}
    else:
        step = "b" + lid.replace(".", "_")
        if step not in takes: sys.exit(f"no take for {lid} ({step}): {ln['says']}")
        subprocess.run([FF, "-v", "error", "-y", "-i", str(takes[step]), "-af", TRIM, "-ar", "48000", "-ac", "1", str(dst)], check=True); new += 1
        read[lid] = {"file": f"vo7/{dst.name}", "seconds": round(dur(dst), 2), "take": f"{takes[step].parent.parent.name}/{step}"}
(out / "read.json").write_text(json.dumps({"voice": "fish 4ded85577e3243dcae310903d0ae75cc (A), drama-3", "lines": dict(sorted(read.items()))}, indent=1))
print(f"{len(read)} lines ({kept} kept from v6, {new} new), {round(sum(v['seconds'] for v in read.values()), 1)} s of voice")
