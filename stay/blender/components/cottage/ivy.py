# cottage/ivy: English ivy grown on the cottage (blender/components/cottage/_lib.py has the walls it grows on). Stems
# climb each patch from the ground, wandering, branching, turning off the glass; along them five-lobed leaves on short
# stalks, tilted out and up toward the light, bigger and darker low down and young and pale at the tips:
#   - up the front's left corner and the left wall's front end, over the window heads and along the frieze;
#   - over the stone chimney's front and outer faces, onto its stack;
#   - up the front's right corner, round the right pair's casing;
#   - over the left porch pier.
# The same origin as cottage/house (the door's sill on the wall's line); place both at the same point.
import os, sys, math, json, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "lib"))
sys.path.insert(0, HERE)
import comp, bpy, bmesh
from mathutils import Vector, Matrix
import _lib as C

rnd = random.Random(23)
V = Vector

# (matte: a glossy leaf tipped up mirrored the sky and the ivy read frosted from the path)
LEAVES = [comp.mat("ivy_old", (0.024, 0.058, 0.02), rough=0.78), comp.mat("ivy_leaf", (0.038, 0.095, 0.028), rough=0.76),
          comp.mat("ivy_young", (0.085, 0.17, 0.04), rough=0.76)]
STEM = comp.mat("ivy_stem", (0.16, 0.11, 0.07), rough=0.85)

col, root = comp.fresh("cottage_ivy")

# a five-lobed ivy leaf, across x and along y from its stalk (0) to its tip (1)
OUTLINE = [(0.0, 0.06), (0.24, 0.0), (0.46, 0.17), (0.40, 0.30), (0.52, 0.46), (0.27, 0.63), (0.0, 1.0),
           (-0.27, 0.63), (-0.52, 0.46), (-0.40, 0.30), (-0.46, 0.17), (-0.24, 0.0)]
MID = (0.0, 0.42)


class Plane:
    """a surface ivy grows on: p(u, z) its point, n its outward normal, ok(u, z) where it may grow, out(u, z) how far
    the surface stands off the plane there"""

    def __init__(self, origin, along, normal, ok, out=lambda u, z: 0.0):
        self.o, self.a, self.n = V(origin), V(along).normalized(), V(normal).normalized()
        self.ok, self.out = ok, out

    def p(self, u, z, off=0.0):
        return self.o + self.a * u + V((0, 0, z)) + self.n * (self.out(u, z) + off)


leaf_bm, stem_bm = bmesh.new(), bmesh.new()


def leaf(at, normal, axis, size, mi):
    """a leaf at `at`, its face toward `normal`, its tip along `axis`"""
    n = normal.normalized()
    y = (axis - n * axis.dot(n)).normalized()
    x = y.cross(n)
    c = at + x * (MID[0] * size) + y * (MID[1] * size) + n * (0.07 * size)        # (a little cupped)
    vc = leaf_bm.verts.new(c)
    ring = [leaf_bm.verts.new(at + x * (px * size) + y * (py * size) + n * (0.02 * size * abs(px))) for px, py in OUTLINE]
    for i in range(len(ring)):
        f = leaf_bm.faces.new((vc, ring[i], ring[(i + 1) % len(ring)]))
        f.material_index = mi


def stem(points, r0, r1):
    """a thin three-sided stalk through the points, tapering r0 to r1"""
    if len(points) < 2:
        return
    prev = None
    for i, p in enumerate(points):
        d = (points[min(i + 1, len(points) - 1)] - points[max(i - 1, 0)]).normalized()
        a = d.orthogonal().normalized()
        b = d.cross(a)
        r = r0 + (r1 - r0) * i / (len(points) - 1)
        ring = [stem_bm.verts.new(p + (a * math.cos(k * 2.094) + b * math.sin(k * 2.094)) * r) for k in range(3)]
        if prev:
            for k in range(3):
                stem_bm.faces.new((prev[k], prev[(k + 1) % 3], ring[(k + 1) % 3], ring[k]))
        prev = ring


UP = V((0, 0, 1))
STEP = 0.035


