# ferris/chair: a stacking plastic chair (Poly Haven's plastic_monobloc_chair_01, CC0). Origin: on the ground at its middle. No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("ferris", "chair", "plastic_monobloc_chair_01", res="1k")
lo, hi = comp.box_of(list(parts.values()))
print("PARTS chair", list(parts), [round(v, 3) for v in (hi - lo)])
comp.export(col, root, "ferris", "chair", made="blender/components/ferris/chair.py", source="https://polyhaven.com/a/plastic_monobloc_chair_01", license="CC0", credit=credit)
