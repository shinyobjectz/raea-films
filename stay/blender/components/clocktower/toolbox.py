# clocktower/toolbox: a steel cantilever toolbox, 0.4 m (Poly Haven's metal_toolbox, CC0), standing on the floor at the origin.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("clocktower", "toolbox", "metal_toolbox", res="1k", origin="floor", turn=0)
lo, hi = comp.box_of(list(parts.values()))
print("parts", {k: [round(v, 3) for v in o.dimensions] for k, o in parts.items()})
comp.export(col, root, "clocktower", "toolbox", made="blender/components/clocktower/toolbox.py",
            source="https://polyhaven.com/a/metal_toolbox", license="CC0", credit=credit)
