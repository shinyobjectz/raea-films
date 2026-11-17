# tools/fx.py: the film's drawn effects, all ours, as flat pictures the film lays in the world (assets/fx):
#   ripple.png  4x4 sheet: rings on the water spreading from a point, two white lines with a deeper blue under each,
#               breaking into dashes and thinning as they go (the anime pond: a ring per paddle, a ring per drop)
#   splash.png  4x4 sheet: a crown splash, white with the goose's navy line and a pale blue shade side
#   sigil.png   the summoning circle drawn on the mud: rings, a seven-point star, a band of our own runes, the goose's
#               own foot in the middle; gold lines on a soft glow
#   rune-K.png  six columns of runes for the stones' faces, the same hand
# run: uv run -q --with pillow --with numpy --with scipy python tools/fx.py OUT_DIR
import sys, math, numpy as np
from PIL import Image, ImageDraw, ImageFilter
out = sys.argv[1]; rng = np.random.default_rng(5)
NAVY = (28, 38, 61, 255)
def sheet(cells, n=4):
    s = cells[0].size[0]; im = Image.new("RGBA", (s * n, s * n), (0, 0, 0, 0))
    for k, c in enumerate(cells): im.paste(c, ((k % n) * s, (k // n) * s))
    return im
def noise1(a, seed, f=5):   # smooth periodic noise round a circle
    return sum(math.sin(a * (f + i * 3) + seed * (i + 1) * 1.7) / (i + 1) for i in range(3)) / 1.8
# ---- ripples
S, SS = 512, 3
cells = []
for k in range(16):
    u = k / 15; im = Image.new("RGBA", (S * SS, S * SS), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = S * SS / 2
    for ring, lag in ((0, 0.0), (1, 0.32)):
        v = max(0.0, u - lag) / (1 - lag)
        if u < lag: continue
        R = c * (0.12 + 0.82 * v); w = SS * (11 - 7 * v) * (1 - 0.3 * ring); a = int(255 * (1 - v ** 1.6))
        gap = 0.05 + 0.55 * v ** 1.2   # how much of the ring has broken away
        for j in range(240):
            a0 = j / 240 * 2 * math.pi; a1 = (j + 1.15) / 240 * 2 * math.pi
            if noise1(a0, ring * 3 + 1) * 0.5 + 0.5 < gap: continue
            for col, dr, ww in (((42, 120, 184, int(a * 0.55)), -w * 0.9, w * 1.2), ((255, 255, 252, a), 0, w)):
                rr = R + dr; d.line([(c + rr * math.cos(a0), c + rr * math.sin(a0)), (c + rr * math.cos(a1), c + rr * math.sin(a1))], fill=col, width=max(1, int(ww)))
    cells.append(im.resize((S, S), Image.LANCZOS))
sheet(cells).save(f"{out}/ripple.png")
def tear(x, y, rd, vx, vy, pad=0.0):
    """a drop in flight: round at its front, drawn out to a point behind it along its flight (v6: no round beads)"""
    l = math.hypot(vx, vy) or 1; fx, fy = vx / l, vy / l; R = rd + pad; tail = rd * 2.9 + pad * 1.4
    pts = [(x + R * math.cos(a) * fx - R * math.sin(a) * -fy * 0 + (R * math.cos(a) * fx - R * math.sin(a) * fy) * 0, 0) for a in []]
    for k in range(13):   # the front half-circle, from one side round to the other
        a = -math.pi / 2 + math.pi * k / 12; c, s_ = math.cos(a), math.sin(a)
        pts.append((x + R * (c * fx - s_ * fy), y + R * (c * fy + s_ * fx)))
    pts.append((x - fx * tail, y - fy * tail))
    return pts
# ---- the crown splash: a wall of water rising in round tongues, their tips pinching off to drops that fly and fall
cells = []
TONGUES = [(x, 0.55 + 0.45 * math.sin(math.pi * (x + 1) / 2) ** 0.5 * (0.8 + 0.4 * np.random.default_rng(i).random())) for i, x in enumerate(np.linspace(-0.85, 0.85, 7))]
for k in range(16):
    u = k / 15; W = S * SS; im = Image.new("RGBA", (W, W), (0, 0, 0, 0)); base = W * 0.84
    rise = math.sin(math.pi * min(1, u * 1.2)) ** 0.8; spread = W * (0.2 + 0.16 * u); H = W * 0.5 * rise
    xs = np.linspace(-1.15, 1.15, 400); top = np.zeros_like(xs)
    for x0, hh in TONGUES:
        top = np.maximum(top, hh * np.exp(-((xs - x0 * (1 + 0.15 * u)) / 0.16) ** 2))
    top = np.maximum(top, 0.35 * np.exp(-(xs / 0.95) ** 8)) * np.clip(1.15 - np.abs(xs), 0, 1) ** 0.3
    shapes = []
    if H > 6:
        pts = [(W / 2 + x * spread, base - t * H) for x, t in zip(xs, top)]
        pts += [(W / 2 + x * spread, base + 0.07 * W * math.sqrt(max(0, 1 - (x / 1.15) ** 2))) for x in xs[::-1]]
        shapes.append(("poly", pts))
    for i, (x0, hh) in enumerate(TONGUES):   # each tongue's tip lets a drop go, a little after the last
        r0 = np.random.default_rng(200 + i); t0 = 0.3 + 0.05 * i % 0.25 + 0.1 * r0.random()
        for j in range(2):
            tj = t0 + 0.12 * j
            if u < tj: continue
            q = (u - tj) / (1 - tj); x = W / 2 + x0 * (1 + 0.15 * u) * spread * (1 + 0.45 * q); y = base - hh * W * 0.5 * (0.95 + 0.4 * q) + q * q * W * 0.75
            rd = W * (0.024 - 0.008 * j) * (1 - 0.35 * q)
            vx = x0 * (1 + 0.15 * u) * spread * 0.45; vy = -hh * W * 0.5 * 0.4 + 2 * q * W * 0.75   # its flight, per unit of q
            if y < base: shapes.append(("drop", (x, y, rd, vx, vy)))
    d = ImageDraw.Draw(im); L = 9 * SS / 3 * 2
    for kind, g in shapes:   # the line: each shape drawn fat in navy, then filled in white over it
        if kind == "poly": d.polygon(g, fill=NAVY); d.line(g + [g[0]], fill=NAVY, width=int(L * 2), joint="curve")
        else: d.polygon(tear(*g, pad=L), fill=NAVY)
    for kind, g in shapes:
        if kind == "poly":
            d.polygon(g, fill=(252, 254, 255, 255))
            shade = [(p[0], p[1]) for p in g if p[0] > W / 2 + spread * 0.12]; 
            if len(shade) > 3: d.polygon(shade, fill=(190, 226, 246, 255))
        else: d.polygon(tear(*g), fill=(252, 254, 255, 255)); d.polygon(tear(g[0] + g[2] * 0.25, g[1] + g[2] * 0.2, g[2] * 0.45, g[3], g[4]), fill=(190, 226, 246, 255))
    cells.append(im.resize((S, S), Image.LANCZOS))
sheet(cells).save(f"{out}/splash.png")
# ---- runes: each a few strokes on a 3x4 grid, a hooked or round end now and then
def rune(d, x, y, sz, r, w, col):
    pts = [(x + (i % 3 - 1) * sz * 0.4, y + (i // 3 - 1.5) * sz * 0.33) for i in range(12)]
    a = int(r.integers(0, 12))
    for _ in range(int(r.integers(2, 5))):
        b = int(r.integers(0, 12))
        if b != a: d.line([pts[a], pts[b]], fill=col, width=w, joint="curve"); a = b
    if r.random() < 0.4: p = pts[int(r.integers(0, 12))]; d.ellipse([p[0] - sz * 0.1, p[1] - sz * 0.1, p[0] + sz * 0.1, p[1] + sz * 0.1], outline=col, width=w)
def glow(line_img, core=(255, 236, 160), hot=(255, 196, 40), halo=(255, 80, 190)):
    a = np.asarray(line_img.split()[3]).astype(float) / 255
    from scipy import ndimage
    g1 = ndimage.gaussian_filter(a, line_img.size[0] / 300); g2 = ndimage.gaussian_filter(a, line_img.size[0] / 90)
    rgb = np.zeros(a.shape + (3,)); al = np.clip(np.maximum.reduce([a, g1 * 1.6, g2 * 1.1]), 0, 1)
    for i in range(3): rgb[..., i] = (core[i] * a + hot[i] * np.clip(g1 * 1.6 - a, 0, 1) + halo[i] * np.clip(g2 * 1.1 - g1 * 1.6, 0, 1)) / np.maximum(al, 1e-4)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), al * 255]).astype(np.uint8), "RGBA")
W = 2048; im = Image.new("RGBA", (W, W), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = W / 2; col = (255, 255, 255, 255)
def wobbly(R, w, seed, wob=6):
    pts = [(c + (R + wob * noise1(j / 360 * 6.283, seed, 3)) * math.cos(j / 360 * 6.283), c + (R + wob * noise1(j / 360 * 6.283, seed, 3)) * math.sin(j / 360 * 6.283)) for j in range(361)]
    d.line(pts, fill=col, width=w, joint="curve")
for R, w, s in ((960, 14, 1), (920, 7, 2), (720, 12, 3), (690, 6, 4), (360, 10, 5)): wobbly(R, w, s)
star = [(c + 700 * math.cos(-math.pi / 2 + j * 2 * math.pi * 3 / 7), c + 700 * math.sin(-math.pi / 2 + j * 2 * math.pi * 3 / 7)) for j in range(8)]
d.line(star, fill=col, width=11, joint="curve")
for j in range(7):
    a = -math.pi / 2 + j * 2 * math.pi / 7; x, y = c + 705 * math.cos(a), c + 705 * math.sin(a); d.ellipse([x - 46, y - 46, x + 46, y + 46], outline=col, width=9)
r = np.random.default_rng(11)
for j in range(28):   # the band of runes between the outer rings
    a = j / 28 * 2 * math.pi; x, y = c + 820 * math.cos(a), c + 820 * math.sin(a)
    g = Image.new("RGBA", (200, 200), (0, 0, 0, 0)); rune(ImageDraw.Draw(g), 100, 100, 130, r, 9, col)
    g = g.rotate(-math.degrees(a) - 90, resample=Image.BICUBIC); im.alpha_composite(g, (int(x - 100), int(y - 100)))
# the goose's foot: three webbed toes
foot = [(c, c + 230), (c - 250, c - 170), (c - 120, c - 120), (c, c - 290), (c + 120, c - 120), (c + 250, c - 170)]
d.line(foot + [foot[0]], fill=col, width=13, joint="curve")
for tx, ty in ((c - 250, c - 170), (c, c - 290), (c + 250, c - 170)): d.line([(c, c + 230), (tx, ty)], fill=col, width=8)
glow(im).save(f"{out}/sigil.png")
# the same circle as a sticker for the trip's gates: gold lines on the navy line and the cream halo, no glow (the glow
# veiled everything behind a gate that passed the lens)
from scipy import ndimage as _nd
_a = np.asarray(im.split()[3]) > 100; _line = _nd.binary_dilation(_a, iterations=7); _halo = _nd.binary_dilation(_line, iterations=8)
_g = np.zeros((W, W, 4), np.uint8); _g[_halo] = (255, 253, 246, 255); _g[_line] = NAVY; _g[_a] = (255, 206, 48, 255)
Image.fromarray(_g, "RGBA").save(f"{out}/gate.png")
for k in range(6):
    g = Image.new("RGBA", (256, 768), (0, 0, 0, 0)); dg = ImageDraw.Draw(g); r = np.random.default_rng(40 + k)
    for i in range(4): rune(dg, 128, 110 + i * 180, 150, r, 11, col)
    glow(g).save(f"{out}/rune-{k}.png")
print("fx written")
# ---- a webbed footprint pressed in mud (foot.png, toes up), and the same foot stamped on the lens in wet mud with
# splats round it (stamp.png)
def webbed(d, cx, cy, s, col):   # a goose's foot from above: three splayed toes, the web scooped between them, claws
    heel = (cx, cy + 0.62 * s); tips = [(cx - 0.98 * s, cy - 0.78 * s), (cx, cy - 1.22 * s), (cx + 0.98 * s, cy - 0.78 * s)]
    web = [heel, tips[0]]
    for t0, t1 in ((tips[0], tips[1]), (tips[1], tips[2])):   # each web edge sags back toward the heel
        for k in range(1, 10):
            u = k / 10; mx, my = t0[0] + (t1[0] - t0[0]) * u, t0[1] + (t1[1] - t0[1]) * u; sag = 0.32 * s * math.sin(math.pi * u)
            vx, vy = heel[0] - mx, heel[1] - my; l = math.hypot(vx, vy); web.append((mx + vx / l * sag, my + vy / l * sag))
        web.append(t1)
    d.polygon(web + [heel], fill=col)
    for tp in tips:
        d.line([heel, tp], fill=col, width=int(0.2 * s)); d.ellipse([tp[0] - 0.12 * s, tp[1] - 0.12 * s, tp[0] + 0.12 * s, tp[1] + 0.12 * s], fill=col)
        vx, vy = tp[0] - heel[0], tp[1] - heel[1]; l = math.hypot(vx, vy); ux, uy = vx / l, vy / l
        d.polygon([(tp[0] + ux * 0.32 * s, tp[1] + uy * 0.32 * s), (tp[0] - uy * 0.08 * s, tp[1] + ux * 0.08 * s), (tp[0] + uy * 0.08 * s, tp[1] - ux * 0.08 * s)], fill=col)
    d.ellipse([heel[0] - 0.24 * s, heel[1] - 0.3 * s, heel[0] + 0.24 * s, heel[1] + 0.16 * s], fill=col)
im = Image.new("RGBA", (512, 512), (0, 0, 0, 0)); d = ImageDraw.Draw(im); webbed(d, 256, 300, 150, (60, 38, 24, 210)); im = im.filter(ImageFilter.GaussianBlur(1.5)); im.save(f"{out}/foot.png")
W = 2048; im = Image.new("RGBA", (W, W), (0, 0, 0, 0)); d = ImageDraw.Draw(im); r = np.random.default_rng(3); MUD = (88, 56, 34, 255)
for i in range(60):   # mud thrown out from the stamp: round drops, bigger near it, a few smeared long
    a = r.uniform(0, 2 * math.pi); dist = r.uniform(0.3, 0.62) * W; rr = r.uniform(8, 40) * (1.3 - dist / W)
    x, y = W / 2 + math.cos(a) * dist, W * 0.5 + math.sin(a) * dist * 0.9
    if i % 4 == 0: d.ellipse([x - rr * 2.2, y - rr * 0.8, x + rr * 2.2, y + rr * 0.8], fill=MUD)
    else: d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=MUD)
webbed(d, W / 2, W * 0.56, W * 0.3, MUD)
a = np.asarray(im).astype(float); sh = np.zeros_like(a[..., 0])
from scipy import ndimage
lit = ndimage.shift(a[..., 3], (6, 6)) - a[..., 3]   # a wet highlight along the top-left of every blob
rgb = a[..., :3].copy(); hl = np.clip(-lit / 255, 0, 1)[..., None]; rgb = rgb * (1 - 0.6 * hl) + np.array([210, 170, 120]) * 0.6 * hl
Image.fromarray(np.dstack([rgb, a[..., 3]]).astype(np.uint8), "RGBA").save(f"{out}/stamp.png")
print("feet written")
# ---- keycaps: one legend a cell (8 x 8), navy in a round bold face (Lilita One, OFL), in the order of plan.ts's KEYS
# (assets/fx/keys.json, written from the plan); a wide key's word is drawn wide and squeezed into its square cell, so it
# comes out right on the cap's wide legend plane
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
# ---- smoke: a cartoon puff off the cigarette, lumps of cloud with the navy line, a cream fill and a lilac shade
# crescent low right; it swells and turns as it rises, then thins away whole (4x4 sheet, one puff's life)
from scipy import ndimage
cells = []
LUMPS = [(-0.30, 0.10, 0.30), (0.0, -0.06, 0.36), (0.29, 0.08, 0.27), (-0.13, -0.32, 0.24), (0.17, -0.30, 0.22), (0.03, 0.26, 0.24)]
for k in range(16):
    u = k / 15; W = S * SS; grow = 0.32 + 0.6 * min(1, u * 1.6) ** 0.7; part = max(0, (u - 0.5) / 0.5); curl = u * 1.2
    m = Image.new("L", (W, W), 0); d = ImageDraw.Draw(m); rs = []
    for i, (x, y, r) in enumerate(LUMPS):
        a = math.atan2(y, x) + curl * (0.5 if i % 2 else -0.4); q = math.hypot(x, y) * (1 + 0.25 * part); rr = r * W * 0.42 * grow * (1 - 0.2 * part)
        cx, cy = W / 2 + math.cos(a) * q * W * 0.42 * grow, W / 2 + math.sin(a) * q * W * 0.42 * grow - W * 0.05 * u; rs.append((cx, cy, rr))
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=255)
    M = np.array(m) > 127; L = max(2, int(SS * 5 * (1 - 0.4 * part)))
    line = ndimage.binary_dilation(M, iterations=L); sh = int(W * 0.05 * grow)
    lit = np.zeros_like(M); lit[:-sh, :-sh] = M[sh:, sh:]   # the cloud moved down-right: what's left is lit, the rest shade
    rgb = np.zeros((W, W, 4), np.uint8); rgb[line] = NAVY; rgb[M] = (214, 206, 242, 255); rgb[M & ~lit] = (214, 206, 242, 255); rgb[M & lit] = (250, 247, 255, 255)
    cx, cy, rr = min(rs, key=lambda p: p[0] + p[1]); hl = Image.new("L", (W, W), 0); ImageDraw.Draw(hl).ellipse([cx - rr * 0.55, cy - rr * 0.6, cx - rr * 0.1, cy - rr * 0.25], fill=255)
    rgb[(np.array(hl) > 127) & M] = (255, 255, 255, 255)
    rgb[..., 3] = (rgb[..., 3] * (1 - part ** 1.4)).astype(np.uint8)
    cells.append(Image.fromarray(rgb, "RGBA").resize((S, S), Image.LANCZOS))
sheet(cells).save(f"{out}/smoke.png")
# ---- the wisp off the tip: a ribbon of smoke waving up from the bottom of the cell, its wave climbing (16 frames, loops)
cells = []
for k in range(16):
    W = S * SS; im = Image.new("RGBA", (W, W), (0, 0, 0, 0)); d = ImageDraw.Draw(im); ph = 2 * math.pi * k / 16
    pts = [(W / 2 + W * 0.16 * (h ** 1.2) * math.sin(2 * math.pi * h * 1.6 - ph) + W * 0.06 * h * math.sin(ph + 1), W * 0.98 - h * W * 0.94, h) for h in np.linspace(0, 1, 260)]
    for x, y, h in pts: w = W * (0.012 + 0.03 * h); d.ellipse([x - w - SS * 5, y - w - SS * 5, x + w + SS * 5, y + w + SS * 5], fill=NAVY)
    for x, y, h in pts: w = W * (0.012 + 0.03 * h); d.ellipse([x - w, y - w, x + w, y + w], fill=(250, 247, 255, 255))
    a = np.array(im); fade = np.clip(np.linspace(0, 1.8, W)[:, None], 0, 1) ** 1.1   # thins out toward the top
    a[..., 3] = (a[..., 3] * fade).astype(np.uint8); cells.append(Image.fromarray(a, "RGBA").resize((S, S), Image.LANCZOS))
sheet(cells).save(f"{out}/wisp.png")
# ---- the trip's far end: a sunburst of 28 rays round a hot white core, white on clear so it takes the void's colour
W = 2048; im = Image.new("RGBA", (W, W), (0, 0, 0, 0)); d = ImageDraw.Draw(im); c = W / 2
for i in range(28):
    a0, a1 = (i - 0.5) * 2 * math.pi / 28, (i - 0.5 + 0.5) * 2 * math.pi / 28
    if i % 2 == 0: d.polygon([(c, c), (c + math.cos(a0) * W, c + math.sin(a0) * W), (c + math.cos(a1) * W, c + math.sin(a1) * W)], fill=(255, 255, 255, 70))
g = Image.new("RGBA", (W, W), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
for rr, al in ((300, 90), (190, 170), (110, 255)): gd.ellipse([c - rr, c - rr, c + rr, c + rr], fill=(255, 250, 225, al))
im = Image.alpha_composite(im, g.filter(ImageFilter.GaussianBlur(40))); im.save(f"{out}/burst.png"); print("smoke and burst written")
