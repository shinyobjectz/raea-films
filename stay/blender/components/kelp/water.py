# kelp/water: the blue distance, modelled and painted by hand: a drum of water 34 m across and 13 m high seen from
# inside, painted from the dark green-blue of the bottom up through bright teal to the dark mirror of the far surface, with the far kelp
# standing in it as dim wavering columns. It stands on the seabed's level, round the origin. Material: water_distance
# (it glows: it is the light of the water itself). No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
import numpy as np
from comp import T, R, S, xf

col, root = comp.fresh("water")
h, w = 512, 2048
yy, xx = np.mgrid[0:h, 0:w]
v, u = yy / h, xx / w
lo, mid, hi = np.array((0.0, 0.04, 0.07)), np.array((0.0, 0.2, 0.27)), np.array((0.05, 0.42, 0.5))
t = v[..., None]
top = np.array((0.01, 0.17, 0.22))        # the dark mirror the surface is, out at its edge
img = np.where(t < 0.4, lo + (mid - lo) * (t / 0.4), np.where(t < 0.75, mid + (hi - mid) * ((t - 0.4) / 0.35), hi + (top - hi) * ((t - 0.75) / 0.25) ** 0.8))
img *= (0.85 + 0.3 * L.noise(h, w, 4, 4))[..., None]
rng = np.random.default_rng(12)
for k in range(46):                      # the far kelp: columns that waver, fainter with distance
    cx, wd, dk = rng.random(), rng.uniform(0.002, 0.007), rng.uniform(0.25, 0.75)
    top = rng.uniform(0.8, 1.0)
    line = cx + 0.006 * np.sin(v * rng.uniform(8, 16) + rng.uniform(0, 6)) + 0.01 * (v - 0.5) * rng.uniform(-1, 1)
    d = np.abs(((u - line + 0.5) % 1.0) - 0.5)
    fr = (0.8 + 0.2 * np.sin(v * 47 + k * 1.7 + 14 * u)) * wd * 2.2      # fronds, as a ragged edge
    m = np.clip(1 - d / (wd + np.maximum(fr, 0)), 0, 1) * (v < top)
    img *= (1 - dk * m)[..., None]
img = np.clip(img, 0, 1)
path = L.save_png(os.path.join(L.TEX, "water_distance.png"), np.dstack([img, np.ones((h, w))]))
m = L.picture("water_distance", path, emit=48.0, rough=1.0, base=False)
next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Alpha"].default_value = 0.97     # blended, so it throws no shadow across the forest
RR, H, SEG = 17.0, 13.0, 72
bm = bmesh.new()
uvl = bm.loops.layers.uv.new("UVMap")
for i in range(SEG):
    a0, a1 = 2 * math.pi * i / SEG, 2 * math.pi * (i + 1) / SEG
    vs = [bm.verts.new((RR * math.cos(a), RR * math.sin(a), z)) for a, z in ((a0, -0.6), (a0, H), (a1, H), (a1, -0.6))]
    f = bm.faces.new(vs)     # wound to face the middle
    for l, (uu, vv) in zip(f.loops, ((i / SEG, 0), (i / SEG, 1), ((i + 1) / SEG, 1), ((i + 1) / SEG, 0))):
        l[uvl].uv = (uu, vv)
for f in bm.faces:
    c = f.calc_center_median()
    if f.normal.dot(c) > 0:
        f.normal_flip()
comp.mesh(col, root, "water_drum", bm, m, smooth=True)
comp.export(col, root, "kelp", "water", made="blender/components/kelp/water.py", source="own geometry and painting", license="ours", credit="",
            rig={"glow": "in the scene: the material water_distance's glow (the water's own light; fog would do the same job)"})
