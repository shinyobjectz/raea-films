# lighthouse/sky: the dusk sky as a backdrop, modelled by hand: a quarter-kilometre arc standing behind the headland
# (never over it, so it shades nothing), lit by its own picture: an ember horizon with the sun just gone at the left,
# rose above it, deep blue overhead. Its material is sky_dusk; the scene sets how bright it is.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf

col, root = comp.fresh("sky")
M = _lib.maker(col, root)


def dusk(u, v):
    hz = (1.0, 0.36, 0.1)
    rose = (0.5, 0.16, 0.22)
    blue = (0.02, 0.04, 0.13)
    t = min(1.0, max(0.0, (v - 0.06) / 0.94))
    a = math.exp(-t / 0.1)
    b = math.exp(-t / 0.33) - a
    c = max(0.0, 1 - a - b)
    glow = math.exp(-((u - 0.3) / 0.16) ** 2) * math.exp(-t / 0.12)
    col_ = [hz[i] * a + rose[i] * b + blue[i] * c + (1.0, 0.75, 0.4)[i] * glow * 0.9 for i in range(3)]
    if v < 0.06:
        col_ = [x * 0.5 for x in col_]
    return col_


m = _lib.glow_image("sky_dusk", "lighthouse", 256, 256, dusk, strength=2500.0)
RAD, H0, H1, A0, A1, N = 250.0, -12.0, 190.0, -25.0, 205.0, 64
bm = bmesh.new()
uv = bm.loops.layers.uv.new("UVMap")
cols = []
for i in range(N + 1):
    a = math.radians(A0 + (A1 - A0) * i / N)
    cols.append((bm.verts.new((RAD * math.cos(a), RAD * math.sin(a), H0)), bm.verts.new((RAD * math.cos(a) * 0.8, RAD * math.sin(a) * 0.8, H1))))
for i in range(N):
    f = bm.faces.new((cols[i][0], cols[i][1], cols[i + 1][1], cols[i + 1][0]))
    for l, (du, dv) in zip(f.loops, ((0, 0), (0, 1), (1, 1), (1, 0))):
        l[uv].uv = (1 - (i + du) / N, dv)
M("sky_backdrop", bm, m, smooth=True)
comp.export(col, root, "lighthouse", "sky", made="blender/components/lighthouse/sky.py", source="own geometry and picture (a painted dusk gradient)", license="ours", credit="",
            rig={"dusk": "in the scene: the material sky_dusk's glow"},
            notes="origin: the cliff's; the arc stands 250 m off behind the place, from the right round the back to the left")
