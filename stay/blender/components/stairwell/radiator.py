# stairwell/radiator: a cast-iron column radiator, 12 sections, 0.74 m wide and 0.66 m high, modelled by hand: each
# section two round columns between rounded top and bottom headers with a web between, the sections butted on their
# bosses, two cast feet, a wheel valve with its union and tail at one end and a lockshield at the other, both pipes
# dropping into floor plates. Its back toward the wall (y 0 is the wall; it stands 4 cm off it), origin on the floor
# at its middle. Rig: "valve" turns the valve's wheel head one whole turn.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("radiator")
iron = comp.mat("radiator_paint", (0.74, 0.72, 0.64), rough=0.38)
brass = comp.mat("radiator_brass", (0.72, 0.52, 0.2), rough=0.3, metal=1.0)
black = comp.mat("radiator_wheel", (0.03, 0.03, 0.03), rough=0.5)
copper = comp.mat("radiator_copper", (0.7, 0.36, 0.2), rough=0.3, metal=1.0)
M = lambda n, bm, m, parent=None, smooth=True: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
NS, PITCH, HT, DEPTH, Z0 = 12, 0.06, 0.6, 0.14, 0.06
YC = -0.04 - DEPTH / 2
secs = []
for k in range(NS):
    x = (k - (NS - 1) / 2) * PITCH
    for dy in (-0.042, 0.042):
        secs.append(comp.cyl(0.019, HT - 0.06, at=(x, YC + dy, Z0 + 0.03), seg=14))
    for z in (Z0 + 0.03, Z0 + HT - 0.03):
        hd = comp.cyl(0.03, DEPTH - 0.06, at=(x, YC - (DEPTH - 0.06) / 2, z), seg=14, axis="Y")
        secs += [hd, L.sphere(0.03, at=(x, YC - (DEPTH - 0.06) / 2, z), u=14, v=8), L.sphere(0.03, at=(x, YC + (DEPTH - 0.06) / 2, z), u=14, v=8)]
        secs.append(comp.cyl(0.022, PITCH, at=(x - PITCH / 2, YC, z), seg=12, axis="X"))
    secs.append(comp.box((0.008, 0.07, HT - 0.1), at=(x, YC, Z0 + HT / 2)))
M("radiator_sections", comp.merge(*secs), iron)
feet = []
for x in (-(NS - 1) / 2 * PITCH, (NS - 1) / 2 * PITCH):
    for dy in (-0.045, 0.045):
        feet.append(comp.cyl(0.02, Z0 + 0.03, at=(x, YC + dy, 0), seg=12, r2=0.014))
M("radiator_feet", comp.merge(*feet), iron)
XE = NS / 2 * PITCH
ZV = Z0 + 0.03
M("radiator_valve_body", comp.merge(comp.cyl(0.014, 0.07, at=(XE - 0.01, YC, ZV), seg=12, axis="X"), comp.cyl(0.02, 0.025, at=(XE + 0.01, YC, ZV), seg=6, axis="X"), L.sphere(0.022, at=(XE + 0.065, YC, ZV), u=12, v=8),
                                    comp.cyl(0.013, 0.05, at=(XE + 0.065, YC, ZV), seg=12),
                                    comp.cyl(0.014, 0.07, at=(-XE - 0.06, YC, ZV), seg=12, axis="X"), L.sphere(0.022, at=(-XE - 0.065, YC, ZV), u=12, v=8), comp.cyl(0.016, 0.035, at=(-XE - 0.065, YC, ZV), seg=12, r2=0.012)), brass)
M("radiator_pipes", comp.merge(comp.cyl(0.0075, ZV, at=(XE + 0.065, YC, 0), seg=10), comp.cyl(0.0075, ZV, at=(-XE - 0.065, YC, 0), seg=10)), copper)
M("radiator_floor_plates", comp.merge(comp.cyl(0.025, 0.004, at=(XE + 0.065, YC, 0), seg=16), comp.cyl(0.025, 0.004, at=(-XE - 0.065, YC, 0), seg=16)), comp.mat("radiator_chrome", (0.85, 0.85, 0.87), rough=0.15, metal=1.0))
wp = comp.pivot(col, root, "radiator_valve", (XE + 0.065, YC, ZV + 0.05))
M("radiator_valve_wheel", comp.merge(comp.cyl(0.024, 0.026, at=(XE + 0.065, YC, ZV + 0.05), seg=10, r2=0.02), *[comp.box((0.008, 0.052, 0.022), at=(XE + 0.065, YC, ZV + 0.063)), comp.box((0.052, 0.008, 0.022), at=(XE + 0.065, YC, ZV + 0.063))]), black, parent=wp, smooth=False)
comp.channel("valve", [(wp, "rotation_euler", 2, 0, 2 * math.pi)])
comp.export(col, root, "stairwell", "radiator", made="blender/components/stairwell/radiator.py", source="own geometry (a generic cast-iron column radiator)", license="ours", credit="", rig={"valve": "the valve's wheel head turns one whole turn"})
