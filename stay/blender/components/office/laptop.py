# office/laptop: a chunky 1990s laptop on its stand (Poly Haven's classic_laptop, CC0).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp

col, root, parts, credit = comp.ph_component("office", "laptop", "classic_laptop", origin="floor")

comp.export(col, root, "office", "laptop", made="blender/components/office/laptop.py",
            source="https://polyhaven.com/a/classic_laptop", license="CC0", credit=credit, rig={})
