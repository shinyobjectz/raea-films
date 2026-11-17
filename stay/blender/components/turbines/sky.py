# turbines/sky: the sunrise sky as a backdrop, modelled by hand: an arc 225 m off standing behind the ridge (never
# over it, so it shades nothing), lit by its own picture (gold at the horizon where the sun is coming up, peach above
# it, pale blue overhead), with the sun's disc painted low over the ridge. Its material is sky_sunrise; the scene
# sets how bright it is.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf

col, root = comp.fresh("sky")
M = _lib.maker(col, root)
SUN_U, SUN_V = 0.6, 0.185


def dawn(u, v):
    hz = (1.0, 0.62, 0.22)
    peach = (0.95, 0.55, 0.42)
    blue = (0.22, 0.42, 0.75)
    t = min(1.0, max(0.0, (v - 0.07) / 0.5))
    a = math.exp(-t / 0.09)
    b = math.exp(-t / 0.3) - a
    c = max(0.0, 1 - a - b)
    glow = math.exp(-((u - SUN_U) / 0.14) ** 2) * math.exp(-t / 0.16)
    du, dv = (u - SUN_U) * 3.54 * 225.0, (v - SUN_V) * 310.0              # metres from the sun's middle on the wall
    disc = max(0.0, min(1.0, (5.5 - math.hypot(du, dv)) / 1.5))
    col_ = [hz[i] * a + peach[i] * b * 0.9 + blue[i] * c * 0.8 + (1.0, 0.85, 0.5)[i] * glow * 1.2 + (4.0, 3.4, 2.2)[i] * disc for i in range(3)]
    if v < 0.07 and disc <= 0:
        col_ = [x * (0.75 + 0.25 * v / 0.07) for x in (0.92, 0.84, 0.78)]      # the fog going off to the horizon
    return col_


m = _lib.glow_image("sky_sunrise", "turbines", 768, 384, dawn, strength=2600.0)
CX, CY = -40.0, -60.0
RAD, H0, H1, A0, A1, N = 225.0, -10.0, 300.0, -20.0, 185.0, 64
bm = bmesh.new()
uv = bm.loops.layers.uv.new("UVMap")
cols = []
for i in range(N + 1):
    a = math.radians(A0 + (A1 - A0) * i / N)
    cols.append((bm.verts.new((CX + RAD * math.cos(a), CY + RAD * math.sin(a), H0)), bm.verts.new((CX + RAD * math.cos(a) * 0.9, CY + RAD * math.sin(a) * 0.9, H1))))
for i in range(N):
    f = bm.faces.new((cols[i][0], cols[i][1], cols[i + 1][1], cols[i + 1][0]))
    for l, (du, dv) in zip(f.loops, ((0, 0), (0, 1), (1, 1), (1, 0))):
        l[uv].uv = ((i + du) / N, dv)
M("sky_backdrop", bm, m, smooth=True)
comp.export(col, root, "turbines", "sky", made="blender/components/turbines/sky.py", source="own geometry and picture (a painted sunrise gradient)", license="ours", credit="",
            rig={"sunrise": "in the scene: the material sky_sunrise's glow"},
            notes="origin: the ridge's; the arc is centred 40 m left and 60 m in front of it and stands 225 m off, from the right round the back to the left; the sun is painted low behind the ridge between the first two turbines")
