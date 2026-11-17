# garage/crash-barrier: 4 m of galvanised W-beam guard rail on three C-posts with base plates and anchor bolts,
# modelled by hand: the rail's face toward -y, 0.55 m to its middle, with spacer blocks, splice bolts and red and
# white reflectors in its valley. It runs along x through the origin; lengths butt end to end. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("crash_barrier")
M = L.maker(col, root)
galv = comp.mat("crash_barrier_galvanised", (0.6, 0.61, 0.62), rough=0.4, metal=1.0)
steel = comp.mat("crash_barrier_bolts", (0.45, 0.45, 0.47), rough=0.4, metal=1.0)
red = comp.mat("crash_barrier_red", (0.75, 0.04, 0.03), rough=0.3)
white = comp.mat("crash_barrier_white", (0.92, 0.92, 0.9), rough=0.3)
LEN, ZC = 4.0, 0.55
w = [(0.0, 0.155), (-0.03, 0.14), (-0.075, 0.1), (-0.08, 0.075), (-0.075, 0.05), (-0.03, 0.012), (-0.022, 0.0), (-0.03, -0.012), (-0.075, -0.05), (-0.08, -0.075), (-0.075, -0.1), (-0.03, -0.14), (0.0, -0.155)]
prof = w + [(n + 0.004, u) for n, u in reversed(w)]
rail = L.sweep([(-LEN / 2, -0.11, ZC), (LEN / 2, -0.11, ZC)], [(-n, u) for n, u in prof])
L.sharp(M("crash_barrier_rail", rail, galv, smooth=True), 30)
posts, bolts, refl_r, refl_w = [], [], [], []
for i, x in enumerate((-1.8, 0, 1.8)):
    posts += [comp.box((0.006, 0.1, 0.74), at=(x, 0.02, 0.37)), comp.box((0.06, 0.006, 0.74), at=(x + 0.03, 0.067, 0.37)), comp.box((0.06, 0.006, 0.74), at=(x + 0.03, -0.027, 0.37)),
              comp.box((0.2, 0.2, 0.01), at=(x + 0.02, 0.02, 0.005)), comp.box((0.08, 0.075, 0.2), at=(x + 0.03, -0.068, ZC))]
    bolts += [comp.cyl(0.011, 0.012, at=(x + 0.02 + sx * 0.075, 0.02 + sy * 0.075, 0.01), seg=6) for sx in (-1, 1) for sy in (-1, 1)]
    bolts += [comp.cyl(0.012, 0.01, at=(x + 0.03, -0.142, ZC), seg=6, axis="Y")]
for i in range(8):
    x = -LEN / 2 + 0.25 + i * 0.5
    (refl_r if i % 2 == 0 else refl_w).append(comp.box((0.09, 0.004, 0.035), at=(x, -0.136, ZC)))
for s in (-1, 1):
    bolts += [comp.cyl(0.009, 0.008, at=(s * (LEN / 2 - 0.06 - k * 0.1), -0.193, ZC + sz * 0.075), seg=6, axis="Y") for k in range(2) for sz in (-1, 1)]
M("crash_barrier_posts", comp.merge(*posts), galv)
M("crash_barrier_bolts", comp.merge(*bolts), steel)
M("crash_barrier_reflectors_red", comp.merge(*refl_r), red)
M("crash_barrier_reflectors_white", comp.merge(*refl_w), white)
L.look(col, "crash-barrier", lens=40)
comp.export(col, root, "garage", "crash_barrier", made="blender/components/garage/crash_barrier.py", source="own geometry (a generic W-beam guard rail)", license="ours", credit="", rig={})
