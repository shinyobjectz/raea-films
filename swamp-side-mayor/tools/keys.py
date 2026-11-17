#!/usr/bin/env python3
"""tools/keys.py: the keycap legends alone (tools/fx.py keys block), from assets/fx/keys.json in plan.ts KEYS order. uv run --with pillow python -I tools/keys.py assets/fx"""
import sys; from PIL import Image, ImageDraw
out = sys.argv[1]; NAVY = (28, 38, 61, 255)
from PIL import ImageFont
import os, json
LBL = json.load(open(f"{out}/keys.json")); C = 256
big = ImageFont.truetype(os.path.join(os.path.dirname(out), "fonts", "LilitaOne-Regular.ttf"), 150)
small = ImageFont.truetype(os.path.join(os.path.dirname(out), "fonts", "LilitaOne-Regular.ttf"), 92)
im = Image.new("RGBA", (8 * C, 8 * C), (0, 0, 0, 0))
for i, (label, w) in enumerate(LBL):
    cell = Image.new("RGBA", (int(C * w), C), (0, 0, 0, 0)); d = ImageDraw.Draw(cell); cx = cell.size[0] / 2
    if len(label) == 1: d.text((cx, C / 2 + 6), label, font=big, fill=NAVY, anchor="mm")
    elif label: d.text((cx, C / 2 + 4), label, font=small, fill=NAVY, anchor="mm")
    if label == "enter": d.line([(cx + 150, C / 2 - 70), (cx + 150, C / 2 - 30), (cx + 110, C / 2 - 30)], fill=NAVY, width=12); d.polygon([(cx + 92, C / 2 - 30), (cx + 114, C / 2 - 46), (cx + 114, C / 2 - 14)], fill=NAVY)
    im.paste(cell.resize((C, C), Image.LANCZOS), ((i % 8) * C, (i // 8) * C))
im.save(f"{out}/keys.png"); print("keys written")
