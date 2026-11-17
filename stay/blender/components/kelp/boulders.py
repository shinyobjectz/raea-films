# kelp/boulders: three more boulders of the reef, lower and wider apart, about 5 x 3 m and 1.3 m high (Poly Haven's
# rock_moss_set_01, CC0: rocks 03, 05 and 06). Stands on the seabed. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp
col, root, parts, credit = comp.ph_component("kelp", "boulders", "rock_moss_set_01", res="1k", keep=lambda n: any(k in n for k in ("rock03", "rock05", "rock06")))
for o in col.all_objects:
    for sl in getattr(o, "material_slots", []):
        L.ambient(sl.material, 95.0)      # the water's scattered light (see _lib.ambient)
comp.export(col, root, "kelp", "boulders", made="blender/components/kelp/boulders.py", source="https://polyhaven.com/a/rock_moss_set_01 (rocks 03, 05, 06)", license="CC0", credit=credit)
