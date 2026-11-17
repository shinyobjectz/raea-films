# ferris/trash-can metal-trash-can a-galvanised-bin:  (Poly Haven's , CC0). Origin: on the ground at its middle. No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("ferris", "trash_can metal_trash_can a_galvanised_bin", "", res="1k")
lo, hi = comp.box_of(list(parts.values()))
print("PARTS trash_can metal_trash_can a_galvanised_bin", list(parts), [round(v, 3) for v in (hi - lo)])
comp.export(col, root, "ferris", "trash_can metal_trash_can a_galvanised_bin", made="blender/components/ferris/trash_can metal_trash_can a_galvanised_bin.py", source="https://polyhaven.com/a/", license="CC0", credit=credit)
