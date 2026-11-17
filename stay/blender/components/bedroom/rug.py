# bedroom/rug: a play rug, 1.6 x 1.1 m, modelled by hand: a low-pile mat printed with a little town seen from above
# (our own painting: grey roads with dashed centre lines and a roundabout, green blocks, a pond, car parks, roofs in
# primary colours), bound round its edge in blue tape, one corner turned up a little. Lies on the floor.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
import numpy as np
from comp import T, R, xf
col, root = comp.fresh("rug")
M = _lib.maker(col, root)
W, D = 1.6, 1.1
px = _lib.canvas(1280, 880, (0.3, 0.62, 0.28))
X, Y = _lib.grid_xy(px)
rng = np.random.default_rng(3)
road, line = (0.33, 0.33, 0.36), (0.95, 0.93, 0.8)
RW = 0.035
def hroad(y, x0=0.0, x1=1.0):
    _lib.rect(px, x0, y - RW * 1.45 / 2 * 1.0, x1, y + RW * 1.45 / 2, road)
    _lib.put(px, (np.abs(Y - y) < 0.003) & (X > x0) & (X < x1) & ((X * 40) % 1 < 0.55), line)
def vroad(x, y0=0.0, y1=1.0):
    _lib.rect(px, x - RW / 2, y0, x + RW / 2, y1, road)
    _lib.put(px, (np.abs(X - x) < 0.002) & (Y > y0) & (Y < y1) & ((Y * 28) % 1 < 0.55), line)
for y in (0.12, 0.5, 0.88):
    hroad(y)
for x in (0.08, 0.36, 0.64, 0.92):
    vroad(x)
# the roundabout at the middle crossing
_lib.disc(px, 0.5, 0.5, 0.13, road); _lib.disc(px, 0.5, 0.5, 0.07, (0.25, 0.55, 0.25)); _lib.disc(px, 0.5, 0.5, 0.03, (0.9, 0.3, 0.3))
# a pond, car parks, houses
_lib.disc(px, 0.22, 0.31, 0.09, (0.25, 0.55, 0.85)); _lib.disc(px, 0.24, 0.3, 0.05, (0.35, 0.65, 0.92))
_lib.rect(px, 0.69, 0.2, 0.88, 0.42, (0.45, 0.45, 0.48))
for i in range(6):
    _lib.rect(px, 0.7 + i * 0.03, 0.21, 0.702 + i * 0.03, 0.29, line); _lib.rect(px, 0.7 + i * 0.03, 0.33, 0.702 + i * 0.03, 0.41, line)
ROOF = [(0.85, 0.15, 0.12), (0.95, 0.75, 0.1), (0.15, 0.3, 0.75), (0.9, 0.45, 0.1), (0.6, 0.2, 0.6)]
for bx0, bx1, by0, by1 in ((0.12, 0.33, 0.58, 0.82), (0.4, 0.6, 0.66, 0.82), (0.68, 0.88, 0.58, 0.82), (0.4, 0.6, 0.18, 0.34), (0.12, 0.33, 0.17, 0.2)):
    for _ in range(5):
        w, h = rng.uniform(0.03, 0.06), rng.uniform(0.05, 0.09)
        x, y = rng.uniform(bx0, bx1 - w), rng.uniform(by0, max(by0 + 0.001, by1 - h))
        c = ROOF[rng.integers(0, 5)]
        _lib.rect(px, x, y, x + w, y + h, c); _lib.rect(px, x + w / 2 - 0.002, y, x + w / 2 + 0.002, y + h, tuple(v * 0.7 for v in c))
for _ in range(40):
    _lib.disc(px, rng.uniform(0.1, 0.9), rng.uniform(0.15, 0.85), 0.012, (0.15, 0.42, 0.15))
for y in (0.12, 0.5, 0.88):
    hroad(y)
for x in (0.08, 0.36, 0.64, 0.92):
    vroad(x)
_lib.disc(px, 0.5, 0.5, 0.13, road); _lib.disc(px, 0.5, 0.5, 0.07, (0.25, 0.55, 0.25)); _lib.disc(px, 0.5, 0.5, 0.03, (0.9, 0.3, 0.3))
_lib.noise(px, 0.03)
m = _lib.image_mat("rug_print", _lib.save_image("rug_print", px), rough=0.95)
top = _lib.flat(W - 0.03, D - 0.03, nx=24, ny=16)
def lift(v):
    c = max(0.0, v.co.x - (W / 2 - 0.25)) * max(0.0, -v.co.y - (D / 2 - 0.25)) / 0.0625
    return 0.012 + 0.07 * c * c
for v in top.verts:
    v.co.z = lift(v)
M("rug_pile", top, m, smooth=True)
base = _lib.flat(W, D, nx=24, ny=16)
for v in base.verts:
    v.co.z = lift(v) - 0.003
bo = M("rug_binding", base, comp.mat("rug_binding", (0.1, 0.2, 0.55), rough=0.9), smooth=True)
comp.solidify(bo, 0.009, -1)
comp.export(col, root, _lib.PLACE, "rug", made="blender/components/bedroom/rug.py", source="own geometry and our own painted print (blender/src/bedroom/rug_print.png)", license="ours", credit="",
            notes="1.6 x 1.1 m, 1.2 cm thick; the front right corner is turned up 7 cm")
