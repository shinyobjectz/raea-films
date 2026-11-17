# garage/utility-box: a blue steel electrical cabinet, 1.12 m high, with its danger plate and hazard tape (Poly
# Haven's utility_box_01, CC0), standing against the wall: on the floor at the origin, its door toward -y. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root, parts, credit = comp.ph_component("garage", "utility_box", "utility_box_01", res="1k", origin="floor")
L.look(col, "utility-box", lens=50)
comp.export(col, root, "garage", "utility_box", made="blender/components/garage/utility_box.py", source="https://polyhaven.com/a/utility_box_01", license="CC0", credit=credit, rig={})
