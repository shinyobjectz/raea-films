# ferris/barrier: a crowd-control barrier, 2.3 m long and 1.1 m high, modelled by hand: a galvanised tube frame with
# rounded corners, eighteen upright bars, two flat bridge feet, and a hook and an eye at its ends to couple the
# next one, with a CLOSED plate cable-tied to it. Origin: on the ground at its middle, its length along x.
# Rig: "plate" swings the CLOSED plate 35 degrees on its ties.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("barrier")
galv = comp.mat("wheel_galvanised", (0.55, 0.57, 0.58), rough=0.45, metal=1.0)
red = comp.mat("fair_red", (0.55, 0.05, 0.04), rough=0.45)
white = comp.mat("barrier_letters", (0.92, 0.92, 0.88), rough=0.5)
W, Z0, Z1 = 2.3, 0.18, 1.1
r = 0.019
fr = [comp.tube([(-W / 2 + 0.06, 0, Z0), (-W / 2, 0, Z0), (-W / 2, 0, Z0 + 0.06), (-W / 2, 0, Z1 - 0.06), (-W / 2, 0, Z1), (-W / 2 + 0.06, 0, Z1), (W / 2 - 0.06, 0, Z1), (W / 2, 0, Z1), (W / 2, 0, Z1 - 0.06), (W / 2, 0, Z0 + 0.06), (W / 2, 0, Z0), (W / 2 - 0.06, 0, Z0), (-W / 2 + 0.06, 0, Z0)], r, res=4, sides=3)]
fr += [L.seg((x, 0, Z0), (x, 0, Z1), 0.008, 6) for x in [-W / 2 + (i + 1) * W / 19 for i in range(18)]]
for sx in (-1, 1):
    x = sx * (W / 2 - 0.3)
    fr += [L.seg((x, 0, Z0), (x, 0, 0.03), r, 8), comp.box((0.06, 0.6, 0.008), at=(x, 0, 0.004)), L.seg((x, -0.28, 0.008), (x, 0, 0.1), 0.01, 6), L.seg((x, 0.28, 0.008), (x, 0, 0.1), 0.01, 6)]
fr += [comp.tube([(W / 2, 0, 0.85), (W / 2 + 0.05, 0, 0.85), (W / 2 + 0.05, 0, 0.75)], 0.008, res=3, sides=2), L.torus(0.02, 0.006, seg_=12, sides=5, axis="Z", at=(-W / 2 - 0.02, 0, 0.8))]
comp.mesh(col, root, "barrier_frame", comp.merge(*fr), galv, smooth=True)
pp = comp.pivot(col, root, "barrier_plate", (0, -0.03, Z1 - 0.03))
pl = comp.mesh(col, root, "barrier_plate_board", comp.box((0.62, 0.006, 0.3), at=(0, -0.03, Z1 - 0.2)), red, parent=pp)
comp.bevel(pl, 0.002, 2)
comp.mesh(col, root, "barrier_plate_letters", xf(comp.text("CLOSED", 0.12, depth=0.002), T(0, -0.035, Z1 - 0.2)), white, parent=pp)
comp.mesh(col, root, "barrier_plate_ties", comp.merge(*[L.torus(0.024, 0.002, seg_=10, sides=3, axis="X", at=(sx * 0.26, -0.012, Z1 - 0.01)) for sx in (-1, 1)]), white, parent=pp, smooth=True)
comp.channel("plate", [(pp, "rotation_euler", 0, 0, math.radians(35))])
comp.export(col, root, "ferris", "barrier", made="blender/components/ferris/barrier.py", source="own geometry (a generic crowd barrier); letters in Blender's built-in font", license="ours", credit="", rig={"plate": "the CLOSED plate swings 35 degrees out on its ties"})
