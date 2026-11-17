# stairwell/extinguisher: a red powder fire extinguisher standing on the landing (Poly Haven's
# korean_fire_extinguisher_01, CC0). Origin: its base's centre on the floor. No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("stairwell", "extinguisher", "korean_fire_extinguisher_01", res="1k")
lo, hi = comp.box_of(list(parts.values()))
print("extinguisher parts", list(parts), [round(v, 3) for v in (hi - lo)])
comp.export(col, root, "stairwell", "extinguisher", made="blender/components/stairwell/extinguisher.py", source="https://polyhaven.com/a/korean_fire_extinguisher_01", license="CC0", credit=credit)
