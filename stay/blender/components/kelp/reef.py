# kelp/reef: a low rocky reef, three weed-grown boulders about 5 x 6 m in all and 1.7 m high (Poly Haven's
# rock_moss_set_01, CC0: rocks 01, 02 and 04, their moss standing for the turf of algae). Stands on the seabed. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp
col, root, parts, credit = comp.ph_component("kelp", "reef", "rock_moss_set_01", res="1k", keep=lambda n: any(k in n for k in ("rock01", "rock02", "rock04")))
for o in col.all_objects:
    for sl in getattr(o, "material_slots", []):
        L.ambient(sl.material, 95.0)      # the water's scattered light (see _lib.ambient)
comp.export(col, root, "kelp", "reef", made="blender/components/kelp/reef.py", source="https://polyhaven.com/a/rock_moss_set_01 (rocks 01, 02, 04)", license="CC0", credit=credit)
