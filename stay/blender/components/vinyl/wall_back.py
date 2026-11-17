# vinyl/wall-back: the shop's back wall, 6 x 3 m of painted brick (Poly Haven's painted_brick, CC0, at its real
# 1.8 m repeat), a dark timber skirting board, a picture rail at 2.4 m, and a run of surface conduit to a double
# socket. The shell's wall: its face at y 0 (wall pieces sit on it), standing on the floor. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("wall_back")
brick = comp.ph_texture("wall_back_brick", "painted_brick", tile=1.8, res="2k")
timber = comp.ph_texture("wall_back_timber", "dark_wood", tile=1.0, res="1k")
steel = comp.mat("wall_back_conduit", (0.55, 0.55, 0.57), rough=0.4, metal=1.0)
white = comp.mat("wall_back_socket", (0.88, 0.88, 0.85), rough=0.4)
w = M("wall_back_brick", comp.box((6.0, 0.12, 3.0), at=(0, 0.06, 1.5)), brick)
comp.uv_box(w, 1.0)
for n, (h, z, d) in {"skirting": (0.14, 0.07, 0.02), "rail": (0.05, 2.4, 0.03)}.items():
    o = M(f"wall_back_{n}", comp.box((6.0, d, h), at=(0, -d / 2, z)), timber)
    comp.uv_box(o, 1.0)
    comp.bevel(o, 0.004, 2)
shade(M("wall_back_conduit", comp.merge(comp.cyl(0.009, 2.05, at=(2.6, -0.011, 0.35), seg=12), comp.cyl(0.012, 0.03, at=(2.6, -0.011, 1.2), seg=12), comp.cyl(0.012, 0.03, at=(2.6, -0.011, 2.0), seg=12)), steel))
s = M("wall_back_socket", comp.merge(comp.box((0.15, 0.03, 0.09), at=(2.6, -0.015, 0.32)), comp.box((0.03, 0.004, 0.03), at=(2.565, -0.032, 0.32)), comp.box((0.03, 0.004, 0.03), at=(2.635, -0.032, 0.32))), white)
comp.bevel(s, 0.003, 2)
done(col, root, "wall_back", "own geometry; https://polyhaven.com/a/painted_brick and https://polyhaven.com/a/dark_wood (CC0)", license="CC0", credit="Poly Haven (textures)")
