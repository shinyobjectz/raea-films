# ferris/bench: a painted wooden bench left out by the stalls (Poly Haven's painted_wooden_bench, CC0). Origin: on the ground at its middle. No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("ferris", "bench", "painted_wooden_bench", res="1k")
lo, hi = comp.box_of(list(parts.values()))
print("PARTS bench", list(parts), [round(v, 3) for v in (hi - lo)])
comp.export(col, root, "ferris", "bench", made="blender/components/ferris/bench.py", source="https://polyhaven.com/a/painted_wooden_bench", license="CC0", credit=credit)
