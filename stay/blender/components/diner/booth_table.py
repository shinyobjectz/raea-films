# diner/booth-table: a booth's table, 1.1 x 0.7 m, modelled by hand: a cream laminate top with a ribbed aluminium edge
# and rounded corners, on a chrome column and a cast cross base with four levelling feet. 0.75 m to the top.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, rbox, T, R, S, xf

col, root = comp.fresh("booth_table")
M = _lib.maker(col, root)
chrome = comp.mat("table_chrome", (0.86, 0.86, 0.88), rough=0.14, metal=1.0)
alu = comp.mat("table_edge", (0.78, 0.78, 0.8), rough=0.3, metal=1.0)
iron = comp.mat("table_base", (0.03, 0.03, 0.033), rough=0.45)
lam = comp.mat("table_top", (0.72, 0.66, 0.5), rough=0.22)
H = 0.75


def slab(w, d, h, z, r, seg=6):
    bm = comp.box((w, d, h), at=(0, 0, z))
    bmesh.ops.bevel(bm, geom=[e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > h * 0.5], offset=r, segments=seg, profile=0.5, affect="EDGES")
    return bm


t = M("booth_table_top", slab(1.1, 0.7, 0.03, H - 0.015, 0.06), lam, smooth=False)
e = M("booth_table_edge", comp.merge(slab(1.112, 0.712, 0.008, H - 0.006, 0.066), slab(1.112, 0.712, 0.008, H - 0.018, 0.066), slab(1.106, 0.706, 0.03, H - 0.0152, 0.063)), alu, smooth=False)
M("booth_table_column", lathe([(0.07, 0.05), (0.045, 0.075), (0.038, 0.1), (0.038, H - 0.06), (0.1, H - 0.04), (0.1, H - 0.03), (0, H - 0.03)], seg=40), chrome)
arms = [comp.taper((0, 0, 0.06), (0.33 * math.cos(a), 0.24 * math.sin(a) * 1.2, 0.035), 0.09, 0.05, 0.045, 0.025) for a in (math.radians(d) for d in (40, 140, 220, 320))]
b = M("booth_table_base", comp.merge(*arms, comp.cyl(0.075, 0.06, at=(0, 0, 0.005), seg=32)), iron, smooth=False)
comp.bevel(b, 0.006, 2, angle=50)
M("booth_table_feet", comp.merge(*[comp.cyl(0.016, 0.012, at=(0.31 * math.cos(a), 0.27 * math.sin(a), 0), seg=12) for a in (math.radians(d) for d in (40, 140, 220, 320))]), chrome)
comp.export(col, root, "diner", "booth_table", made="blender/components/diner/booth_table.py",
            source="own geometry (a generic pedestal booth table)", license="ours", credit="",
            notes="the top is at 0.75 m")
