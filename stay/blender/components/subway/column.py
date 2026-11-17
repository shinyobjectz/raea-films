# subway/column: a riveted steel H-column, 2.85 m from the platform's deck to the girder, modelled by hand: two
# flanges and a web, cover plates and four rows of rivets on each flange, a base plate bolted to a concrete plinth,
# a cap plate, painted dark green with a black lower band, and an enamel station plate (STAY) on both faces at eye
# height. Stands on the origin; its flanges face along the platform. Copies run every 5 m, 0.8 m in from the edge.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, slab, bolt

col, root = comp.fresh("column")
green = comp.mat("column_paint", (0.03, 0.09, 0.06), rough=0.45)
black = comp.mat("column_band", (0.015, 0.015, 0.017), rough=0.5)
conc = comp.mat("column_plinth", (0.4, 0.39, 0.37), rough=0.9)
enamel = comp.mat("column_plate", (0.9, 0.9, 0.86), rough=0.25)
ink = comp.mat("column_plate_ink", (0.02, 0.02, 0.025), rough=0.4)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
H, B, TF, TW, Z0, ZB = 2.85, 0.3, 0.025, 0.02, 0.12, 1.15
def shaft(z0, z1):
    return comp.merge(slab(-B / 2, B / 2, -B / 2, -B / 2 + TF, z0, z1), slab(-B / 2, B / 2, B / 2 - TF, B / 2, z0, z1), slab(-TW / 2, TW / 2, -B / 2 + TF, B / 2 - TF, z0, z1))
M("column_shaft", comp.merge(shaft(ZB, H - 0.02), *[slab(-B / 2 - 0.004, B / 2 + 0.004, s * (B / 2 + 0.008) - 0.008, s * (B / 2 + 0.008) + 0.008, 1.9, H - 0.02) for s in (-1, 1)], slab(-0.22, 0.22, -0.22, 0.22, H - 0.02, H)), green)
M("column_band", comp.merge(shaft(Z0, ZB), slab(-0.22, 0.22, -0.22, 0.22, Z0, Z0 + 0.02)), black)
p = M("column_plinth", slab(-0.27, 0.27, -0.27, 0.27, 0.0, Z0), conc)
comp.bevel(p, 0.02, 2)
riv_g, riv_b = [], []
for s in (-1, 1):
    for x in (-0.11, -0.04, 0.04, 0.11):
        for i in range(26):
            z = Z0 + 0.1 + i * 0.105
            off = 0.016 if z > 1.9 else 0.0
            (riv_g if z > ZB else riv_b).append(_lib.sphere(0.011, at=(x, s * (B / 2 + off), z), scale=(1, 0.6, 1), u=8, v=4))
M("column_rivets", comp.merge(*riv_g), green)
M("column_rivets_low", comp.merge(*riv_b, *[bolt((sx * 0.18, sy * 0.18, Z0 + 0.02), 0.016, 0.016) for sx in (-1, 1) for sy in (-1, 1)]), black)
pl, wd = [], []
for s in (-1, 1):
    pl.append(slab(-0.13, 0.13, s * (B / 2 + 0.014) - 0.004, s * (B / 2 + 0.014) + 0.004, 1.62, 1.8))
    t = comp.text("STAY", 0.085, depth=0.002)
    if s > 0:
        xf(t, R(180, "Z"))
    wd.append(xf(t, T(0, s * (B / 2 + 0.019), 1.71)))
M("column_plate", comp.merge(*pl), enamel)
M("column_plate_ink", comp.merge(*wd), ink)
comp.export(col, root, "subway", "column", made="blender/components/subway/column.py", source="own geometry (a generic riveted station column); letters in Blender's built-in font", license="ours", credit="")
