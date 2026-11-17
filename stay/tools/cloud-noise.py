# The cloud noise the film's sky is made of: the two tileable textures evroon's bevy-volumetric-clouds (MIT; the Horizon
# Zero Dawn method, Schneider and Vos, with Frostbite's noise, Hillaire) builds on the GPU at start-up, baked once here
# with the same recipes (its clouds_compute.wgsl render_clouds_atlas and render_clouds_worley, its common.wgsl noises):
#   media/sky/cloud-atlas.png    1024 x 1024: r the cloud's base shape (Perlin fbm cut by Worley), g a Worley mix (stored + 1),
#                                b a second Worley, inverted
#   media/sky/cloud-worley.png   a 32 x 32 x 32 Worley block for eroding edges, laid out as 8 x 4 slices of 32 x 32
#   raea blender run tools/cloud-noise.py
import numpy as np, os
import subprocess
def save(arr, name):
    # (Blender's Python has numpy and no image library: the bytes go through ImageMagick)
    h, w = arr.shape[:2]; raw = os.path.join(OUT, name + '.raw'); arr.tofile(raw)
    subprocess.run(['magick', '-size', f'{w}x{h}', '-depth', '16' if arr.dtype == np.uint16 else '8', '-endian', 'LSB', ('rgb:' if arr.ndim == 3 else 'gray:') + raw, os.path.join(OUT, name + '.png')], check=True); os.remove(raw)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "media", "sky")
fract = lambda x: x - np.floor(x)
def hash13(p):                      # Dave Hoskins' hash without sine, as the crate's
    p3 = fract(p * 1031.1031); d = (p3 * (p3[..., [1, 2, 0]] + 19.19)).sum(-1, keepdims=True); p3 = p3 + d
    return fract((p3[..., 0] + p3[..., 1]) * p3[..., 2])
def value_hash(p):
    p3 = fract(p * 0.1031); d = (p3 * (p3[..., [1, 2, 0]] + 19.19)).sum(-1, keepdims=True); p3 = p3 + d
    return fract((p3[..., 0] + p3[..., 1]) * p3[..., 2])
def hash_noise(x, tile):
    p = np.floor(x); f = fract(x); f = f * f * (3 - 2 * f)
    def c(dx, dy, dz): return value_hash(np.mod(p + np.array([dx, dy, dz], np.float32), tile))
    x0 = c(0, 0, 0) * (1 - f[..., 0]) + c(1, 0, 0) * f[..., 0]; x1 = c(0, 1, 0) * (1 - f[..., 0]) + c(1, 1, 0) * f[..., 0]
    x2 = c(0, 0, 1) * (1 - f[..., 0]) + c(1, 0, 1) * f[..., 0]; x3 = c(0, 1, 1) * (1 - f[..., 0]) + c(1, 1, 1) * f[..., 0]
    return (x0 * (1 - f[..., 1]) + x1 * f[..., 1]) * (1 - f[..., 2]) + (x2 * (1 - f[..., 1]) + x3 * f[..., 1]) * f[..., 2]
def voronoi(x, tile):
    p = np.floor(x); f = fract(x); res = np.full(x.shape[:-1], 100.0, np.float32)
    for k in (-1, 0, 1):
        for j in (-1, 0, 1):
            for i in (-1, 0, 1):
                b = np.array([i, j, k], np.float32); r = b - f + hash13(np.mod(p + b, tile))[..., None]
                res = np.minimum(res, (r * r).sum(-1))
    return 1 - res
def fbm(fn, p, octaves, freq):
    amp, n, w = 1.0, 0.0, 0.0
    for _ in range(min(octaves, 7)):          # (past seven octaves a cell is under a texel: nothing left to add)
        n = n + amp * fn(p * freq, freq); freq *= 2; w += amp; amp *= 0.5
    return n / w
os.makedirs(OUT, exist_ok=True)
N = 1024
u, v = np.meshgrid((np.arange(N) + 0.5) / N, (np.arange(N) + 0.5) / N, indexing="xy")
coord = np.stack([u, v, np.full_like(u, 0.5)], -1).astype(np.float32)
r = (1 - 0.9 + 0.9 * fbm(hash_noise, coord, 7, 4.0)) * (1 - 0.7 + 0.7 * fbm(voronoi, coord, 8, 9.0))
g = 0.625 * fbm(voronoi, coord, 3, 15.0) + 0.25 * fbm(voronoi, coord, 3, 19.0) + 0.125 * fbm(voronoi, coord, 3, 23.0)       # the shader takes 1 from it
b = 1 - fbm(voronoi, coord + 0.5, 6, 9.0)
print("atlas r", float(r.min()), float(r.max()), "g", float(g.min()), float(g.max()), "b", float(b.min()), float(b.max()))
# (sixteen bits: the cloud's edge is a threshold on this, and at eight its steps showed as square patches in a thin sky)
save((np.clip(np.stack([r, g, b], -1), 0, 1) * 65535 + 0.5).astype(np.uint16), "cloud-atlas")
M = 32
x, y, z = np.meshgrid(np.arange(M), np.arange(M), np.arange(M), indexing="ij")
c3 = (np.stack([x, y, z], -1).astype(np.float32)) / M
w = np.maximum(0, 1 - (fbm(voronoi, c3, 16, 3.0) + 0.5 * fbm(voronoi, c3, 4, 8.0) + 0.25 * fbm(voronoi, c3, 4, 16.0)) / 1.75)
print("worley", float(w.min()), float(w.max()))
w = (w - w.min()) / (w.max() - w.min())
sheet = np.zeros((4 * M, 8 * M), np.float32)
for s in range(M):
    sheet[(s // 8) * M:(s // 8 + 1) * M, (s % 8) * M:(s % 8 + 1) * M] = w[:, :, s].T
save((sheet * 255 + 0.5).astype(np.uint8), "cloud-worley")
print("wrote cloud-atlas.png, cloud-worley.png")
