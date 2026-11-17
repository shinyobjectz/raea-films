# garage/trash-can: a galvanised steel dustbin, 0.9 m high, its lid leaning against it (the clean one of Poly Haven's
# metal_trash_can pair, CC0), on the floor at the origin. Rig: none (the lid is its own node, trash_can_lid).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root, parts, credit = comp.ph_component("garage", "trash_can", "metal_trash_can", res="1k", origin="floor", keep=lambda n: "rust" not in n)
L.look(col, "trash-can", lens=50)
comp.export(col, root, "garage", "trash_can", made="blender/components/garage/trash_can.py", source="https://polyhaven.com/a/metal_trash_can", license="CC0", credit=credit, rig={})
