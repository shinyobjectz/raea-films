# koi/maple: a Japanese maple in autumn red, about 3.4 m high and 4 m across, modelled by hand: a leaning trunk that
# forks low into three limbs, each into branches and twigs (Poly Haven's trident_maple_bark, CC0), and some 4,500
# leaves, each a seven-pointed palmate leaf of real shape, in layered clouds round the twigs in three reds. Its
# foot at the origin; it leans over the pond. Rig: "sway" leans the whole crown 3 degrees from the top of the trunk
# (a morning breeze); "fall" lets twelve loose leaves fall from the canopy to the ground, drifting and turning.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("maple")
rng = random.Random(12)
bark = comp.ph_texture("maple_bark", "trident_maple_bark", tile=0.9, res="1k", tint=(0.6, 0.55, 0.5))
REDS = [comp.mat(f"maple_leaf_{i + 1}", srgb(c), rough=0.55) for i, c in enumerate(((0.74, 0.1, 0.06), (0.9, 0.3, 0.06), (0.55, 0.05, 0.08)))]
branches, anchors = [], []
def grow(p, d, length, r, depth):
    pts, cur = [p.copy()], p.copy()
    n = 5
    for i in range(n):
        d = (d + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.6, 0.6))) * 0.22 + Vector((0, 0, 0.05 if depth < 1 else -0.03))).normalized()
        cur = cur + d * length / n
        pts.append(cur.copy())
    branches.append((pts, r, depth))
    if depth >= 3:
        anchors.extend(pts[2:])
        return
    for j in range(3 if depth < 2 else 2):
        az = rng.uniform(0, 2 * math.pi) if depth else (j * 2.1 + 0.4)
        nd = (d * 0.45 + Vector((math.cos(az), math.sin(az), rng.uniform(0.0, 0.4)))).normalized()
        grow(cur, nd, length * rng.uniform(0.78, 0.95), r * 0.56, depth + 1)
    if depth:
        grow(pts[3], (d * 0.3 + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), 0.2))).normalized(), length * 0.6, r * 0.4, max(depth + 1, 3))
grow(Vector((0, 0, -0.05)), Vector((0.22, -0.1, 1.0)).normalized(), 1.35, 0.085, 0)
TOP = branches[0][0][-1]
tr = M("maple_trunk", comp.merge(comp.tube([tuple(p) for p in branches[0][0]], 0.085, res=4, sides=4), turn([(0.16, 0.0), (0.11, 0.1), (0.088, 0.22)], -0.05, seg=16, at=(0, 0))), bark, smooth=True)
comp.uv_box(tr, 1.0)
crown = comp.pivot(col, root, "maple_crown", tuple(TOP))
limbs = comp.merge(*[comp.tube([tuple(p) for p in pts], r, res=3 if depth < 3 else 2, sides=3 if depth < 2 else (2 if depth < 3 else 1)) for pts, r, depth in branches[1:]])
lb = M("maple_limbs", limbs, bark, parent=crown, smooth=True)
comp.uv_box(lb, 1.0)
def leaf(size):
    bm = bmesh.new()
    c = bm.verts.new((0, 0, 0))
    rim = []
    LOBES = [(-135, 0.45), (-90, 0.7), (-45, 0.9), (0, 1.0), (45, 0.9), (90, 0.7), (135, 0.45)]
    for i, (a, l) in enumerate(LOBES):
        a0 = math.radians(a + 90)
        if i:
            am = math.radians(a - 22.5 + 90)
            rim.append(bm.verts.new((0.28 * size * math.cos(am), 0.28 * size * math.sin(am), 0)))
        rim.append(bm.verts.new((l * size * math.cos(a0), l * size * math.sin(a0), -0.06 * size)))
    stem = bm.verts.new((0, -0.5 * size, 0))
    for i in range(len(rim) - 1):
        bm.faces.new((c, rim[i], rim[i + 1]))
    bm.faces.new((c, rim[-1], stem)); bm.faces.new((c, stem, rim[0]))
    return bm
clouds = [[], [], []]
for a in anchors:
    for _ in range(rng.randrange(30, 40)):
        p = a + Vector((rng.gauss(0, 0.26), rng.gauss(0, 0.26), rng.gauss(0, 0.07)))
        l = leaf(rng.uniform(0.055, 0.09))
        xf(l, T(*p) @ R(rng.uniform(0, 360), "Z") @ R(rng.uniform(-40, 40), "X") @ R(rng.uniform(-30, 30), "Y"))
        clouds[rng.choice((0, 0, 1, 1, 2))].append(l)
for i, c in enumerate(clouds):
    M(f"maple_leaves_{i + 1}", comp.merge(*c), REDS[i], parent=crown)
keys = []
for i in range(12):
    a = rng.choice(anchors)
    p = a + Vector((rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), -0.15))
    pv = comp.pivot(col, root, f"maple_falling_{i + 1}", tuple(p))
    M(f"maple_falling_{i + 1}_leaf", xf(leaf(0.065), T(*p) @ R(rng.uniform(0, 360), "Z") @ R(rng.uniform(-30, 30), "X")), REDS[i % 3], parent=pv)
    keys += [(pv, "location", 2, pv.location.z, 0.015), (pv, "location", 0, pv.location.x, pv.location.x + rng.uniform(-0.5, 0.5)), (pv, "location", 1, pv.location.y, pv.location.y + rng.uniform(-0.6, 0.1)),
             (pv, "rotation_euler", 2, 0, rng.uniform(-6, 6)), (pv, "rotation_euler", 0, 0, rng.choice((-1, 1)) * math.pi * rng.randrange(1, 3))]
channel("sway", [(crown, "rotation_euler", 0, 0, math.radians(3))])
channel("fall", keys)
print(f"maple: {len(branches)} branches, {sum(len(c) for c in clouds)} leaves")
done(col, root, "maple", "own geometry (a Japanese maple); https://polyhaven.com/a/trident_maple_bark (CC0)", license="CC0", credit="Poly Haven (texture)",
     rig={"sway": "the crown (limbs and leaves) leans 3 degrees about the top of the trunk", "fall": "twelve loose leaves fall from the canopy to the ground, drifting and turning over"})
