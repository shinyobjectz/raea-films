# subway/bench: a station bench, 2.4 m, modelled by hand: varnished hardwood slats (five on the seat following its
# curve, four on the back) on three cast-iron standards with scrolled arm rests, bolted through, the feet
# bolted to the deck. Seat 0.44 m, back 0.86 m. Stands on the origin, facing -y.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, slab, bolt, prism

col, root = comp.fresh("bench")
wood = comp.ph_texture("bench_wood", "rough_wood", tile=0.7, res="1k", tint=(0.55, 0.33, 0.18))
iron = comp.mat("bench_iron", (0.02, 0.05, 0.035), rough=0.45)
steel = comp.mat("bench_bolts", (0.4, 0.4, 0.42), rough=0.4, metal=1.0)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
W = 2.4
SEAT = [(-0.2, 0.43, 4), (-0.115, 0.44, 0), (-0.03, 0.44, -2), (0.055, 0.432, -5), (0.14, 0.42, -9)]
BACK = [(0.215, 0.54, 78), (0.235, 0.64, 80), (0.255, 0.74, 80), (0.272, 0.835, 82)]
sl, bolts = [], []
for y, z, a in SEAT + BACK:
    b = comp.box((W, 0.075, 0.03), at=(0, 0, 0))
    xf(b, R(a, "X")); xf(b, T(0, y, z)); sl.append(b)
    for x in (-1.1, 0.0, 1.1):
        hb = bolt((0, 0, 0.015), 0.009, 0.005, seg=8)
        xf(hb, R(a, "X")); xf(hb, T(x, y, z)); bolts.append(hb)
s = M("bench_slats", comp.merge(*sl), wood)
comp.bevel(s, 0.006, 2)
comp.uv_box(s)
M("bench_bolts", comp.merge(*bolts), steel)
SIDE = [(-0.24, 0.0), (-0.17, 0.0), (-0.16, 0.36), (0.16, 0.36), (0.19, 0.0), (0.27, 0.0), (0.25, 0.4), (0.31, 0.86), (0.26, 0.87), (0.2, 0.47), (0.17, 0.405), (-0.2, 0.405), (-0.21, 0.6), (0.05, 0.62), (0.05, 0.66), (-0.22, 0.655), (-0.265, 0.63), (-0.255, 0.4)]
st = []
for x in (-1.1, 0.0, 1.1):
    p = prism([(py, pz) for py, pz in SIDE], -0.02, 0.02)
    # prism pushes an (x, z) outline along y: turn it so the outline lies in yz and its thickness along x
    xf(p, R(90, "Z")); xf(p, T(x, 0, 0)); st.append(p)
    st += [comp.box((0.1, 0.09, 0.012), at=(x, -0.205, 0.006)), comp.box((0.1, 0.09, 0.012), at=(x, 0.23, 0.006))]
i = M("bench_standards", comp.merge(*st), iron)
comp.bevel(i, 0.004, 2)
comp.export(col, root, "subway", "bench", made="blender/components/subway/bench.py", source="own geometry (a generic slatted station bench); wood https://polyhaven.com/a/rough_wood", license="ours; texture CC0", credit="texture: Poly Haven")
