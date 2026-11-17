# koi/mossy-rocks-b: three low mossy stones for the near bank and the path's side (Poly Haven's rock_moss_set_02,
# CC0: its rocks 08, 09 and 12 at half size), about 1.8 m across, knee high. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

SC = 0.5
col, root, parts, credit = comp.ph_component(PLACE, "mossy_rocks_b", "rock_moss_set_02", res="2k", scale=SC, keep=lambda n: n.endswith(("rock08", "rock09", "rock12")))
to = {"rock08": (-0.55, 0.1), "rock09": (0.35, -0.2), "rock12": (0.2, 0.55)}
for k, o in parts.items():
    lo, hi = comp.box_of(o)
    x, y = to[k]
    o.matrix_world = T(x - (lo.x + hi.x) / 2, y - (lo.y + hi.y) / 2, -0.038 * SC) @ o.matrix_world
bpy.context.view_layer.update()
done(col, root, "mossy_rocks_b", "https://polyhaven.com/a/rock_moss_set_02", license="CC0", credit=credit)
