# sea/bench: a painted wooden bench, 1.16 m, for the pier's deck (Poly Haven's painted_wooden_bench, CC0). No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

col, root, parts, credit = comp.ph_component("sea", "bench", "painted_wooden_bench", res="1k")
comp.export(col, root, "sea", "bench", made="blender/components/sea/bench.py", source="https://polyhaven.com/a/painted_wooden_bench", license="CC0", credit=credit)
