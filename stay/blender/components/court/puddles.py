# court/puddles: standing rain on the court, modelled by hand: seven shallow puddles of irregular outline (0.5 to 2.4 m)
# lying in the slab's low places, mirror-dark water, with twelve raindrop rings on them. The origin is the middle of
# the baseline, as the court's. The water is its own material (puddles_water).
# Rig: "ripple" opens every ring from a drop's point to 22-40 cm across; loop it. "swell" spreads the puddles 12%.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import arc, blob, T, R, S, xf

col, root = comp.fresh("puddles")
M = _lib.maker(col, root)
water = comp.mat("puddles_water", (0.2, 0.21, 0.23), rough=0.03, metal=1.0)
ring_m = comp.mat("puddles_rings", (0.6, 0.62, 0.66), rough=0.05, metal=1.0)
SPOTS = [(-2.9, -3.4, 1.2, 0.7, 20), (1.6, -7.3, 0.95, 0.8, 50), (4.6, -3.0, 0.8, 0.6, -30), (-5.4, -8.6, 1.1, 0.75, 10), (0.6, -10.6, 0.7, 0.9, 80), (5.8, -9.8, 0.6, 0.7, 0), (-0.9, -1.0, 0.45, 0.6, 15)]
rnd = random.Random(5)
swell = comp.pivot(col, root, "puddles_swell", (0, -6, 0))
keys = []
for i, (x, y, r, sq, turn) in enumerate(SPOTS):
    b = blob(r, seed=i + 3, z=0.007, squash=sq)
    xf(b, T(x, y, 0) @ R(turn, "Z"))
    M(f"puddles_water_{i + 1}", b, water, parent=swell, smooth=False)
    for j in range(2 if r > 0.65 else 1):
        a, d = rnd.uniform(0, 6.28), rnd.uniform(0, r * 0.3)
        px, py = x + d * math.cos(a), y + d * math.sin(a) * sq
        rr = rnd.uniform(0.11, 0.2)
        p = comp.pivot(col, root, f"puddles_ring_{i + 1}_{j + 1}", (px, py, 0.009))
        M(f"puddles_ring_{i + 1}_{j + 1}_mesh",
          xf(comp.merge(arc(rr, 0, 360, w=0.012, z=0.0, t=0.0015, n=40), arc(rr * 0.55, 0, 360, w=0.008, z=0.0, t=0.0015, n=32)), T(px, py, 0.009)), ring_m, parent=p, smooth=False)
        p.scale = (0.12, 0.12, 1)
        keys += [(p, "scale", 0, 0.12, 1.0), (p, "scale", 1, 0.12, 1.0)]
_lib.channel("ripple", keys)
_lib.channel("swell", [(swell, "scale", 0, 1.0, 1.12), (swell, "scale", 1, 1.0, 1.12)])
comp.export(col, root, "court", "puddles", made="blender/components/court/puddles.py", source="own geometry", license="ours", credit="",
            rig={"ripple": "every raindrop ring opens from a point to its whole width (22-40 cm): loop it", "swell": "the puddles spread 12% about the court's middle",
                 "wet": "in the scene: the material puddles_water (how dark and how mirror-like)"},
            notes="origin: the middle of the baseline on the ground, as court; the water lies 7 mm over the slab")
