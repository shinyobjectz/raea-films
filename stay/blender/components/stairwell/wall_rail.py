# stairwell/wall-rail: the handrail on the wall side of one storey's flight, modelled by hand: a brass tube 8 cm off
# the wall on a cast bracket every other tread, turned back into the wall at both ends. Origin: the well's axis at
# the landing's level. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("wall_rail")
brass = comp.mat("wall_rail_brass", (0.72, 0.52, 0.2), rough=0.28, metal=1.0)
iron = comp.mat("rail_iron", (0.03, 0.03, 0.035), rough=0.45, metal=1.0)
RR, DROP = L.R_WALL - 0.085, 0.08
rail = [L.handrail(66, 356, radius=RR, drop=DROP, r=0.021)]
for u in (66, 356):
    p, q = L.pol(RR, L.LAND0 + u, L.rail_z(u) - DROP), L.pol(L.R_WALL + 0.02, L.LAND0 + u + (-3 if u < 100 else 3), L.rail_z(u) - DROP)
    rail.append(comp.tube([tuple(p), tuple((p + q) / 2 + Vector((0, 0, 0.0))), tuple(q)], 0.021, res=3, sides=4))
comp.mesh(col, root, "wall_rail_tube", comp.merge(*rail), brass, smooth=True)
br = []
for k in range(9):
    u = 76 + k * 33.3
    z = L.rail_z(u) - DROP
    a = L.LAND0 + u
    br.append(comp.tube([tuple(L.pol(L.R_WALL, a, z - 0.07)), tuple(L.pol(RR, a, z - 0.07)), tuple(L.pol(RR, a, z - 0.015))], 0.007, res=4, sides=3))
    rose = comp.cyl(0.028, 0.008, seg=14, axis="X")
    xf(rose, R(a, "Z"))
    xf(rose, T(*L.pol(L.R_WALL - 0.008, a, z - 0.07)))
    br.append(rose)
comp.mesh(col, root, "wall_rail_brackets", comp.merge(*br), iron, smooth=True)
comp.export(col, root, "stairwell", "wall_rail", made="blender/components/stairwell/wall_rail.py", source="own geometry (a wall handrail on brackets)", license="ours", credit="",
            notes="origin: the well's axis at the landing's level")
