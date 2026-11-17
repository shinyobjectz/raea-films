# pool/ceiling: one 16 x 7.5 m bay of the hall's ceiling (four bays roof it), modelled by hand: a painted plaster
# soffit (its underside at z 0, the origin its middle), two downstand beams across the hall, a galvanised ventilation
# duct on rod hangers down one side with flanged joints and three jet nozzles aimed at the water, and a conduit run
# with junction boxes for the tubes. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("ceiling")
plaster_m = plaster()
galv = comp.mat("pool_duct", (0.66, 0.68, 0.69), rough=0.38, metal=1.0)
cond = comp.mat("pool_conduit", (0.6, 0.61, 0.6), rough=0.5, metal=1.0)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
BAY = 7.5
s = M("ceiling_soffit", comp.box((HALL_W, BAY, 0.25), at=(0, 0, 0.125)), plaster_m)
comp.uv_box(s, 1.0)
b = M("ceiling_beams", comp.merge(*[comp.box((HALL_W, 0.3, 0.55), at=(0, y, -0.275)) for y in (-BAY / 4, BAY / 4)]), plaster_m)
comp.bevel(b, 0.015, 2)
comp.uv_box(b, 1.0)
DX, DZ, DR = -5.6, -1.05, 0.25
duct = [comp.cyl(DR, BAY, at=(DX, -BAY / 2, DZ), seg=40, axis="Y")]
duct += [comp.cyl(DR + 0.022, 0.03, at=(DX, y - 0.015, DZ), seg=40, axis="Y") for y in (-3.0, -1.5, 0.0, 1.5, 3.0)]
M("ceiling_duct", comp.merge(*duct), galv, smooth=True)
noz = []
for y in (-2.25, 0.0, 2.25):
    n = turn([(0.085, 0.0), (0.085, 0.1), (0.11, 0.17), (0.1, 0.18), (0.07, 0.11), (0.07, 0.0)], seg=24)
    noz.append(xf(n, T(DX, y, DZ) @ R(115, "Y") @ T(0, 0, DR - 0.02)))
M("ceiling_nozzles", comp.merge(*noz), galv, smooth=True)
hang = []
for y in (-3.3, -1.1, 1.1, 3.3):
    hang += [comp.cyl(0.005, -DZ - 0.0, at=(DX + sx * (DR + 0.03), y, DZ), seg=8) for sx in (-1, 1)]
    hang.append(comp.box((2 * DR + 0.1, 0.03, 0.006), at=(DX, y, DZ - DR - 0.003)))
    hang += [comp.cyl(0.005, DR + 0.004, at=(DX + sx * (DR + 0.03), y, DZ - DR - 0.004), seg=8) for sx in (-1, 1)]
M("ceiling_duct_hangers", comp.merge(*hang), galv)
# conduit: three runs along the hall under the soffit, dropping under each beam, a box where each tube fitting hangs
runs = []
for x in (-3.0, 0.0, 3.0):
    pts = [(x + 0.45, -BAY / 2, -0.02)]
    for y in (-BAY / 4, BAY / 4):
        pts += [(x + 0.45, y - 0.22, -0.02), (x + 0.45, y - 0.2, -0.57), (x + 0.45, y + 0.2, -0.57), (x + 0.45, y + 0.22, -0.02)]
    pts.append((x + 0.45, BAY / 2, -0.02))
    runs.append(pipe(bend(pts, 0.04, 3), 0.011, sides=2))
    runs += [comp.box((0.09, 0.09, 0.045), at=(x + 0.45, y, -0.0225)) for y in (-BAY / 2 + 0.6, 0.0, BAY / 2 - 0.6)]
M("ceiling_conduit", comp.merge(*runs), cond)
done(col, root, "ceiling", source="own geometry; plaster https://polyhaven.com/a/painted_plaster_wall", license="ours; texture CC0", credit="Poly Haven (painted_plaster_wall)",
     notes="origin: the bay's middle at the soffit (z 0); tube fittings hang at x -3, 0, 3 between the beams")
