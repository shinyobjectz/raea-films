# koi/pond: the koi pond, modelled by hand: a kidney-shaped pool about 4 x 3 m, its pebbled bed shelving to 0.6 m
# (Poly Haven's ganges_river_pebbles, CC0), a rim of forty-odd weathered, lichened stones of mixed sizes set round
# the water's edge with four larger accent rocks (lichen_rock), and the water's surface as a part of its own
# (pond_water), 7 cm below the ground. The shell's centre: its origin is the pond's middle at ground level.
# Rig: "level" is a clip that drops the water 0.25 m (a drought, a drain); the water's colour and shine are the
# scene's (the material pond_water).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("pond")
rng = random.Random(4)
bed = comp.ph_texture("pond_bed", "ganges_river_pebbles", tile=1.4, res="2k", tint=(0.55, 0.62, 0.5))
rock = comp.ph_texture("pond_stone", "lichen_rock", tile=1.2, res="2k")
water = comp.mat("pond_water", srgb((0.1, 0.24, 0.2)), rough=0.03, alpha=0.62)
N = 96
bm = bmesh.new()
rings = []
for k, z in ((1.06, 0.0), (1.0, WATER - 0.03), (0.86, -0.3), (0.6, -0.52), (0.3, -0.6)):
    rings.append([bm.verts.new(shore_pt(2 * math.pi * i / N, k, z)) for i in range(N)])
c = bm.verts.new((0, 0, -0.62))
for a, b in zip(rings, rings[1:]):
    for i in range(N):
        bm.faces.new((a[i], a[(i + 1) % N], b[(i + 1) % N], b[i]))
for i in range(N):
    bm.faces.new((rings[-1][i], rings[-1][(i + 1) % N], c))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bmesh.ops.reverse_faces(bm, faces=[f for f in bm.faces]) if sum(f.normal.z for f in bm.faces) < 0 else None
b = M("pond_bed", bm, bed, smooth=True)
comp.uv_box(b, 1.0)
lv = comp.pivot(col, root, "pond_level", (0, 0, WATER))
w = bmesh.new()
cv = w.verts.new((0, 0, WATER))
ws = [w.verts.new(shore_pt(2 * math.pi * i / N, 1.005, WATER)) for i in range(N)]
for i in range(N):
    w.faces.new((cv, ws[i], ws[(i + 1) % N]))
M("pond_water", w, water, parent=lv)
stones = []
a = 0.0
while a < 2 * math.pi - 0.05:
    sz = rng.uniform(0.24, 0.5)
    p = shore_pt(a, 1.0 + (sz * 0.3) / shore(a), 0)
    stones.append(stone(rng, (sz * rng.uniform(0.9, 1.4), sz, sz * rng.uniform(0.6, 0.95)), at=(p.x, p.y, WATER - 0.06)))
    a += (sz * rng.uniform(0.78, 0.95)) / (shore(a) * 1.15)
rim = M("pond_rim", comp.merge(*stones), rock, smooth=True)
comp.uv_box(rim, 1.0)
big = []
for a, sz in ((0.5, 0.75), (2.5, 0.9), (3.9, 0.65), (5.4, 0.8)):
    p = shore_pt(a, 1.0 + 0.3 / shore(a), 0)
    big.append(stone(rng, (sz * 1.2, sz, sz * 0.75), at=(p.x, p.y, WATER - 0.15), sub=4, rough=0.3))
acc = M("pond_rocks", comp.merge(*big), rock, smooth=True)
comp.uv_box(acc, 1.0)
channel("level", [(lv, "location", 2, lv.location.z, lv.location.z - 0.25)])
done(col, root, "pond", "own geometry; https://polyhaven.com/a/ganges_river_pebbles and https://polyhaven.com/a/lichen_rock (CC0)", license="CC0", credit="Poly Haven (textures)",
     rig={"level": "the water's surface down 0.25 m", "water": "in the scene: the material pond_water's colour, clearness and shine"})
