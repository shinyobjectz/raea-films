# garage/trashbag: a full black bin bag, 0.57 m high, tied at the neck (Poly Haven's trashbag, CC0), on the floor at
# the origin. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root, parts, credit = comp.ph_component("garage", "trashbag", "trashbag", res="1k", origin="floor")
L.look(col, "trashbag", lens=50)
comp.export(col, root, "garage", "trashbag", made="blender/components/garage/trashbag.py", source="https://polyhaven.com/a/trashbag", license="CC0", credit=credit, rig={})
