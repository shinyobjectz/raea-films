#!/usr/bin/env python3
"""The tutorial's captions and chapter marks, from components/tut/beats.json (the lines, placed as the soundtrack
places them), so they follow every retiming:

  out/tut/goose-learns-raea.srt       one cue a sentence or two, at most two lines of 42 characters
  out/tut/chapters.txt                YouTube's chapter list (0:00 Cold open, ...), for the description
  out/tut/chapters.ffmeta             the same marks as MP4 chapters, for ffmpeg's -i FILE -map_metadata
  out/tut/narration.words.json        the narrator's words on the film's clock ({w, t0, t1}, each line's words spread
                                      over it by their letters), for raea check --words

python3 -I tools/tutsrt.py
"""
import json, re, textwrap
from pathlib import Path

here = Path(__file__).resolve().parent.parent
B = json.loads((here / "components/tut/beats.json").read_text())
out = here / "out/tut"; out.mkdir(parents=True, exist_ok=True)

def ts(s: float, sep=","):
    ms = round(s * 1000); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{sec:02d}{sep}{ms:03d}"

cues = []
for b in B["beats"]:
    for ln in b["lines"]:
        t0, d, text = b["start"] + ln["at"], ln["seconds"], ln["says"]
        # a line too long for two caption lines is cut at its sentences, then at a comma or colon nearest the middle,
        # each piece timed by its share of the letters
        def fits(p): return len(textwrap.wrap(p, 42)) <= 2
        def cut(p):
            if fits(p): return [p]
            marks = [m.end() for m in re.finditer(r"[.?!—]\s+", p)] or [m.end() for m in re.finditer(r"[,:;]\s+", p)] or [m.end() for m in re.finditer(r"\s+", p)]
            k = min(marks, key=lambda m: abs(m - len(p) / 2))
            return cut(p[:k].strip()) + cut(p[k:].strip())
        parts = cut(text)
        total, at = sum(len(p) for p in parts), t0
        for p in parts:
            dur = d * len(p) / total
            cues.append((at, at + dur, "\n".join(textwrap.wrap(p, 42))))
            at += dur
srt = "\n".join(f"{i}\n{ts(a)} --> {ts(min(e, cues[i][0] - 0.04) if i < len(cues) else e)}\n{t}\n" for i, (a, e, t) in enumerate(cues, 1))
(out / "goose-learns-raea.srt").write_text(srt)

# the chapters: each heading's name before its stage direction ("03 · Start the project. THE CHAT" -> Start the project)
chapters, seen = [], set()
for b in B["beats"]:
    if b["chapter"] in seen: continue
    seen.add(b["chapter"])
    name = b["heading"].split("·", 1)[1].strip().split(". ")[0].rstrip(".")
    chapters.append((b["start"], name))
mmss = lambda s: f"{int(s // 60)}:{int(s % 60):02d}"
(out / "chapters.txt").write_text("\n".join(f"{mmss(0 if i == 0 else s)} {n}" for i, (s, n) in enumerate(chapters)) + "\n")
meta = [";FFMETADATA1"]
for i, (s, n) in enumerate(chapters):
    e = chapters[i + 1][0] if i + 1 < len(chapters) else B["seconds"]
    meta += ["[CHAPTER]", "TIMEBASE=1/1000", f"START={round(s * 1000)}", f"END={round(e * 1000)}", f"title={n}"]
(out / "chapters.ffmeta").write_text("\n".join(meta) + "\n")
# the narration's words, for the sound check (where the voice is, so it can say what's louder than it)
words = []
for b in B["beats"]:
    for ln in b["lines"]:
        ws, t = ln["says"].split(), b["start"] + ln["at"]
        total = sum(len(w) + 1 for w in ws)
        for w in ws:
            d = ln["seconds"] * (len(w) + 1) / total
            words.append({"w": w, "t0": round(t, 3), "t1": round(t + d, 3)}); t += d
(out / "narration.words.json").write_text(json.dumps(words, indent=0))
print(len(cues), "cues;", len(chapters), "chapters;", len(words), "words")
print((out / "chapters.txt").read_text())
