#!/usr/bin/env python3
"""tools/v6fx.py: v6's drawn pieces that aren't lettering.
  assets/fx/zoom-{0,1,2}.png   crash-zoom lines: white streaks rushing in at the middle, clear there (2160 x 1080)
  assets/fx/duckcard.png       the DUCK? freeze's card: a burst of rays in two pinks round the middle, halftone dots
  assets/fx/cursor.png, grab.png   the app's pointer and its closed hand, drawn plain (white with a navy edge)
  assets/ink/src-crown.png, src-heart.png   shapes for tools/paint.py mask (painted after)
uv run --with pillow --with numpy python -I tools/v6fx.py"""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
rng = np.random.default_rng(7); NAVY = (28, 38, 61, 255)
W, H = 2160, 1080
for k in range(3):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); r = np.random.default_rng(11 + k)
    for i in range(70):
        a = r.uniform(0, 2 * math.pi); r0 = r.uniform(380, 620); r1 = r0 + r.uniform(500, 1300); w = r.uniform(5, 22)
        pts = [(W / 2 + math.cos(a) * rr * 1.25, H / 2 + math.sin(a) * rr) for rr in (r0, r1)]
        # a tapered streak: thin at the inner end, fat outside
        n = np.array([-math.sin(a), math.cos(a)])
        p0, p1 = np.array(pts[0]), np.array(pts[1])
        d.polygon([tuple(p0), tuple(p1 + n * w), tuple(p1 - n * w)], fill=(255, 255, 255, 235))
    im.save(f"assets/fx/zoom-{k}.png")
# the card: 2048 x 1024, rays from a point a little left of the middle (the goose's head sits there)
CW, CH = 2048, 1024; cx, cy = CW * 0.5, CH * 0.5
im = Image.new("RGB", (CW, CH), (200, 18, 106)); d = ImageDraw.Draw(im)
for i in range(24):
    a0 = i / 24 * 2 * math.pi; a1 = a0 + math.pi / 24
    if i % 2: continue
    d.polygon([(cx, cy), (cx + math.cos(a0) * 3000, cy + math.sin(a0) * 3000), (cx + math.cos(a1) * 3000, cy + math.sin(a1) * 3000)], fill=(232, 52, 132))
dots = Image.new("L", (CW, CH), 0); dd = ImageDraw.Draw(dots)
for y in range(0, CH, 28):
    for x in range(0, CW, 28):
        rr = math.hypot(x - cx, y - cy) / 1100 * 9
        if rr > 1.2: dd.ellipse([x + (14 if (y // 28) % 2 else 0) - rr, y - rr, x + (14 if (y // 28) % 2 else 0) + rr, y + rr], fill=255)
im = Image.composite(Image.new("RGB", (CW, CH), (255, 120, 60)), im, dots)
# a soft cream glow in the middle so the white goose sits in light
g = Image.new("L", (CW, CH), 0); ImageDraw.Draw(g).ellipse([cx - 380, cy - 330, cx + 380, cy + 330], fill=150); g = g.filter(ImageFilter.GaussianBlur(120))
im = Image.composite(Image.new("RGB", (CW, CH), (255, 236, 200)), im, g); im.save("assets/fx/duckcard.png")
# the pointer (macOS shape) and the closed hand, 4x size for a crisp 48 px draw
def pointer():
    s = 4; im = Image.new("RGBA", (24 * s, 32 * s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    P = [(1, 1), (1, 23), (6.5, 18), (10, 26), (13.5, 24.5), (10, 17), (17, 17)]
    d.polygon([(x * s, y * s) for x, y in P], fill=(255, 255, 255, 255), outline=NAVY, width=int(1.6 * s)); return im
def hand():
    s = 4; im = Image.new("RGBA", (28 * s, 28 * s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    def rr(x0, y0, x1, y1, r): d.rounded_rectangle([x0 * s, y0 * s, x1 * s, y1 * s], r * s, fill=(255, 255, 255, 255), outline=NAVY, width=int(1.5 * s))
    rr(5, 9, 23, 25, 6)
    for i, x in enumerate((6, 10, 14, 18)): rr(x, 6 + (i % 3 == 0) * 1.5, x + 4.4, 13, 2.2)
    rr(2, 12, 7.5, 18, 2.5); d.rounded_rectangle([6.5 * s, 11 * s, 22 * s, 22 * s], 5 * s, fill=(255, 255, 255, 255)); return im
pointer().save("assets/fx/cursor.png"); hand().save("assets/fx/grab.png")
# a crown: a band, five points each topped with a ball, a jewel row (filled white: tools/paint.py paints it)
im = Image.new("RGBA", (900, 640), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
pts = [(90, 560), (60, 180), (230, 380), (300, 110), (450, 330), (600, 110), (670, 380), (840, 180), (810, 560)]
d.polygon(pts, fill=(255, 255, 255, 255))
for x, y in [(60, 170), (300, 100), (600, 100), (840, 170), (450, 60)]: d.ellipse([x - 42, y - 42, x + 42, y + 42], fill=(255, 255, 255, 255))
d.polygon([(450, 330), (390, 130), (450, 90), (510, 130)], fill=(255, 255, 255, 255))
d.rounded_rectangle([70, 500, 830, 600], 30, fill=(255, 255, 255, 255))
for x in (210, 450, 690): d.ellipse([x - 34, 430, x + 34, 498], fill=(0, 0, 0, 0))
im.save("assets/ink/src-crown.png")
im = Image.new("RGBA", (600, 560), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
d.ellipse([40, 40, 310, 300], fill=(255, 255, 255, 255)); d.ellipse([290, 40, 560, 300], fill=(255, 255, 255, 255)); d.polygon([(52, 220), (548, 220), (300, 520)], fill=(255, 255, 255, 255))
im.save("assets/ink/src-heart.png"); print("v6 fx written")
