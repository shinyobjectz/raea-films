# court/light-cone: the wet air in the floodlight's beam, modelled by hand: seven nested cones from the lamp, 11 m long
# and 9.5 m across where they end, each a faint glowing skin that fades out along its length (our own painted
# falloff), so the beam is brightest through its middle and has no edge. The origin is the lamp; at rest the cone
# points where the floodlight does (-y, 50 degrees down). Its material is its own (light_cone_air).
# Rig: "tilt" raises it 25 degrees with the lamp; "glow" is the scene's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
import numpy as np
from _lib import T, R, S, xf

col, root = comp.fresh("light_cone")
M = _lib.maker(col, root)


def falloff(u, v):                      # v 0 at the lamp, 1 at the far end
    a = np.clip(v / 0.04, 0, 1) * np.clip((1 - v) / 0.75, 0, 1) ** 1.6 * 0.085
    return np.stack([np.ones_like(u), np.ones_like(u) * 0.96, np.ones_like(u) * 0.88, a], axis=-1)


air = _lib.alpha_image_mat("light_cone_air", _lib.paint("light_cone_air", 8, 256, falloff), rough=1.0, emit=22.0)
tilt = comp.pivot(col, root, "light_cone_tilt", (0, 0, 0))
L, SEG, N = 11.0, 120, 10
bm = bmesh.new()
uv = bm.loops.layers.uv.new("UVMap")
for k in range(7):
    r1 = 4.75 * (1 - k / 7.5)
    r0 = 0.3 * (1 - k / 9)
    rings = []
    for j in range(N + 1):
        t = j / N
        r, y = r0 + (r1 - r0) * t, -(0.1 + (L - 0.1) * t)
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / SEG), y, r * math.sin(2 * math.pi * i / SEG))) for i in range(SEG)])
    for j in range(N):
        for i in range(SEG):
            f = bm.faces.new((rings[j][i], rings[j][(i + 1) % SEG], rings[j + 1][(i + 1) % SEG], rings[j + 1][i]))
            for l, (du, dv) in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
                l[uv].uv = ((i + du) / SEG, (j + dv) / N)
M("light_cone_air", bm, air, parent=tilt)
tilt.rotation_euler[0] = math.radians(50)
_lib.channel("tilt", [(tilt, "rotation_euler", 0, math.radians(50), math.radians(25))])
comp.export(col, root, "court", "light_cone", made="blender/components/court/light_cone.py", source="own geometry and our own painted falloff", license="ours", credit="",
            rig={"tilt": "the cone rises 25 degrees with the lamp", "glow": "in the scene: the material light_cone_air (how thick the wet air is)"},
            notes="origin: the lamp (on the floodlight: 7.53 m up, 0.55 m out)")
