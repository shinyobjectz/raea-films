# road/branches: windfall on the shoulder and the road's edge, the storm's litter: three dead branches up to 1.3 m
# (Poly Haven's dry_branches_medium_01, CC0), laid across one another. Rig: "skid" drags the lot 0.5 m along the
# road and turns it a quarter (the car's wash, or its tyre).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

col, root, parts, credit = comp.ph_component("road", "branches", "dry_branches_medium_01", res="1k")
SPOTS = {"a": (0.0, 0.0, 0), "b": (0.25, 0.1, 70), "c": (-0.2, -0.15, -50)}
for nm, o in parts.items():
    lo, hi = comp.box_of(o)
    x, y, yaw = SPOTS[nm]
    o.matrix_world = comp.T(x, y, 0) @ comp.R(yaw, "Z") @ comp.T(-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z) @ o.matrix_world
bpy.context.view_layer.update()
p = comp.hang(col, root, list(parts.values()), "branches_skid", at=(0, 0, 0))
_lib.channel("skid", [(p, "location", 1, 0, 0.5), (p, "rotation_euler", 2, 0, math.radians(90))])
_lib.done(col, root, "branches", source="https://polyhaven.com/a/dry_branches_medium_01", license="CC0", credit=credit,
          rig={"skid": "the pile slides 0.5 m away along the road and turns a quarter turn flat on the ground"})
