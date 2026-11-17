# turbines/barrier: a precast concrete road barrier closing the road's end and the crane pad's edge, 1.55 m long (Poly
# Haven's concrete_road_barrier, CC0). No rig; copies stand end to end.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("turbines", "barrier", "concrete_road_barrier", res="1k")
print("parts", {k: [round(x, 2) for x in (*comp.box_of(v)[0], *comp.box_of(v)[1])] for k, v in parts.items()})
comp.export(col, root, "turbines", "barrier", made="blender/components/turbines/barrier.py", source="https://polyhaven.com/a/concrete_road_barrier", license="CC0", credit=credit)
