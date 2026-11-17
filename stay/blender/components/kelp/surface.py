# kelp/surface: the sea's surface seen from below, 34 x 34 m, modelled and painted by hand: a swell of crossing waves,
# painted with Snell's window (the bright disc of sky overhead, 11 m across at this depth, its rim rippled) inside the
# dark mirror of the water beyond it, and a net of caustic lines over both. A ceiling piece: the crests are at the
# origin, the troughs 0.3 m below. Material: surface_light (it glows: it is the daylight coming in).
# Rig: "swell" carries the waves 1.6 m along +x (the window stays overhead in the scene: move the piece back as it runs).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
import numpy as np
from comp import T, R, S, xf

col, root = comp.fresh("surface")
W, N = 34.0, 110
n = 1024
yy, xx = np.mgrid[0:n, 0:n]
x, y = (xx / n - 0.5) * W, (yy / n - 0.5) * W
r = np.hypot(x, y)
ang = np.arctan2(y, x)
n1, n2 = L.noise(n, n, 2, 5), L.noise(n, n, 7, 5)
rim = 5.6 + 0.5 * np.sin(ang * 7 + 6 * n1) + 0.9 * (n2 - 0.5)
inside = np.clip((rim - r) / 0.7, 0, 1)
sky = np.array((0.22, 0.68, 0.8))[None, None, :] * (0.62 + 0.3 * np.exp(-(r / 4.0) ** 2))[..., None]
mirror = np.array((0.0, 0.085, 0.11))[None, None, :] * (0.5 + 1.3 * n1[..., None])
img = mirror * (1 - inside[..., None]) + sky * inside[..., None]
c1 = np.abs(np.sin(x * 2.1 + 3.0 * np.sin(y * 0.9 + 4 * n1)) * np.sin(y * 2.3 + 3.0 * np.sin(x * 0.8 + 4 * n2)))
caust = np.clip(1 - c1 * 5, 0, 1) ** 2
img += caust[..., None] * (0.1 + 0.5 * inside[..., None]) * np.array((0.6, 1.0, 0.95))
img = np.clip(img, 0, 1)
path = L.save_png(os.path.join(L.TEX, "surface_light.png"), np.dstack([img, np.ones((n, n))]))
m = L.picture("surface_light", path, emit=27.0, rough=0.08, base=True)
next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Alpha"].default_value = 0.97     # a blended surface: the scene's sun is not shut out by it
def wave(px, py):
    return -0.15 + 0.07 * math.sin(px * 0.9 + py * 0.35) + 0.05 * math.sin(py * 1.4 - px * 0.5 + 1.0) + 0.03 * math.sin(px * 2.6 + 2.0) * math.sin(py * 2.2)
slide = comp.pivot(col, root, "surface_swell", (0, 0, 0))
bm = bmesh.new()
uvl = bm.loops.layers.uv.new("UVMap")
vs = [[bm.verts.new((-W / 2 + W * i / N, -W / 2 + W * j / N, wave(-W / 2 + W * i / N, -W / 2 + W * j / N))) for j in range(N + 1)] for i in range(N + 1)]
for i in range(N):
    for j in range(N):
        f = bm.faces.new((vs[i][j], vs[i][j + 1], vs[i + 1][j + 1], vs[i + 1][j]))      # facing down
        for l, (a, b) in zip(f.loops, ((i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j))):
            l[uvl].uv = (a / N, b / N)
for f in bm.faces:
    if f.normal.z > 0:
        f.normal_flip()
comp.mesh(col, root, "surface_water", bm, m, parent=slide, smooth=True)
L.channel("swell", [(slide, "location", 0, 0.0, 1.6)])
comp.export(col, root, "kelp", "surface", made="blender/components/kelp/surface.py", source="own geometry and painting", license="ours", credit="",
            rig={"swell": "the waves (surface_swell) run 1.6 m along +x", "glow": "in the scene: the material surface_light's glow (the daylight); the sun itself is kelp/sun"})
