# ferris/bench painted-wooden-bench a-painted-wooden-bench-left-out-by-the-stalls:  (Poly Haven's , CC0). Origin: on the ground at its middle. No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("ferris", "bench painted_wooden_bench a_painted_wooden_bench_left_out_by_the_stalls", "", res="1k")
lo, hi = comp.box_of(list(parts.values()))
print("PARTS bench painted_wooden_bench a_painted_wooden_bench_left_out_by_the_stalls", list(parts), [round(v, 3) for v in (hi - lo)])
comp.export(col, root, "ferris", "bench painted_wooden_bench a_painted_wooden_bench_left_out_by_the_stalls", made="blender/components/ferris/bench painted_wooden_bench a_painted_wooden_bench_left_out_by_the_stalls.py", source="https://polyhaven.com/a/", license="CC0", credit=credit)
