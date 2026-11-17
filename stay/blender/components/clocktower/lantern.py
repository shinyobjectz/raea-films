# clocktower/lantern: a vintage oil lamp, 0.8 m with its chimney (Poly Haven's vintage_oil_lamp, CC0), standing on the floor at the origin.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("clocktower", "lantern", "vintage_oil_lamp", res="1k", origin="floor", turn=0)
lo, hi = comp.box_of(list(parts.values()))
print("parts", {k: [round(v, 3) for v in o.dimensions] for k, o in parts.items()})
comp.export(col, root, "clocktower", "lantern", made="blender/components/clocktower/lantern.py",
            source="https://polyhaven.com/a/vintage_oil_lamp", license="CC0", credit=credit)
