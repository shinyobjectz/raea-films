# cathedral/altar: the high altar on its dais, modelled by hand: three stone steps (5.0 x 3.2 m at the floor, 0.48 m
# to the top), a stone altar 2.4 m long and 1 m high with an arcade of five trefoil-less pointed panels on its front
# over dark red, a marble mensa, a fair linen cloth that hangs down both ends, and a red velvet superfrontal with a
# gilt fringe along the front edge. The cross and the candlesticks are their own components. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("altar")
stone, dressed = L.stone(), L.plain_stone()
velvet = L.velvet()
marble = comp.ph_texture("cathedral_marble", "marble_01", tile=1.5, res="1k")
linen = comp.mat("cathedral_linen", (0.86, 0.85, 0.8), rough=0.8)
gilt = comp.mat("cathedral_gilt", (0.9, 0.66, 0.2), rough=0.3, metal=1.0)
red = comp.mat("cathedral_panel_red", (0.22, 0.02, 0.03), rough=0.6)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
for i, (w, d) in enumerate(((5.0, 3.2), (4.4, 2.6), (3.8, 2.0))):
    s = M(f"altar_step_{i + 1}", comp.box((w, d, 0.16), at=(0, 0, 0.08 + i * 0.16)), stone)
    comp.bevel(s, 0.015, 2)
    L.finish(s, 1.0)
Z = 0.48
YC = 0.25                       # the altar stands toward the back of the top step
body = M("altar_body", comp.box((2.3, 0.85, 0.92), at=(0, YC, Z + 0.46)), stone)
L.finish(body, 1.0)
base = M("altar_base", comp.merge(comp.box((2.44, 0.99, 0.1), at=(0, YC, Z + 0.05)), comp.box((2.38, 0.93, 0.05), at=(0, YC, Z + 0.125))), dressed)
comp.bevel(base, 0.012, 2)
FY = YC - 0.425
loops = [L.rect(-1.15, Z + 0.15, 1.15, Z + 0.9)]
shafts = []
for i in range(5):
    cx = -0.92 + i * 0.46
    loops.append(L.arch(0.34, Z + 0.55, Z + 0.22, at=cx, n=8)[0])
for i in range(6):
    cx = -1.15 + i * 0.46
    shafts.append(xf(L.lathe([(0.035, 0), (0.035, 0.02), (0.022, 0.04), (0.022, 0.3), (0.04, 0.34), (0.04, 0.36), (0, 0.36)], seg=10), T(min(1.12, max(-1.12, cx)), FY - 0.075, Z + 0.2)))
M("altar_front_panel", comp.box((2.28, 0.01, 0.74), at=(0, FY - 0.005, Z + 0.52)), red)
fa = M("altar_front_arcade", xf(L.plate(loops, 0.06), T(0, FY - 0.012, 0)), dressed)
comp.bevel(fa, 0.008, 2, angle=50)
M("altar_front_shafts", comp.merge(*shafts), dressed, smooth=True)
M("altar_front_bosses", comp.merge(*[L.ball(0.028, (-0.92 + i * 0.46, FY - 0.02, Z + 0.45), squash=(1, 0.5, 1)) for i in range(5)]), gilt, smooth=True)
me = M("altar_mensa", comp.box((2.5, 1.0, 0.09), at=(0, YC, Z + 0.965)), marble)
comp.bevel(me, 0.012, 3)
L.finish(me, 1.0)
TOP = Z + 1.01
cloth = comp.merge(comp.box((2.56, 0.9, 0.006), at=(0, YC, TOP + 0.003)), comp.box((0.006, 0.9, 0.62), at=(-1.28, YC, TOP - 0.305)), comp.box((0.006, 0.9, 0.62), at=(1.28, YC, TOP - 0.305)))
M("altar_fair_linen", cloth, linen)
sf = M("altar_superfrontal", comp.box((2.52, 0.012, 0.2), at=(0, YC - 0.507, TOP - 0.1)), velvet)
L.finish(sf, 1.0)
fr = [comp.box((2.52, 0.014, 0.012), at=(0, YC - 0.508, TOP - 0.03))]
fr += [comp.box((0.012, 0.014, 0.05), at=(-1.25 + i * 0.025, YC - 0.508, TOP - 0.225)) for i in range(101)]
fr += [xf(L.plate([L.rect(-0.012, -0.07, 0.012, 0.07)], 0.004), T(x, YC - 0.513, TOP - 0.11)) for x in (-0.9, -0.3, 0.3, 0.9)]
fr += [xf(L.plate([L.rect(-0.05, -0.012, 0.05, 0.012)], 0.004), T(x, YC - 0.513, TOP - 0.09)) for x in (-0.9, -0.3, 0.3, 0.9)]
M("altar_superfrontal_gilt", comp.merge(*fr), gilt)
comp.export(col, root, "cathedral", "altar", made="blender/components/cathedral/altar.py",
            source="own geometry; stone: https://polyhaven.com/a/large_sandstone_blocks_01; marble: https://polyhaven.com/a/marble_01; velvet: https://polyhaven.com/a/velour_velvet", license="ours; textures CC0", credit="Poly Haven (large_sandstone_blocks_01, marble_01, velour_velvet)",
            notes="The mensa's top is 1.49 m above the origin (the cloth 1.496), its centre 0.25 m behind the origin.")
