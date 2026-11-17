# stairwell/rail: one storey's balustrade along the well's edge of the flight, modelled by hand: two round iron
# balusters a tread, each with a shoe and a turned knop, an iron core rail under a polished mahogany handrail that
# climbs one whole turn of the spiral (the circle the shot is cut on, seen from above). Origin: the well's axis at
# the landing's level; it runs from the landing's end round to the next landing, where stairwell/landing's own
# length takes over. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("rail")
iron = comp.mat("rail_iron", (0.03, 0.03, 0.035), rough=0.45, metal=1.0)
wood = comp.mat("rail_wood", (0.2, 0.085, 0.035), rough=0.22)
us, foot = [], {}
for i in range(L.N):
    for f in (0.27, 0.77):
        u = 60 + (i + f) * L.STEP
        us.append(u)
        foot[u] = (i + 1) * L.RISE
bars, knops = L.balusters(us, lambda u: foot[u])
comp.mesh(col, root, "rail_balusters", comp.merge(*bars), iron, smooth=True)
comp.mesh(col, root, "rail_knops", comp.merge(*knops), iron, smooth=True)
comp.mesh(col, root, "rail_core", L.handrail(60, 360, drop=0.028, r=0.011), iron, smooth=True)
comp.mesh(col, root, "rail_handrail", L.handrail(60, 360), wood, smooth=True)
comp.export(col, root, "stairwell", "rail", made="blender/components/stairwell/rail.py", source="own geometry (an iron balustrade with a wooden handrail)", license="ours", credit="",
            notes="origin: the well's axis at the landing's level; the handrail is the spiral the montage's circle is")
