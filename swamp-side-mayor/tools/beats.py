#!/usr/bin/env python3
"""The tutorial's beats with their times, made from tutorial-v11.script.ts (the lines live there only), for the previz and
the shots: components/tut/beats.json, one entry a beat: its id (chapter.beat), start and seconds, what's on screen,
the camera, and each line with where it starts in the beat and its take (assets/vo10/read.json, LEAD_IN in and BETWEEN
between lines; an estimate at 2.5 words a second for a line not yet read).

python3 -I tools/beats.py        writes components/tut/beats.json and prints one line a beat
"""
import json, subprocess
from pathlib import Path

here = Path(__file__).resolve().parent.parent
spec = subprocess.run(["raea", "spec", "tutorial-v11.script.ts"], cwd=here, capture_output=True, text=True, check=True)
script = json.loads(spec.stdout.strip().splitlines()[0])
# the read, when it's made (tools/vo_collect.py): each line's take and its real length; the approved opening keeps the
# starts the director signed a feed post, out/tut/fish/drama3/cues.json), each from its beat's start
readp = here / "assets/vo11/read.json"   # v11 (11-17): v10's takes and the rail's new line (tools/vo11.py); v10 (11-16): v9's takes with their pauses tightened, and the new lines (tools/vo10.py)
READ = json.loads(readp.read_text())["lines"] if readp.exists() else {}
# v10 a note, "the whole VO ... doesn't feel like it was timed well"). In v9 every line started 0.15 s after its cut,
# before the picture had landed, and ran on into the next a flat 1.05 s later, chapter or not; the takes' own pauses
# were as long. Now the picture leads: a line starts LEAD_IN after its beat's cut; lines in one beat are BETWEEN apart;
# a beat ends TAIL after its voice, a chapter's last beat BREATH later still; and the pauses inside a take are
# tightened (tools/vo10.py), so a pause inside a line < between lines < between beats < between chapters.
LEAD_IN, BETWEEN, TAIL, BREATH = 0.5, 0.55, 0.7, 0.5
# the cold open's first line waits for the monitor's power-on; the second goes on in the same shot
LEAD = {"00.01": 0.9, "00.02": 0.3}
# a longer pause before a line, where a gag plays between two lines: 03.04, the held beat on /goal honk before "'Honk' is
# not a condition" a note; 09.03, the frog hops off before "Reviews were mixed."
GAP = {"03.04.2": 1.6, "09.03.2": 2.0}
# what the picture does after the voice, held past TAIL: the window opening out of the Dock (01.01); the click on a
# project (01.03); Claude's sign-in opening (02.03); Goose's honk, heard over "/goal honk" (03.04); the card growing
# (04.03); Goose's honk back to the lens (04.04); the pin and the note (05.02); v3 landing on the card (05.05); v2 picked,
# then Goose's feathered flap (05.06); the song coming up (11.01)
HOLD = {"01.01": 0.8, "01.03": 1.1, "02.03": 0.3, "03.04": 1.1, "04.03": 0.6, "04.04": 1.0, "05.02": 0.5, "05.05": 1.5, "05.06": 2.4, "11.01": 0.3}
beats, t = [], 0.0
for scene in script["scenes"]:
    ch = scene["heading"].split(" ")[0]
    for k, b in enumerate(scene["beats"]):
        bid = f"{ch}.{k + 1:02d}"
        at, lines = LEAD.get(bid, LEAD_IN), []
        last = k == len(scene["beats"]) - 1
        for i, ln in enumerate(b.get("lines", [])):
            take = READ.get(f"{bid}.{i + 1}")
            d = take["seconds"] if take else len(ln["says"].split()) / 2.5 + 0.2
            lines.append({"says": ln["says"], "how": ln.get("how"), "at": round(at, 2), "seconds": round(d, 2), "file": take["file"] if take else None})
            at += d + GAP.get(f"{bid}.{i + 2}", BETWEEN)
        end = at - GAP.get(f"{bid}.{len(lines) + 1}", BETWEEN) if lines else 0
        secs = round(end + TAIL + HOLD.get(bid, 0) + (BREATH if last else 0), 2) if lines else b["seconds"]
        beats.append({"id": bid, "chapter": ch, "heading": scene["heading"], "start": round(t, 2), "seconds": secs,
                      "onScreen": b.get("onScreen", ""), "camera": b.get("camera", ""), "cut": b.get("cut"), "cues": b.get("cues", []), "lines": lines})
        t += secs
(here / "components/tut/beats.json").write_text(json.dumps({"seconds": round(t, 2), "beats": beats}, indent=1))
for b in beats:
    print(f'{b["id"]} {b["start"]:6.1f} {b["seconds"]:4.1f}s | {b["onScreen"][:120]} || {b["camera"][:70]}')
print(f"{len(beats)} beats, {t:.1f} s")
