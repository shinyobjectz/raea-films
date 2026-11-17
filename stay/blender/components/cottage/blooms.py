# cottage/blooms: the cottage's flowers (blender/components/cottage/_lib.py has where its boxes and porch are):
#   - in the window boxes (the front pairs' and the right side's pair's): red geraniums, clumps of round scalloped leaves
#     and umbels of five-petalled florets on stalks above them; over the boxes' front edge, trails of blue lobelia and
#     white bacopa hanging down;
#   - in the two planters on the porch (sets/outdoors.ts doorGarden puts them at x +-1.25, 0.42 m in front of the
#     wall's line, 0.44 m tall): pink geraniums over soil, and trails;
#   - a climbing rose, soft pink, from the right pier's foot up the pier and round its column, then along the porch beam
#     toward the door: canes, compound leaves, open cupped blooms and buds.
# The same origin as cottage/house; place both at the same point.
import os, sys, math, json, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "lib"))
sys.path.insert(0, HERE)
import comp, bpy, bmesh
from mathutils import Vector, Matrix
import _lib as C

rnd = random.Random(31)
V = Vector
UP = V((0, 0, 1))

# materials, in the order of their index in the meshes
MATS = [
    comp.mat("bloom_geranium", (0.72, 0.035, 0.03), rough=0.55),          # 0
    comp.mat("bloom_geranium_pink", (0.85, 0.22, 0.32), rough=0.55),      # 1
    comp.mat("bloom_lobelia", (0.16, 0.13, 0.62), rough=0.55),            # 2
    comp.mat("bloom_bacopa", (0.9, 0.9, 0.86), rough=0.6),                # 3
    comp.mat("bloom_rose", (0.9, 0.52, 0.56), rough=0.5),                 # 4
    comp.mat("bloom_rose_deep", (0.78, 0.32, 0.4), rough=0.5),            # 5
    comp.mat("bloom_leaf", (0.04, 0.11, 0.03), rough=0.75),               # 6
    comp.mat("bloom_leaf_geranium", (0.07, 0.19, 0.045), rough=0.75),     # 7
    comp.mat("bloom_stem", (0.12, 0.2, 0.06), rough=0.7),                 # 8
    comp.mat("bloom_cane", (0.2, 0.17, 0.08), rough=0.8),                 # 9
    comp.mat("bloom_soil", (0.1, 0.07, 0.045), rough=1.0),                # 10
    comp.mat("bloom_eye", (0.95, 0.85, 0.35), rough=0.6),                 # 11
]
col, root = comp.fresh("cottage_blooms")
bm = bmesh.new()


def frame(normal, axis):
    n = normal.normalized()
    y = (axis - n * axis.dot(n))
    y = y.normalized() if y.length > 1e-6 else n.orthogonal().normalized()
    return y.cross(n), y, n


def fan(c, outline, x, y, n, mi, lift=0.0):
    """a flat shape round its centre c: outline points (across x, along y) in metres"""
    vc = bm.verts.new(c + n * lift)
    ring = [bm.verts.new(c + x * px + y * py) for px, py in outline]
    for i in range(len(ring)):
        bm.faces.new((vc, ring[i], ring[(i + 1) % len(ring)])).material_index = mi


def floret(c, normal, r, mi, petals=5):
    """a small flower: petals round an eye, notched between them"""
    x, y, n = frame(normal, normal.orthogonal())
    pts = []
    for k in range(2 * petals):
        a = math.pi * k / petals + rnd.uniform(-0.1, 0.1)
        rr = r if k % 2 == 0 else r * 0.45
        pts.append((rr * math.cos(a), rr * math.sin(a)))
    fan(c, pts, x, y, n, mi, lift=r * 0.15)