def grow(pl, u, z, theta, length, depth=0, age0=0.0, pull=0.12, noise=0.22):
    """one stem from (u, z) heading theta from straight up (in the plane, toward +u), `length` metres of it; it branches.
    `pull` is how hard it turns back to climbing (a runner along a board, or a trail hanging from a beam, has none)"""
    pts, s = [], 0.0
    while s < length:
        theta += rnd.gauss(0, noise) - pull * theta
        nu, nz = u + STEP * math.sin(theta), z + STEP * math.cos(theta)
        if not pl.ok(nu, nz):
            turned = False
            for dt in (0.7, -0.7, 1.3, -1.3):
                tu, tz = u + STEP * math.sin(theta + dt), z + STEP * math.cos(theta + dt)
                if pl.ok(tu, tz):
                    theta += dt
                    nu, nz = tu, tz
                    turned = True
                    break
            if not turned:
                break
        u, z, s = nu, nz, s + STEP
        k = s / max(length, 1e-3)
        pts.append(pl.p(u, z, 0.004))
        # leaves, alternate sides, every other step: bigger and older low on the stem
        if len(pts) % 2 == 0:
            side = 1 if len(pts) % 4 == 0 else -1
            age = min(1.0, age0 + 0.75 * k)
            size = rnd.uniform(0.05, 0.085) * (1.15 - 0.55 * age)
            du = side * rnd.uniform(0.012, 0.035)
            at = pl.p(u + du, z + rnd.uniform(-0.02, 0.01), rnd.uniform(0.012, 0.05))
            # its face out from the wall (toward the path) and tipped a little up; its tip hanging down and out to the side
            tilt = rnd.uniform(0.05, 0.4)
            nrm = (pl.n * math.cos(tilt) + UP * math.sin(tilt)).normalized()
            hang = (-UP * 0.8 + pl.a * side * rnd.uniform(0.2, 0.9) + pl.n * 0.3).normalized()
            hang = Matrix.Rotation(rnd.uniform(-0.5, 0.5), 3, nrm) @ hang
            mi = 2 if age > 0.8 else (0 if age < 0.3 and rnd.random() < 0.6 else 1)
            leaf(at, nrm, hang, size, mi)
        if depth < 3 and rnd.random() < 0.05 and length - s > 0.4:
            grow(pl, u, z, theta + rnd.choice((-1, 1)) * rnd.uniform(0.5, 1.1), (length - s) * rnd.uniform(0.4, 0.8), depth + 1, age0 + 0.75 * k, pull, noise)
    if pts:
        stem(pts[::3] + [pts[-1]], 0.006 if depth == 0 else 0.004, 0.0015)


def clear_of_glass(wall):
    """not over a window's glass or the door (a margin in from the casing's inside, so leaves may lap the casing)"""
    hs = C.holes(wall)
    # (and not through a window box and its brackets: the front pairs' and the right side's pair's)
    boxes = [(C.along(wall, c) - wd / 2 - 0.14, C.along(wall, c) + wd / 2 + 0.14) for w, c, wd, s, hh, panes in C.WINDOWS if w == wall and panes == 2 and wall in ("front", "right")]

    def ok(u, z):
        for u0, u1, z0, z1 in hs:
            if u0 + 0.03 < u < u1 - 0.03 and z0 + 0.02 < z < z1 - 0.02:
                return False
        for b0, b1 in boxes:
            if b0 < u < b1 and C.BOX_Z[0] - 0.3 < z < C.BOX_Z[1] + 0.05:
                return False
        return True
    return ok


def wall_out(u, z):
    """how far the wall's surface stands off its shingle face: the stone base and its water table stand proud"""
    return C.STONE_OUT + 0.01 if z < C.BASE + 0.09 else 0.012


def wall_plane(wall, umin, umax, top):
    o, a, n, L = C.wall_frame(wall)
    glass = clear_of_glass(wall)
    return Plane(o, a, n, lambda u, z: umin <= u <= umax and -0.02 <= z <= top(u) and glass(u, z), wall_out)


# (only what the path sees: the front, the porch, and the chimney's stack over the roof; the side walls are edge-on)
# ---- the front's left corner: up the corner board and round the left pair, over its head and along the frieze ---------
LF = C.along("front", -2.0)                                             # (the front wall, from its left end to x -2)
front_l = wall_plane("front", 0.0, LF, lambda u: C.PLATE - 0.02 if u < 1.3 else C.PLATE - 0.02 - 1.2 * (u - 1.3))
for k in range(16):
    u0 = rnd.uniform(0.0, 0.3) if k < 10 else rnd.uniform(0.3, 1.8)
    grow(front_l, u0, 0.0, rnd.uniform(-0.15, 0.6), rnd.uniform(2.2, 3.6) if k < 10 else rnd.uniform(0.4, 1.2))
# runners: along the stone base toward the porch, and along the frieze over the window's head
for k in range(4):
    grow(front_l, rnd.uniform(0.0, 0.3), 0.06, rnd.uniform(1.2, 1.45), rnd.uniform(0.9, 1.8), pull=0.02, noise=0.12)
for k in range(6):
    grow(front_l, rnd.uniform(0.0, 0.15), rnd.uniform(2.3, 2.65), rnd.uniform(1.3, 1.7), rnd.uniform(0.8, 1.7), 1, 0.3, pull=0.0, noise=0.12)
# trails hanging from the frieze down over the window's casing
for k in range(5):
    grow(front_l, rnd.uniform(0.1, 1.3), 2.68, math.pi + rnd.uniform(-0.25, 0.25), rnd.uniform(0.25, 0.6), 1, 0.5, pull=0.0, noise=0.1)

