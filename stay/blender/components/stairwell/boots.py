# stairwell/boots: a pair of rubber boots left by a door (Poly Haven's rubber_boots, CC0). Origin: on the floor
# between them. No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("stairwell", "boots", "rubber_boots", res="1k")
lo, hi = comp.box_of(list(parts.values()))
print("boots parts", list(parts), [round(v, 3) for v in (hi - lo)])
comp.export(col, root, "stairwell", "boots", made="blender/components/stairwell/boots.py", source="https://polyhaven.com/a/rubber_boots", license="CC0", credit=credit)
