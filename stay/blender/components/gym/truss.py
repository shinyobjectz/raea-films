# gym/truss: an open-web steel roof joist, 18 m long and 0.9 m deep, modelled by hand: double-angle top and bottom
# chords, a zigzag of round web bars, bearing seats at both ends, bridging angles, and a painted sprinkler pipe hung
# under it on clevis hangers. Its top at z 0 (the roof deck), running along x.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rod, T, R, S, xf

col, root = comp.fresh("truss")
M = _lib.maker(col, root)
L, Dp = 18.0, 0.9
steel = comp.mat("truss_steel", (0.5, 0.47, 0.4), rough=0.6)
red = comp.mat("truss_sprinkler", (0.45, 0.03, 0.02), rough=0.45)
ch = []
for z in (-0.04, -Dp):
    for sy in (-1, 1):
        ch.append(comp.box((L, 0.06, 0.008), at=(0, sy * 0.045, z + 0.036)))
        ch.append(comp.box((L, 0.008, 0.06), at=(0, sy * 0.015, z + 0.006 + 0.03 - 0.03)))
n = 20
web = []
for i in range(n):
    x0, x1 = -L / 2 + i * L / n, -L / 2 + (i + 1) * L / n
    a, b = ((x0, 0, -0.03), (x1, 0, -Dp + 0.03)) if i % 2 == 0 else ((x0, 0, -Dp + 0.03), (x1, 0, -0.03))
    web.append(rod(a, b, 0.014, seg=8))
web += [comp.box((0.2, 0.16, 0.012), at=(sx * (L / 2 - 0.1), 0, -0.07)) for sx in (-1, 1)]
web += [comp.box((0.05, 2.0, 0.05), at=(x, 0, -Dp + 0.06)) for x in (-6, 0, 6)]
M("truss_chords", comp.merge(*ch), steel, smooth=False)
M("truss_web", comp.merge(*web), steel)
sp = [comp.cyl(0.03, L, at=(-L / 2, 0.25, -Dp - 0.25), seg=12, axis="X")]
for x in range(-8, 9, 4):
    sp.append(rod((x, 0.25, -Dp - 0.25), (x, 0.25, -Dp + 0.03), 0.005, seg=6))
    sp.append(_lib.torus(0.036, 0.005, seg=14, sides=4, at=(x, 0.25, -Dp - 0.25), axis="X"))
for x in range(-6, 7, 4):
    sp.append(comp.cyl(0.012, 0.08, at=(x, 0.25, -Dp - 0.36), seg=8))
    sp.append(_lib.lathe([(0, 0), (0.03, 0.002), (0, 0.004)], seg=10, at=(x, 0.25, -Dp - 0.375)))
M("truss_sprinkler", comp.merge(*sp), red)
comp.export(col, root, "gym", "truss", made="blender/components/gym/truss.py",
            source="own geometry (a generic open-web roof joist and sprinkler main)", license="ours", credit="")
