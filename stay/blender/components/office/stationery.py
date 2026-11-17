# office/stationery: a pencil cup, pens, pencils and an eraser (Poly Haven's stationery_supplies, CC0).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp

col, root, parts, credit = comp.ph_component("office", "stationery", "stationery_supplies", origin="floor")

comp.export(col, root, "office", "stationery", made="blender/components/office/stationery.py",
            source="https://polyhaven.com/a/stationery_supplies", license="CC0", credit=credit, rig={})
