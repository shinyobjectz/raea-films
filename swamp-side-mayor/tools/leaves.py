# tools/leaves.py: the foliage cards' pictures, ours, drawn white (the tree's colour is its material times its vertex
# colour) with a little value change from leaf to leaf, cut out with alpha:
#   assets/glb/willow-card.png: six hanging willow strands of narrow leaves, ragged at the bottom
#   assets/glb/leaf-clump.png: a round clump of broad leaves pointing outward
# run: uv run -q --with pillow --with numpy python tools/leaves.py
import math, random
from PIL import Image, ImageDraw, ImageFilter
def leaf(d, x, y, ang, L, w, v):
    ca, sa = math.cos(ang), math.sin(ang); pts = []
    for i in range(13):
        t = i / 12; half = w * math.sin(math.pi * t) ** 0.8
        pts.append((t * L, half))
    pts += [(t * L, -h) for (t, h) in [(p[0] / L, p[1]) for p in reversed(pts)]]
    d.polygon([(x + px * ca - py * sa, y + px * sa + py * ca) for px, py in pts], fill=(v, v, v, 255))
random.seed(5)
# willow: strands hang from the top; leaves sit along each at a shallow angle, alternating sides
W, H = 512, 2048; S = 2; im = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
for k in range(7):
    x = (40 + k * (W - 80) / 6 + random.uniform(-25, 25)) * S; top = random.uniform(0, 520) * S; end = H * S * random.uniform(0.62, 0.98)
    y = top; sway = random.uniform(-1, 1)
    d.line([(x, top), (x + sway * 30 * S, end)], fill=(205, 205, 205, 255), width=3 * S)
    side = 1
    while y < end:
        u = (y - top) / max(1, end - top); cx = x + sway * 30 * S * u
        L = random.uniform(70, 110) * S * (1 - 0.35 * u); w = random.uniform(9, 13) * S * (1 - 0.3 * u)
        ang = math.pi / 2 - side * random.uniform(0.28, 0.5)
        leaf(d, cx, y, ang, L, w, random.randint(212, 255)); side = -side; y += random.uniform(16, 26) * S
im = im.resize((W, H), Image.LANCZOS); im.save("assets/glb/willow-card.png")
# broadleaf clump: leaves from near the middle outward, the outer ones over the inner, lighter toward the top-left
W = 512; S = 2; im = Image.new("RGBA", (W * S, W * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = W * S / 2
leaves = []
for i in range(170):
    a = random.uniform(0, math.tau); r = W * S * 0.34 * math.sqrt(random.random())
    leaves.append((r, a))
for r, a in sorted(leaves):
    ang = a + random.uniform(-0.6, 0.6); L = random.uniform(62, 92) * S; w = random.uniform(20, 28) * S
    x, y = c + math.cos(a) * r - math.cos(ang) * L * 0.45, c + math.sin(a) * r - math.sin(ang) * L * 0.45
    lit = 0.5 + 0.5 * (-(math.cos(a) + math.sin(a)) / 1.414) * (r / (W * S * 0.3))
    leaf(d, x, y, ang, L, w, int(200 + 55 * min(1, max(0, lit + random.uniform(-0.25, 0.25)))))
im = im.resize((W, W), Image.LANCZOS); im.save("assets/glb/leaf-clump.png")
print("cards")
# tinted atlases: each card picks a column (willow) or quadrant (leaves), so the colour is in the picture itself
import numpy as np
def tint(img, top, bottom=None):
    a = np.asarray(img).astype(float) / 255; h = a.shape[0]
    t = np.linspace(0, 1, h)[:, None, None]; c0 = np.array(top)[None, None] / 255; c1 = np.array(bottom if bottom else top)[None, None] / 255
    col = (c0 * (1 - t) + c1 * t) * a[..., :1]
    return Image.fromarray((np.dstack([col, a[..., 3:]]) * 255).clip(0, 255).astype(np.uint8))
hx = lambda h: [int(h[i:i + 2], 16) for i in (1, 3, 5)]
wc = Image.open("assets/glb/willow-card.png").resize((256, 1024), Image.LANCZOS); at = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
for k, (a, b) in enumerate([("#86bd4c", "#c4dc72"), ("#93c653", "#cfe27a"), ("#a0cc56", "#d6e57e"), ("#7cb447", "#b9d56a")]):
    at.paste(tint(wc, hx(a), hx(b)), (k * 256, 0))
at.save("assets/glb/willow-atlas.png")
lc = Image.open("assets/glb/leaf-clump.png"); at = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
for k, c in enumerate(["#58a042", "#66ab47", "#76b84f", "#86c257"]):
    at.paste(tint(lc, hx(c)), ((k % 2) * 512, (k // 2) * 512))
at.save("assets/glb/leaf-atlas.png"); print("atlases")
