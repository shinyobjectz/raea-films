# pool/wet-floor-sign: a yellow wet-floor A-frame sign on the deck (Poly Haven's WetFloorSign_01, CC0; the office's
# blender/components/office/wet_floor_sign.py). No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
col, root, parts, credit = comp.ph_component("pool", "wet_floor_sign", "WetFloorSign_01", res="1k", origin="floor")
done(col, root, "wet_floor_sign", source="https://polyhaven.com/a/WetFloorSign_01", license="CC0", credit=credit)
