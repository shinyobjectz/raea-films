# garage/pipes: 10 m of the services under the soffit (their hangers' tops at z 0, the run along x through the origin),
# modelled by hand: a red sprinkler main with grooved couplings and four drops to pendant heads, a dark grey drain
# with collars and a rodding eye, and two galvanised conduits through a junction box, all on six trapeze hangers
# (two threaded rods and a strut channel each) with U-bolts. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("pipes")
M = L.maker(col, root)
red = comp.mat("pipes_red", (0.5, 0.03, 0.025), rough=0.42)
pvc = comp.mat("pipes_drain", (0.09, 0.095, 0.1), rough=0.5)
galv = comp.mat("pipes_galvanised", (0.62, 0.63, 0.64), rough=0.36, metal=1.0)
brass = comp.mat("pipes_brass", (0.75, 0.6, 0.3), rough=0.3, metal=1.0)
LEN, ZS = 10.0, -0.42
hang = []
for i in range(6):
    x = -LEN / 2 + 0.5 + i * 1.8
    hang += [comp.cyl(0.005, -ZS + 0.02, at=(x, s * 0.34, ZS - 0.02), seg=8) for s in (-1, 1)]
    hang.append(comp.box((0.04, 0.76, 0.04), at=(x, 0, ZS - 0.02)))
    hang += [comp.cyl(0.011, 0.008, at=(x, s * 0.34, ZS - 0.048), seg=6) for s in (-1, 1)] + [comp.cyl(0.011, 0.008, at=(x, s * 0.34, ZS), seg=6) for s in (-1, 1)]
    for y, r in ((-0.18, 0.045), (0.14, 0.055)):
        hang.append(L.sweep([(x, y + (r + 0.004) * math.cos(a), ZS + r + (r + 0.004) * math.sin(a)) for a in [math.radians(d) for d in range(-20, 201, 20)]], L.rrect(0.012, 0.004, 0.001, 1), up=(1, 0, 0)))
M("pipes_hangers", comp.merge(*hang), galv)
main = [comp.cyl(0.045, LEN, at=(-LEN / 2, -0.18, ZS + 0.045), seg=24, axis="X")]
for x in (-4.6, -1.6, 1.4, 4.4):
    main.append(comp.cyl(0.056, 0.05, at=(x, -0.18, ZS + 0.045), seg=24, axis="X"))
    main += [comp.box((0.03, 0.025, 0.03), at=(x + 0.025, -0.18 + s * 0.062, ZS + 0.045)) for s in (-1, 1)]
drops = []
for x in (-3.75, -1.25, 1.25, 3.75):
    main.append(comp.cyl(0.03, 0.05, at=(x, -0.18, ZS - 0.03), seg=16))
    main.append(comp.cyl(0.016, 0.1, at=(x, -0.18, ZS - 0.12), seg=12))
    drops.append(L.lathe([(0.009, 0), (0.012, -0.012), (0.006, -0.02), (0.004, -0.04), (0.002, -0.05), (0.024, -0.052), (0.024, -0.054), (0, -0.054)], 14, at=(x, -0.18, ZS - 0.12)))
    drops += [comp.box((0.003, 0.003, 0.04), at=(x + s * 0.012, -0.18, ZS - 0.14)) for s in (-1, 1)]
m = M("pipes_sprinkler_main", comp.merge(*main), red, smooth=True)
L.sharp(m, 40)
M("pipes_sprinkler_heads", comp.merge(*drops), brass, smooth=True)
dr = [comp.cyl(0.055, LEN, at=(-LEN / 2, 0.14, ZS + 0.055), seg=24, axis="X")] + [comp.cyl(0.062, 0.07, at=(x, 0.14, ZS + 0.055), seg=24, axis="X") for x in (-3.4, -0.9, 1.6, 4.1)]
dr.append(comp.cyl(0.05, 0.09, at=(2.6, 0.14, ZS - 0.03), seg=20))
dr.append(comp.cyl(0.058, 0.02, at=(2.6, 0.14, ZS - 0.045), seg=8))
d = M("pipes_drain", comp.merge(*dr), pvc, smooth=True)
L.sharp(d, 40)
cd = [comp.cyl(0.011, LEN, at=(-LEN / 2, y, ZS + 0.011), seg=10, axis="X") for y in (0.26, 0.295)] + [comp.box((0.12, 0.1, 0.06), at=(0.9, 0.277, ZS + 0.03))]
c = M("pipes_conduits", comp.merge(*cd), galv, smooth=True)
L.sharp(c, 40)
L.look(col, "pipes", eye=(3.5, -2.5, -1.4), target=(0.5, 0, -0.35), lens=30)
comp.export(col, root, "garage", "pipes", made="blender/components/garage/pipes.py", source="own geometry", license="ours", credit="", rig={},
            notes="A 10 m run along x; the hangers' tops at z 0 (the soffit); runs butt end to end.")
