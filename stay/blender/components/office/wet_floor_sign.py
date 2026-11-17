# office/wet-floor-sign: a yellow wet-floor A-frame sign, for the aisle by the cooler (Poly Haven's WetFloorSign_01, CC0).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp

col, root, parts, credit = comp.ph_component("office", "wet_floor_sign", "WetFloorSign_01", origin="floor")

comp.export(col, root, "office", "wet_floor_sign", made="blender/components/office/wet_floor_sign.py",
            source="https://polyhaven.com/a/WetFloorSign_01", license="CC0", credit=credit, rig={})
