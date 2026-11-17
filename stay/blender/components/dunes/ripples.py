# dunes/ripples: the dunes' sand as textures, for v3/dunes.tsx's ground (a mesh raea builds, so these are its maps):
#   media/tex/dunes-sand-diff.png  Poly Haven's sand_02, its colour taken out and its tone evened, so the scene's own
#                                  sand colour (a material tint) is the colour; tiled 4 x 4 in the 2 m tile
#   media/tex/dunes-ripple-nor.png the wind's ripples: crests about 9 cm apart running across the wind, each a long gentle
#                                  slope up and a short steep one down, wandering, splitting and joining as real ripples
#                                  do; with sand_02's own grain over them. An OpenGL normal map (green up).
# One tile is 2 m of ground (v3/dunes.tsx TILE). Everything here repeats on whole periods, so the tile has no seam.
import os, sys, math
import numpy as np
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SRC = os.path.join(PROJECT, "blender", "src", "polyhaven", "tex", "sand_02")
OUT = os.path.join(PROJECT, "media", "tex")
N = 2048
TILE = 2.0


def load(path):
    im = bpy.data.images.load(path)
    w, h = im.size
    a = np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4)[:, :, :3]
    bpy.data.images.remove(im)
    return a


def save(a, path, colour):
    h, w = a.shape[:2]
    im = bpy.data.images.new(os.path.basename(path), w, h, alpha=False, float_buffer=False)
    im.colorspace_settings.name = "sRGB" if colour else "Non-Color"
    px = np.ones((h, w, 4), dtype=np.float32)
    px[:, :, :3] = np.clip(a, 0, 1)
    im.pixels[:] = px.ravel()
    im.filepath_raw = path
    im.file_format = "PNG"
    im.save()
    bpy.data.images.remove(im)
    print("wrote", path)


def tile4(a):
    """a 2k texture shrunk to a quarter and laid 4 x 4 (a box filter, then repeated)"""
    h, w = a.shape[:2]
    q = a.reshape(h // 4, 4, w // 4, 4, -1).mean(axis=(1, 3))
    return np.tile(q, (4, 4, 1))


# ---- the colour: sand_02's grain without its hue, its tone pulled to an even middle grey
diff = tile4(load(os.path.join(SRC, "sand_02_diff_2k.jpg")))
lum = diff @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
# (its slow blotches out: each pixel over a wide blur of itself, so only the grain is left)
k = 64
pad = np.pad(lum, k, mode="wrap")
cs = pad.cumsum(0).cumsum(1)
blur = (cs[2 * k:, 2 * k:] - cs[:-2 * k, 2 * k:] - cs[2 * k:, :-2 * k] + cs[:-2 * k, :-2 * k]) / (2 * k) ** 2
blur = blur[:N, :N]
grain = lum / np.maximum(blur, 1e-3)
g = np.clip(0.8 + 0.2 * np.clip(grain - 1.0, -0.6, 0.2) * 0.8, 0.64, 0.84)
save(np.repeat(g[:, :, None], 3, axis=2), os.path.join(OUT, "dunes-sand-diff.png"), True)

# ---- the ripples, as a height (metres) over the tile; u along the crests (x), v across them (the wind, z)
u = (np.arange(N, dtype=np.float32) + 0.5) / N
U, V = np.meshgrid(u, u)                      # (rows are v: image y)
two = 2 * math.pi
rng = np.random.default_rng(11)
# the crests' wander: a few whole-period waves in both directions, so the tile wraps
phase = 22.0 * V
for (fu, fv, amp) in [(1, 0, 0.55), (2, 1, 0.32), (3, -1, 0.22), (5, 2, 0.16), (7, -3, 0.12), (11, 4, 0.08), (17, -5, 0.05), (23, 7, 0.035)]:
    phase = phase + amp * np.sin(two * (fu * U + fv * V) + rng.uniform(0, two))
f = phase - np.floor(phase)
f = 1.0 - f                                   # (the steep side away from the sun, so it reads as a shadowed line, not a glint)
# the profile: up the long slope (0 .. 0.72), down the short steep one, crest and trough rounded
up = np.clip(f / 0.72, 0, 1)
dn = np.clip((f - 0.72) / 0.28, 0, 1)
prof = np.where(f < 0.72, up * up * (3 - 2 * up), 1 - dn * dn * (3 - 2 * dn))
# where crests split or die out the ripple is lower: a slow whole-period mask
amp = 0.75 + 0.25 * np.sin(two * (2 * U + 3 * V) + 1.1) * np.sin(two * (3 * U - 1 * V) + 0.4)
h = 0.0026 * prof * amp

# slopes of the ripples, by wrapped differences (metres per metre)
px = TILE / N
dhdu = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) / (2 * px)
dhdv = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) / (2 * px)
# sand_02's own grain on top, from its normal map (OpenGL: green up), a little softened
nor = tile4(load(os.path.join(SRC, "sand_02_nor_gl_2k.jpg"))) * 2 - 1
gu = -nor[:, :, 0] / np.maximum(nor[:, :, 2], 0.3) * 0.12
gv = -nor[:, :, 1] / np.maximum(nor[:, :, 2], 0.3) * 0.12
sx, sy = dhdu + gu, dhdv + gv
# (image rows run down while v runs up in the texture: Blender's pixels start at the bottom row, so rows are v as-is)
n = np.stack([-sx, -sy, np.ones_like(sx)], axis=2)
n /= np.linalg.norm(n, axis=2, keepdims=True)
save(n * 0.5 + 0.5, os.path.join(OUT, "dunes-ripple-nor.png"), False)
