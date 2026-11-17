# sea/sea: the sea's surface to the horizon, modelled by hand: a long swell rolling toward the camera with shorter
# seas crossing it at angles, on a mesh 700 m wide and 420 m deep that is fine (0.6 m) near the camera and coarse far
# out, glowing with the sky's mirror image as seen from the camera's mark (raea 0, 4.5, 16) and a flat skirt of deep water under
# it out past the sky. Its origin is the still-water level under the camera's mark; the swell stands +-0.5 m about it.
# Rig: "waves" runs the swell 32 m toward the camera, which is one whole period of every wave in it: it loops.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S
import numpy as np
import bpy

col, root = comp.fresh("sea")
M = _lib.maker(col, root)
L = 32.0

# the water: dark and glossy, and glowing with the sky's own picture (sea/sky's), each vertex's UV being where its
# mirror ray from the camera's mark lands on that picture. Solari's rays stop at 50 m and never reach a sky dome, so
# without this the sea is black wherever the sun's own disc is not mirrored.
if not os.path.isfile(_lib.SKY_JPG):
    comp.fail("build sea/sky.py first: the sea mirrors its picture")
# the mirror image is the sky's picture an eighth of its size: soft, as moving water mirrors a sky, and with no hard
# edge of cloud for a small change of slope to jump across
soft = os.path.join(_lib.SRC, "sea_mirror.jpg")
if not os.path.isfile(soft) or os.path.getmtime(soft) < os.path.getmtime(_lib.SKY_JPG):
    im = bpy.data.images.load(_lib.SKY_JPG)
    w, h = im.size
    px = np.empty(w * h * 4, dtype=np.float32)
    im.pixels.foreach_get(px)
    k = 8
    px = px.reshape(h, w, 4)[: h // k * k, : w // k * k].reshape(h // k, k, w // k, k, 4).mean((1, 3))
    for _ in range(2):                                    # and a little more blur along the horizon
        px = (np.roll(px, 1, 1) + px * 2 + np.roll(px, -1, 1)) / 4
    px[..., 3] = 1
    o = bpy.data.images.new("sea_mirror", w // k, h // k)
    o.pixels.foreach_set(px.ravel())
    o.filepath_raw = soft
    o.file_format = "JPEG"
    o.save()
    bpy.data.images.remove(im)
water = _lib.glow_tex("sea_water", soft, strength=1500.0)
b = next(n for n in water.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
b.inputs["Base Color"].default_value = (0.012, 0.034, 0.046, 1)
b.inputs["Roughness"].default_value = 0.22
b.inputs["Specular IOR Level"].default_value = 0.5
EYE = _lib.Vector((0.0, -50.0, 11.0))   # further back and higher than the camera, so the image holds as the swell runs

def axis(lo, hi, fine_lo, fine_hi, step, grow=1.16):
    xs = list(np.arange(fine_lo, fine_hi + 1e-6, step))
    d, x = step, fine_hi
    while x < hi:
        d *= grow
        x = min(hi, x + d)
        xs.append(x)
    d, x = step, fine_lo
    while x > lo:
        d *= grow
        x = max(lo, x - d)
        xs.insert(0, x)
    return xs
XS = axis(-350, 350, -54, 54, 0.6)
YS = axis(-70, 390, -36, 66, 0.6)
# (periods in L toward the camera, sideways wavenumber, height, sharpness)
WAVES = [(1, 0.0, 0.34, 1.6), (2, 0.05, 0.13, 1.3), (3, -0.12, 0.075, 1.2), (5, 0.26, 0.04, 1.0), (7, -0.4, 0.022, 1.0), (11, 0.7, 0.012, 1.0)]
def height(x, y, cell):
    h = 0.0
    for n, kx, a, sharp in WAVES:
        lam = L / n
        if lam < cell * 3.2:
            continue
        s = math.sin(2 * math.pi * n * y / L + kx * x + n * 1.3)
        s = 2 * ((s + 1) / 2) ** sharp - 1
        h += a * s * (0.75 + 0.25 * math.sin(x * 0.021 + n))
    return h
def chop(x, y, cell):
    """the wind's chop, as a slope only (too fine for the mesh): it breaks the mirror up near the camera"""
    k = min(1.0, 1.0 / cell) ** 2
    sx = 0.030 * math.cos(1.1 * x + 1.7 * y) * 1.1 - 0.022 * math.cos(-1.6 * x + 2.3 * y + 1.0) * 1.6 + 0.012 * math.cos(0.4 * x + 3.1 * y + 2.0) * 0.4
    sy = 0.030 * math.cos(1.1 * x + 1.7 * y) * 1.7 + 0.022 * math.cos(-1.6 * x + 2.3 * y + 1.0) * 2.3 + 0.012 * math.cos(0.4 * x + 3.1 * y + 2.0) * 3.1
    return sx * k * 0.3, sy * k * 0.3
def mirror_uv(x, y, z, cell):
    d = 0.05
    sx = (height(x + d, y, cell) - height(x - d, y, cell)) / (2 * d)
    sy = (height(x, y + d, cell) - height(x, y - d, cell)) / (2 * d)
    cx, cy = chop(x, y, cell)
    n = _lib.Vector((-(sx + cx), -(sy + cy), 1.0)).normalized()
    i = (_lib.Vector((x, y, z)) - EYE)
    if i.length < 1e-6:
        i = _lib.Vector((0, 1, -0.2))
    i.normalize()
    r = i - 2 * i.dot(n) * n
    elev = math.degrees(math.asin(max(-1.0, min(1.0, r.z))))
    az = math.degrees(math.atan2(r.x, r.y))
    return _lib.sky_uv(az, max(0.6, min(88.0, elev)))
# three strips (near, middle, far): Solari takes at most 65,535 triangles in one glowing mesh
slide = comp.pivot(col, root, "sea_swell", (0, 0, 0))
NY = len(YS) - 1
cuts = [0, NY // 3, 2 * NY // 3, NY]
for part, (j0, j1) in enumerate(zip(cuts, cuts[1:])):
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    grid = []
    for j in range(j0, j1 + 1):
        y = YS[j]
        cy = (YS[min(j + 1, len(YS) - 1)] - YS[max(j - 1, 0)]) / 2
        row = []
        for i, x in enumerate(XS):
            cx = (XS[min(i + 1, len(XS) - 1)] - XS[max(i - 1, 0)]) / 2
            cell = max(cx, cy)
            v = bm.verts.new((x, y, height(x, y, cell)))
            row.append((v, mirror_uv(x, y, v.co.z, cell)))
        grid.append(row)
    for j in range(len(grid) - 1):
        for i in range(len(XS) - 1):
            q = (grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i])
            f = bm.faces.new([v for v, _ in q])
            for l, (_, uv) in zip(f.loops, q):
                l[uvl].uv = uv
    M(f"sea_surface_{'near middle far'.split()[part]}", bm, water, parent=slide, smooth=True)
# deep water under it and out past the sky, so no edge ever shows
deep = comp.mat("sea_deep", (0.01, 0.03, 0.042), rough=0.1)
M("sea_skirt", comp.box((1000, 1000, 0.1), at=(0, 150, -0.75)), deep)
_lib.channel("waves", [(slide, "location", 1, 0.0, -L)])
comp.export(col, root, "sea", "sea", made="blender/components/sea/sea.py", source="own geometry; its mirror image: https://polyhaven.com/a/the_sky_is_on_fire", license="ours; picture CC0", credit="Poly Haven (the_sky_is_on_fire)",
            rig={"waves": "the swell runs 32 m toward the camera (raea +z), one whole period: it loops", "mirror": "in the scene: the material sea_water glows with the sky's mirror image (1,500, the sky's 3,000 less the water's loss); under an Environment that Solari mirrors for real, turn it down"},
            notes="The swell is 0.34 m high and 32 m long with shorter seas across it; at 2.4 m/s one loop is 13.3 s.")
