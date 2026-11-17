# clocktower/ladder: a paint-spattered wooden stepladder, 1.33 m (Poly Haven's wooden_ladder, CC0), standing open on the floor.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("clocktower", "ladder", "wooden_ladder", res="1k", origin="floor", turn=0)
lo, hi = comp.box_of(list(parts.values()))
print("parts", {k: [round(v, 3) for v in o.dimensions] for k, o in parts.items()})
comp.export(col, root, "clocktower", "ladder", made="blender/components/clocktower/ladder.py",
            source="https://polyhaven.com/a/wooden_ladder", license="CC0", credit=credit)
