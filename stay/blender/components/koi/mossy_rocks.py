# koi/mossy-rocks: a setting of three moss-grown garden rocks, a tall one and two low (Poly Haven's
# rock_moss_set_01, CC0: its rocks 04, 03 and 05 at 0.45 of their size, sunk in the ground as scanned), about 2.4 m
# across and 0.5 m high. For the pond's far bank. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

SC = 0.45
col, root, parts, credit = comp.ph_component(PLACE, "mossy_rocks", "rock_moss_set_01", res="2k", scale=SC, keep=lambda n: n.endswith(("rock04", "rock03", "rock05")))
to = {"rock04": (0.0, 0.25), "rock03": (0.95, -0.2), "rock05": (-0.85, -0.25)}
for k, o in parts.items():
    lo, hi = comp.box_of(o)
    x, y = to[k]
    o.matrix_world = T(x - (lo.x + hi.x) / 2, y - (lo.y + hi.y) / 2, -0.661 * SC) @ o.matrix_world
bpy.context.view_layer.update()
done(col, root, "mossy_rocks", "https://polyhaven.com/a/rock_moss_set_01", license="CC0", credit=credit)