def leaf(base, normal, axis, length, width, mi, curl=0.15):
    """an oval leaf from its base along axis"""
    x, y, n = frame(normal, axis)
    pts = [(0, 0)] + [(width * 0.5 * math.sin(math.pi * t), length * t) for t in (0.2, 0.45, 0.7, 0.9)] + [(0, length)] + \
          [(-width * 0.5 * math.sin(math.pi * t), length * t) for t in (0.9, 0.7, 0.45, 0.2)]
    fan(base + y * (length * 0.45), [(px, py - length * 0.45) for px, py in pts], x, y, n, mi, lift=curl * width)


def round_leaf(c, normal, r, mi):
    """a geranium leaf: round, scalloped"""
    x, y, n = frame(normal, normal.orthogonal())
    pts = []
    for k in range(14):
        a = 2 * math.pi * k / 14
        rr = r * (1.0 if k % 2 == 0 else 0.86) * (0.0 if k == 0 else 1.0) if k else r * 0.25
        pts.append((rr * math.cos(a), rr * math.sin(a)))
    fan(c, pts, x, y, n, mi, lift=r * 0.12)


def stalk(points, r, mi):
    prev = None
    for i, p in enumerate(points):
        d = (points[min(i + 1, len(points) - 1)] - points[max(i - 1, 0)]).normalized()
        a = d.orthogonal().normalized()
        b = d.cross(a)
        ring = [bm.verts.new(p + (a * math.cos(k * 2.094) + b * math.sin(k * 2.094)) * r) for k in range(3)]
        if prev:
            for k in range(3):
                bm.faces.new((prev[k], prev[(k + 1) % 3], ring[(k + 1) % 3], ring[k])).material_index = mi
        prev = ring


def geranium(base, out, mi_flower, umbels=2, big=1.0):
    """a clump: leaves round its foot, umbels of florets on stalks over it"""
    for k in range(rnd.randint(9, 13)):
        a = rnd.uniform(0, 2 * math.pi)
        d = V((math.cos(a), math.sin(a), 0)) * rnd.uniform(0.02, 0.09)
        c = base + d + UP * rnd.uniform(0.03, 0.12)
        nrm = (UP * 1.0 + d.normalized() * rnd.uniform(0.3, 0.9) + out * 0.3).normalized()
        stalk([base + d * 0.3, c], 0.002, 8)
        round_leaf(c, nrm, rnd.uniform(0.028, 0.045), 7)
    for k in range(umbels):
        top = base + V((rnd.uniform(-0.05, 0.05), rnd.uniform(-0.05, 0.05), 0)) + out * rnd.uniform(0.0, 0.05) + UP * rnd.uniform(0.2, 0.3)
        stalk([base, base + (top - base) * 0.5 + V((0.01, 0.0, 0)), top], 0.0025, 8)
        R = rnd.uniform(0.035, 0.045) * big
        for j in range(int(rnd.randint(14, 20) * big * big)):
            v = V((rnd.gauss(0, 1), rnd.gauss(0, 1), abs(rnd.gauss(0, 1)) + 0.4)).normalized()
            floret(top + v * R * rnd.uniform(0.7, 1.0), (v + out * 0.4).normalized(), rnd.uniform(0.009, 0.012) * big, mi_flower)


def trail(start, out, side, length, mi_flower):
    """a trailing stem over a box's edge: out over the rim, then hanging, small leaves and flowers along it"""
    pts = [start]
    p, d = V(start), (out * 0.7 + UP * 0.2 + side * rnd.uniform(-0.3, 0.3)).normalized()
    n = int(length / 0.025)
    for i in range(n):
        d = (d + (-UP) * 0.18 + V((rnd.gauss(0, 0.05), rnd.gauss(0, 0.05), 0))).normalized()
        p = p + d * 0.025
        pts.append(p)
        if i % 2 == 0:
            nrm = (out * 0.8 + UP * 0.4 + V((rnd.gauss(0, 0.3), rnd.gauss(0, 0.3), rnd.gauss(0, 0.3)))).normalized()
            leaf(p, nrm, d.cross(nrm) * (1 if i % 4 else -1) + d * 0.5, rnd.uniform(0.012, 0.018), 0.009, 7)
        if i % 3 == 1:
            floret(p + out * 0.006 + V((rnd.gauss(0, 0.006), rnd.gauss(0, 0.006), 0)), (out + UP * 0.3).normalized(), rnd.uniform(0.006, 0.008), mi_flower)
    stalk(pts[::2], 0.0015, 8)


