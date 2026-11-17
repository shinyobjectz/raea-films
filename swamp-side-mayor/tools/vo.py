#!/usr/bin/env python3
"""The tutorial's read sheet and timing, made from tutorial.script.ts (the lines live there only).

python3 -I tools/vo.py            writes tutorial/vo.md and prints each chapter's seconds, words and pace
Pace is the words a second the narrator must hold to fit a chapter's seconds: about 2.5 (150 a minute) is a plain read;
over 2.7 is a rush. The gags' silent beats count toward the seconds, so a chapter with gags needs room left over.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

here = Path(__file__).resolve().parent.parent
spec = subprocess.run(["raea", "spec", "tutorial.script.ts"], cwd=here, capture_output=True, text=True, check=True)
script = json.loads(spec.stdout.strip().splitlines()[0])

out = ["# Goose Learns raea: VO read sheet", "",
       "Made from tutorial.script.ts by tools/vo.py; change the lines there. One narrator, dry and measured. Record a",
       "chapter as one take with a two-second pause between lines, or one file a line named by its ID (03-05.wav).", ""]
total_s = total_w = 0.0
rows = []
for scene in script["scenes"]:
    num = scene["heading"].split(" ")[0]
    secs = sum(b["seconds"] or 0 for b in scene["beats"])
    out += [f"## {scene['heading']}", ""]
    n = 0
    words = 0
    for beat in scene["beats"]:
        for line in beat["lines"]:
            n += 1
            w = len(re.findall(r"[A-Za-z0-9'’-]+", line["says"]))
            words += w
            how = f" *({line['how']})*" if line.get("how") else ""
            out.append(f"**{num}.{n:02d}**{how} {line['says']}")
            out.append("")
    total_s += secs
    total_w += words
    rows.append((scene["heading"], secs, words))

(here / "tutorial").mkdir(exist_ok=True)
(here / "tutorial" / "vo.md").write_text("\n".join(out))
clock = 0.0
for heading, secs, words in rows:
    print(f"{int(clock // 60)}:{clock % 60:04.1f}  {secs:5.1f} s  {words:3d} words  {words / secs:4.2f} w/s  {heading}")
    clock += secs
print(f"total {int(total_s // 60)}:{total_s % 60:04.1f} ({total_s:.1f} s), {int(total_w)} words, {total_w / total_s:.2f} w/s overall")
sys.exit(0)
