# road/rocks: three mossy boulders for the bank beyond the ditch, the biggest 2.2 m across (Poly Haven's
# rock_moss_set_01, CC0: rocks 03, 04 and 06 of its six, set together and sunk into the ground).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

keep = {"rock03": (1.1, 0.5, 20), "rock04": (-0.8, 0.0, 0), "rock06": (0.6, -1.2, 70)}
col, root, parts, credit = comp.ph_component("road", "rocks", "rock_moss_set_01", res="2k", keep=lambda n: any(k in n for k in keep))
for nm, o in parts.items():
    lo, hi = comp.box_of(o)
    x, y, yaw = keep[nm]
    o.matrix_world = comp.T(x, y, 0) @ comp.R(yaw, "Z") @ comp.T(-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z - 0.38 * (hi.z - lo.z)) @ o.matrix_world
bpy.context.view_layer.update()
_lib.done(col, root, "rocks", source="https://polyhaven.com/a/rock_moss_set_01", license="CC0", credit=credit,
          notes="Each rock is sunk 38 % into the ground; its origin is the group's middle at ground level.")
