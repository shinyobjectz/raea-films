# koi/ferns: four fern clumps for the banks and the rocks' feet (Poly Haven's fern_02, CC0), drawn in to a group
# 1.2 m across. Rig: "sway" tips each clump about its own root, 6 degrees, alternate ways (the breeze).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, parts, credit = comp.ph_component(PLACE, "ferns", "fern_02", res="2k")
keys = []
for i, (k, o) in enumerate(sorted(parts.items())):
    lo, hi = comp.box_of(o)
    c = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 0))
    o.matrix_world = T(-c.x * 0.4, -c.y * 0.4, 0) @ o.matrix_world
    bpy.context.view_layer.update()
    pv = comp.hang(col, root, o, f"ferns_clump_{k}", at=(c.x * 0.6, c.y * 0.6, 0))
    keys.append((pv, "rotation_euler", i % 2, 0, math.radians(6 if i % 2 else -6)))
channel("sway", keys)
done(col, root, "ferns", "https://polyhaven.com/a/fern_02", license="CC0", credit=credit, rig={"sway": "each of the four clumps tips 6 degrees about its root, alternate ways"})
