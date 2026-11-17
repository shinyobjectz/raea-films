# clocktower/broom: a wooden broom, 1.45 m (Poly Haven's wooden_broom, CC0), standing on its head at the origin.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("clocktower", "broom", "wooden_broom", res="1k", origin="floor", turn=0)
lo, hi = comp.box_of(list(parts.values()))
print("parts", {k: [round(v, 3) for v in o.dimensions] for k, o in parts.items()})
comp.export(col, root, "clocktower", "broom", made="blender/components/clocktower/broom.py",
            source="https://polyhaven.com/a/wooden_broom", license="CC0", credit=credit)
