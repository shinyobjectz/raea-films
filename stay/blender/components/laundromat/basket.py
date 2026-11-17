# laundromat/basket: a plastic laundry basket, 0.6 x 0.42 m and 0.28 m deep, modelled by hand: a solid floor and low
# band, a wall of upright bars, a rolled rim with a grip each end, in pale blue; in it two stacks of folded towels
# (Poly Haven's terry_cloth and waffle_pique_cotton) and a wadded gingham shirt over the rim. It stands on a table or a
# chair. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rod, rrect, loft, rbox, wad, fold, T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("basket")
M = _lib.maker(col, root)
plastic = comp.mat("basket_plastic", (0.45, 0.68, 0.85), rough=0.4)
towel = comp.ph_texture("basket_towel", "terry_cloth", tile=0.2, res="1k", tint=(0.95, 0.95, 0.92), grey=True)
waffle = comp.ph_texture("basket_waffle", "waffle_pique_cotton", tile=0.28, res="1k")
check = comp.ph_texture("basket_check", "gingham_check", tile=0.28, res="1k")
LT, WT, LB, WB, Hh = 0.6, 0.42, 0.5, 0.33, 0.28
lp = lambda k, z, grow=0.0: rrect(LB + (LT - LB) * k + grow, WB + (WT - WB) * k + grow, 0.05 + 0.02 * k, z, n=5)
band = M("basket_band", loft([lp(0.0, 0.0), lp(0.02, 0.006), lp(0.2, 0.056)], cap_bottom=True), plastic, smooth=True)
comp.solidify(band, 0.004, 1)
rim = M("basket_rim", loft([lp(0.8, 0.224), lp(1.0, 0.27), lp(1.0, 0.28, 0.016), lp(1.0, 0.268, 0.034), lp(1.0, 0.25, 0.034)]), plastic, smooth=True)
comp.solidify(rim, 0.004, 1)
lo, hi = lp(0.2, 0.056), lp(0.8, 0.224)
bars = []
n = len(lo)
for i in range(n):
    j = (i + 1) % n
    seg = (Vector(lo[j]) - Vector(lo[i])).length
    m = max(1, round(seg / 0.03))
    for k in range(m):
        f = (k + 0.5) / m
        a, b = Vector(lo[i]).lerp(Vector(lo[j]), f), Vector(hi[i]).lerp(Vector(hi[j]), f)
        bars.append(rod(a, b, 0.0065, seg=4, over=0.004))
M("basket_bars", comp.merge(*bars), plastic)
M("basket_grips", comp.merge(*[rbox((0.02, 0.14, 0.02), at=(s * (LT / 2 + 0.012), 0, 0.262), r=0.008) for s in (-1, 1)]), plastic, smooth=True)
t1 = M("basket_towels_white", xf(fold(0.24, 0.3, layers=6, t=0.03, seed=3), T(-0.12, 0.0, 0.01)), towel, smooth=True)
comp.uv_box(t1, 1.0)
t2 = M("basket_towels_yellow", xf(fold(0.2, 0.28, layers=4, t=0.03, seed=5), T(0.13, 0.01, 0.01)), waffle, smooth=True)
comp.uv_box(t2, 1.0)
w = wad(4, (0.3, 0.26, 0.16), rough=0.3)
for v in w.verts:
    if v.co.y < -0.05:
        v.co.z -= (-(v.co.y + 0.05)) * 1.6
s = M("basket_shirt", xf(w, T(0.13, -0.12, 0.2)), check, smooth=True)
comp.uv_box(s, 1.0)
comp.export(col, root, _lib.PLACE, "basket", made="blender/components/laundromat/basket.py",
            source="own geometry (a generic plastic laundry basket); cloth: https://polyhaven.com/a/terry_cloth, /waffle_pique_cotton, /gingham_check", license="ours; textures CC0", credit="Poly Haven (terry_cloth, waffle_pique_cotton, gingham_check)", rig={})
