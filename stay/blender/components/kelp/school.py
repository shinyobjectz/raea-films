# kelp/school: a school of forty-two senoritas (Oxyjulis californica), slim orange-tan wrasses 16 to 22 cm long with a
# black blot on the tail, modelled and painted by hand, all heading +x in a loose lens 3 m long. Its origin is under
# the school's middle, the fish between 0.4 and 1.8 m above it. Rig: "swim" carries the school 3 m ahead;
# "turn" wheels it 70 degrees about its middle (the school turning as one).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
import numpy as np
from comp import T, R, S, xf

col, root = comp.fresh("school")
h, w = 128, 256
yy, xx = np.mgrid[0:h, 0:w]
u, v = xx / w, yy / h
img = np.zeros((h, w, 3))
img[:] = (0.85, 0.45, 0.12)
img *= (0.7 + 0.5 * v)[..., None]
img[v < 0.35] = (0.9, 0.82, 0.62)
img[(u > 0.8) & (np.abs(v - 0.5) < 0.3)] = (0.03, 0.03, 0.03)
skin = L.picture("senorita_skin", L.save_png(os.path.join(L.TEX, "senorita.png"), np.dstack([img, np.ones((h, w))])), emit=120.0, rough=0.3)
swim = comp.pivot(col, root, "school_swim", (0, 0, 1.1))
turn = comp.pivot(col, root, "school_turn", (0, 0, 1.1), parent=swim)
rnd = random.Random(6)
fishes = []
for i in range(42):
    ln = rnd.uniform(0.16, 0.22)
    b = L.fish_body(ln, ln * 0.2, ln * 0.11, seg=8, rings=9, snout=0.6)
    tail = L.fin([(0.0, 0.012 * ln / 0.2), (0.16 * ln, 0.1 * ln), (0.13 * ln, 0.0), (0.16 * ln, -0.1 * ln), (0.0, -0.012 * ln / 0.2)], ln, ln * 0.2, x0=0.82 * ln)
    xf(tail, R(rnd.uniform(-22, 22), "Z"))
    dors = L.fin([(0.0, 0.0), (0.05 * ln, 0.04 * ln), (0.4 * ln, 0.035 * ln), (0.45 * ln, 0.0)], ln, ln * 0.2, x0=0.28 * ln, z0=0.085 * ln)
    f = comp.merge(b, tail, dors)
    xf(f, T(-ln / 2, 0, 0))
    xf(f, R(180, "Z"))                       # the body is built with its tail toward +x: turn it to head +x
    xf(f, R(rnd.uniform(-14, 14), "Z"))
    xf(f, R(rnd.uniform(-8, 8), "Y"))
    a, rr = rnd.uniform(0, 6.28), rnd.uniform(0, 1) ** 0.6
    xf(f, T(1.5 * rr * math.cos(a) + rnd.uniform(-0.2, 0.2), 0.55 * rr * math.sin(a) * rnd.uniform(0.3, 1), 1.1 + 0.7 * rr * math.sin(a * 1.7 + i)))
    fishes.append(f)
comp.mesh(col, root, "school_fish", comp.merge(*fishes), skin, parent=turn, smooth=True)
L.channel("swim", [(swim, "location", 0, 0.0, 3.0)])
L.channel("turn", [(turn, "rotation_euler", 2, 0.0, math.radians(70))])
comp.export(col, root, "kelp", "school", made="blender/components/kelp/school.py", source="own geometry and painting (a school of senoritas)", license="ours", credit="",
            rig={"swim": "the school (school_swim) moves 3 m ahead (+x)", "turn": "the school (school_turn) wheels 70 degrees about its middle"})
