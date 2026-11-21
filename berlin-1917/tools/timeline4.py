# Berlin long cut v4: the film's timeline from the voice's lengths (assets/rebuilt/vo4/dur.json). One source for the
# composition (it imports timeline.json) and the score's arrangement (arrange4.py).
import json
G = __import__('pathlib').Path(__file__).resolve().parent.parent.as_posix()
D = json.load(open(f"{G}/assets/rebuilt/vo4/dur.json"))
SHOW = 50.48
# scene: id, lines, lead, gaps after each line but the last (list or one value), tail
S = [
    ("photo", ["v01", "v02", "v03", "v04", "v05"], 2.2, [1.2, 1.1, 1.4, 2.8], 5.0),   # the flash, the plate; title after
    ("map", ["v06", "v07", "v08"], 0.8, [0.9, 0.9], 0.6),
    ("house", ["v09", "v10", "v11"], 0.4, [1.0, 2.0], 3.0),                        # the stair, then a chapter break
    ("book", ["v12", "v13"], 0.8, [1.2], 0.6),
    ("rooms", ["v14", "v15", "v16", "v17"], 0.5, [1.0, 1.2, 1.0], 2.6),
    ("under", ["v18", "v19", "v20", "v21"], 0.8, [1.0, 1.2, 1.0], 2.0),
    ("winter", ["v22", "v23", "v24", "v25"], 0.6, [1.2, 5.0, 1.6], 2.4),            # 5.0: up the stair, no voice
]
out, at = [], SHOW
for sid, lines, lead, gaps, tail in S:
    g = gaps if isinstance(gaps, list) else [gaps] * (len(lines) - 1)
    k, L = lead, []
    for i, l in enumerate(lines):
        L.append(round(k, 3)); k += D[l] + (g[i] if i < len(lines) - 1 else 0)
    ln = k + tail
    out.append({"id": sid, "start": round(at, 3), "len": round(ln, 3), "lines": lines, "L": L})
    at += ln
END_START = at
# the ending is the song's low section (117.98-140.66): v26 starts 1.6 s before it, so it ends before the vocals
# return at song 131.4 ("When the morning bell rings through"); the coda is the last chorus (140.66-158.04)
LOW, CODA = 140.66 - 117.98, 158.04 - 140.66 - 0.0
out.append({"id": "end", "start": round(END_START, 3), "len": round(LOW, 3), "lines": ["v26"], "L": [-1.6]})
out.append({"id": "open", "start": round(END_START + LOW, 3), "len": round(CODA, 3), "lines": ["v27"], "L": [0.4]})
total = END_START + LOW + CODA
assert D["v26"] - 1.6 < 131.4 - 117.98 - 0.2, D["v26"]
json.dump({"show": SHOW, "end_start": round(END_START, 3), "total": round(total, 3), "scenes": out}, open(f"{G}/assets/rebuilt/vo4/timeline.json", "w"), indent=1)
for s in out: print(s["id"], s["start"], s["len"])
print("end_start", round(END_START, 2), "total", round(total, 2), f"{int(total // 60)}:{total % 60:04.1f}")