# ---- the window boxes ------------------------------------------------------------------------------------------------
soil_top = C.BOX_Z[1] - 0.035
for wall, c, wd, s, h, panes in C.WINDOWS:
    if not (panes == 2 and wall in ("front", "right")):
        continue
    o, a, nrm, L = C.wall_frame(wall)
    a, nrm = V(a), V(nrm)
    u = C.along(wall, c)
    b0, b1 = u - wd / 2 - 0.10, u + wd / 2 + 0.10
    n = 10
    for k in range(n):
        uu = b0 + 0.09 + (b1 - b0 - 0.18) * (k + rnd.uniform(0.2, 0.8)) / n
        base = V(C.at(wall, uu, soil_top, rnd.uniform(0.1, 0.2)))
        geranium(base, nrm, 0 if rnd.random() < 0.85 else 1, umbels=rnd.choice((2, 3, 3)), big=1.45)
    for k in range(20):
        uu = b0 + 0.04 + (b1 - b0 - 0.08) * (k + rnd.uniform(0.1, 0.9)) / 14
        start = V(C.at(wall, uu, soil_top + 0.02, 0.255))
        trail(start, nrm, a, rnd.uniform(0.25, 0.5), 2 if k % 2 else 3)

# ---- the porch's planters (sets/outdoors.ts: x +-1.25, 0.42 m out from the wall's line, 0.44 m tall) -------------------
for sx in (-1, 1):
    pc = V((sx * 1.25, C.FRONT - 0.32, 0.017 + 0.40))
    sb = comp.box((0.84, 0.36, 0.02), tuple(pc))
    for f in sb.faces:
        f.material_index = 10
    bm = comp.merge(bm, sb)
    out = V((0, -1, 0))
    for k in range(5):
        base = pc + V((-0.34 + 0.17 * k + rnd.uniform(-0.03, 0.03), rnd.uniform(-0.08, 0.06), 0.01))
        geranium(base, out, 1, umbels=2)
    for k in range(8):
        start = pc + V((-0.4 + 0.8 * (k + 0.5) / 8, -0.19, 0.03))
        trail(start, out, V((1, 0, 0)), rnd.uniform(0.18, 0.32), 3 if k % 2 else 2)

# ---- the climbing rose on the right pier and column, and along the beam -----------------------------------------------
X, Y = C.PX, C.PY
canes = []
# up the pier's outer and front faces from its foot
for k in range(4):
    face = k % 2
    pts = []
    t0 = rnd.uniform(0, 1)
    for i in range(14):
        z = 0.02 + i * (C.PIER_H + 0.05) / 13
        if face == 0:                      # the outer face (+x)
            p = V((X + C.PIER / 2 + 0.03, Y + (t0 - 0.5) * C.PIER * 0.8 + 0.05 * math.sin(i * 0.9 + k), z))
        else:                              # the front face (-y)
            p = V((X + (t0 - 0.5) * C.PIER * 0.8 + 0.05 * math.sin(i * 0.9 + k), Y - C.PIER / 2 - 0.03, z))
        pts.append(p)
    canes.append(pts)
# round the column, tapering with it, from the cap to the beam
CZ0, CZ1 = C.PIER_H + 0.09, C.BEAM_B
for k in range(3):
    pts = []
    ph = rnd.uniform(0, 2 * math.pi)
    turns = rnd.uniform(1.1, 1.6)
    for i in range(26):
        t = i / 25
        z = CZ0 + t * (CZ1 - CZ0 - 0.03)
        w = (C.COL_B + (C.COL_T - C.COL_B) * min(1, t)) / 2 + 0.03
        a = ph + 2 * math.pi * turns * t
        # (round a square column: push the circle out to the square's faces)
        ca, sa = math.cos(a), math.sin(a)
        m = max(abs(ca), abs(sa))
        pts.append(V((X + w * ca / m, Y + w * sa / m, z)))
    canes.append(pts)
