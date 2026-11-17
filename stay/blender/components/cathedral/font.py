# cathedral/font: an octagonal stone font and its oak cover, 1.05 m to the rim, modelled by hand: two octagonal steps,
# a stem ringed by eight shafts, a bowl with a quatrefoil sunk in each face, a lead lining, the water, and a flat oak
# cover with iron straps, a turned finial and a ring. Rig: "cover" lifts the cover 0.7 m straight up off the bowl.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("font")
stone, dressed, oak, iron = L.stone(), L.plain_stone(), L.oak(), L.iron_mat()
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
st = M("font_steps", comp.merge(L.octa([(0.95, 0.0), (0.95, 0.15), (0.0, 0.15)]), L.octa([(0.68, 0.15), (0.68, 0.3), (0.0, 0.3)])), stone)
comp.bevel(st, 0.012, 2)
L.finish(st, 1.0)
stem = [L.octa([(0.36, 0.3), (0.36, 0.36), (0.3, 0.4), (0.24, 0.42), (0.24, 0.72), (0.3, 0.76)])]
for i in range(8):
    a = math.radians(45 * i)
    stem.append(xf(L.lathe([(0.05, 0.0), (0.05, 0.02), (0.034, 0.04), (0.034, 0.28), (0.045, 0.3), (0.055, 0.34), (0, 0.34)], seg=10), T(0.29 * math.cos(a), 0.29 * math.sin(a), 0.4)))
M("font_stem", comp.merge(*stem), dressed, smooth=False)
bowl = M("font_bowl", L.octa([(0.3, 0.74), (0.46, 0.8), (0.5, 0.84), (0.5, 1.02), (0.47, 1.05), (0.4, 1.05), (0.38, 1.0), (0.0, 1.0)]), dressed)
comp.bevel(bowl, 0.008, 2)
ap = 0.5 * math.cos(math.radians(22.5))
q = []
for i in range(8):
    a = math.radians(45 * i + 22.5 + 22.5)
    for k in range(4):
        b = math.radians(90 * k + 45)
        d = xf(comp.cyl(0.036, 0.006, seg=14, axis="Y"), T(0.036 * math.cos(b), -ap - 0.001, 0.93 + 0.036 * math.sin(b)))
        q.append(xf(d, R(math.degrees(a) + 90, "Z")))
M("font_quatrefoils", comp.merge(*q), comp.mat("cathedral_shadow", (0.02, 0.02, 0.022), rough=0.95))
M("font_lining", L.lathe([(0.39, 1.045), (0.36, 0.86), (0.2, 0.8), (0.0, 0.79)], seg=32, cap=False), comp.mat("font_lead", (0.2, 0.21, 0.22), rough=0.4, metal=0.8), smooth=True)
M("font_water", comp.cyl(0.375, 0.004, at=(0, 0, 0.985), seg=32), comp.mat("font_water", (0.05, 0.09, 0.1), rough=0.03, alpha=0.75))
cp = comp.pivot(col, root, "font_cover", (0, 0, 1.05))
cv = M("font_cover_board", L.octa([(0.5, 1.055), (0.5, 1.09), (0.44, 1.105), (0.0, 1.105)]), oak, parent=cp)
comp.bevel(cv, 0.006, 2)
L.finish(cv, 1.0)
iw = [xf(comp.box((0.9, 0.04, 0.006), at=(0, 0, 1.108)), R(a, "Z")) for a in (0, 90)]
iw += [L.lathe([(0.07, 1.105), (0.05, 1.13), (0.025, 1.15), (0.035, 1.18), (0.018, 1.21), (0.0, 1.215)], seg=16), xf(L.torus(0.04, 0.007, 16, 5), T(0, 0, 1.245))]
M("font_cover_ironwork", comp.merge(*iw), iron, parent=cp, smooth=False)
L.channel("cover", [(cp, "location", 2, cp.location.z, cp.location.z + 0.7)])
comp.export(col, root, "cathedral", "font", made="blender/components/cathedral/font.py", source="own geometry (an octagonal Gothic font); stone: https://polyhaven.com/a/large_sandstone_blocks_01; oak: https://polyhaven.com/a/dark_wood", license="ours; textures CC0", credit="Poly Haven (large_sandstone_blocks_01, dark_wood)",
            rig={"cover": "the oak cover (font_cover) rises 0.7 m off the bowl"})
