# subway/fire-extinguisher: a red fire extinguisher, 0.66 m (Poly Haven's korean_fire_extinguisher_01, CC0), standing on the floor at the origin.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("subway", "fire_extinguisher", "korean_fire_extinguisher_01", res="1k", origin="floor", turn=0)
print("parts", {k: [round(v, 3) for v in o.dimensions] for k, o in parts.items()})
comp.export(col, root, "subway", "fire_extinguisher", made="blender/components/subway/fire_extinguisher.py",
            source="https://polyhaven.com/a/korean_fire_extinguisher_01", license="CC0", credit=credit)
