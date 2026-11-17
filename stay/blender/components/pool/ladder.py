# pool/ladder: a stainless pool ladder, modelled by hand at real size: two 42 mm rails 0.5 m apart that rise from
# sockets in the deck, arch 0.9 m over the coping and drop 1.25 m down the pool's wall, four ribbed plastic treads
# between them, rubber stand-offs against the wall, and an escutcheon on each deck socket. Its origin is the pool's
# edge at deck level, the water toward -y and the deck behind. (The generator's wrong one, "a ladder into the wall",
# is this one stood against a wall.) Rig: "lift" draws the ladder 0.9 m up out of its sockets (the cursor's pull).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("ladder")
st = steel("pool_steel", 0.15)
tread_m = comp.mat("pool_ladder_tread", (0.9, 0.9, 0.87), rough=0.6)
rub = comp.mat("pool_rubber", (0.02, 0.02, 0.02), rough=0.8)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
body = comp.pivot(col, root, "ladder_body", (0, 0, 0))
AY, PY = 0.66, -0.15       # the deck sockets behind the overflow channel; the rails' drop, clear of the wall
for s, side in ((-1, "l"), (1, "r")):
    x = s * 0.25
    pts = [(x, AY, -0.14), (x, AY, 0.5), (x, AY - 0.25, 0.9), (x, PY + 0.1, 0.9), (x, PY, 0.62), (x, PY, -1.25)]
    M(f"ladder_rail_{side}", pipe(bend(pts, 0.22, 8), 0.021, sides=4), st, parent=body, smooth=True)
    M(f"ladder_standoff_{side}", comp.merge(comp.cyl(0.012, -PY - 0.02, at=(x, PY, -1.16), seg=12, axis="Y"), comp.cyl(0.026, 0.022, at=(x, -0.022, -1.16), seg=16, axis="Y")), rub, parent=body, smooth=True)
    M(f"ladder_cap_{side}", sphere(0.021, at=(x, PY, -1.25), u=12, v=8), rub, parent=body, smooth=True)
    M(f"ladder_escutcheon_{side}", turn([(0.022, 0.0), (0.055, 0.0), (0.055, 0.006), (0.03, 0.028), (0.022, 0.028)], seg=24, at=(x, AY, 0.0)), st, smooth=True)
for i, z in enumerate((-0.28, -0.56, -0.84, -1.12)):
    t = comp.merge(comp.box((0.5 - 0.03, 0.085, 0.03), at=(0, PY, z)), *[comp.box((0.44, 0.008, 0.004), at=(0, PY - 0.03 + k * 0.02, z + 0.016)) for k in range(4)],
                   *[comp.cyl(0.03, 0.05, at=(sx * 0.25 - 0.025, PY, z), seg=14, axis="X") for sx in (-1, 1)])
    to = M(f"ladder_tread_{i + 1}", t, tread_m, parent=body)
    comp.bevel(to, 0.003, 2)
comp.channel("lift", [(body, "location", 2, 0.0, 0.9)])
done(col, root, "ladder", source="own geometry (a generic four-tread stainless pool ladder)",
     rig={"lift": "the rails and treads rise 0.9 m out of their deck sockets (the escutcheons stay)", "position": "the Model's own position in the scene (the wrong one stands against a wall)"},
     notes="origin: the pool's edge at deck level; the water is toward -y")
