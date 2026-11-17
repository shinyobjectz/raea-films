# gym/wall: a 9 m bay of the gym's wall, 8 m tall, modelled by hand: painted concrete block (Poly Haven's
# concrete_block_wall, its relief under paint) in two coats, the school's green to 2.4 m and cream above, a rubber cove base,
# a painted steel conduit run with two junction boxes, and a row of acoustic panels under the roof. Its face at y 0,
# standing on the floor. Two bays make the baseline wall; turned, it is a side wall.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rbox, rod, T, R, S, xf

col, root = comp.fresh("wall")
M = _lib.maker(col, root)
W, H, DADO = 9.0, 8.0, 2.4
low = _lib.ph_plain("wall_green", "concrete_block_wall", (0.03, 0.2, 0.11), res="2k")   # painted block: the set's relief under one coat of colour
high = _lib.ph_plain("wall_cream", "concrete_block_wall", (0.72, 0.68, 0.52), res="2k")
base = comp.mat("wall_cove", (0.02, 0.02, 0.022), rough=0.6)
pipe_m = comp.mat("wall_conduit", (0.72, 0.7, 0.6), rough=0.5)
panel = comp.ph_texture("wall_acoustic", "hessian_230", tile=0.5, res="1k", grey=True, tint=(0.55, 0.5, 0.4))
a = M("wall_low", comp.box((W, 0.2, DADO), at=(0, 0.1, DADO / 2)), low, smooth=False)
comp.uv_box(a, 2.0)
b = M("wall_high", comp.box((W, 0.2, H - DADO), at=(0, 0.1, DADO + (H - DADO) / 2)), high, smooth=False)
comp.uv_box(b, 2.0)
M("wall_stripe", comp.box((W, 0.004, 0.1), at=(0, -0.002, DADO + 0.05)), comp.mat("wall_stripe", (0.85, 0.8, 0.6), rough=0.5), smooth=False)
M("wall_cove", comp.box((W, 0.012, 0.1), at=(0, -0.006, 0.05)), base, smooth=False)
cz = 4.6
con = [comp.cyl(0.013, W, at=(-W / 2, -0.02, cz), seg=10, axis="X")]
con += [rbox((0.11, 0.05, 0.11), at=(x, -0.025, cz), r=0.006, seg=2) for x in (-2.2, 2.6)]
con += [comp.cyl(0.013, H - cz - 0.4, at=(x, -0.02, cz), seg=10) for x in (-2.2,)]
con += [rbox((0.03, 0.006, 0.05), at=(x, -0.003, cz), r=0.001, seg=1) for x in (-4, -3, -1, 0, 1, 2, 3.6)]
M("wall_conduit", comp.merge(*con), pipe_m, smooth=False)
ps = []
for i in range(6):
    ps.append(rbox((1.3, 0.05, 1.3), at=(-W / 2 + 0.75 + i * 1.5, -0.025, 6.6), r=0.01, seg=2))
p = M("wall_acoustic", comp.merge(*ps), panel, smooth=False)
comp.uv_box(p, 1.0)
comp.export(col, root, "gym", "wall", made="blender/components/gym/wall.py",
            source="own geometry; block: https://polyhaven.com/a/concrete_block_wall, panels: https://polyhaven.com/a/hessian_230", license="ours; textures CC0", credit="Poly Haven (concrete_block_wall, hessian_230)")
