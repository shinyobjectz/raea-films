# kelp/sea-fan: a California golden gorgonian, 0.75 m high, modelled by hand: a holdfast, a short trunk and a fan of
# about ninety branches forking in one plane (the plane faces the camera, across the current), thinning to the tips.
# Rig: "sway" bends the fan 12 degrees back and 9 to the side about its foot, and its upper half 9 and 7 more.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("sea_fan")
gold = comp.mat("sea_fan_gold", (0.9, 0.45, 0.04), rough=0.6, emit=(0.9, 0.45, 0.04), strength=55.0)
rnd = random.Random(14)
low, high = [], []
SPLIT = 0.36
def grow(p, ang, ln, depth, r):
    a = math.radians(ang)
    q = (p[0] + ln * math.sin(a), p[1] + rnd.uniform(-0.012, 0.012), p[2] + ln * math.cos(a))
    mid = ((p[0] + q[0]) / 2 + rnd.uniform(-0.01, 0.01), (p[1] + q[1]) / 2, (p[2] + q[2]) / 2)
    (high if p[2] >= SPLIT else low).append(comp.tube([p, mid, q], r, res=3, sides=1))
    if depth == 0:
        return
    n = 2 if rnd.random() < 0.8 else 3
    for k in range(n):
        spread = (k - (n - 1) / 2) * rnd.uniform(34, 50)
        grow(q, ang * 0.75 + spread, ln * rnd.uniform(0.68, 0.86), depth - 1, max(0.0022, r * 0.74))
grow((0, 0, 0.03), 0, 0.16, 6, 0.011)
base = comp.pivot(col, root, "sea_fan_foot", (0, 0, 0.02))
upper = comp.pivot(col, root, "sea_fan_upper", (0, 0, SPLIT), parent=base)
comp.mesh(col, root, "sea_fan_holdfast", L.lathe([(0.05, 0.0), (0.035, 0.012), (0.014, 0.03), (0.0, 0.034)], seg=12), gold, smooth=True)
comp.mesh(col, root, "sea_fan_lower", comp.merge(*low), gold, parent=base, smooth=True)
comp.mesh(col, root, "sea_fan_branches", comp.merge(*high), gold, parent=upper, smooth=True)
L.channel("sway", [(base, "rotation_euler", 0, 0.0, math.radians(-12)), (base, "rotation_euler", 1, 0.0, math.radians(9)), (upper, "rotation_euler", 0, 0.0, math.radians(-9)), (upper, "rotation_euler", 1, 0.0, math.radians(7))])
comp.export(col, root, "kelp", "sea_fan", made="blender/components/kelp/sea_fan.py", source="own geometry (a California golden gorgonian)", license="ours", credit="",
            rig={"sway": "the fan bends 12 degrees back (toward +y) and 9 to the side (+x) about its foot (sea_fan_foot), and its upper half (sea_fan_upper) 9 and 7 degrees more about the fan's middle"})
