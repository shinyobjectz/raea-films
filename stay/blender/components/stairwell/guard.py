# stairwell/guard: the balustrade that closes the top landing's open end, modelled by hand: a square iron newel
# with a ball cap at the well's edge, a straight run of nine balusters with knops on a bottom shoe out to the wall,
# under the same mahogany handrail, which sweeps down from the landing's own rail. Origin: the well's axis at the
# top landing's level; it stands on the landing's end at -60 degrees. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("guard")
iron = comp.mat("rail_iron", (0.03, 0.03, 0.035), rough=0.45, metal=1.0)
wood = comp.mat("rail_wood", (0.2, 0.085, 0.035), rough=0.22)
A = L.LAND1 - 2.2
ZR = L.RAIL + L.RISE
p0 = L.pol(L.R_IN + 0.07, L.LAND1, 0)
newel = comp.merge(comp.box((0.06, 0.06, ZR + 0.03), at=(p0.x, p0.y, (ZR + 0.03) / 2)), comp.box((0.085, 0.085, 0.03), at=(p0.x, p0.y, 0.015)), comp.box((0.08, 0.08, 0.02), at=(p0.x, p0.y, ZR + 0.035)), L.sphere(0.04, at=(p0.x, p0.y, ZR + 0.075), u=14, v=8))
nw = comp.mesh(col, root, "guard_newel", newel, iron)
comp.bevel(nw, 0.004, 2)
bars = []
for k in range(1, 10):
    r = L.R_IN + 0.07 + k * (L.R_WALL - L.R_IN - 0.09) / 10
    p = L.pol(r, A, 0)
    bars += [comp.cyl(0.008, ZR - 0.02, at=(p.x, p.y, 0), seg=8), comp.cyl(0.017, 0.014, at=(p.x, p.y, 0), seg=10, r2=0.011), L.sphere(0.019, at=(p.x, p.y, ZR * 0.5), u=10, v=6), L.sphere(0.012, at=(p.x, p.y, ZR * 0.5 + 0.035), u=8, v=4), L.sphere(0.012, at=(p.x, p.y, ZR * 0.5 - 0.035), u=8, v=4)]
comp.mesh(col, root, "guard_balusters", comp.merge(*bars), iron, smooth=True)
a, b = L.pol(L.R_IN + 0.07, A, ZR), L.pol(L.R_WALL + 0.0, A, ZR)
comp.mesh(col, root, "guard_handrail", comp.tube([tuple(a), tuple((a + b) / 2), tuple(b)], 0.027, res=3, sides=4), wood, smooth=True)
comp.export(col, root, "stairwell", "guard", made="blender/components/stairwell/guard.py", source="own geometry", license="ours", credit="", notes="origin: the well's axis at the top landing's level")
