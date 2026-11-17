# sea/rocks: a reef of dark wet rocks breaking the surface near the camera, 11 m across: nine closed boulders, Poly
# Haven's namaqualand_boulder_04 and namaqualand_boulder_03 (CC0, photoscans by Rob Tuytel) cut to a seventh of their
# faces, darkened as wet rock, and turned, tipped, stretched and sunk to different depths so no two read alike: two
# big ones standing 2 m out of the water, the rest awash round them. Its origin is the still-water level at the
# reef's middle. No rig: the spray, the foam and the kelp that go with it are their own components.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix
col, root = comp.fresh("rocks")
# (which, x, y, sink under the water, turn z, tip x, tip y, scale)
PIECES = [("a", 0.2, 0.8, 1.3, 20, 6, -4, (1.7, 1.5, 1.75)), ("b", -3.0, -0.4, 0.9, 150, 8, -6, (1.3, 1.2, 1.9)), ("a", 3.4, -1.0, 1.5, 200, -10, 12, (1.1, 1.3, 1.0)),
          ("b", 1.4, -2.6, 0.75, 40, 14, 6, (0.9, 0.8, 1.0)), ("b", -1.4, 2.8, 1.0, 290, -6, 10, (1.2, 1.0, 1.2)), ("a", -4.8, 2.0, 1.1, 110, 12, -8, (0.7, 0.8, 0.75)),
          ("b", 4.6, 1.8, 0.8, 250, 4, 16, (0.8, 0.9, 0.9)), ("a", -1.2, -2.2, 0.85, 75, -8, 5, (0.6, 0.55, 0.6)), ("a", 2.3, 2.6, 1.0, 320, 5, -12, (0.65, 0.75, 0.7))]
credit = _lib.boulders(col, root, "rocks", PIECES, res=("1k", "1k"))
comp.export(col, root, "sea", "rocks", made="blender/components/sea/rocks.py", source="https://polyhaven.com/a/namaqualand_boulder_04, https://polyhaven.com/a/namaqualand_boulder_03 (decimated, darkened)", license="CC0", credit=credit,
            notes="Its origin is the water's surface; stand it at the sea's level.")
