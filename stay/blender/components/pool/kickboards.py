# pool/kickboards: the swim-aids trolley, modelled by hand at real size: a tubular steel cart 1.1 m long on four
# casters with two shelves, sixteen foam kickboards standing in a row on the top shelf, six two-colour pull buoys on
# the lower one, and seven foam noodles standing in a hoop at its end. No rig (where it stands is the scene's).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("kickboards")
frame_m = steel("pool_steel", 0.25)
shelf_m = comp.mat("pool_cart_shelf", (0.86, 0.87, 0.85), rough=0.5)
rub = comp.mat("pool_rubber", (0.02, 0.02, 0.02), rough=0.8)
FOAM = {"blue": (0.05, 0.25, 0.8), "yellow": (0.95, 0.75, 0.05), "red": (0.85, 0.1, 0.07), "green": (0.1, 0.6, 0.25), "white": (0.92, 0.92, 0.9), "orange": (0.95, 0.4, 0.05), "pink": (0.9, 0.25, 0.5)}
foam = {k: comp.mat(f"pool_foam_{k}", v, rough=0.85) for k, v in FOAM.items()}
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
L, D, H = 1.1, 0.5, 0.95
tubes = [rod((sx * L / 2, sy * D / 2, 0.11), (sx * L / 2, sy * D / 2, H), 0.014) for sx in (-1, 1) for sy in (-1, 1)]
for z in (0.17, 0.57, H):
    tubes.append(pipe([(-L / 2, -D / 2, z), (L / 2, -D / 2, z), (L / 2, D / 2, z), (-L / 2, D / 2, z)], 0.011 if z < H else 0.014, cyclic=True))
tubes.append(pipe(bend([(-L / 2, -D / 2, H), (-L / 2 - 0.14, -D / 2, H + 0.06), (-L / 2 - 0.14, D / 2, H + 0.06), (-L / 2, D / 2, H)], 0.05, 4), 0.014))   # the push handle
tubes.append(pipe([(0.3 + 0.19 * math.cos(a), 0.19 * math.sin(a), 1.25) for a in [i * math.pi / 12 for i in range(24)]], 0.008, cyclic=True))    # the noodles' hoop
tubes += [rod((0.3 + 0.19 * sx, 0.0, H), (0.3 + 0.19 * sx, 0.0, 1.25), 0.008) for sx in (-1, 1)]
M("kickboards_cart", comp.merge(*tubes), frame_m, smooth=True)
sh = M("kickboards_shelves", comp.merge(*[comp.box((L - 0.03, D - 0.03, 0.012), at=(0, 0, z)) for z in (0.18, 0.58)]), shelf_m)
comp.bevel(sh, 0.003, 1)
cast = []
for sx in (-1, 1):
    for sy in (-1, 1):
        cast.append(comp.cyl(0.045, 0.028, at=(sx * L / 2 - 0.014, sy * D / 2 + 0.02, 0.045), seg=20, axis="X"))
        cast.append(comp.box((0.04, 0.012, 0.075), at=(sx * L / 2, sy * D / 2, 0.085)))
M("kickboards_casters", comp.merge(*cast), rub, smooth=False)
random.seed(4)
groups = {}
for i in range(16):
    c = ("blue", "yellow", "red", "blue", "green")[i % 5]
    b = comp.box((0.028, 0.3, 0.46))
    for v in b.verts:
        if v.co.z > 0:
            v.co.y *= 0.82          # a kickboard's rounded nose is narrower
    xf(b, T(-0.5 + 0.02 + i * 0.036, random.uniform(-0.03, 0.03), 0.586 + 0.23) @ R(random.uniform(-4, 4), "Y"))
    groups.setdefault(c, []).append(b)
for c, bms in groups.items():
    o = M(f"kickboards_boards_{c}", comp.merge(*bms), foam[c], smooth=False)
    comp.bevel(o, 0.011, 3)
for half, c in ((0, "blue"), (1, "white")):
    bu = []
    for i in range(6):
        x = -0.4 + i * 0.165
        for dz, r in ((0.065, 0.065), (0.165, 0.05)):
            bu.append(comp.cyl(r, 0.115, at=(x, -0.115 + half * 0.115, 0.186 + dz), seg=20, axis="Y"))
    o = M(f"kickboards_pull_buoys_{c}", comp.merge(*bu), foam[c], smooth=True)
noodles = []
for i, c in enumerate(("orange", "green", "pink", "yellow", "blue", "red", "green")):
    a = i * 2 * math.pi / 7
    r = 0.11 if i < 6 else 0.0
    n = comp.cyl(0.033, 1.5, seg=16)
    xf(n, T(0.3 + r * math.cos(a), r * math.sin(a), 0.588) @ R(random.uniform(-2.5, 2.5), "X") @ R(random.uniform(-2.5, 2.5), "Y"))
    M(f"kickboards_noodle_{i + 1}", n, foam[c], smooth=True)
done(col, root, "kickboards", source="own geometry (a generic swim-aids trolley: kickboards, pull buoys, noodles)", rig={"position": "the Model's own position on the deck"})
