# cathedral/column: a compound pier of the nave arcade, 5.5 m to the top of its abacus, modelled by hand: an octagonal
# plinth, a moulded base (two rolls and a hollow), a round ashlar core with four large and four small attached shafts,
# a shaft ring half way up, and a bell capital with two rows of twelve trefoil crockets under an octagonal abacus. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("column")
stone, dressed = L.stone(), L.plain_stone()
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
H = 5.5
pl = M("column_plinth", comp.merge(xf(L.lathe([(0.78, 0.0), (0.78, 0.3), (0.7, 0.36)], seg=8), R(22.5, "Z")), xf(L.lathe([(0.84, 0.0), (0.84, 0.1), (0.78, 0.14)], seg=8), R(22.5, "Z"))), dressed)
comp.bevel(pl, 0.012, 2)
M("column_base", L.lathe([(0.66, 0.36), (0.68, 0.4), (0.66, 0.45), (0.6, 0.47), (0.56, 0.52), (0.58, 0.56), (0.61, 0.6), (0.58, 0.65), (0.5, 0.68)], seg=48), dressed, smooth=True)
core = M("column_core", comp.cyl(0.4, H - 0.68 - 0.75, at=(0, 0, 0.68), seg=48), stone, smooth=True)
L.finish(core, 1.0)
shafts = []
for i in range(8):
    a = math.radians(45 * i)
    big = i % 2 == 0
    r, d = (0.15, 0.4) if big else (0.085, 0.42)
    shafts.append(comp.cyl(r, H - 0.6 - 0.72, at=(d * math.cos(a), d * math.sin(a), 0.6), seg=20))
    for z in (0.6, 2.75):   # each shaft's own little base, and the ring half way
        shafts.append(xf(L.lathe([(r + 0.035, 0.0), (r + 0.05, 0.03), (r + 0.035, 0.06), (r + 0.01, 0.09), (r, 0.1)], seg=20), T(d * math.cos(a), d * math.sin(a), z)))
M("column_shafts", comp.merge(*shafts), dressed, smooth=True)
M("column_bell", L.lathe([(0.58, H - 0.78), (0.62, H - 0.74), (0.58, H - 0.7), (0.57, H - 0.55), (0.62, H - 0.36), (0.74, H - 0.2), (0.78, H - 0.16)], seg=48), dressed, smooth=True)
buds = []
for row, (z, rr, n, off) in enumerate(((H - 0.42, 0.63, 12, 0), (H - 0.24, 0.77, 12, 15))):
    for i in range(n):
        a = math.radians(360 / n * i + off)
        ca, sa = math.cos(a), math.sin(a)
        buds.append(comp.taper((0.55 * ca, 0.55 * sa, z - 0.15), (rr * ca, rr * sa, z + 0.03), 0.12, 0.07, 0.06, 0.035))
        # a curled trefoil of leaf at the stalk's head: one lobe forward and down, one each side
        for dr, dt, dz, r in ((0.035, 0.0, -0.03, 0.05), (0.0, 0.07, 0.01, 0.04), (0.0, -0.07, 0.01, 0.04), (0.012, 0.0, 0.03, 0.035)):
            bud = L.ball(r, squash=(1, 1, 0.75))
            buds.append(xf(bud, T((rr + dr) * ca - dt * sa, (rr + dr) * sa + dt * ca, z + dz)))
M("column_crockets", comp.merge(*buds), dressed, smooth=True)
ab = M("column_abacus", xf(L.lathe([(0.8, H - 0.16), (0.86, H - 0.12), (0.86, H - 0.03), (0.82, H)], seg=8), R(22.5, "Z")), dressed)
comp.bevel(ab, 0.01, 2)
comp.export(col, root, "cathedral", "column", made="blender/components/cathedral/column.py",
            source="own geometry (an Early Gothic compound pier); stone: https://polyhaven.com/a/large_sandstone_blocks_01", license="ours; texture CC0", credit="Poly Haven (large_sandstone_blocks_01)")
