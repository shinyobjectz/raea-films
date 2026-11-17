# lighthouse/bench: a painted wooden bench against the cottage's front wall, 1.16 m (Poly Haven's painted_wooden_bench,
# CC0). No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("lighthouse", "bench", "painted_wooden_bench", res="1k")
print("parts", {k: [round(x, 2) for x in (*comp.box_of(v)[0], *comp.box_of(v)[1])] for k, v in parts.items()})
comp.export(col, root, "lighthouse", "bench", made="blender/components/lighthouse/bench.py", source="https://polyhaven.com/a/painted_wooden_bench", license="CC0", credit=credit)
