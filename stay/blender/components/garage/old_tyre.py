# garage/old-tyre: a worn car tyre, 0.6 m across, lying flat on the deck (Poly Haven's old_tyre, CC0), its middle on
# the origin. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root, parts, credit = comp.ph_component("garage", "old_tyre", "old_tyre", res="1k", origin="floor")
for o in parts.values():
    o.matrix_world = T(0, 0, 0.0825) @ R(90, "X") @ T(0, 0, -0.3) @ o.matrix_world
bpy.context.view_layer.update()
L.look(col, "old-tyre", lens=50)
comp.export(col, root, "garage", "old_tyre", made="blender/components/garage/old_tyre.py", source="https://polyhaven.com/a/old_tyre", license="CC0", credit=credit, rig={})
