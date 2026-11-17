# laundromat/folding-table: the table for folding at, 1.8 x 0.8 m and 0.9 m high, modelled by hand: a white laminate
# top with a dark rubber edge on a welded steel frame of square tube (four legs with screw feet, aprons, a low
# stretcher each end) and a laminate shelf under it. Its long side faces -y. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rbox, label, T, R, S, xf

col, root = comp.fresh("folding_table")
M = _lib.maker(col, root)
lam = comp.mat("table_laminate", (0.84, 0.84, 0.8), rough=0.3)
edge = comp.mat("table_edge", (0.1, 0.1, 0.11), rough=0.5)
steel = comp.mat("table_frame", (0.55, 0.57, 0.6), rough=0.35, metal=0.6)
rubber = comp.mat("table_feet", (0.02, 0.02, 0.022), rough=0.8)
L, Wd, Hh = 1.8, 0.8, 0.9
M("folding_table_top", rbox((L - 0.008, Wd - 0.008, 0.032), at=(0, 0, Hh - 0.016), r=0.002, seg=1), lam)
M("folding_table_edge", comp.merge(rbox((L, 0.006, 0.034), at=(0, -Wd / 2 + 0.003, Hh - 0.017), r=0.002), rbox((L, 0.006, 0.034), at=(0, Wd / 2 - 0.003, Hh - 0.017), r=0.002),
                                     rbox((0.006, Wd, 0.034), at=(-L / 2 + 0.003, 0, Hh - 0.017), r=0.002), rbox((0.006, Wd, 0.034), at=(L / 2 - 0.003, 0, Hh - 0.017), r=0.002)), edge)
fr = []
LX, LY = L / 2 - 0.1, Wd / 2 - 0.08
for sx in (-1, 1):
    for sy in (-1, 1):
        fr.append(comp.box((0.04, 0.04, Hh - 0.062), at=(sx * LX, sy * LY, 0.03 + (Hh - 0.062) / 2)))
    fr.append(comp.box((0.03, 2 * LY, 0.03), at=(sx * LX, 0, 0.22)))
    fr.append(comp.box((0.03, 2 * LY, 0.05), at=(sx * LX, 0, Hh - 0.06)))
for sy in (-1, 1):
    fr.append(comp.box((2 * LX, 0.03, 0.05), at=(0, sy * LY, Hh - 0.06)))
    fr.append(comp.box((2 * LX, 0.03, 0.03), at=(0, sy * LY, 0.22)))
f = M("folding_table_frame", comp.merge(*fr), steel)
comp.bevel(f, 0.003, 2)
M("folding_table_shelf", rbox((2 * LX - 0.04, 2 * LY + 0.03, 0.02), at=(0, 0, 0.245), r=0.003), lam)
M("folding_table_feet", comp.merge(*[comp.merge(comp.cyl(0.022, 0.012, at=(sx * LX, sy * LY, 0), seg=16), comp.cyl(0.006, 0.02, at=(sx * LX, sy * LY, 0.012), seg=8)) for sx in (-1, 1) for sy in (-1, 1)]), rubber)
M("folding_table_notice", rbox((0.3, 0.1, 0.0015), at=(0.55, -0.25, Hh + 0.0008), r=0.0005, seg=1), comp.mat("table_notice", (0.9, 0.82, 0.2), rough=0.5))
M("folding_table_notice_print", comp.merge(xf(xf(label("FOLDING ONLY", 0.028, (0, 0, 0)), R(-90, "X")), T(0.55, -0.235, Hh + 0.002)), xf(xf(label("NO SITTING  -  NO DYE", 0.016, (0, 0, 0)), R(-90, "X")), T(0.55, -0.27, Hh + 0.002))), edge)
comp.export(col, root, _lib.PLACE, "folding_table", made="blender/components/laundromat/folding_table.py", source="own geometry (a generic laminate folding counter on a steel frame)", license="ours", credit="", rig={})
