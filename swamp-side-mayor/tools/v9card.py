#!/usr/bin/env python3
"""tools/v9card.py: the second freeze's card (v9, the director 11-16: at the second "duck", "the same thing as before but a blue
water themed one"): the first freeze's burst (tools/v6fx.py) in deep blues and aqua, with ripple rings spreading from the
middle, bubbles rising round the edge and a pale glow where the goose's head sits.
  assets/fx/duckcard-water.png   2048 x 1024
uv run --with pillow --with numpy python -I tools/v9card.py"""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
CW, CH = 2048, 1024; cx, cy = CW * 0.5, CH * 0.5
rng = np.random.default_rng(9)
im = Image.new("RGB", (CW, CH), (10, 78, 160)); d = ImageDraw.Draw(im)
for i in range(24):   # the rays, as the first card's
    a0 = i / 24 * 2 * math.pi; a1 = a0 + math.pi / 24
    if i % 2: continue
    d.polygon([(cx, cy), (cx + math.cos(a0) * 3000, cy + math.sin(a0) * 3000), (cx + math.cos(a1) * 3000, cy + math.sin(a1) * 3000)], fill=(28, 128, 206))
dots = Image.new("L", (CW, CH), 0); dd = ImageDraw.Draw(dots)
for y in range(0, CH, 28):
    for x in range(0, CW, 28):
        rr = math.hypot(x - cx, y - cy) / 1100 * 9
        if rr > 1.2: dd.ellipse([x + (14 if (y // 28) % 2 else 0) - rr, y - rr, x + (14 if (y // 28) % 2 else 0) + rr, y + rr], fill=255)
im = Image.composite(Image.new("RGB", (CW, CH), (96, 214, 238)), im, dots)
# ripple rings: wobbly ellipses spreading from the middle, thinner and fainter outward
rings = Image.new("RGBA", (CW, CH), (0, 0, 0, 0)); rd = ImageDraw.Draw(rings)
for k, R in enumerate([300, 430, 580, 750, 940, 1150]):
    pts = []
    for j in range(241):
        a = j / 240 * 2 * math.pi; w = 1 + 0.025 * math.sin(a * 5 + k) + 0.015 * math.sin(a * 11 + 2 * k)
        pts.append((cx + math.cos(a) * R * 1.25 * w, cy + math.sin(a) * R * 0.62 * w))
    rd.line(pts, fill=(225, 248, 255, int(200 - 26 * k)), width=max(4, 16 - 2 * k), joint="curve")
im = Image.alpha_composite(im.convert("RGBA"), rings)
# bubbles round the edge, rising: an outlined disc with a glint
bub = Image.new("RGBA", (CW, CH), (0, 0, 0, 0)); bd = ImageDraw.Draw(bub)
for i in range(46):
    while True:
        x, y = rng.uniform(0, CW), rng.uniform(0, CH)
        if math.hypot((x - cx) / 1.6, y - cy) > 330: break
    r = rng.uniform(10, 46)
    bd.ellipse([x - r, y - r, x + r, y + r], fill=(160, 230, 250, 70), outline=(235, 252, 255, 230), width=max(3, int(r / 7)))
    bd.ellipse([x - r * 0.55, y - r * 0.6, x - r * 0.15, y - r * 0.2], fill=(255, 255, 255, 220))
im = Image.alpha_composite(im, bub).convert("RGB")
# a pale glow in the middle so the white goose sits in light
g = Image.new("L", (CW, CH), 0); ImageDraw.Draw(g).ellipse([cx - 380, cy - 330, cx + 380, cy + 330], fill=150); g = g.filter(ImageFilter.GaussianBlur(120))
im = Image.composite(Image.new("RGB", (CW, CH), (222, 246, 255)), im, g)
im.save("assets/fx/duckcard-water.png"); print("wrote assets/fx/duckcard-water.png")
