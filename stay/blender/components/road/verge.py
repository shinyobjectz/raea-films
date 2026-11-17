# road/verge: the ground beside one 40 m section of road, 12 m deep, for the road's right side (turn a copy half a
# turn for the left): a gravel shoulder falling away from the asphalt, a ditch with a dark wet bottom, a bank, and a
# forest floor of needle litter that heaves and rises toward the trees, with moss hummocks. Its inner edge meets
# road/road's edge course at x 3.6.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

from mathutils import noise
col, root = comp.fresh("verge")
M = _lib.meshers(col, root)
W, L = _lib.ROAD_W, _lib.ROAD_L
gravel = comp.ph_texture("verge_gravel", "gravel_floor_03", tile=1.6, res="1k", tint=(0.5, 0.48, 0.46))
floor = comp.ph_texture("verge_floor", "forest_ground_04", tile=3.0, res="2k", tint=(0.62, 0.6, 0.55))
moss = comp.ph_texture("verge_moss", "mossy_rock", tile=1.5, res="1k", tint=(0.55, 0.75, 0.4))
water = comp.mat("verge_ditch_water", (0.015, 0.018, 0.02), rough=0.05, alpha=0.85)
X0 = W / 2 + 0.3
E0 = _lib.road_z(W / 2, 0) - 0.03 - 0.55 * 0.3 ** 1.4

def gz(x, y):
    d = x - X0
    z = E0 - 0.07 * min(d, 1.1)                                           # the shoulder's fall
    z -= 0.5 * math.exp(-((d - 2.3 - 0.25 * math.sin(y * 0.21)) / 0.8) ** 2)   # the ditch, wandering a little
    rise = max(0.0, d - 3.0)
    z += 0.09 * rise + 0.25 * (1 - math.exp(-rise))                             # the bank, then a slow climb
    amp = min(1.0, max(0.0, d - 0.6) / 2.5)
    z += amp * (0.22 * noise.noise(Vector((x * 0.35, y * 0.35, 1.0))) + 0.07 * noise.noise(Vector((x * 1.3, y * 1.3, 5.0))))
    return z

sh = M("verge_shoulder", _lib.sheet(6, 100, X0 - 0.05, X0 + 1.2, -L / 2, L / 2, gz), gravel, smooth=True)
_lib.uv_top(sh, 1.0)
gr = M("verge_ground", _lib.sheet(54, 120, X0 + 1.2, X0 + 12.0, -L / 2, L / 2, gz), floor, smooth=True)
_lib.uv_top(gr, 1.0)
# gravel spilled past the shoulder's edge: a ragged apron over the ground's first half metre
ap = _lib.sheet(3, 100, X0 + 1.15, X0 + 1.75, -L / 2, L / 2, lambda x, y: gz(x, y) + 0.008)
for v in ap.verts:
    if v.co.x > X0 + 1.5:
        v.co.x += 0.25 * noise.noise(Vector((v.co.y * 1.2, 2.0, 0)))
        v.co.z = gz(v.co.x, v.co.y) + 0.006
a = M("verge_gravel_spill", ap, gravel, smooth=True)
_lib.uv_top(a, 1.0)
# standing water along the ditch's bottom
wb = _lib.sheet(4, 80, X0 + 1.7, X0 + 3.0, -L / 2, L / 2, lambda x, y: E0 - 0.47)
M("verge_ditch_water", wb, water)
# moss hummocks on the bank and under the trees
rnd = random.Random(12)
hs = []
for i in range(46):
    x, y = X0 + rnd.uniform(3.2, 11.5), rnd.uniform(-L / 2 + 0.8, L / 2 - 0.8)
    r = rnd.uniform(0.25, 0.9)
    b = bmesh.new()
    bmesh.ops.create_icosphere(b, subdivisions=3, radius=1.0)
    for v in b.verts:
        n = 1 + 0.18 * noise.noise(v.co * 2.0 + Vector((i, 0, 0)))
        v.co = Vector((v.co.x * r * n, v.co.y * r * n * rnd.uniform(0.95, 1.05), v.co.z * r * 0.32 * n))
    xf(b, T(x, y, gz(x, y) - 0.02)); hs.append(b)
hm = M("verge_moss", comp.merge(*hs), moss, smooth=True)
_lib.uv_top(hm, 1.0)
# the outer skirt, so the ground has an edge from the side
comp.uv_box(M("verge_skirt", comp.box((12.0, L, 0.05), at=(X0 + 6.0, 0, -0.9)), floor), 1.0)
_lib.done(col, root, "verge", source="own geometry; https://polyhaven.com/a/gravel_floor_03, https://polyhaven.com/a/forest_ground_04, https://polyhaven.com/a/mossy_rock",
          license="ours; textures CC0", credit="Poly Haven (gravel_floor_03, forest_ground_04, mossy_rock)",
          notes="The right-hand verge, from x 3.9 to 15.9, at road/road's origin. For the left, a copy turned half a turn about y. Ground height: shoulder -0.15, ditch -0.6 at x 6.2, bank and floor +0.3 to +1.3 beyond x 8.")
