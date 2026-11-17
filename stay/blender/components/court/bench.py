# court/bench: a painted wooden bench at the court's side, Poly Haven's painted_wooden_bench (CC0). No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component("court", "bench", "painted_wooden_bench", res="2k")
comp.export(col, root, "court", "bench", made="blender/components/court/bench.py", source="https://polyhaven.com/a/painted_wooden_bench", license="CC0", credit=credit)
