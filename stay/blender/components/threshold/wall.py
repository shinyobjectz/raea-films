# threshold/wall: a ruined wall of dressed limestone with the castle door's opening in it, 5 m wide and up to 4.4 m
# high, 0.6 m thick. Its blocks are laid in courses, each block its own solid with a real joint round it; round the
# door the courses stop at the jambs, and over it a ring of eleven voussoirs and a keystone carries the round head (the
# blocks beside the ring are cut to its curve). Its top is broken: tall on the left, fallen away on the right, and the
# blocks that fell lie at its foot. The opening fits media/models/cathedral/door.glb placed at the same origin (its
# frame's face at y 0.014). No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

rnd = random.Random(11)
col, root = comp.fresh("wall")
STONE = L.stone()
Y0, Y1 = L.WALL_Y
HALF = 2.5
JAMB = L.DOOR_HALF + L.CLEAR                    # the opening's sides
RI = L.HEAD_R + L.CLEAR                          # the head's intrados
RX = RI + 0.42                                   # and the voussoirs' outer edge (the extrados)
C = L.SPRING_Z
GAP = 0.012


def top(x):
    """the broken top of the wall: tall on the left, fallen away to the right, with a notch"""
    base = 4.4 - 0.36 * (x + HALF) - (0.55 if x > 1.65 else 0.0) - (0.3 if 0.2 < x < 0.9 else 0.0)
    return max(base, 3.75 if abs(x) < 1.9 else 2.2)


def ext(z):
    """the extrados's half-width at height z (0 over its crown)"""
    if z <= C:
        return RX
    return math.sqrt(max(0.0, RX * RX - (z - C) ** 2))


def block(a, b, za, zb, curve):
    """one block's outline: a rectangle, or with its inner end cut to the extrados (`curve` -1 its right end, the
    arch being to its right; +1 its left end)"""
    if curve == 0:
        return [(a, za), (b, za), (b, zb), (a, zb)]
    zs = [za + (zb - za) * k / 6 for k in range(7)]
    if curve < 0:
        ends = [(min(b, -ext(z) - GAP / 2), z) for z in zs]
        return [(a, za)] + ends + [(a, zb)]
    ends = [(max(a, ext(z) + GAP / 2), z) for z in zs]
    return [(b, za), (b, zb)] + list(reversed(ends))


blocks, loose = [], []
z, course = 0.0, 0
while z < 4.45:
    h = rnd.uniform(0.27, 0.35)
    if z < C - 0.05 and z + h > C - 0.12:
        h = C - z                                # (a course ends at the springing, where the arch begins)
    z0, z1 = z, z + h
    x = -HALF - rnd.uniform(0.0, 0.35) * (course % 2)
    while x < HALF:
        ln = rnd.uniform(0.48, 0.95)
        x0, x1 = max(x, -HALF), min(x + ln, HALF)
        x += ln
        mid = (x0 + x1) / 2
        if z1 > top(mid) + rnd.uniform(-0.12, 0.2):
            if z0 < top(mid) + 0.3 and rnd.random() < 0.25:
                loose.append((x0, x1, z0, z1))          # (a block that was up there: it lies at the foot now)
            continue
        above = z1 > C + 1e-6
        ix = ext(z1) if above else JAMB                  # where the opening (or the ring over it) stops a block, at its top
        pieces = []
        if x1 <= -ix or x0 >= ix:
            pieces.append((x0, x1))
        else:
            if x0 < -ix:
                pieces.append((x0, -ix))
            if x1 > ix:
                pieces.append((ix, x1))
        for a, b in pieces:
            a2, b2, za, zb = a + GAP / 2, b - GAP / 2, z0 + GAP / 2, z1 - GAP / 2
            curve = 0
            if above and b2 <= 0 and b2 > -ext(za) - GAP:
                curve = -1
                if -ext(za) - GAP / 2 - a2 < 0.1:
                    continue                             # (too thin a sliver at its foot)
            elif above and a2 >= 0 and a2 < ext(za) + GAP:
                curve = 1
                if b2 - (ext(za) + GAP / 2) < 0.1:
                    continue
            if b2 - a2 < 0.14:
                continue
            inset = rnd.uniform(-0.012, 0.008)
            bm = L.prism(block(a2, b2, za, zb, curve), Y0 + inset, Y1 - rnd.uniform(0, 0.01))
            L.rough(bm, 0.006, seed=len(blocks))
            blocks.append(bm)
    z = z1
    course += 1

# the voussoirs: eleven wedges over the head, from the springing round to the springing; the middle one, the keystone,
# a little prouder than the rest
N = 11
for i in range(N):
    a0, a1 = math.pi * i / N, math.pi * (i + 1) / N
    g = GAP / RI / 2
    key = i == N // 2
    ro = RX + (0.06 if key else 0.0)
    arc = [a0 + g + (a1 - a0 - 2 * g) * k / 6 for k in range(7)]
    poly = [(RI * math.cos(a), C + RI * math.sin(a)) for a in arc] + [(ro * math.cos(a), C + ro * math.sin(a)) for a in reversed(arc)]
    bm = L.prism(poly, Y0 - (0.025 if key else rnd.uniform(-0.004, 0.006)), Y1)
    L.rough(bm, 0.005, seed=100 + i)
    blocks.append(bm)

# what fell: the loose blocks, lying tipped and half sunk at the wall's foot, most of them on the right where it broke
for i, (x0, x1, z0, z1) in enumerate(loose[:9]):
    ln, h = x1 - x0, z1 - z0
    bm = comp.box((ln - GAP, 0.58, h - GAP))
    L.rough(bm, 0.008, seed=200 + i)
    side = 1 if i % 3 else -1
    fx, fy = side * rnd.uniform(1.5, 2.9), -rnd.uniform(0.5, 1.5)
    xf(bm, R(rnd.uniform(-20, 20), "X") @ R(rnd.uniform(0, 360), "Z") @ R(rnd.uniform(-10, 10), "Y"))
    xf(bm, T(fx, fy, h * 0.3))
    blocks.append(bm)

print("blocks", len(blocks), "loose", len(loose))
o = comp.mesh(col, root, "wall_stones", comp.merge(*blocks), STONE)
comp.bevel(o, width=0.012, segments=2, angle=35)
L.finish(o, 1.0)
comp.export(col, root, "threshold", "wall", made="blender/components/threshold/wall.py",
            source="own geometry; stone: https://polyhaven.com/a/worn_rock_natural_01", license="CC0", credit="Poly Haven (texture)",
            notes=f"the castle door's opening: sides at x +-{JAMB:.3f}, its head an arc about (0, {C}) of radius {RI:.3f}; front face y {Y0}")
