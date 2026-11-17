# vinyl/floor: the shop's floor, 6 x 5 m of worn pine boards (Poly Haven's wood_floor_worn, CC0, at its real 2 m
# repeat), its top at z 0, with a worn runner mat down the aisle before the racks. The shell's floor. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("floor")
boards = comp.ph_texture("floor_boards", "wood_floor_worn", tile=2.0, res="2k")
mat_m = comp.ph_texture("floor_runner", "hessian_230", tile=0.4, res="1k", tint=(0.45, 0.2, 0.16), grey=True)
f = M("floor_boards", comp.box((6.0, 5.0, 0.04), at=(0, 0, -0.02)), boards)
comp.uv_box(f, 1.0)
r = M("floor_runner", comp.box((2.6, 0.8, 0.008), at=(0.2, -0.3, 0.004)), mat_m)
comp.uv_box(r, 1.0)
comp.bevel(r, 0.003, 2)
done(col, root, "floor", "own geometry; https://polyhaven.com/a/wood_floor_worn and https://polyhaven.com/a/hessian_230 (CC0)", license="CC0", credit="Poly Haven (textures)")
