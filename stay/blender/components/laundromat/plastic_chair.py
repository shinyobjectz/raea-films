# laundromat/plastic-chair: a row of four moulded plastic shell seats on a steel beam, 2.14 m long, modelled by hand:
# each shell one curved moulding (a waterfall front, a dished seat, a back that wraps the sitter, a hand hole), bolted
# through a steel saddle to a box beam on two T legs with rubber feet; two orange, two cream. The row's front faces
# -y; seats 0.43 m up. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rod, path, rbox, T, R, S, xf
import bmesh
from mathutils import Vector

col, root = comp.fresh("plastic_chair")
M = _lib.maker(col, root)
orange = comp.mat("chair_shell_orange", (0.85, 0.3, 0.05), rough=0.35)
cream = comp.mat("chair_shell_cream", (0.85, 0.8, 0.66), rough=0.35)
steel = comp.mat("chair_beam", (0.1, 0.1, 0.11), rough=0.4)
chrome = comp.mat("chair_bolts", (0.8, 0.8, 0.82), rough=0.2, metal=0.9)
rubber = comp.mat("chair_feet", (0.02, 0.02, 0.022), rough=0.8)
# the shell's profile from the front lip to the top of the back: (y, z, half width)
PROF = [(-0.235, 0.395, 0.2), (-0.225, 0.425, 0.225), (-0.19, 0.44, 0.235), (-0.08, 0.432, 0.24), (0.04, 0.422, 0.24), (0.13, 0.425, 0.235), (0.185, 0.455, 0.23), (0.215, 0.52, 0.228),
        (0.232, 0.62, 0.225), (0.246, 0.72, 0.215), (0.256, 0.79, 0.19), (0.262, 0.825, 0.15)]
NU = 10
def shell(x0):
    bm = bmesh.new()
    rows = []
    for k, (y, z, hw) in enumerate(PROF):
        s = k / (len(PROF) - 1)
        row = []
        for i in range(NU + 1):
            u = 2 * i / NU - 1
            dish = 0.03 * u * u if s < 0.45 else 0.0
            wrap = 0.06 * u * u * min(1.0, max(0.0, (s - 0.45) / 0.2))
            row.append(bm.verts.new((x0 + u * hw, y - wrap, z + dish + (0.012 * (abs(u) ** 3) if s < 0.45 else 0))))
        rows.append(row)
    for a, b in zip(rows[:-1], rows[1:]):
        for i in range(NU):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
PITCH = 0.53
xs = [(-1.5 + i) * PITCH for i in range(4)]
for i, x0 in enumerate(xs):
    o = M(f"plastic_chair_shell_{i + 1}", shell(x0), orange if i % 2 == 0 else cream, smooth=True)
    comp.solidify(o, 0.007, 0)
    comp.subsurf(o, 2)
    # the saddle under the seat and its four bolts through the pan
    M(f"plastic_chair_saddle_{i + 1}", comp.merge(rbox((0.2, 0.26, 0.012), at=(x0, -0.02, 0.408), r=0.004), comp.box((0.08, 0.07, 0.03), at=(x0, 0.0, 0.392))), steel)
    M(f"plastic_chair_bolts_{i + 1}", comp.merge(*[turn([(0.0, 0.004), (0.008, 0.003), (0.01, 0.0)], seg=10, at=(x0 + sx * 0.07, -0.02 + sy * 0.09, 0.4375)) for sx in (-1, 1) for sy in (-1, 1)]), chrome, smooth=True)
beam = M("plastic_chair_beam", rbox((4 * PITCH + 0.02, 0.07, 0.04), at=(0, 0.0, 0.358), r=0.006), steel)
M("plastic_chair_beam_caps", comp.merge(*[rbox((0.008, 0.074, 0.044), at=(s * (2 * PITCH + 0.014), 0, 0.358), r=0.003) for s in (-1, 1)]), rubber)
legs, feet = [], []
for s in (-1, 1):
    x = s * PITCH
    legs.append(rbox((0.05, 0.05, 0.31), at=(x, 0.0, 0.185), r=0.005))
    legs.append(rbox((0.05, 0.56, 0.035), at=(x, 0.0, 0.0325), r=0.006))
    legs.append(rbox((0.07, 0.12, 0.008), at=(x, 0.0, 0.335), r=0.002))
    feet += [rbox((0.056, 0.05, 0.015), at=(x, sy * 0.26, 0.0075), r=0.004) for sy in (-1, 1)]
M("plastic_chair_legs", comp.merge(*legs), steel)
M("plastic_chair_feet", comp.merge(*feet), rubber)
comp.export(col, root, _lib.PLACE, "plastic_chair", made="blender/components/laundromat/plastic_chair.py", source="own geometry (a generic beam seat of moulded shells)", license="ours", credit="", rig={})
