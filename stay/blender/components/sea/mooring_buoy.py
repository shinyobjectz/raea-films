# sea/mooring-buoy: a small spar buoy with a flag staff, 1.85 m out of the water (Poly Haven's ocean_buoy, CC0, by
# Mateusz Sadek), for the water by the pier. Its origin is its waterline. Rig: "bob" lifts it 0.3 m; "lean" tips it
# 18 degrees about the waterline.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

col, root = comp.fresh("mooring_buoy")
parts, credit = _lib.bring(col, root, "ocean_buoy", "mooring_buoy", res="1k")
body = parts["body"]
heave = comp.pivot(col, root, "mooring_buoy_bob", (0, 0, 0))
lean = comp.pivot(col, root, "mooring_buoy_lean", (0, 0, 0), parent=heave)
comp.link(col, root, body, parent=lean)
_lib.channel("bob", [(heave, "location", 2, 0.0, 0.3)])
_lib.channel("lean", [(lean, "rotation_euler", 1, 0.0, math.radians(18))])
comp.export(col, root, "sea", "mooring_buoy", made="blender/components/sea/mooring_buoy.py", source="https://polyhaven.com/a/ocean_buoy", license="CC0", credit=credit,
            rig={"bob": "it rises 0.3 m", "lean": "it tips 18 degrees to its right about its waterline"})
