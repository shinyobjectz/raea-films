# garage/back-wall: 20 m of the car park's perimeter wall, 2.75 m to the soffit and 0.25 m thick, its back at y 0 and
# its foot at the origin: cast concrete (Poly Haven's concrete_wall_008, CC0) with a mustard painted dado to 1.1 m
# (the same concrete, tinted) under a black line, a kerb at its foot (broken from x 8.1 to 9.4 for the stair door), the level's name stencilled on it, and a
# galvanised conduit run with saddles, two junction boxes and a drop to an isolator. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("back_wall")
M = L.maker(col, root)
conc = comp.ph_texture("wall_concrete", "concrete_wall_008", tile=2.71, res="1k")
dado = comp.ph_texture("wall_dado", "concrete_wall_008", tile=2.71, res="1k", tint=(1.0, 0.66, 0.1), grey=True)
black = comp.mat("wall_line", (0.02, 0.02, 0.02), rough=0.6)
teal = comp.mat("wall_stencil", (0.03, 0.2, 0.22), rough=0.7)
galv = comp.mat("wall_conduit", (0.62, 0.63, 0.64), rough=0.38, metal=1.0)
grey = comp.mat("wall_box", (0.35, 0.36, 0.38), rough=0.5)
W, H, TH = 20.0, 2.75, 0.25
F = -TH
w = M("back_wall_concrete", comp.box((W, TH, H), at=(0, -TH / 2, H / 2)), conc)
comp.uv_box(w, 1.0)
d = M("back_wall_dado", comp.box((W, 0.004, 1.1), at=(0, F - 0.002, 0.55)), dado)
comp.uv_box(d, 1.0)
M("back_wall_line", comp.box((W, 0.004, 0.1), at=(0, F - 0.002, 1.15)), black)
DOOR = (8.1, 9.4)   # the kerb stops for the stair door
k = M("back_wall_kerb", comp.merge(comp.box((DOOR[0] + W / 2, 0.2, 0.15), at=((DOOR[0] - W / 2) / 2, F - 0.1, 0.075)), comp.box((W / 2 - DOOR[1], 0.2, 0.15), at=((DOOR[1] + W / 2) / 2, F - 0.1, 0.075))), conc)
comp.bevel(k, 0.02, 2)
comp.uv_box(k, 1.0)
M("back_wall_stencil", comp.merge(xf(comp.text("LEVEL 2", 0.5, 0.002), T(-5.0, F - 0.002, 1.95)), xf(comp.text("LEVEL 2", 0.5, 0.002), T(5.0, F - 0.002, 1.95))), teal)
runs = [comp.cyl(0.0125, W - 0.6, at=(-W / 2 + 0.3, F - 0.03, 2.45), seg=12, axis="X"), comp.cyl(0.0125, 1.05, at=(-8.6, F - 0.03, 1.4), seg=12)]
M("back_wall_conduit", comp.merge(*runs), galv, smooth=True)
sad = [comp.box((0.012, 0.03, 0.05), at=(-W / 2 + 0.6 + i * 1.2, F - 0.02, 2.45)) for i in range(16)]
M("back_wall_saddles", comp.merge(*sad), galv)
bx = [comp.box((0.1, 0.06, 0.1), at=(x, F - 0.03, 2.45)) for x in (-8.6, 2.0)] + [comp.box((0.12, 0.08, 0.18), at=(-8.6, F - 0.04, 1.32))]
b = M("back_wall_boxes", comp.merge(*bx), grey)
comp.bevel(b, 0.006, 2)
M("back_wall_isolator_handle", comp.box((0.03, 0.03, 0.07), at=(-8.6, F - 0.09, 1.33)), comp.mat("wall_isolator", (0.7, 0.05, 0.04), rough=0.5))
L.look(col, "back-wall", eye=(5, -12, 2.2), target=(0, 0, 1.3), lens=28)
comp.export(col, root, "garage", "back_wall", made="blender/components/garage/back_wall.py",
            source="own geometry; https://polyhaven.com/a/concrete_wall_008", license="ours; textures CC0",
            credit="Poly Haven (concrete_wall_008)", rig={}, notes="Back at y 0, its face at y -0.25, foot at z 0.")
