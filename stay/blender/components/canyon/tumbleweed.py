# canyon/tumbleweed: a dry Russian thistle broken off at the root, a lumpy ball 0.6 m across, modelled
# by hand: fourteen main stems fanning from the stub of the root, each forking into six branches and those into six twigs
# that cross the ball and curl back at its lumpy edge, 600 sticks in three thicknesses and two straw colours. The prop the cursor picks off the
# sand and throws down the slot. Rig: "roll" turns it one whole turn forward about its middle (down the slot, away
# from the camera; loops); "hop" lifts it 0.7 m off the sand (one bound's height). In the scene: where it is along the
# slot (it bounds ahead of the camera) and the cursor's grab.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, xf, Vector, Matrix

col, root = comp.fresh("tumbleweed")
straw = comp.mat("tumbleweed_stem", (0.33, 0.24, 0.13), rough=0.85)
pale = comp.mat("tumbleweed_twig", (0.46, 0.36, 0.2), rough=0.9)
RAD = 0.33
SQ = Vector((1.0, 1.0, 0.86))
rnd = random.Random(3)
C = Vector((0, 0, RAD * SQ.z))


def rand_dir():
    while True:
        v = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1)))
        if 0.1 < v.length < 1:
            return v.normalized()


def branch(a, d, length, r, curl, n=6):
    """A stick from a, heading d, bending toward the ball's surface direction as it goes; returns its points."""
    pts, p = [a.copy()], a.copy()
    step = length / n
    for i in range(n):
        out = (p - C)
        if out.length > 1e-4:
            tang = d - out.normalized() * d.dot(out.normalized())
            k = min(1.0, out.length / RAD) ** 2 * curl
            d = (d * (1 - k) + tang.normalized() * k if tang.length > 1e-4 else d).normalized()
        d = (d + rand_dir() * 0.22).normalized()
        p = p + d * step
        q = p - C
        lim = RAD * (0.84 + 0.22 * L.noise.noise(q.normalized() * 1.6 + Vector((3.0, 1.0, 7.0))))      # a lumpy ball
        if q.length > lim:            # keep it in the ball
            p = C + q.normalized() * lim
        pts.append(p.copy())
    return [Vector((v.x * SQ.x, v.y * SQ.y, (v.z - C.z) * 1.0 + C.z)) for v in pts], d


stems, twigs = [], []
ROOT = C + Vector((0.02, 0.0, -0.1))
for i in range(14):
    d = rand_dir()
    pts, d1 = branch(ROOT, d, RAD * 0.95, 0.008, 0.15, n=5)
    stems.append(L.twig(pts, 0.0075, sides=5))
    for j in range(6):
        a = pts[rnd.randint(1, len(pts) - 1)]
        d2 = (d1 + rand_dir() * 1.3).normalized()
        p2, d3 = branch(a, d2, RAD * rnd.uniform(0.7, 1.3), 0.004, 0.4, n=6)
        stems.append(L.twig(p2, 0.0042, sides=4))
        for k in range(6):
            b = p2[rnd.randint(1, len(p2) - 1)]
            d4 = (d3 + rand_dir() * 1.6).normalized()
            p3, _ = branch(b, d4, RAD * rnd.uniform(0.35, 0.8), 0.002, 0.6, n=4)
            twigs.append(L.twig(p3, 0.0026, sides=3))
# the root's stub
stems.append(L.twig([ROOT + Vector((0, 0, -0.07)), ROOT + Vector((0.005, 0, -0.03)), ROOT], 0.011, sides=6))
hopp = comp.pivot(col, root, "tumbleweed_hop", (0, 0, 0))
spin = comp.pivot(col, root, "tumbleweed_roll", tuple(C), parent=hopp)
comp.mesh(col, root, "tumbleweed_stems", comp.merge(*stems), straw, parent=spin)
comp.mesh(col, root, "tumbleweed_twigs", comp.merge(*twigs), pale, parent=spin)
comp.channel("roll", [(spin, "rotation_euler", 0, 0, -2 * math.pi)])
comp.channel("hop", [(hopp, "location", 2, 0, 0.7)])
comp.export(col, root, L.PLACE, "tumbleweed", made="blender/components/canyon/tumbleweed.py", source="own geometry (a Russian thistle tumbleweed)", license="ours", credit="",
            rig={"roll": "one whole turn forward about its middle (tumbleweed_roll, 0.28 m up), rolling away from the camera; loops",
                 "hop": "lifts 0.7 m off the sand (tumbleweed_hop): a bound's height",
                 "place": "in the scene: where it is along the slot, and the cursor's grab and throw"})
