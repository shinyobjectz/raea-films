# v4, 30-hands: the alien hands' skin as seamless tiles (components/hand-skin.ts maps them), TILE_MM across in N px
# (0.02 mm a pixel: far finer than the lens resolves, so the mip levels average it rather than smear it).
# Noise is band-passed white noise (periodic by construction, so it tiles).
#   colour: blotches 8-16 mm, lighter and darker, the dark ones browner; freckles 1.5-3 mm and 3-5 mm, sparse; a fine
#     speckle; faint grey-violet patches; blemishes (small darker, redder marks, a few raised). A multiplier on the
#     material's base colour (about 0.86 on average, never over 1).
#   normal (OpenGL, +Y green): the skin's micro-relief: pores, the fine criss-cross of furrows that splits skin into
#     tiny diamonds, a few fine creases, the blemishes' bumps, a soft unevenness.
#   roughness (green, as Bevy reads it): oilier in the furrows and pores than on the plateaus.
# usage: make_skin.py OUTDIR
import sys, os
import numpy as np
from PIL import Image

N, TILE_MM = 4096, 80.0
MM = TILE_MM / N
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(31)
fx = (np.fft.fftfreq(N)[:, None] * N / TILE_MM).astype(np.float32)  # cycles per mm
fy = (np.fft.fftfreq(N)[None, :] * N / TILE_MM).astype(np.float32)
fr = np.hypot(fx, fy)
lfr = np.log(fr + 1e-9)

def band(lo_mm, hi_mm, aniso=None):
    """noise with features lo_mm..hi_mm across, unit deviation; aniso=(angle, ratio) stretches it along an angle"""
    w = rng.standard_normal((N, N)).astype(np.float32)
    f0, f1 = 1 / hi_mm, 1 / lo_mm
    if aniso is None:
        r = lfr
    else:
        a, k = aniso
        u = fx * np.cos(a) + fy * np.sin(a)
        v = -fx * np.sin(a) + fy * np.cos(a)
        r = np.log(np.hypot(u, v * k) + 1e-9)
    m = np.exp(-((r - np.log(np.sqrt(f0 * f1))) ** 2) / (2 * (np.log(f1 / f0) / 2.5) ** 2)).astype(np.float32)
    m[0, 0] = 0
    n = np.real(np.fft.ifft2(np.fft.fft2(w) * m)).astype(np.float32)
    return (n - n.mean()) / n.std()

def spots(density_per_cm2, r_mm, seed):
    """a field of round marks: count from the density, radii around r_mm, as 0..1 with soft edges (tiles: wraps)"""
    g = np.random.default_rng(seed)
    n = int(density_per_cm2 * (TILE_MM / 10) ** 2)
    out = np.zeros((N, N), np.float32)
    for _ in range(n):
        cx, cy = g.uniform(0, N, 2)
        r = r_mm * g.uniform(0.6, 1.5) / MM
        s = int(r * 2.5) + 2
        ys, xs = np.mgrid[-s:s + 1, -s:s + 1]
        d = np.hypot(xs + (cx % 1), ys + (cy % 1)) / r
        v = np.clip(1 - d * d, 0, 1) ** 1.5 * g.uniform(0.5, 1)
        iy = (ys + int(cy)) % N
        ix = (xs + int(cx)) % N
        np.maximum.at(out, (iy, ix), v.astype(np.float32))
    return out

# ---- colour ----
blot, blot2, freck, freck2, speck, violet = band(8, 16), band(4, 8), band(1.5, 3), band(3, 5), band(0.4, 0.8), band(10, 20)
blem = spots(0.35, 0.9, 5)          # blemishes: small marks, darker and redder
light = 0.055 * blot + 0.03 * blot2 + 0.02 * speck
sp = np.clip(freck - 2.0, 0, None) * 0.22 + np.clip(freck2 - 1.6, 0, None) * 0.07
dark = np.clip(-blot, 0, None)
r = 0.86 + light - sp * 0.7 + 0.02 * dark - blem * 0.06
g = 0.86 + light - sp * 1.0 - 0.025 * dark - blem * 0.16
b = 0.86 + light - sp * 1.1 - 0.035 * dark - blem * 0.14
v = np.clip(violet - 0.9, 0, None) * 0.022
r += v * 0.4; g -= v * 0.6; b += v * 0.8

# ---- height (mm) ----
pores = spots(60.0, 0.12, 9)         # pores: tiny pits, about a pixel across at the lens's distance
hatch = np.abs(band(0.5, 0.9, (0.6, 6.0))) + np.abs(band(0.5, 0.9, (-0.7, 6.0)))   # two sets of fine furrows criss-crossing
furrow = np.clip(1.6 - hatch, 0, None) ** 2                                         # the lines where either set dips
crease = np.clip(np.abs(band(2.0, 4.0, (0.2, 9.0))) - 1.9, 0, None)                # a few longer fine creases
raised = spots(0.12, 0.7, 13)        # some blemishes raised
h = -0.018 * pores - 0.009 * furrow - 0.03 * crease + 0.04 * raised + 0.015 * band(1.5, 4) + 0.005 * speck
# the furrows and pores show a little darker too
r -= 0.03 * furrow / furrow.max() + 0.05 * pores
g -= 0.03 * furrow / furrow.max() + 0.05 * pores
b -= 0.03 * furrow / furrow.max() + 0.05 * pores
rgb = np.clip(np.stack([r, g, b], -1), 0, 1)
Image.fromarray((rgb * 255).round().astype(np.uint8)).save(os.path.join(out, "skin-mottle.png"))

# normals from the height's slopes (wrapping, so it tiles)
dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / (2 * MM)
dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) / (2 * MM)
nz = np.ones_like(h)
n = np.stack([-dx, dy, nz], -1)
n /= np.linalg.norm(n, axis=-1, keepdims=True)
Image.fromarray(((n * 0.5 + 0.5) * 255).round().astype(np.uint8)).save(os.path.join(out, "skin-normal.png"))

rough = np.clip(0.5 + 0.05 * blot2 + 0.03 * speck + 0.08 * sp - 0.08 * furrow / furrow.max() - 0.1 * pores, 0.3, 0.7)
z = np.zeros_like(rough)
Image.fromarray((np.stack([z, rough, z], -1) * 255).round().astype(np.uint8)).resize((N // 2, N // 2), Image.LANCZOS).save(os.path.join(out, "skin-rough.png"))
slope = np.degrees(np.arccos(n[..., 2]))
print("mottle mean", rgb.astype(np.float64).mean(axis=(0, 1)).round(3), "min", rgb.min().round(3), "| normal tilt mean", slope.astype(np.float64).mean().round(1), "deg, p99", np.percentile(slope, 99).round(1), "| rough", rough.astype(np.float64).mean().round(3))
