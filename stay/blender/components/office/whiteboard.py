# office/whiteboard: a 1.8 x 1.2 m wall whiteboard, modelled by hand: the enamel board in an aluminium frame with
# plastic corners, a pen tray with three markers and an eraser, a few magnets and sheets. Its back is on the wall
# (y 0), its origin at its centre.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("whiteboard")
enamel = comp.mat("whiteboard_board", (0.93, 0.94, 0.94), rough=0.12)
alu = comp.mat("whiteboard_frame", (0.7, 0.71, 0.73), rough=0.3, metal=1.0)
grey = comp.mat("whiteboard_plastic", (0.3, 0.3, 0.32), rough=0.5)
paper = comp.mat("whiteboard_paper", (0.92, 0.91, 0.86), rough=0.7)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
W, H = 1.8, 1.2
M("whiteboard_board", comp.box((W - 0.03, 0.012, H - 0.03), at=(0, -0.008, 0)), enamel)
fr = M("whiteboard_frame", comp.merge(comp.box((W, 0.022, 0.022), at=(0, -0.011, H / 2 - 0.011)), comp.box((W, 0.022, 0.022), at=(0, -0.011, -H / 2 + 0.011)),
                                      comp.box((0.022, 0.022, H), at=(-W / 2 + 0.011, -0.011, 0)), comp.box((0.022, 0.022, H), at=(W / 2 - 0.011, -0.011, 0))), alu)
comp.bevel(fr, 0.003, 2)
M("whiteboard_corners", comp.merge(*[comp.box((0.04, 0.026, 0.04), at=(sx * (W / 2 - 0.018), -0.012, sz * (H / 2 - 0.018))) for sx in (-1, 1) for sz in (-1, 1)]), grey)
tr = M("whiteboard_tray", comp.merge(comp.box((0.7, 0.07, 0.008), at=(0, -0.055, -H / 2 + 0.004)), comp.box((0.7, 0.006, 0.02), at=(0, -0.088, -H / 2 + 0.012))), alu)
cols = [(0.05, 0.05, 0.05), (0.75, 0.05, 0.05), (0.05, 0.15, 0.7)]
for i, c in enumerate(cols):
    m = comp.mat(f"whiteboard_marker_{i + 1}", c, rough=0.4)
    M(f"whiteboard_marker_{i + 1}", comp.merge(comp.cyl(0.008, 0.11, at=(-0.25 + i * 0.16, -0.06, -H / 2 + 0.016), seg=16, axis="X"), comp.cyl(0.0065, 0.022, at=(-0.14 + i * 0.16, -0.06, -H / 2 + 0.016), seg=16, axis="X")), m, smooth=True)
er = M("whiteboard_eraser", comp.merge(comp.box((0.11, 0.045, 0.022), at=(0.26, -0.058, -H / 2 + 0.019)), ), grey)
comp.bevel(er, 0.004, 2)
rnd = random.Random(3)
sheets, mags = [], []
for i in range(4):
    x, z = 0.3 + (i % 2) * 0.26 + rnd.uniform(-0.02, 0.02), 0.25 - (i // 2) * 0.36 + rnd.uniform(-0.02, 0.02)
    b = comp.box((0.21, 0.0006, 0.297)); xf(b, R(rnd.uniform(-3, 3), "Y")); xf(b, T(x, -0.0146, z)); sheets.append(b)
    mags.append(comp.cyl(0.012, 0.006, at=(x, -0.021, z + 0.13), seg=16, axis="Y"))
M("whiteboard_sheets", comp.merge(*sheets), paper)
M("whiteboard_magnets", comp.merge(*mags), comp.mat("whiteboard_magnet", (0.8, 0.1, 0.08), rough=0.3), smooth=False)
comp.export(col, root, "office", "whiteboard", made="blender/components/office/whiteboard.py", source="own geometry (a generic wall whiteboard)", license="ours", credit="")
