# the porter's room build-up time-lapse for berlin v5: the clay pass as lines, then clay, textured, finished, the Kling
# loft; two scan wipes and two dissolves on the sequence's clock (compositions/rebuilt-v5-build.tsx), written as frames
import numpy as np, os
from PIL import Image
D = 'out/work/b5f'; OUT = D + '/out'; os.makedirs(OUT, exist_ok=True)
FPS = 24; N = int(18.0 * FPS)


def fr(stage, T, T0):
    files = sorted(f for f in os.listdir(f'{D}/{stage}') if f.endswith('.png'))
    i = int(round((T - T0) * FPS))
    return np.asarray(Image.open(f'{D}/{stage}/' + files[min(max(i, 0), len(files) - 1)]).convert('RGB')).astype(np.float32)


def ease(x):
    x = min(1, max(0, x)); return x * x * (3 - 2 * x)


BG = np.array([11, 14, 19], np.float32); INK = np.array([150, 205, 255], np.float32)


def lines(img):
    g = img @ np.array([0.299, 0.587, 0.114], np.float32)
    gx = np.zeros_like(g); gy = np.zeros_like(g)
    gx[:, 1:-1] = g[:, 2:] - g[:, :-2]; gy[1:-1, :] = g[2:, :] - g[:-2, :]
    a = np.clip((np.sqrt(gx * gx + gy * gy) - 6) / 14, 0, 1)
    b = a.copy()
    for s in (1, 2):
        for ax in (0, 1):
            b = np.maximum(b, 0.35 * np.roll(a, s, ax)); b = np.maximum(b, 0.35 * np.roll(a, -s, ax))
    return BG[None, None, :] * (1 - b[..., None]) + INK[None, None, :] * b[..., None]


def wipe(new, old, k, W=1920):
    x = int(k * W); out = old.copy(); out[:, :x] = new[:, :x]
    if 0 < k < 1:
        for d, al in ((0, 1.0), (1, 0.8), (2, 0.6), (4, 0.35), (7, 0.18), (11, 0.08)):
            for xx in (x - d, x + d):
                if 0 <= xx < W: out[:, xx] = out[:, xx] * (1 - al) + np.array([235, 245, 255], np.float32) * al
    return out


for n in range(N):
    T = n / FPS
    if T < 3.6: img = lines(fr('clay', T, 0))
    elif T < 4.6: img = wipe(fr('clay', T, 0), lines(fr('clay', T, 0)), ease((T - 3.6) / 1.0))
    elif T < 11.0: img = fr('clay', T, 0)
    elif T < 12.0: img = wipe(fr('tex', T, 11.0), fr('clay', T, 0), ease((T - 11.0) / 1.0))
    elif T < 15.0: img = fr('tex', T, 11.0)
    elif T < 15.8: k = ease((T - 15.0) / 0.8); img = fr('tex', T, 11.0) * (1 - k) + fr('final', T, 15.0) * k
    elif T < 17.0: img = fr('final', T, 15.0)
    else: k = ease((T - 17.0) / 1.0); img = fr('final', T, 15.0) * (1 - k) + fr('loft', T, 17.0) * k
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(f'{OUT}/{n:04d}.png')
print('frames', N)
