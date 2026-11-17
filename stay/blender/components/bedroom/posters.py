# bedroom/posters: three posters taped to the wall as a group, modelled by hand, their pictures painted here (our own
# art, no real band, film or brand): a space poster (a ringed planet, a rocket, BLAST OFF!), 0.56 x 0.80 m; a
# nineties squiggle-and-triangle pattern poster (TOTALLY RAD '96), 0.70 x 0.50 m; and a basketball poster (SLAM!),
# 0.42 x 0.30 m. Each is a sheet of its own, a little crooked, its corners held by tape, one corner curling. The
# group's origin is its centre, backs on the wall (y 0). Rig: "flutter" lifts each poster's loose bottom edge off the
# wall (the sheets hinge at their top tape; 5 to 8 degrees: the warm air, the window's draught).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
import numpy as np
from comp import T, R, xf
col, root = comp.fresh("posters")
M = _lib.maker(col, root)
rnd = random.Random(1996)
tape = comp.mat("posters_tape", (0.9, 0.86, 0.7), rough=0.3, alpha=0.75)
white = comp.mat("posters_white", (0.96, 0.96, 0.94), rough=0.6)
# --- space ------------------------------------------------------------------------------------------------------
sp = _lib.gradient(_lib.canvas(560, 800), (0.02, 0.02, 0.12), (0.3, 0.08, 0.4))
X, Y = _lib.grid_xy(sp)
rng = np.random.default_rng(5)
for _ in range(260):
    x, y, r = rng.uniform(0, 1), rng.uniform(0, 0.8), rng.uniform(0.0015, 0.004)
    _lib.disc(sp, x, y, r, (1, 1, 0.9), a=rng.uniform(0.5, 1))
_lib.disc(sp, 0.62, 0.3, 0.17, (0.95, 0.6, 0.25))
band = (((X - 0.62) * 0.7) ** 2 + (Y - 0.3) ** 2 < 0.17 ** 2)
for k in range(5):
    _lib.put(sp, band & (np.abs(Y - 0.2 - k * 0.05 - 0.02 * np.sin(X * 20)) < 0.009), (0.8, 0.4, 0.2))
ring = np.abs(np.sqrt(((X - 0.62) * 0.7 / 1.75) ** 2 + ((Y - 0.3 - (X - 0.62) * 0.25) / 0.35) ** 2) - 0.165) < 0.014
_lib.put(sp, ring & ~(band & (Y < 0.3 + (X - 0.62) * 0.25)), (0.98, 0.9, 0.6))
_lib.disc(sp, 0.2, 0.15, 0.05, (0.75, 0.8, 0.9))
_lib.poly(sp, [(0.22, 0.62), (0.3, 0.44), (0.38, 0.62), (0.38, 0.74), (0.22, 0.74)], (0.92, 0.92, 0.95))
_lib.poly(sp, [(0.3, 0.44), (0.345, 0.54), (0.255, 0.54)], (0.85, 0.12, 0.1))
_lib.poly(sp, [(0.22, 0.68), (0.15, 0.78), (0.22, 0.76)], (0.85, 0.12, 0.1)); _lib.poly(sp, [(0.38, 0.68), (0.45, 0.78), (0.38, 0.76)], (0.85, 0.12, 0.1))
_lib.disc(sp, 0.3, 0.63, 0.03, (0.3, 0.6, 0.9))
_lib.poly(sp, [(0.25, 0.74), (0.3, 0.86), (0.35, 0.74)], (1.0, 0.7, 0.1)); _lib.poly(sp, [(0.275, 0.74), (0.3, 0.81), (0.325, 0.74)], (1, 0.95, 0.6))
_lib.rect(sp, 0, 0.885, 1, 1, (0.02, 0.02, 0.1))
# --- the nineties pattern -----------------------------------------------------------------------------------------
rad = _lib.canvas(700, 500, (0.1, 0.75, 0.72))
X, Y = _lib.grid_xy(rad)
PALS = [(0.98, 0.3, 0.6), (0.98, 0.85, 0.15), (0.45, 0.2, 0.7), (0.98, 0.98, 0.95), (0.05, 0.05, 0.1)]
for _ in range(34):
    cx, cy, s, a, c = rng.uniform(0, 1), rng.uniform(0, 1), rng.uniform(0.03, 0.07), rng.uniform(0, 6.28), PALS[rng.integers(0, 5)]
    kind = rng.integers(0, 3)
    if kind == 0:
        _lib.poly(rad, [(cx + s * math.cos(a + k * 2.094) / 1.4, cy + s * math.sin(a + k * 2.094)) for k in range(3)], c)
    elif kind == 1:
        _lib.disc(rad, cx, cy, s * 0.5, c)
    else:
        u = (X - cx) * math.cos(a) * 1.4 + (Y - cy) * math.sin(a); v = -(X - cx) * math.sin(a) * 1.4 + (Y - cy) * math.cos(a)
        _lib.put(rad, (np.abs(u) < s * 1.3) & (np.abs(v - 0.012 * np.sin(u * 150)) < 0.006), c)
