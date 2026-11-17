# tools/clouds.py: painted anime cumulus, as flat sprites with alpha (assets/sky/cloud-N.png). Each is a heap of
# soft balls: a flat white body, a cool blue-grey underside cut along a wavy line, a warm-white rim on the sunny
# top-left, crisp edges. The film stands them far off as cards that face the stage.
# run: uv run -q --with pillow --with numpy --with scipy python tools/clouds.py
import numpy as np
from PIL import Image
from scipy import ndimage
W, H = 1600, 900
yy, xx = np.mgrid[0:H, 0:W].astype(float)
def cloud(seed, flat=0.55, tall=1.0):
    r = np.random.default_rng(seed); f = np.zeros((H, W)); light = np.zeros((H, W))
    base = H * 0.78
    n = 26
    for i in range(n):
        u = r.uniform(0.12, 0.88); w = np.exp(-((u - 0.5) / 0.26) ** 2)
        rad = r.uniform(70, 170) * (0.5 + 0.7 * w) * (1 if i > 4 else 1.3)
        cx = W * u; cy = base - rad * 0.55 - w * r.uniform(60, 330) * tall
        d = np.hypot(xx - cx, (yy - cy) * 1.05)
        f = np.maximum(f, np.clip(1 - d / rad, 0, 1))
        light = np.maximum(light, np.clip(1 - np.hypot(xx - cx + rad * 0.45, yy - cy + rad * 0.5) / (rad * 1.05), 0, 1))
    f[yy > base] *= np.clip(1 - (yy[yy > base] - base) / 18, 0, 1)        # a flat-ish bottom
    mask = ndimage.gaussian_filter((f > 0.02).astype(float), 1.2)
    # the shade: everything below a wavy line, and inside the heap away from the light
    wave = base - 70 * flat - 30 * np.sin(xx / 90 + seed) - 18 * np.sin(xx / 37 + seed * 2)
    shade = ((yy > wave) | (light < 0.04)).astype(float)
    shade = ndimage.gaussian_filter(shade, 2.0)
    white = np.array([255, 253, 248.]); sh = np.array([184, 206, 232.]); deep = np.array([150, 180, 216.])
    col = white[None, None] * (1 - shade[..., None]) + sh[None, None] * shade[..., None]
    low = ndimage.gaussian_filter(((yy > base - 22)).astype(float), 3) * shade
    col = col * (1 - 0.6 * low[..., None]) + deep[None, None] * 0.6 * low[..., None]
    img = np.dstack([col, mask[..., None] * 255]).clip(0, 255).astype(np.uint8)
    ys, xs = np.nonzero(mask > 0.02); im = Image.fromarray(img).crop((max(0, xs.min() - 8), max(0, ys.min() - 8), min(W, xs.max() + 8), min(H, ys.max() + 8)))
    return im
for k, (fl, ta) in enumerate([(0.55, 1.0), (0.4, 1.3), (0.7, 0.7), (0.5, 1.1), (0.6, 0.5), (0.45, 1.5)]):
    cloud(k * 11 + 3, fl, ta).save(f"assets/sky/cloud-{k}.png")
print("6 clouds")
