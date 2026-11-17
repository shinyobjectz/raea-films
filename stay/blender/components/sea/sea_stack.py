# sea/sea-stack: a sea stack standing off the coast, 13 m across at its foot and 15 m out of the water: closed
# boulders (Poly Haven's namaqualand_boulder_04 and _03, CC0, photoscans by Rob Tuytel) stood many times their size,
# a tall leaning pillar of three stacked on one another with a shoulder beside it and five fallen blocks awash at its
# foot. Its origin is the still-water level under the pillar. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix
col, root = comp.fresh("sea_stack")
PIECES = [("a", 0.0, 0.0, 3.0, 10, 3, -3, (3.4, 3.2, 5.2)), ("b", 0.5, 0.3, -2.6, 120, -4, 5, (2.9, 2.6, 5.2)), ("a", 0.9, 0.0, -7.2, 250, 6, 4, (2.2, 2.1, 3.6)),
          ("b", -2.8, 1.0, 2.0, 60, 8, -10, (2.6, 2.2, 5.6)), ("a", 4.4, -1.6, 1.4, 30, 6, 4, (1.6, 1.5, 1.4)), ("b", -5.2, -2.4, 1.2, 200, -5, 8, (1.3, 1.1, 1.5)),
          ("a", 1.0, 4.4, 1.6, 140, 8, -6, (1.5, 1.7, 1.3)), ("b", 3.2, 3.0, 1.0, 310, -8, -5, (1.0, 0.9, 1.3)), ("a", -2.0, -4.2, 1.1, 95, 4, 9, (1.1, 1.2, 0.9))]
credit = _lib.boulders(col, root, "sea_stack", PIECES, res=("1k", "1k"), wet=(0.42, 0.4, 0.39))
comp.export(col, root, "sea", "sea_stack", made="blender/components/sea/sea_stack.py", source="https://polyhaven.com/a/namaqualand_boulder_04, https://polyhaven.com/a/namaqualand_boulder_03 (decimated, darkened, scaled up)", license="CC0", credit=credit,
            notes="The scans are two to five times their size here, so their texture is coarse close to: keep it 40 m or more from the camera.")
