# lighthouse/surf: the white water round the headland's foot, modelled by hand: three broken, lacy lines of foam that
# follow the promontory's waterline (a wide one seething against the rock, two thinner lines of spent waves outside it)
# and four breaking crests further out. A few centimetres above sea level; its origin is the cliff's. Rig: "wash" runs
# the foam lines and the crests 4 m in to the rock (a wave arriving); the foam is its own material (surf_foam).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, fbm
from mathutils import Vector

col, root = comp.fresh("surf")
foam = comp.mat("surf_foam", (0.97, 0.98, 0.98), rough=0.9, alpha=0.9)
M = _lib.maker(col, root)
edge = lambda x: -16.0 + 0.02 * x * x


def line(off, width, seed, gate, z, x0=-62, x1=62, step=0.5):
    """A ribbon `off` metres outside the cliff's edge, `width` wide where the noise lets it be."""
    bm = bmesh.new()
    prev = None
    x = x0
    while x <= x1:
        t = Vector((1, 0.04 * x, 0)).normalized()
        n = Vector((t.y, -t.x, 0))                          # outward (toward the sea)
        p = Vector((x, edge(x), z)) + n * (off + 2.2 * fbm(x, 0, scale=11, octaves=3, seed=seed))
        g = fbm(x, 3.0, scale=7, octaves=2, seed=seed + 5)
        w = width * max(0.0, (g - gate)) / (1 - gate) * (0.6 + 0.8 * abs(fbm(x, 9.0, scale=1.6, octaves=2, seed=seed + 2)))
        if w > 0.08:
            a = bm.verts.new(p - n * w * (0.5 + 0.4 * fbm(x, 1.0, scale=1.1, octaves=1, seed=seed + 8)))
            b = bm.verts.new(p + n * w * 0.5)
            if prev:
                bm.faces.new((prev[0], prev[1], b, a))
            prev = (a, b)
        else:
            prev = None
        x += step
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
    return bm


wash = comp.pivot(col, root, "surf_wash", (0, 0, 0))
M("surf_seethe", line(8.0, 4.0, 1.0, -0.8, 0.2), foam, parent=wash)
M("surf_line_1", line(15.5, 3.4, 2.0, -0.6, 0.24), foam, parent=wash)
M("surf_line_2", line(21.5, 2.2, 3.0, -0.4, 0.28), foam, parent=wash)
# breaking crests: low rolls of white water, each a bent tube
crests = []
for i, (cx, cy, ln) in enumerate(((-18, -52, 26), (22, -66, 34), (-44, -78, 22), (48, -44, 18))):
    pts = [(cx - ln / 2 + ln * j / 8, cy + 1.6 * math.sin(j * 0.8 + i), 0.5) for j in range(9)]
    t = comp.tube(pts, 0.55, res=4, sides=3)
    for v in t.verts:
        u = (v.co.x - (cx - ln / 2)) / ln
        v.co.z = 0.2 + (v.co.z - 0.2) * max(0.05, math.sin(math.pi * min(1, max(0, u)))) * 1.3
        v.co.y += 0.5 * fbm(v.co.x, v.co.z, scale=1.5, octaves=2, seed=i)
    crests.append(t)
roll = comp.pivot(col, root, "surf_crests", (0, 0, 0))
M("surf_breakers", comp.merge(*crests), foam, parent=roll, smooth=True)
comp.channel("wash", [(wash, "location", 1, 0.0, 4.0), (roll, "location", 1, 0.0, 9.0)])
comp.export(col, root, "lighthouse", "surf", made="blender/components/lighthouse/surf.py", source="own geometry (foam lines along the cliff's waterline)", license="ours", credit="",
            rig={"wash": "the foam lines run 4 m in to the rock and the breaking crests 9 m toward it", "foam": "in the scene: the material surf_foam"},
            notes="origin: the cliff's (sea level under the tower's foot)")
