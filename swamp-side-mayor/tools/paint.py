#!/usr/bin/env python3
"""tools/paint.py: lettering and marks painted in one colour with a dry brush, like the reference's "DUCK" (the director,
11-16: "i really like this painted single color font"; the marker inside a navy and cream outline read abrasive and
childish).

  paint.py word NAME "TEXT" SIZE COLOUR        Archivo Black (OFL 1.1), a literal \\n starts a second line
  paint.py mask NAME IN.png COLOUR SCALE       a drawn shape's alpha (an arrow, a burst); SCALE ~ its stroke x 4

Writes assets/ink/NAME-{0,1,2}.png, three takes the same size whose edges and streaks differ a little (cycled, the
boil). The letters keep their places between takes; only the paint boils.

How it's painted: each letter set down by hand (a degree or two of turn, a little off the line), its corners softened,
its edge wobbled and bristled along the stroke, and dry streaks dragged through each stroke in that stroke's own
direction, more of them toward the edges, the way a loaded brush runs dry. The stroke's direction is the distance
field's structure tensor (across the stroke) turned a quarter; the streaks are sparse noise integrated along it.
"""
import sys
import zlib

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd

FONT = "assets/fonts/ArchivoBlack-Regular.ttf"
OUT = "assets/ink"


def rgb(c):
    c = c.lstrip("#")
    return np.array([int(c[i:i + 2], 16) for i in (0, 2, 4)], np.uint8)


def text_mask(text, size, seed):
    """The words in white on black, each letter set down a touch off by hand. Returns (mask, cap height)."""
    f = ImageFont.truetype(FONT, size)
    rng = np.random.default_rng(seed)
    lines = text.replace("\\n", "\n").split("\n")
    asc, desc = f.getmetrics()
    lh = int((asc + desc) * 0.92)
    widths = [f.getlength(l) for l in lines]
    pad = int(size * 0.3)
    W, H = int(max(widths)) + 2 * pad, lh * len(lines) + 2 * pad
    M = Image.new("L", (W, H), 0)
    for i, line in enumerate(lines):
        x0, y0 = pad + (max(widths) - widths[i]) / 2, pad + i * lh
        for k, ch in enumerate(line):
            if ch == " ":
                continue
            x = x0 + f.getlength(line[:k])
            g = Image.new("L", (int(size * 1.6), int((asc + desc) * 1.4)), 0)
            ImageDraw.Draw(g).text((size * 0.3, (asc + desc) * 0.2), ch, font=f, fill=255)
            g = g.rotate(rng.normal(0, 1.4), resample=Image.BICUBIC, center=(size * 0.3 + f.getlength(ch) / 2, (asc + desc) * 0.75))
            dy = rng.normal(0, size * 0.012)
            M.paste(Image.new("L", g.size, 255), (int(x - size * 0.3), int(y0 - (asc + desc) * 0.2 + dy)), g)
    return np.asarray(M, np.float32) / 255, size * 0.72


def lic(noise, dx, dy, L, step=2.0):
    """noise averaged along the direction field, L px each way, weighted to fade at the ends: streaks with tapered tips"""
    H, W = noise.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    acc, ws = np.zeros_like(noise), 0.0
    n = max(1, int(L / step))
    for k in range(-n, n + 1):
        w = 1 - abs(k) / (n + 1)
        acc += w * nd.map_coordinates(noise, [yy + k * step * dy, xx + k * step * dx], order=1, mode="constant")
        ws += w
    return acc / ws


def smooth(rng, shape, sigma):
    z = nd.gaussian_filter(rng.standard_normal(shape).astype(np.float32), sigma)
    return z / (z.std() + 1e-6)


def paint(M, cap, name, colour):
    H, W = M.shape
    soft = nd.gaussian_filter(M, cap * 0.022)  # corners softened, as a round brush leaves them
    inside = soft > 0.5
    D = nd.distance_transform_edt(inside).astype(np.float32)
    gy, gx = np.gradient(nd.gaussian_filter(D, 1.5))
    s = cap * 0.05
    Jxx, Jxy, Jyy = (nd.gaussian_filter(a, s) for a in (gx * gx, gx * gy, gy * gy))
    th = 0.5 * np.arctan2(2 * Jxy, Jxx - Jyy) + np.pi / 2  # along the stroke
    dx, dy = np.cos(th).astype(np.float32), np.sin(th).astype(np.float32)
    edge_near = 1 - np.clip(D / (cap * 0.1), 0, 1)  # 1 at the edge, 0 a tenth of the cap in
    shared = np.random.default_rng(zlib.crc32(name.encode()))
    wob_a = [smooth(shared, (H, W), cap * 0.13) for _ in range(2)]
    imp_a = shared.random((H, W)).astype(np.float32)
    amp_a = shared.random((H, W)).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    takes = []
    for t in range(3):
        rng = np.random.default_rng(zlib.crc32(name.encode()) + 101 * (t + 1))
        # the edge: wobbled a little (mostly shared, so the letters hold their shapes), then bristled along the stroke
        wob = [0.8 * a + 0.35 * smooth(rng, (H, W), cap * 0.13) for a in wob_a]
        sd = nd.map_coordinates(soft, [yy + wob[1] * cap * 0.011, xx + wob[0] * cap * 0.011], order=1, mode="constant")
        br = lic(nd.gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 0.7), dx, dy, cap * 0.07)
        br = br / (br.std() + 1e-6)
        edge = np.clip((sd + 0.035 * br - 0.5) / 0.07 + 0.5, 0, 1)
        # the dry streaks: sparse dabs (three quarters the same every take) dragged along the stroke
        p = (22 / cap**2) * (0.8 + 0.5 * edge_near) * (D > cap * 0.035)
        imp = np.where(t == 0, imp_a, np.where(rng.random((H, W)) < 0.75, imp_a, rng.random((H, W)).astype(np.float32)))
        dabs = (imp < p).astype(np.float32) * (0.4 + 0.6 * amp_a) * inside
        S = lic(nd.gaussian_filter(dabs, 0.75), dx, dy, cap * 0.24)
        ref = np.percentile(S[S > 0], 99.0) if (S > 0).any() else 1
        gaps = np.clip((S / ref - 0.16) / 0.16, 0, 1)
        takes.append(edge * (1 - gaps))
    # one crop for all three takes, so they're the same size
    any_a = np.max(takes, axis=0) > 0.02
    ys, xs = np.where(any_a)
    b = 14
    y0, y1, x0, x1 = max(0, ys.min() - b), min(H, ys.max() + b), max(0, xs.min() - b), min(W, xs.max() + b)
    c = rgb(colour)
    for t, a in enumerate(takes):
        img = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        img[..., :3] = c
        img[..., 3] = (a[y0:y1, x0:x1] * 255).round().astype(np.uint8)
        Image.fromarray(img, "RGBA").save(f"{OUT}/{name}-{t}.png", optimize=True)
    return x1 - x0, y1 - y0


if __name__ == "__main__":
    kind, name = sys.argv[1], sys.argv[2]
    if kind == "word":
        text, size, colour = sys.argv[3], int(sys.argv[4]), sys.argv[5]
        M, cap = text_mask(text, size, zlib.crc32(name.encode()))
    else:
        src, colour, scale = sys.argv[3], sys.argv[4], float(sys.argv[5])
        a = np.asarray(Image.open(src).convert("RGBA"))[..., 3].astype(np.float32) / 255
        pad = int(scale * 0.4)
        M, cap = np.pad(a, pad), scale
    w, h = paint(M, cap, name, colour)
    print(f"{name} {w}x{h}")
