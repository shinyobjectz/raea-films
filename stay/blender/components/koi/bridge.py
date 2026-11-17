# koi/bridge: an arched garden footbridge, modelled by hand: 2.6 m span, 1 m wide, rising 0.45 m, twenty-six cedar
# deck boards on two curved stringers (Poly Haven's japanese_cedar_planks, CC0), four vermilion posts a side with
# bronze onion caps on the end ones, two vermilion rails a side following the arch, and a footing stone at each
# corner. It spans along x, its side toward -y; its ends on the ground at z 0. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("bridge")
rng = random.Random(6)
cedar = comp.ph_texture("bridge_deck", "japanese_cedar_planks", tile=1.13, res="1k", tint=(0.75, 0.68, 0.6))
red = comp.mat("bridge_vermilion", srgb((0.74, 0.14, 0.08)), rough=0.45)
bronze = comp.mat("bridge_bronze", srgb((0.25, 0.2, 0.12)), rough=0.4, metal=0.8)
rock = comp.ph_texture("bridge_footing", "lichen_rock", tile=0.9, res="1k")
SPAN, RISE, WID = 2.6, 0.45, 1.0
RB = ((SPAN / 2) ** 2 + RISE ** 2) / (2 * RISE)
CZ = RISE - RB
HALF = math.asin(SPAN / 2 / RB)
def on(a, r=0.0, y=0.0):
    return T((RB + r) * math.sin(a), y, CZ + (RB + r) * math.cos(a)) @ Matrix.Rotation(a, 4, "Y")
NP = 26
boards = []
for i in range(NP):
    a = -HALF + (i + 0.5) * 2 * HALF / NP
    boards.append(xf(comp.box((2 * HALF * RB / NP - 0.008, WID, 0.035), at=(0, 0, 0.0175)), on(a) @ R(rng.uniform(-0.6, 0.6), "Z")))
d = M("bridge_deck", comp.merge(*boards), cedar)
comp.uv_box(d, 1.0)
comp.bevel(d, 0.003, 2)
NS = 40
st = [xf(comp.box((2 * HALF * RB / NS + 0.004, 0.09, 0.14), at=(0, 0, -0.07)), on(-HALF + (i + 0.5) * 2 * HALF / NS, y=sy * 0.38)) for i in range(NS) for sy in (-1, 1)]
s = M("bridge_stringers", comp.merge(*st), red)
posts, caps, rails, foot = [], [], [], []
PA = [-HALF * 0.97, -HALF * 0.33, HALF * 0.33, HALF * 0.97]
for sy in (-1, 1):
    for k, a in enumerate(PA):
        x, z = RB * math.sin(a), CZ + RB * math.cos(a)
        end = k in (0, 3)
        h = 0.95 if end else 0.82
        posts.append(comp.box((0.09, 0.09, h + 0.2), at=(x, sy * (WID / 2 + 0.01), z - 0.2 + (h + 0.2) / 2)))
        if end:
            caps.append(turn([(0.0, 0.0), (0.05, 0.0), (0.055, 0.02), (0.035, 0.035), (0.062, 0.08), (0.055, 0.12), (0.02, 0.16), (0.0, 0.175)], z + h, seg=20, at=(x, sy * (WID / 2 + 0.01))))
            foot.append(stone(rng, (0.34, 0.3, 0.16), at=(x, sy * (WID / 2 + 0.01), z - 0.24), rough=0.12, flat=0.5))
        else:
            caps.append(comp.box((0.11, 0.11, 0.02), at=(x, sy * (WID / 2 + 0.01), z + h + 0.01)))
    for r in (0.36, 0.72):
        NR = 48
        for i in range(NR):
            a = -HALF * 0.97 + (i + 0.5) * 2 * HALF * 0.97 / NR
            rails.append(xf(comp.box((2 * HALF * 0.97 * (RB + r) / NR + 0.003, 0.05, 0.06)), on(a, r=r, y=sy * (WID / 2 + 0.01))))
p = M("bridge_posts", comp.merge(*posts), red)
comp.bevel(p, 0.006, 2)
M("bridge_rails", comp.merge(*rails), red)
shade(M("bridge_caps", comp.merge(*caps), bronze), 40)
f = M("bridge_footings", comp.merge(*foot), rock, smooth=True)
comp.uv_box(f, 1.0)
done(col, root, "bridge", "own geometry (a generic arched garden bridge); https://polyhaven.com/a/japanese_cedar_planks and https://polyhaven.com/a/lichen_rock (CC0)", license="CC0", credit="Poly Haven (textures)")
