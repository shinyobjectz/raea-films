# office/stapler: a steel desk stapler (Poly Haven's vintage_stapler, CC0).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp

col, root, parts, credit = comp.ph_component("office", "stapler", "vintage_stapler", origin="floor")

comp.export(col, root, "office", "stapler", made="blender/components/office/stapler.py",
            source="https://polyhaven.com/a/vintage_stapler", license="CC0", credit=credit, rig={})
