# clocktower/caged-light: a caged industrial pendant light (Poly Haven's caged_hanging_light, CC0), its top at the origin (a ceiling fitting).
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("clocktower", "caged_light", "caged_hanging_light", res="1k", origin="top", turn=0)
lo, hi = comp.box_of(list(parts.values()))
print("parts", {k: [round(v, 3) for v in o.dimensions] for k, o in parts.items()})
comp.export(col, root, "clocktower", "caged_light", made="blender/components/clocktower/caged_light.py",
            source="https://polyhaven.com/a/caged_hanging_light", license="CC0", credit=credit)
