# pool/flags: the backstroke flags, modelled by hand at real size: two stainless posts in deck sockets 9.5 m apart, a
# line slung between them 1.8 m over the water with a little sag, and twenty-nine pennants on it in red, white and
# blue, each a part of its own on its hem. Its origin is the middle of the line's span at deck level; it crosses the
# pool along x, 5 m from an end wall. Rig: "flutter" swings every pennant on the line, alternate ones forward 26 and
# back 18 degrees (the draught from the vents).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("flags")
st = steel("pool_steel", 0.2)
line_m = comp.mat("pool_flag_line", (0.9, 0.9, 0.86), rough=0.8)
cols = [comp.mat("pool_flag_red", (0.8, 0.07, 0.05), rough=0.7), comp.mat("pool_flag_white", (0.92, 0.92, 0.9), rough=0.7), comp.mat("pool_flag_blue", (0.04, 0.2, 0.7), rough=0.7)]
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
PX, PH, SAG = POOL_W / 2 + 0.75, 2.1, 0.22
lz = lambda x: PH - 0.06 - SAG * (1 - (x / PX) ** 2)
posts = []
for sx in (-1, 1):
    posts.append(comp.cyl(0.024, PH, at=(sx * PX, 0, 0), seg=20))
    posts.append(turn([(0.024, 0.0), (0.06, 0.0), (0.06, 0.006), (0.034, 0.03), (0.024, 0.03)], seg=24, at=(sx * PX, 0, 0)))
    posts.append(sphere(0.026, at=(sx * PX, 0, PH), u=12, v=8))
    posts.append(pipe([(sx * PX, 0, PH - 0.06), (sx * (PX - 0.04), 0, PH - 0.06)], 0.006))
    posts.append(comp.box((0.012, 0.07, 0.03), at=(sx * (PX + 0.0), -0.03, 1.1)))       # the line's cleat
M("flags_posts", comp.merge(*posts), st, smooth=True)
xs = [-PX + 0.04 + i * (2 * PX - 0.08) / 40 for i in range(41)]
M("flags_line", pipe([(x, 0, lz(x)) for x in xs], 0.004, sides=2), line_m, smooth=True)
M("flags_line_tails", comp.merge(*[pipe([(sx * PX, -0.026, PH - 0.06), (sx * PX, -0.03, 1.1)], 0.003, sides=2) for sx in (-1, 1)]), line_m)
flags = []
N = 29
for i in range(N):
    x = -4.2 + i * 8.4 / (N - 1)
    z = lz(x) - 0.004
    p = comp.pivot(col, root, f"flags_pennant_{i + 1:02d}", (x, 0, z))
    bm = bmesh.new()
    a, b, c = bm.verts.new((x - 0.1, 0, z)), bm.verts.new((x + 0.1, 0, z)), bm.verts.new((x, 0, z - 0.3))
    ab, bc, ca = bm.verts.new((x, 0, z)), bm.verts.new((x + 0.05, 0.006, z - 0.15)), bm.verts.new((x - 0.05, -0.006, z - 0.15))
    for tri in ((a, ab, ca), (ab, b, bc), (ab, bc, ca), (ca, bc, c)):
        bm.faces.new(tri)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = M(f"flags_pennant_{i + 1:02d}_cloth", bm, cols[i % 3], parent=p, smooth=True)
    comp.solidify(o, 0.0015, 0)
    flags.append(p)
comp.channel("flutter", [(p, "rotation_euler", 0, 0, math.radians(26 if i % 2 == 0 else -18)) for i, p in enumerate(flags)])
done(col, root, "flags", source="own geometry (generic backstroke flags on their posts)",
     rig={"flutter": "every pennant swings about the line, alternate ones 26 degrees forward and 18 back"},
     notes="origin: the middle of the span at deck level; the posts stand 4.75 m either side, on the deck")
