# cathedral/altar-cross: a brass altar cross, 0.95 m, modelled by hand: a stepped six-lobed foot, a stem with a knop,
# and a cross with trefoil ends, a raised border and a red stone at the crossing. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("altar_cross")
brass = L.brass_mat()
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
foot = [L.lathe([(0.13, 0.0), (0.135, 0.012), (0.12, 0.022), (0.1, 0.03), (0.06, 0.07), (0.03, 0.11), (0.022, 0.16), (0.022, 0.2)], seg=36)]
foot += [L.ball(0.035, (0.115 * math.cos(math.radians(60 * i)), 0.115 * math.sin(math.radians(60 * i)), 0.012), squash=(1, 1, 0.4)) for i in range(6)]
M("altar_cross_foot", comp.merge(*foot), brass, smooth=True)
M("altar_cross_knop", comp.merge(L.lathe([(0.022, 0.2), (0.03, 0.21), (0.052, 0.235), (0.03, 0.26), (0.022, 0.27), (0.018, 0.36)], seg=24), xf(xf(L.torus(0.05, 0.006, 24, 6), R(90, "X")), T(0, 0, 0.235))), brass, smooth=True)
CZ = 0.66
arms = [comp.box((0.06, 0.018, 0.6), at=(0, 0, 0.36 + 0.3 - 0.02)), comp.box((0.42, 0.018, 0.06), at=(0, 0, CZ))]
cr = M("altar_cross_cross", comp.merge(*arms), brass)
comp.bevel(cr, 0.004, 2)
ends = []
for x, z in ((0, 0.95 - 0.045), (-0.21, CZ), (0.21, CZ)):
    for a in (0, 120, 240):
        dx, dz = (0, 1) if x == 0 else ((-1, 0) if x < 0 else (1, 0))
        ang = math.radians(a)
        ox = dx * math.cos(ang) - dz * math.sin(ang)
        oz = dx * math.sin(ang) + dz * math.cos(ang)
        ends.append(xf(comp.cyl(0.03, 0.018, seg=18, axis="Y"), T(x + ox * 0.026, -0.009, z + oz * 0.026)))
M("altar_cross_trefoils", comp.merge(*ends), brass, smooth=False)
M("altar_cross_border", comp.merge(comp.box((0.036, 0.024, 0.5), at=(0, 0, 0.36 + 0.29)), comp.box((0.34, 0.024, 0.036), at=(0, 0, CZ))), comp.mat("cathedral_brass_dark", (0.5, 0.36, 0.14), rough=0.4, metal=1.0))
M("altar_cross_stone", L.ball(0.022, (0, -0.014, CZ), squash=(1, 0.6, 1)), comp.mat("cathedral_garnet", (0.5, 0.02, 0.04), rough=0.08), smooth=True)
M("altar_cross_stone_setting", xf(L.torus(0.024, 0.005, 20, 6), T(0, -0.013, CZ)), brass, smooth=True)
comp.export(col, root, "cathedral", "altar_cross", made="blender/components/cathedral/altar_cross.py", source="own geometry (a brass altar cross)", license="ours", credit="")
