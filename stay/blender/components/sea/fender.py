# sea/fender: an old tyre hung on two ropes from the pier's edge as a fender, 0.6 m (Poly Haven's old_tyre, CC0), the
# ropes and their cleat modelled by hand. A wall item: its back is the pier's side (y 0), its origin the cleat on the
# deck's edge, and the tyre hangs 1.1 m under it. Rig: "swing" swings tyre and ropes 14 degrees along the pier's side.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

col, root = comp.fresh("fender")
M = _lib.maker(col, root)
rope_m = comp.mat("fender_rope", (0.42, 0.33, 0.2), rough=0.95)
steel = comp.mat("fender_cleat", (0.35, 0.36, 0.37), rough=0.45, metal=1.0)
M("fender_cleat", comp.merge(comp.box((0.2, 0.05, 0.02), at=(0, -0.03, 0.0)), comp.cyl(0.012, 0.05, at=(-0.05, -0.03, 0.0), seg=8), comp.cyl(0.012, 0.05, at=(0.05, -0.03, 0.0), seg=8),
                             comp.cyl(0.014, 0.26, at=(-0.13, -0.03, 0.05), seg=10, axis="X")), steel, smooth=False)
sw = comp.pivot(col, root, "fender_swing", (0, -0.03, 0.04))
parts, credit = _lib.bring(col, root, "old_tyre", "fender_tyre", res="1k")
t = parts["body"]
lo, hi = comp.box_of(t)
t.matrix_world = T(-(lo.x + hi.x) / 2, -0.01 - hi.y, -1.1 - (lo.z + hi.z) / 2) @ t.matrix_world
bpy.context.view_layer.update()
comp.link(col, root, t, parent=sw)
y = -0.09
ropes = [comp.tube([(sx * 0.05, -0.03, 0.05), (sx * 0.07, y, -0.3), (sx * 0.12, y, -0.82), (sx * 0.1, y - 0.085, -0.86), (sx * 0.1, y - 0.085, -0.93), (sx * 0.1, y + 0.07, -0.93), (sx * 0.1, y + 0.07, -0.86), (sx * 0.12, y, -0.82)], 0.011, res=6, sides=3) for sx in (-1, 1)]
M("fender_ropes", comp.merge(*ropes), rope_m, parent=sw, smooth=True)
_lib.channel("swing", [(sw, "rotation_euler", 1, 0.0, math.radians(14))])
comp.export(col, root, "sea", "fender", made="blender/components/sea/fender.py", source="https://polyhaven.com/a/old_tyre; ropes and cleat our own", license="CC0; ours", credit=credit,
            rig={"swing": "the tyre and its ropes swing 14 degrees along the pier's side, about the cleat"})
