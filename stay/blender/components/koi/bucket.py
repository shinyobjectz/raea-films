# koi/bucket: a wooden water bucket with iron bands and a bail handle, 0.35 m (Poly Haven's wooden_bucket_01, CC0),
# by the deer scarer's basin. Rig: "handle" drops the bail handle from upright 75 degrees to rest on the rim.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, parts, credit = comp.ph_component(PLACE, "bucket", "wooden_bucket_01", res="1k")
h = next(o for k, o in parts.items() if "handle" in k)
lo, hi = comp.box_of(h)
pv = comp.hang(col, root, h, "bucket_handle_swing", at=((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z + 0.012))
channel("handle", [(pv, "rotation_euler", 0, 0, math.radians(75))])
done(col, root, "bucket", "https://polyhaven.com/a/wooden_bucket_01", license="CC0", credit=credit, rig={"handle": "the bail handle from upright 75 degrees down toward the back, about its pins on the rim"})