# along the beam's front face toward the door, and over its top
for k in range(3):
    pts = []
    z0 = C.BEAM_B + 0.05 + 0.1 * k
    for i in range(22):
        x = X - 0.05 - i * 0.06
        pts.append(V((x, Y - 0.12 - 0.03, z0 + 0.05 * math.sin(i * 0.6 + k * 2) + (0.12 if k == 2 else 0.0))))
    canes.append(pts)

for pts in canes:
    stalk(pts, 0.006, 9)
    # leaves: compound, three to five leaflets, every so often; blooms and buds at the ends of side shoots
    for i in range(1, len(pts) - 1):
        p = pts[i]
        d = (pts[i + 1] - pts[i - 1]).normalized()
        # the outward side: away from the pier or column's middle, or out from the beam
        away = V((p.x - X, p.y - Y, 0))
        away = away.normalized() if away.length > 1e-3 and p.z < C.BEAM_B else V((0, -1, 0))
        if rnd.random() < 0.75:
            side = d.cross(away).normalized() * rnd.choice((-1, 1))
            stem_end = p + (side * 0.5 + away * 0.7).normalized() * 0.04
            stalk([p, stem_end], 0.0015, 8)
            for j in range(rnd.choice((3, 5))):
                q = stem_end + d * (0.012 * (j - 1))
                nrm = (away + UP * 0.15 + V((0, -0.4, 0)) + V((rnd.gauss(0, 0.25), rnd.gauss(0, 0.25), 0))).normalized()
                leaf(q, nrm, (side * (1 if j % 2 else -1) + d * 0.6).normalized(), rnd.uniform(0.022, 0.032), 0.016, 6)
        if rnd.random() < 0.55:
            # a bloom: an inner cup and an outer ring of opener petals, on a short stalk out from the cane
            bc = p + away * rnd.uniform(0.03, 0.06) + UP * rnd.uniform(-0.02, 0.03) + d * rnd.uniform(-0.02, 0.02)
            stalk([p, bc], 0.002, 8)
            face = (away + UP * 0.35 + V((rnd.gauss(0, 0.3), rnd.gauss(0, 0.3), rnd.gauss(0, 0.2)))).normalized()
            R = rnd.uniform(0.03, 0.045)
            mi = 4 if rnd.random() < 0.7 else 5
            bud = rnd.random() < 0.2
            x, y, n = frame(face, face.orthogonal())
            rings = [(5, 0.45, 0.75, 5)] if bud else [(5, 0.42, 0.8, 5), (7, 0.75, 0.45, 4), (8, 1.0, 0.18, 4)]
            for (cnt, rr, rise, m_i) in rings:
                for q in range(cnt):
                    a = 2 * math.pi * (q + rnd.uniform(-0.15, 0.15)) / cnt + rr
                    dirv = x * math.cos(a) + y * math.sin(a)
                    tip = bc + dirv * (R * rr) + n * (R * rise)
                    base = bc + dirv * (R * rr * 0.25) + n * (R * 0.05)
                    pd = (tip - base)
                    pn = (n * 0.6 - dirv * (0.8 if rise > 0.5 else 0.2)).normalized()
                    leaf(base, pn, pd, pd.length * 1.1, R * rr * 0.95, mi if rr < 0.9 else 4, curl=0.3)

o = comp.mesh(col, root, "blooms", bm, MATS)
comp.export(col, root, "cottage", "blooms", made="blender/components/cottage/blooms.py",
            source="own geometry (grown by the script in the cottage's boxes and on its porch)", license="ours", credit="")
