# gym/court: half a high-school basketball court, 17 x 14.5 m of varnished hardwood strip (Poly Haven's wood_floor,
# narrow planks; plank_flooring_02 was tried and its knots read wrong for a gym), modelled by hand with its paint a millimetre proud: the baseline and sidelines, the key
# (3.66 m wide, 5.8 m long) filled in the school's green, the free-throw line and its circle, the three-point arc
# (6.02 m from the rim) with its straight runs to the baseline, the half-court line and half the centre circle, and the
# lane's block marks. The origin is on the floor under the rim's centre (1.6 m in from the baseline); the baseline wall
# is toward +y. Lines are 5 cm, white.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import T, R, S, xf

col, root = comp.fresh("court")
M = _lib.maker(col, root)
wood = comp.ph_texture("court_wood", "wood_floor", tile=1.7, res="2k")
white = comp.mat("court_lines", (0.9, 0.9, 0.86), rough=0.35)
green = comp.mat("court_key", (0.02, 0.16, 0.09), rough=0.35)
BASE = 1.6          # the baseline, toward +y from the rim
HALF = BASE - 12.8  # the half-court line
SIDE = 7.62
LW, Z = 0.05, 0.0012
f = M("court_floor", comp.box((17.0, 14.5, 0.04), at=(0, (BASE + 1.0 + HALF - 0.7) / 2, -0.02)), wood, smooth=False)
comp.uv_box(f, 1.0)


def strip(x0, y0, x1, y1, w=LW, z=Z):
    dx, dy = x1 - x0, y1 - y0
    ln = math.hypot(dx, dy)
    bm = comp.box((ln, w, 0.0006))
    xf(bm, T((x0 + x1) / 2, (y0 + y1) / 2, z) @ R(math.degrees(math.atan2(dy, dx)), "Z"))
    return bm


def arc(cx, cy, r, a0, a1, n=64, w=LW, z=Z):
    bm = bmesh.new()
    ring = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        ring.append((bm.verts.new((cx + (r - w / 2) * math.cos(a), cy + (r - w / 2) * math.sin(a), z)), bm.verts.new((cx + (r + w / 2) * math.cos(a), cy + (r + w / 2) * math.sin(a), z))))
    for (a, b), (c, d) in zip(ring, ring[1:]):
        bm.faces.new((a, b, d, c))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for fc in bm.faces:
        if fc.normal.z < 0:
            fc.normal_flip()
    return bm


FT = BASE - 5.8
lines = [strip(-SIDE, BASE, SIDE, BASE), strip(-SIDE, BASE, -SIDE, HALF), strip(SIDE, BASE, SIDE, HALF), strip(-SIDE, HALF, SIDE, HALF),
         strip(-1.83, BASE, -1.83, FT), strip(1.83, BASE, 1.83, FT), strip(-1.83, FT, 1.83, FT),
         arc(0, FT, 1.83, 180, 360), arc(0, HALF, 1.83, 0, 180)]
lines += [arc(0, FT, 1.83, a, a + 11, n=6) for a in range(4, 176, 22)]               # the circle's far half, dashed
# the three-point line: straight from the baseline to where the arc takes over
X3 = 6.02 * math.cos(math.asin(min(1, 0 / 6.02)))
a3 = math.degrees(math.acos(min(1.0, 6.4 / 6.02))) if 6.4 < 6.02 else 0
lines += [arc(0, 0, 6.02, 180, 360, n=96), strip(-6.02, BASE, -6.02, 0), strip(6.02, BASE, 6.02, 0)]
for sx in (-1, 1):                                                                   # the lane's blocks and hash marks
    lines.append(strip(sx * 1.83, BASE - 2.13 - 0.15, sx * 2.03, BASE - 2.13 - 0.15, w=0.3))
    for d in (3.35, 4.3, 5.2):
        lines.append(strip(sx * 1.83, BASE - d, sx * 2.03, BASE - d))
M("court_lines", comp.merge(*lines), white, smooth=False)
M("court_key", comp.box((3.66 - LW, 5.8 - LW, 0.0005), at=(0, (BASE + FT) / 2, 0.0006)), green, smooth=False)
comp.export(col, root, "gym", "court", made="blender/components/gym/court.py",
            source="own geometry; floor: https://polyhaven.com/a/wood_floor", license="ours; texture CC0", credit="Poly Haven (wood_floor)",
            notes="the origin is under the rim; the free-throw line (the H2 line of the gym's hooks) is 4.2 m toward -y, the baseline 1.6 m toward +y")
