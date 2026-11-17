# road/stump: an old cut stump on the verge, 1.4 m across its roots (Poly Haven's tree_stump_01, CC0): what the
# road's clearing left behind, and something for the headlights to rake across.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

col, root, parts, credit = comp.ph_component("road", "stump", "tree_stump_01", res="1k")
for o in parts.values():
    o.location.z -= 0.1      # its roots a little into the litter
_lib.done(col, root, "stump", source="https://polyhaven.com/a/tree_stump_01", license="CC0", credit=credit)
