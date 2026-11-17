#!/usr/bin/env python3
"""Write components/app-states.ts from the app take: each keyed state's picture, its magenta media boxes
(assets/app-take/media.json), the pointer (states.json) and, in the compare view, where the wipe's divider stands
(the white column across the picture, found in the state's own PNG).

  /tmp/ivyenv/bin/python -I scripts/app_states.py     (after scripts/key_states.sh)
"""
import json, os
import numpy as np
from PIL import Image

PROJ = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
TAKE = os.path.join(PROJ, "assets", "app-take")
states = json.load(open(os.path.join(TAKE, "states.json")))
media = json.load(open(os.path.join(TAKE, "media.json")))


def wipe_x(name):
    u = json.load(open(os.path.join(TAKE, "ui", name + ".json")))
    w = next((n for n in u["nodes"] if n["id"] == "wipe"), None)
    if not w:
        return None
    r = w["rect"]
    img = np.asarray(Image.open(os.path.join(TAKE, "states", name + ".png")).convert("RGB")).astype(int)
    y = int(r["y"] + r["h"] * 0.25)
    xs = [x for x in range(int(r["x"]) + 2, int(r["x"] + r["w"]) - 2) if (img[y, x] > 200).all()]
    return round(float(np.mean(xs)), 1) if xs else None


lines = [
    "// The captured states of the real app (assets/app-take), keyed: each state's picture with its flat magenta media cut out,",
    "// where that media was (so the film's own picture shows there), where the pointer was and, comparing two versions, where",
    "// the wipe's divider stands. Written by scripts/app_states.py after scripts/key_states.sh; do not edit by hand.",
]
rows = []
for i, s in enumerate(states):
    name = os.path.splitext(os.path.basename(s["file"]))[0]
    lines.append(f'import s{i} from "../assets/app-take/keyed/{name}.png";')
    boxes = media.get(name, [])
    wx = wipe_x(name)
    extra = f", wipe: {wx}" if wx is not None else ""
    p = s["pointer"]
    rows.append(f'  "{name}": {{ src: s{i}, media: {json.dumps(boxes)}, pointer: [{round(p["x"])}, {round(p["y"])}]{extra} }},')
lines.append("")
lines.append("export type AppState = { src: string; media: [number, number, number, number][]; pointer: [number, number]; /** comparing: the divider's x, v1 to its left, v2 to its right */ wipe?: number };")
lines.append("export const STATES: Record<string, AppState> = {")
lines += rows
lines.append("};")
open(os.path.join(PROJ, "components", "app-states.ts"), "w").write("\n".join(lines) + "\n")
print(len(rows), "states;", sum("wipe:" in r for r in rows), "comparing")
for r in rows:
    if "wipe:" in r:
        print(r[:40], r[r.index("wipe:"):])
