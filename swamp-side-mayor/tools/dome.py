# Folds each pano's five faces (compositions film.tsx#pano, rendered in order: pano k's faces are frames 5k..5k+4)
# into a dome: the sky half seen from that spot, in an equidistant fisheye looking straight up (the centre the zenith,
# the rim the horizon; x along world +x, down the image along world +z), which underwater.tsx's pass reads.
#   uv run --with pillow --with numpy python -I tools/dome.py FACES_DIR OUT_DIR [SIZE]
import math, sys, os
import numpy as np
from PIL import Image

FACES = [((1, 0, 0), (0, 1, 0)), ((-1, 0, 0), (0, 1, 0)), ((0, 0, 1), (0, 1, 0)), ((0, 0, -1), (0, 1, 0)), ((0, 1, 0), (0, 0, -1))]   # plan.ts FACES
src, out = sys.argv[1], sys.argv[2]; N = int(sys.argv[3]) if len(sys.argv) > 3 else 1024
os.makedirs(out, exist_ok=True)
files = sorted(f for f in os.listdir(src) if f.startswith("frame-") and f.endswith(".png"))
assert len(files) % 5 == 0, f"{len(files)} faces is not five a pano"
y, x = np.mgrid[0:N, 0:N].astype(np.float64)
X, Y = (x + 0.5) / N * 2 - 1, (y + 0.5) / N * 2 - 1
r = np.hypot(X, Y); th = np.clip(r, 0, 1) * math.pi / 2; ph = np.arctan2(Y, X)
D = np.stack([np.sin(th) * np.cos(ph), np.cos(th), np.sin(th) * np.sin(ph)], -1)   # world direction per dome pixel
for k in range(len(files) // 5):
    imgs = [np.asarray(Image.open(os.path.join(src, files[5 * k + i])).convert("RGB"), np.float64) for i in range(5)]
    H, W = imgs[0].shape[:2]
    # the sky is drawn in screen space, so the face looking straight up got a light gradient that met the side faces'
    # deep blue in a hard seam through the window (v7 stills): its sky (each pixel near its own row's sky colour) takes
    # the side faces' top-row sky instead
    tops = np.concatenate([im[: max(2, H // 40)].reshape(-1, 3) for im in imgs[:4]]); blue = tops[(tops[:, 2] > tops[:, 0] + 40) & (tops[:, 2] > tops[:, 1] + 10)]
    if len(blue):
        sky = np.median(blue, 0); up = imgs[4]; isb = (up[..., 2] > up[..., 0] + 30) & (up[..., 2] > up[..., 1] + 5)
        row = np.stack([np.median(up[j][isb[j]], 0) if isb[j].sum() > 8 else sky for j in range(H)])[:, None, :]
        mask = (np.linalg.norm(up - row, axis=-1) < 28) & isb
        up[mask] = sky; imgs[4] = up
    best = np.full(D.shape[:2], -1e9); col = np.zeros(D.shape[:2] + (3,))
    for i, (f, u) in enumerate(FACES):
        f, u = np.array(f, float), np.array(u, float); rt = np.cross(f, u)
        df = D @ f; take = (df > best) & (df > 1e-6)
        sx = (D @ rt) / np.where(df > 1e-6, df, 1); sy = (D @ u) / np.where(df > 1e-6, df, 1)
        px = np.clip((sx + 1) / 2 * W - 0.5, 0, W - 1.001); py = np.clip((1 - sy) / 2 * H - 0.5, 0, H - 1.001)
        x0, y0 = px.astype(int), py.astype(int); fx, fy = (px - x0)[..., None], (py - y0)[..., None]; im = imgs[i]
        c = im[y0, x0] * (1 - fx) * (1 - fy) + im[y0, x0 + 1] * fx * (1 - fy) + im[y0 + 1, x0] * (1 - fx) * fy + im[y0 + 1, x0 + 1] * fx * fy
        col[take] = c[take]; best = np.where(take, df, best)
    col[r > 1] = col[np.clip(r, 0, 1) >= 0.999].mean(0) if (r > 1).any() else 0   # past the horizon: the horizon's own colour
    Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).save(os.path.join(out, f"dome-{k}.png"))
    print("dome", k)