# ---- the chimney's stack, where it shows over the roof ------------------------------------------------------------------
cx0 = C.XL - C.CHIM_OUT
sx0 = cx0 + 0.04
SH = C.CHIM_SHOULDER
stack_front = Plane((sx0, C.CHIM_STACK[0], 0), (1, 0, 0), (0, -1, 0), lambda u, z: 0 <= u <= C.XL - sx0 and SH + 0.4 <= z <= C.CHIM_TOP - 0.35, lambda u, z: 0.01)
for k in range(7):
    grow(stack_front, rnd.uniform(0.0, 0.55), SH + 0.42, rnd.uniform(-0.3, 0.3), rnd.uniform(1.8, 2.6), 0, 0.2)

# ---- the front's right corner, round the right pair -------------------------------------------------------------------
L = C.wall_frame("front")[3]
front_r = wall_plane("front", C.along("front", 2.1), L, lambda u: C.PLATE - 0.02)
for k in range(10):
    grow(front_r, rnd.uniform(L - 0.25, L), 0.0, rnd.uniform(-0.7, 0.1), rnd.uniform(1.6, 3.2))
for k in range(4):
    grow(front_r, rnd.uniform(L - 0.15, L), rnd.uniform(2.3, 2.6), -rnd.uniform(1.3, 1.7), rnd.uniform(0.6, 1.3), 1, 0.3, pull=0.0, noise=0.12)
for k in range(3):
    grow(front_r, rnd.uniform(L - 1.2, L - 0.2), 2.68, math.pi + rnd.uniform(-0.25, 0.25), rnd.uniform(0.2, 0.5), 1, 0.5, pull=0.0, noise=0.1)

# ---- the left porch pier, its column, and along the porch's beam --------------------------------------------------------
h = C.PIER / 2
pier_front = Plane((-C.PX - h, C.PY - h, 0), (1, 0, 0), (0, -1, 0), lambda u, z: 0 <= u <= C.PIER and z <= C.PIER_H - 0.02, lambda u, z: 0.012)
pier_side = Plane((-C.PX - h, C.PY + h, 0), (0, -1, 0), (-1, 0, 0), lambda u, z: 0 <= u <= C.PIER and z <= C.PIER_H - 0.02, lambda u, z: 0.012)
for k in range(5):
    grow(pier_side, rnd.uniform(0.0, 0.5), 0.0, rnd.uniform(-0.3, 0.3), rnd.uniform(0.7, 1.3))
for k in range(4):
    grow(pier_front, rnd.uniform(0.0, 0.3), 0.0, rnd.uniform(0.0, 0.6), rnd.uniform(0.6, 1.2))
# the column tapers: its faces lean back as they rise
CZ0, CZ1 = C.PIER_H + 0.09, C.BEAM_B
tap = lambda z: max(0.0, min(1.0, (z - CZ0) / (CZ1 - CZ0))) * (C.COL_B - C.COL_T) / 2
col_front = Plane((-C.PX - C.COL_B / 2, C.PY - C.COL_B / 2, 0), (1, 0, 0), (0, -1, 0),
                  lambda u, z: CZ0 - 0.01 <= z <= CZ1 and tap(z) <= u <= C.COL_B - tap(z), lambda u, z: 0.008 - tap(z))
col_side = Plane((-C.PX - C.COL_B / 2, C.PY + C.COL_B / 2, 0), (0, -1, 0), (-1, 0, 0),
                 lambda u, z: CZ0 - 0.01 <= z <= CZ1 and tap(z) <= u <= C.COL_B - tap(z), lambda u, z: 0.008 - tap(z))
for k in range(4):
    grow(col_front, rnd.uniform(0.06, 0.28), CZ0, rnd.uniform(-0.3, 0.3), rnd.uniform(1.0, 1.6), 0, 0.2, pull=0.06)
for k in range(3):
    grow(col_side, rnd.uniform(0.06, 0.28), CZ0, rnd.uniform(-0.3, 0.3), rnd.uniform(1.0, 1.5), 0, 0.2, pull=0.06)
# along the beam's face from the column, and trails hanging from it
beam = Plane((-2.0, C.PY - 0.12, 0), (1, 0, 0), (0, -1, 0), lambda u, z: 0.0 <= u <= 1.35 and (C.BEAM_B <= z <= C.BEAM_T - 0.01 or (u < 1.25 and 1.85 <= z <= C.BEAM_T)), lambda u, z: 0.006)
for k in range(5):
    grow(beam, rnd.uniform(0.25, 0.45), rnd.uniform(C.BEAM_B + 0.05, C.BEAM_T - 0.06), rnd.uniform(1.4, 1.7), rnd.uniform(0.5, 1.0), 1, 0.4, pull=0.0, noise=0.1)
for k in range(6):
    grow(beam, rnd.uniform(0.3, 1.2), C.BEAM_B + 0.02, math.pi + rnd.uniform(-0.2, 0.2), rnd.uniform(0.2, 0.5), 1, 0.6, pull=0.0, noise=0.08)

o = comp.mesh(col, root, "ivy_leaves", leaf_bm, LEAVES)
o = comp.mesh(col, root, "ivy_stems", stem_bm, STEM, smooth=True)
comp.export(col, root, "cottage", "ivy", made="blender/components/cottage/ivy.py",
            source="own geometry (grown by the script on the cottage's walls)", license="ours", credit="")
