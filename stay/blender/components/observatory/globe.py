# observatory/globe: a celestial globe on its floor stand, modelled by hand: a 36 cm sphere of the night sky (our own
# painted map: deep blue, the stars and their figures in gilt, the equator and ecliptic) on a polar axle in a brass
# meridian ring, the ring cradled in a horizon ring carried on four turned oak legs with a stretcher. 1 m to the
# horizon. Rig: "spin" turns the globe one whole turn on its tilted axle; "tip" swings the meridian ring 30 degrees
# in its cradle (setting the latitude).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
import numpy as np
from _lib import lathe, torus, rod, T, R, S, xf, Vector

col, root = comp.fresh("globe")
M = _lib.maker(col, root)


def sky(u, v):
    base = _lib.star_chart(seed=33, paper=(0.05, 0.09, 0.22), ink=(0.9, 0.75, 0.4))(u, v)
    h = u.shape[0]
    for lat, k in ((0.5, 0.9), (0.5 + 0.13, 0.4), (0.5 - 0.13, 0.4)):
        line = np.clip(1 - np.abs(v - lat) * h / 1.5, 0, 1)[..., None] * k
        base = base * (1 - line) + np.array([0.9, 0.75, 0.4], np.float32) * line
    return base


sky_m = _lib.image_mat("globe_sky", _lib.paint("globe_sky", 2048, 1024, sky), rough=0.35)
brass = comp.mat("globe_brass", (0.78, 0.58, 0.22), rough=0.25, metal=1.0)
oak = comp.ph_texture("globe_oak", "oak_veneer_01", tile=1.0, res="1k", tint=(0.55, 0.42, 0.32))
GR, CZ = 0.18, 1.0
C = Vector((0, 0, CZ))
tip = comp.pivot(col, root, "globe_tip", C)
axis = _lib.axis_pivot(col, root, "globe_axis", T(*C) @ R(-50, "X"), mode="ZYX", parent=tip)
M("globe_sphere", xf(_lib.sphere_uv(GR), T(*C) @ R(-50, "X")), sky_m, parent=axis)
ax = T(*C) @ R(-50, "X")
M("globe_axle", xf(comp.merge(comp.cyl(0.004, 2 * GR + 0.05, at=(0, 0, -GR - 0.025), seg=8), comp.cyl(0.012, 0.012, at=(0, 0, GR + 0.004), seg=12), comp.cyl(0.03, 0.003, at=(0, 0, GR + 0.008), seg=24)), ax), brass, parent=axis)
M("globe_meridian", xf(comp.merge(torus(GR + 0.02, 0.006, seg=64, sides=6, axis="X"), *[comp.cyl(0.009, 0.014, at=(0, 0, sz * (GR + 0.014) - 0.007), seg=10) for sz in (-1, 1)]), ax), brass, parent=tip)
hz = lathe([(GR + 0.035, -0.012), (GR + 0.11, -0.012), (GR + 0.115, 0.0), (GR + 0.11, 0.012), (GR + 0.035, 0.012), (GR + 0.035, -0.012)], seg=64, at=(0, 0, CZ))
legs = []
for i in range(4):
    a = math.pi / 4 + i * math.pi / 2
    x, y = (GR + 0.075) * math.cos(a), (GR + 0.075) * math.sin(a)
    fx, fy = x * 1.25, y * 1.25
    prof = [(0.016, 0.0), (0.022, 0.02), (0.014, 0.06), (0.02, 0.3), (0.028, 0.36), (0.016, 0.42), (0.02, 0.8), (0.027, 0.9), (0.018, 0.94), (0.022, CZ - 0.012)]
    leg = lathe(prof, seg=12)
    for v in leg.verts:                         # splay the foot outward
        t = 1 - v.co.z / (CZ - 0.012)
        v.co.x += x + (fx - x) * t
        v.co.y += y + (fy - y) * t
    legs.append(leg)
    b = math.pi / 4 + ((i + 1) % 4) * math.pi / 2
    legs.append(rod((x * 1.19, y * 1.19, 0.3), ((GR + 0.075) * 1.19 * math.cos(b), (GR + 0.075) * 1.19 * math.sin(b), 0.3), 0.011, seg=8))
legs += [rod((-0.25, -0.25, 0.3), (0.25, 0.25, 0.3), 0.011, seg=8), rod((-0.25, 0.25, 0.3), (0.25, -0.25, 0.3), 0.011, seg=8), lathe([(0.0, 0.28), (0.05, 0.28), (0.05, 0.31), (0.015, 0.33), (0.012, CZ - GR - 0.07), (0.03, CZ - GR - 0.05), (0.0, CZ - GR - 0.05)], seg=16)]
st = M("globe_stand", comp.merge(hz, *legs), oak)
comp.uv_box(st, 1.0)
M("globe_cradle", comp.merge(*[comp.box((0.02, 0.03, 0.02), at=(0, sy * (GR + 0.03), CZ)) for sy in (-1, 1)], comp.box((0.02, 0.03, 0.03), at=(0, 0, CZ - GR - 0.035))), brass, smooth=False)
_lib.channel("spin", [(axis, "rotation_euler", 2, 0, 2 * math.pi)])
_lib.channel("tip", [(tip, "rotation_euler", 0, 0, math.radians(30))])
comp.export(col, root, "observatory", "globe", made="blender/components/observatory/globe.py", source="own geometry and our own painted sky; Poly Haven texture oak_veneer_01", license="ours (texture CC0)", credit="Poly Haven (texture)",
            rig={"spin": "the globe one whole turn on its tilted axle", "tip": "the meridian ring and globe swing 30 degrees in the cradle"})
