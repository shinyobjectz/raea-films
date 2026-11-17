# koi/moss: a cushion of moss, 0.9 m across and a hand high, modelled by hand: a low mound grown over in small
# rounded clumps (a fine bumpy surface in two greens, darker in the hollows), ragged at its edge, with a fringe of
# separate little cushions round it. For the banks, the rocks' feet and the lantern's base. No rig.
# (Poly Haven's moss_01 tufts were tried: scattered thick enough to cover, they shadow each other to black here.)
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("moss")
rng = random.Random(23)
greens = [comp.mat("moss_green", srgb((0.36, 0.52, 0.14)), rough=0.95), comp.mat("moss_deep", srgb((0.2, 0.36, 0.1)), rough=0.95), comp.mat("moss_gold", srgb((0.52, 0.6, 0.18)), rough=0.95)]
R0, H0, G = 0.45, 0.085, 84
def edge(a):
    return R0 * (0.86 + 0.12 * noise.noise(Vector((math.cos(a) * 1.7, math.sin(a) * 1.7, 5.0))))
def height(x, y):
    d = math.hypot(x, y) / edge(math.atan2(y, x))
    if d >= 1:
        return None
    base = H0 * (1 - d * d) ** 0.7
    p = Vector((x, y, 0.3))
    clump = 0.016 * abs(noise.noise(p * 16)) + 0.012 * abs(noise.noise(p * 34 + Vector((7, 3, 1)))) + 0.02 * max(0, noise.noise(p * 6))
    return 0.003 + base + clump * min(1, (1 - d) * 5)
bm = bmesh.new()
vs = {}
for i in range(G + 1):
    for j in range(G + 1):
        x, y = -R0 + 2 * R0 * i / G, -R0 + 2 * R0 * j / G
        h = height(x, y)
        if h is not None:
            vs[i, j] = bm.verts.new((x, y, h))
for i in range(G):
    for j in range(G):
        q = [vs.get(k) for k in ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))]
        if all(q):
            f = bm.faces.new(q)
            c = f.calc_center_median()
            n = noise.noise(Vector((c.x * 16, c.y * 16, 0.3)))
            f.material_index = 1 if abs(n) < 0.08 else (2 if noise.noise(Vector((c.x * 4, c.y * 4, 9.0))) > 0.25 else 0)
M("moss_cushion", bm, greens, smooth=True)
blobs = []
for _ in range(60):
    a = rng.uniform(0, 2 * math.pi)
    r = edge(a) * rng.uniform(0.9, 1.12)
    s = rng.uniform(0.02, 0.05)
    blobs.append(sphere(s, at=(r * math.cos(a), r * math.sin(a), 0.004), u=10, v=6, scale=(1, 1, 0.45)))
M("moss_fringe", comp.merge(*blobs), greens[0], smooth=True)
done(col, root, "moss", "own geometry (a moss cushion)")