_lib.rect(rad, 0.12, 0.33, 0.88, 0.67, (0.05, 0.05, 0.1)); _lib.rect(rad, 0.13, 0.345, 0.87, 0.655, (0.98, 0.85, 0.15))
# --- basketball ---------------------------------------------------------------------------------------------------
bb = _lib.gradient(_lib.canvas(420, 300), (0.05, 0.25, 0.3), (0.02, 0.1, 0.15))
X, Y = _lib.grid_xy(bb)
_lib.disc(bb, 0.3, 0.5, 0.36, (0.9, 0.42, 0.1))
ball = ((X - 0.3) * 1.4) ** 2 + (Y - 0.5) ** 2 < 0.36 ** 2
_lib.put(bb, ball & ((np.abs(Y - 0.5) < 0.012) | (np.abs(X - 0.3) < 0.009) | (np.abs(np.sqrt(((X - 0.3) * 1.4 - 0.45) ** 2 + (Y - 0.5) ** 2) - 0.36) < 0.012) | (np.abs(np.sqrt(((X - 0.3) * 1.4 + 0.45) ** 2 + (Y - 0.5) ** 2) - 0.36) < 0.012)), (0.08, 0.05, 0.03))
P = [("space", sp, 0.56, 0.80, (-0.42, 0.02), -1.5, [("BLAST OFF!", 0.058, (0, -0.352), (0.98, 0.9, 0.3))], 6),
     ("rad", rad, 0.70, 0.50, (0.3, 0.17), 2.0, [("TOTALLY", 0.07, (0, 0.035), (0.05, 0.05, 0.1)), ("RAD '96", 0.07, (0, -0.045), (0.85, 0.1, 0.4))], 5),
     ("slam", bb, 0.42, 0.30, (0.3, -0.27), -3.0, [("SLAM!", 0.075, (0.085, 0.0), (0.98, 0.95, 0.9))], 8)]
keys = []
for name, px, w, h, (cx, cz), tilt, words, deg in P:
    _lib.noise(px, 0.012)
    m = _lib.image_mat(f"posters_{name}", _lib.save_image(f"poster_{name}", px), rough=0.45)
    X0 = T(cx, 0, cz) @ R(tilt, "Y")
    hinge = comp.pivot(col, root, f"posters_{name}", tuple(X0 @ comp.Vector((0, 0, h / 2))))
    sheet = _lib.panel(w, h, nx=8, ny=8)
    for v in sheet.verts:
        # the bottom right corner curls off the wall; the sheet bellies a little
        c = max(0.0, (v.co.x / w + 0.5) - 0.7) * max(0.0, 0.3 - (v.co.z / h + 0.5)) / 0.09
        v.co.y = -0.002 - 0.05 * c * c - 0.004 * math.sin((v.co.z / h + 0.5) * math.pi)
    so = M(f"posters_{name}_sheet", xf(sheet, X0), m, parent=hinge, smooth=True)
    back = _lib.panel(w, h, nx=8, ny=8)
    for v in back.verts:
        c = max(0.0, (v.co.x / w + 0.5) - 0.7) * max(0.0, 0.3 - (v.co.z / h + 0.5)) / 0.09
        v.co.y = -0.0015 - 0.05 * c * c - 0.004 * math.sin((v.co.z / h + 0.5) * math.pi)
    import bmesh
    bmesh.ops.reverse_faces(back, faces=back.faces)
    M(f"posters_{name}_back", xf(back, X0), white, parent=hinge)
    for k, (word, size, (tx, tz), colour) in enumerate(words):
        M(f"posters_{name}_text_{k + 1}", xf(xf(comp.text(word, size, depth=0.0006), T(tx, -0.0072, tz)), X0), comp.mat(f"posters_{name}_ink_{k + 1}", colour, rough=0.5), parent=hinge)
    tapes = [xf(xf(comp.box((0.05, 0.0004, 0.018)), R(sx * sz * 45 + rnd.uniform(-8, 8), "Y") @ T(0, 0, 0)), X0 @ T(sx * (w / 2 - 0.006), -0.0032, sz * (h / 2 - 0.006))) for sx in (-1, 1) for sz in (-1, 1) if not (sx == 1 and sz == -1)]
    M(f"posters_{name}_tape", comp.merge(*tapes), tape, parent=hinge)
    keys.append((hinge, "rotation_euler", 0, 0.0, math.radians(-deg)))
comp.channel("flutter", keys)
comp.export(col, root, _lib.PLACE, "posters", made="blender/components/bedroom/posters.py", source="own geometry and our own painted pictures (blender/src/bedroom/poster_*.png)", license="ours", credit="",
            rig={"flutter": "each sheet's bottom edge lifts off the wall about its top tape (6, 5 and 8 degrees)"},
            notes="the group is 1.35 m wide and 0.84 m high about its origin")
