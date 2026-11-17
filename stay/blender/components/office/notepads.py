# office/notepads: legal pads, sticky notes and loose A4, laid out on a desk (Poly Haven's office_notepads, CC0).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp

col, root, parts, credit = comp.ph_component("office", "notepads", "office_notepads", origin="floor")

comp.export(col, root, "office", "notepads", made="blender/components/office/notepads.py",
            source="https://polyhaven.com/a/office_notepads", license="CC0", credit=credit, rig={})
