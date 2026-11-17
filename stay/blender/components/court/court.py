# court/court: the half court's slab, modelled by hand: 17 x 16.5 m of wet cracked asphalt (Poly Haven asphalt_02, its
# roughness dropped for rain), a concrete kerb round it, and the worn white lines of a half court painted on it: the
# baseline, sidelines and half line with its half centre circle, the key (4.9 x 5.8 m, filled a faded brick red) with
# its lane marks, the free-throw circle, the no-charge arc and the three-point line 6.75 m from the rim. The origin is
# the middle of the baseline on the ground; the court runs toward -y (the camera), and the rim hangs 1.575 m in.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import arc, wet, T, R, S, xf

col, root = comp.fresh("court")
M = _lib.maker(col, root)
asph = wet(comp.ph_texture("court_asphalt", "asphalt_02", tile=3.0, res="2k", tint=(0.36, 0.36, 0.4)), 0.2)
key_m = wet(comp.ph_texture("court_key_paint", "asphalt_02", tile=3.0, res="2k", tint=(0.5, 0.15, 0.11)), 0.18)
line_m = comp.mat("court_lines", (0.82, 0.82, 0.78), rough=0.3)
kerb_m = comp.ph_texture("court_kerb", "concrete_floor_worn_001", tile=2.0, res="1k", tint=(0.7, 0.7, 0.72))
W, Y0, Y1 = 17.0, 2.3, -14.2
slab = M("court_slab", comp.box((W, Y0 - Y1, 0.2), at=(0, (Y0 + Y1) / 2, -0.1)), asph, smooth=False)
comp.uv_box(slab, 1.0)
kb = [comp.box((W + 0.5, 0.25, 0.3), at=(0, y, -0.07)) for y in (Y0 + 0.125, Y1 - 0.125)] + [comp.box((0.25, Y0 - Y1, 0.3), at=(sx * (W / 2 + 0.125), (Y0 + Y1) / 2, -0.07)) for sx in (-1, 1)]
kerb = M("court_kerb", comp.merge(*kb), kerb_m, smooth=False)
comp.bevel(kerb, 0.015, 2)
comp.uv_box(kerb, 1.0)
key = M("court_key", comp.box((4.9, 5.8, 0.002), at=(0, -2.9, 0.002)), key_m, smooth=False)
comp.uv_box(key, 1.0)
Z, LW = 0.005, 0.05
ln = lambda w, d, x, y: comp.box((w, d, 0.002), at=(x, y, Z))
RIM = -1.575
L = [ln(15.05, LW, 0, 0), ln(15.05, LW, 0, -14.0), ln(LW, 14.0, -7.5, -7.0), ln(LW, 14.0, 7.5, -7.0),
     ln(LW, 5.8, -2.45, -2.9), ln(LW, 5.8, 2.45, -2.9), ln(4.95, LW, 0, -5.8),
     arc(1.8, 0, 360, at=(0, -5.8), z=Z - 0.001, n=96), arc(1.8, 0, 180, at=(0, -14.0), z=Z - 0.001), arc(1.25, 180, 360, at=(0, RIM), z=Z - 0.001, n=40)]
a = math.degrees(math.asin(1.415 / 6.75))
L += [arc(6.75, 180 + a, 360 - a, at=(0, RIM), z=Z - 0.001, n=120), ln(LW, 2.99, -6.6, -1.495), ln(LW, 2.99, 6.6, -1.495)]
for sx in (-1, 1):
    L += [ln(0.1, LW, sx * 2.5, y) for y in (-1.75, -2.6, -3.85, -4.7)] + [ln(0.1, 0.4, sx * 2.5, -2.2)]
    L += [ln(LW, 0.375, sx * 1.25, RIM + 0.19)]
M("court_lines", comp.merge(*L), line_m, smooth=False)
comp.export(col, root, "court", "court", made="blender/components/court/court.py", source="own geometry; Poly Haven textures asphalt_02 and concrete_floor_worn_001", license="CC0", credit="Poly Haven",
            notes="origin: the middle of the baseline on the ground; the rim's centre is 1.575 m in toward -y; the slab's top is z 0")
