# turbines/power-pole: a timber pole of the 33 kV line that takes the ridge's power down to the valley, modelled by
# hand: an 11 m tapered pole with a steel cross-arm and braces, three brown pin insulators carrying three conductors
# that sag away 45 m to each side (toward the next poles), a pole-top cap, a stay wire to a ground anchor, a number
# plate and a yellow anti-climb band with a hazard plate. Bark from a Poly Haven texture set. The line runs along x.
# No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe
from mathutils import Vector

col, root = comp.fresh("power_pole")
wood = comp.ph_texture("pole_timber", "bark_willow", tile=1.0, res="1k", grey=True, tint=(0.75, 0.6, 0.45))
steel = comp.mat("pole_steel", (0.55, 0.56, 0.58), rough=0.4, metal=1.0)
glaze = comp.mat("pole_insulator", (0.25, 0.1, 0.05), rough=0.15)
wire = comp.mat("pole_conductor", (0.3, 0.3, 0.31), rough=0.5, metal=1.0)
yellow = comp.mat("pole_hazard", (0.9, 0.7, 0.02), rough=0.5)
black = comp.mat("pole_black", (0.01, 0.01, 0.012), rough=0.6)
M = _lib.maker(col, root)
H = 11.0


def rod(a, b, r, seg=6):
    a, b = Vector(a), Vector(b)
    bm = comp.cyl(r, (b - a).length, seg=seg)
    xf(bm, (b - a).to_track_quat("Z", "Y").to_matrix())
    return xf(bm, T(*a))


p = M("power_pole_pole", comp.cyl(0.17, H, seg=18, r2=0.11), wood, smooth=True)
_lib.uv_cyl(p, tile=1.0, r_ref=0.45)
M("power_pole_cap", lathe([(0.118, H - 0.02), (0.125, H), (0.0, H + 0.05)], seg=18), steel)
arm = comp.merge(comp.box((0.09, 2.5, 0.11), at=(0, 0, H - 0.6)), rod((0, -1.0, H - 0.62), (0, -0.1, H - 1.5), 0.02), rod((0, 1.0, H - 0.62), (0, 0.1, H - 1.5), 0.02),
                 comp.box((0.3, 0.02, 0.16), at=(0, -0.13, H - 0.6)), comp.box((0.3, 0.02, 0.16), at=(0, 0.13, H - 0.6)))
M("power_pole_cross_arm", arm, steel)
ins, cond = [], []
for y in (-1.1, 0.0, 1.1):
    z0 = H - 0.54 if y else H + 0.05
    ins.append(lathe([(0.012, 0.0), (0.012, 0.1), (0.055, 0.11), (0.06, 0.14), (0.03, 0.16), (0.065, 0.19), (0.07, 0.22), (0.035, 0.24), (0.04, 0.29), (0.0, 0.31)], seg=14, z0=z0, at=(0, y)))
    top = z0 + 0.27
    pts = [(x, y, top - 1.4 * (1 - (x / 45.0) ** 2) + 1.4) for x in range(-45, 46, 5)]
    pts = [(x, y, top - 1.4 * (1 - ((abs(x) - 22.5) / 22.5) ** 2)) for x in range(-45, 46, 3)]
    cond.append(comp.tube(pts, 0.016, res=3, sides=1))
M("power_pole_insulators", comp.merge(*ins), glaze, smooth=True)
M("power_pole_conductors", comp.merge(*cond), wire)
M("power_pole_stay", comp.merge(rod((0, 0.12, H - 1.6), (0, 5.5, 0.1), 0.008), comp.cyl(0.02, 0.4, at=(0, 5.5, -0.1), seg=6), rod((0, 4.2, 2.2), (0, 5.3, 0.4), 0.02, seg=8)), steel)
M("power_pole_stay_guard", rod((0, 4.25, 2.1), (0, 5.25, 0.45), 0.024, seg=8), yellow)
M("power_pole_anticlimb", comp.merge(comp.cyl(0.19, 0.5, at=(0, 0, 2.6), seg=18, r2=0.185), comp.box((0.22, 0.01, 0.16), at=(0, -0.185, 1.9))), yellow, smooth=False)
num = comp.text("R14", 0.07, depth=0.003)
xf(num, T(0, -0.192, 1.9))
M("power_pole_number", num, black)
comp.export(col, root, "turbines", "power_pole", made="blender/components/turbines/power_pole.py", source="own geometry (a generic timber 33 kV pole); texture: https://polyhaven.com/a/bark_willow",
            license="ours; texture CC0", credit="Poly Haven (bark_willow)", notes="origin: the pole's foot; the conductors run 45 m along x to each side, sagging 1.4 m, so poles stand 90 m apart")
