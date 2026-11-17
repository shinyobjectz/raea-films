# pool/bench: a changing bench for the deck by the wall, modelled by hand at real size: four hardwood slats 1.8 m long
# on two tubular steel leg frames with rubber feet and a stretcher, and a two-slat shoe shelf under the seat. 45 cm
# high, 38 cm deep. No rig (pool/towel and pool/flip-flops belong on and under it).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("bench")
wood = comp.ph_texture("pool_bench_wood", "fine_grained_wood", tile=0.6, res="1k")
st = paint_m("pool_bench_frame", (0.85, 0.86, 0.85), 0.35)
rub = comp.mat("pool_rubber", (0.02, 0.02, 0.02), rough=0.8)
metal = steel("pool_steel", 0.25)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
L, D, H = 1.8, 0.38, 0.45
slats = [comp.box((L, 0.082, 0.028), at=(0, -D / 2 + 0.045 + i * 0.097, H - 0.014)) for i in range(4)]
slats += [comp.box((L - 0.3, 0.082, 0.022), at=(0, y, 0.171)) for y in (-0.06, 0.06)]
s = M("bench_slats", comp.merge(*slats), wood)
comp.bevel(s, 0.006, 3)
comp.uv_box(s, 1.0)
frame = []
for x in (-0.68, 0.68):
    frame.append(pipe(bend([(x, -D / 2 + 0.03, 0.01), (x, -D / 2 + 0.03, H - 0.045), (x, D / 2 - 0.03, H - 0.045), (x, D / 2 - 0.03, 0.01)], 0.05, 5), 0.016))
    frame.append(rod((x, -D / 2 + 0.03, 0.15), (x, D / 2 - 0.03, 0.15), 0.012))
frame.append(rod((-0.68, 0, 0.15), (0.68, 0, 0.15), 0.012))
M("bench_frame", comp.merge(*frame), st, smooth=True)
M("bench_feet", comp.merge(*[comp.cyl(0.02, 0.018, at=(x, y, 0), seg=14) for x in (-0.68, 0.68) for y in (-D / 2 + 0.03, D / 2 - 0.03)]), rub, smooth=True)
M("bench_screws", comp.merge(*[comp.cyl(0.005, 0.002, at=(x, -D / 2 + 0.045 + i * 0.097, H), seg=8) for x in (-0.68, 0.68) for i in range(4)]), metal)
done(col, root, "bench", source="own geometry (a generic slatted changing bench); wood: https://polyhaven.com/a/fine_grained_wood", license="ours; texture CC0", credit="Poly Haven (fine_grained_wood)")
