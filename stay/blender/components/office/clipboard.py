# office/clipboard: a clipboard with a sheet, lying on a desk (Poly Haven's clipboard, CC0).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp

col, root, parts, credit = comp.ph_component("office", "clipboard", "clipboard", origin="floor")

comp.export(col, root, "office", "clipboard", made="blender/components/office/clipboard.py",
            source="https://polyhaven.com/a/clipboard", license="CC0", credit=credit, rig={})
