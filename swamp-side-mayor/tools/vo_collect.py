#!/usr/bin/env python3
"""The narrator's read, filed by beat: each Fish take (raea gen's output folder, its gen.jsonl) trimmed of the silence
around it and written as assets/vo/NN-MM-K.wav (chapter, beat, line), with the approved opening (out/tut/fish/drama3,
The director's OK on a feed post for its lines; assets/vo/read.json holds each line's file and seconds, which
tools/beats.py uses to place the lines in their beats.

python3 -I tools/vo_collect.py GEN_OUT_DIR
"""
import json, subprocess, sys
from pathlib import Path

here = Path(__file__).resolve().parent.parent
gen = Path(sys.argv[1])
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse"
dur = lambda f: float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)]).decode())
out = here / "assets/vo"; out.mkdir(exist_ok=True)
read = {}
takes = {}
for line in (gen / "gen.jsonl").read_text().splitlines():
    j = json.loads(line); takes[j["step"]] = gen / j["files"][0]   # a later take of a step (a retake, NAMEv2) wins
for step, f in sorted(takes.items()):
    base = step.removesuffix("v2")
    if base != step or base + "v2" not in takes:
        ch, beat, k = base[1:].split("_")
        dst = out / f"{ch}-{beat}-{k}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-af", TRIM, "-ar", "48000", "-ac", "1", str(dst)], check=True)
        read[f"{ch}.{beat}.{k}"] = {"file": f"vo/{dst.name}", "seconds": round(dur(dst), 2), "take": step}
# the approved opening, as the director signed it
for key, name in {"00.01.1": "l1", "00.02.1": "l2", "00.03.1": "l3", "00.04.1": "l4d", "00.05.1": "l5b", "01.04.1": "l6"}.items():
    src = here / "out/tut/fish/drama3" / f"{name}.wav"
    dst = out / f"{key.replace('.', '-')}.wav"
    subprocess.run(["cp", str(src), str(dst)], check=True)
    read[key] = {"file": f"vo/{dst.name}", "seconds": round(dur(dst), 2), "take": f"drama3/{name}"}
(out / "read.json").write_text(json.dumps({"voice": "fish 4ded85577e3243dcae310903d0ae75cc (A), drama-3", "lines": dict(sorted(read.items()))}, indent=1))
print(len(read), "lines,", round(sum(v["seconds"] for v in read.values()), 1), "s of voice")
