# cathedral/aisle-roof: one 4.5 m bay of the aisle's lean-to roof seen from below, modelled by hand: oak boards on
# seven rafters, a wall plate at its foot and a purlin half way, sloping up from the aisle wall's head to the nave
# wall. A ceiling piece: its high edge (against the nave wall, toward -y) is at z 0 and its low edge, at y 0, 1.7 m
# below; 3.0 m from wall to wall. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("aisle_roof")
oak = L.oak()
BAY, RUN, DROP = 4.5, 3.0, 1.7
ang = math.degrees(math.atan2(DROP, RUN))
ln = math.hypot(RUN, DROP)
def slope(bm):   # lay a piece built flat (y from 0 to -ln, z down from 0) onto the slope
    return xf(xf(bm, R(-ang, "X")), T(0, 0, -DROP))
boards = comp.mesh(col, root, "aisle_roof_boards", slope(comp.merge(*[comp.box((0.2, ln, 0.025), at=(-BAY / 2 + 0.1125 + i * 0.225, -ln / 2, 0.0)) for i in range(20)])), oak)
comp.bevel(boards, 0.004, 1)
L.finish(boards, 1.0)
raft = comp.mesh(col, root, "aisle_roof_rafters", slope(comp.merge(*[comp.box((0.1, ln, 0.16), at=(-BAY / 2 + 0.05 + i * (BAY - 0.1) / 6, -ln / 2, -0.09)) for i in range(7)])), oak)
comp.bevel(raft, 0.008, 2)
L.finish(raft, 1.0)
pur = comp.mesh(col, root, "aisle_roof_purlin", slope(comp.merge(comp.box((BAY, 0.16, 0.2), at=(0, -ln / 2, -0.27)), comp.box((BAY, 0.2, 0.14), at=(0, -0.12, -0.2)), comp.box((BAY, 0.2, 0.14), at=(0, -ln + 0.12, -0.2)))), oak)
comp.bevel(pur, 0.008, 2)
L.finish(pur, 1.0)
comp.export(col, root, "cathedral", "aisle_roof", made="blender/components/cathedral/aisle_roof.py",
            source="own geometry; oak: https://polyhaven.com/a/dark_wood", license="ours; texture CC0", credit="Poly Haven (dark_wood)")
