# road/log: a fallen trunk, 3 m, bare and grey, lying on the verge by the ditch (Poly Haven's dead_tree_trunk, CC0).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

col, root, parts, credit = comp.ph_component("road", "log", "dead_tree_trunk", res="1k")
_lib.done(col, root, "log", source="https://polyhaven.com/a/dead_tree_trunk", license="CC0", credit=credit, notes="Lies along x.")
