# bedroom/toys: the toys left out on the floor, as one scatter about 1.1 m across: nine wooden alphabet blocks (three
# stacked), a die-cast style toy car with rolling wheels, a ring-stacker, a striped rubber ball, a yo-yo on its
# string, four marbles, all modelled by hand, and a rubber duck (Poly Haven's rubber_duck_toy, CC0, at half size).
# Rig: "car" rolls the toy car 0.35 m forward, its wheels turning with it; "ball" rolls the ball 0.3 m and one turn;
# "blocks" topples the stack's top block off (it slides 6 cm and tips 90 degrees).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bpy, bmesh
from comp import T, R, S, xf
col, root = comp.fresh("toys")
M = _lib.maker(col, root)
rnd = random.Random(33)
wood = comp.ph_texture("toys_wood", "plywood", tile=0.3, res="1k")
# alphabet blocks
BS = 0.045
INK = [(0.8, 0.1, 0.08), (0.1, 0.3, 0.7), (0.1, 0.5, 0.2), (0.9, 0.6, 0.05)]
spots = [(-0.3, 0.1, 0, 12), (-0.3, 0.1, 1, 30), (-0.3, 0.1, 2, -8), (-0.24, 0.12, 0, 40), (-0.37, 0.02, 0, 70), (-0.15, -0.05, 0, 5), (-0.42, 0.2, 0, 55), (-0.2, 0.22, 0, 80), (-0.33, -0.12, 0, 20)]
top_block = None
for i, (x, y, lv, a) in enumerate(spots):
    p = comp.pivot(col, root, f"toys_block_{i + 1}", (x, y, lv * BS))
    X = T(x, y, lv * BS) @ R(a, "Z")
    b = M(f"toys_block_{i + 1}_wood", xf(comp.box((BS, BS, BS), at=(0, 0, BS / 2)), X), wood, parent=p)
    comp.bevel(b, 0.003, 2); comp.uv_box(b, 1.0)
    L = "STAYRAEBX"[i]
    faces = [xf(comp.text(L, 0.032, depth=0.0006), T(0, -BS / 2 - 0.0003, BS / 2)), xf(xf(comp.text(L, 0.032, depth=0.0006), R(-90, "X")), T(0, 0, BS + 0.0003)),
             xf(xf(comp.text(L, 0.032, depth=0.0006), R(90, "Z")), T(BS / 2 + 0.0003, 0, BS / 2)), xf(xf(comp.text(L, 0.032, depth=0.0006), R(-90, "Z")), T(-BS / 2 - 0.0003, 0, BS / 2))]
    M(f"toys_block_{i + 1}_letter", xf(comp.merge(*faces), X), comp.mat(f"toys_ink_{i % 4}", _lib.srgb(INK[i % 4]), rough=0.5), parent=p)
    if lv == 2:
        top_block = p
# the toy car
car = comp.pivot(col, root, "toys_car", (0.2, -0.1, 0))
CX = T(0.2, -0.1, 0) @ R(-25, "Z")
body = comp.box((0.03, 0.075, 0.012), at=(0, 0, 0.011))
cab = comp.box((0.026, 0.034, 0.01), at=(0, 0.004, 0.022))
for v in cab.verts:
    if v.co.z > 0.022:
        v.co.y = 0.004 + (v.co.y - 0.004) * 0.7; v.co.x *= 0.85
bo = M("toys_car_body", xf(comp.merge(body, cab), CX), comp.mat("toys_car_paint", (0.5, 0.01, 0.01), rough=0.2, metal=0.4), parent=car)
comp.bevel(bo, 0.003, 3)
M("toys_car_glass", xf(comp.merge(comp.box((0.0235, 0.0005, 0.007), at=(0, -0.0085, 0.023)), comp.box((0.0235, 0.0005, 0.007), at=(0, 0.0165, 0.023))), CX), comp.mat("toys_car_glass", (0.1, 0.15, 0.2), rough=0.1), parent=car)
wheels = []
for sx in (-1, 1):
    for sy in (-0.024, 0.024):
        w = comp.pivot(col, root, f"toys_car_wheel_{len(wheels) + 1}", tuple(CX @ comp.Vector((sx * 0.0155, sy, 0.0065))), parent=car)
        w.rotation_euler[2] = math.radians(-25)
        bpy.context.view_layer.update()
        wo = M(f"toys_car_wheel_{len(wheels) + 1}_tyre", xf(comp.cyl(0.0065, 0.005, at=(sx * 0.0155 - 0.0025, sy, 0.0065), seg=14, axis="X"), CX), comp.mat("toys_tyre", (0.02, 0.02, 0.02), rough=0.7), parent=w)
        wheels.append(w)
# the ring stacker
SXY = (0.38, 0.22)
M("toys_stacker_post", comp.merge(comp.cyl(0.055, 0.012, at=(*SXY, 0), seg=28), comp.cyl(0.009, 0.16, at=(*SXY, 0.012), seg=12, r2=0.006)), comp.mat("toys_stacker_post", (0.95, 0.95, 0.9), rough=0.4), smooth=True)
RC = [(0.5, 0.15, 0.6), (0.1, 0.35, 0.8), (0.1, 0.6, 0.25), (0.95, 0.8, 0.1), (0.9, 0.3, 0.1)]
z = 0.012
for k in range(4):
    r = 0.048 - k * 0.007
    prof = [(r - 0.012 + 0.012 * math.cos(a), 0.013 + 0.013 * math.sin(a)) for a in [j * 2 * math.pi / 12 for j in range(13)]]
    M(f"toys_stacker_ring_{k + 1}", xf(_lib.turn(prof, seg=24), T(*SXY, z)), comp.mat(f"toys_ring_{k + 1}", _lib.srgb(RC[k]), rough=0.3), smooth=True)
    z += 0.026
M("toys_stacker_ring_5", xf(xf(_lib.turn([(0.02 - 0.012 + 0.012 * math.cos(a), 0.013 + 0.013 * math.sin(a)) for a in [j * 2 * math.pi / 12 for j in range(13)]], seg=24), R(74, "X")), T(0.26, 0.3, 0.02)), comp.mat("toys_ring_5", _lib.srgb(RC[4]), rough=0.3), smooth=True)
# the ball
ball = comp.pivot(col, root, "toys_ball", (0.0, 0.32, 0.075))
roll = comp.pivot(col, root, "toys_ball_roll", (0.0, 0.32, 0.075), parent=ball)
import numpy as np
bp = _lib.canvas(256, 128, (0.85, 0.1, 0.1))
X_, Y_ = _lib.grid_xy(bp)
_lib.put(bp, np.abs(Y_ - 0.5) < 0.09, (0.96, 0.95, 0.9)); _lib.put(bp, np.abs(Y_ - 0.5) < 0.035, (0.1, 0.25, 0.7))
_lib.put(bp, (Y_ < 0.25) & ((X_ * 8) % 1 < 0.5), (0.95, 0.75, 0.1))
M("toys_ball_mesh", xf(_lib.uv_sphere(0.075, seg=32, rings=16), T(0.0, 0.32, 0.075) @ R(35, "X")), _lib.image_mat("toys_ball", _lib.save_image("toy_ball", bp), rough=0.3), parent=roll, smooth=True)
# the yo-yo and marbles
yy = [(0.0, 0.0), (0.02, 0.0), (0.028, 0.004), (0.028, 0.012), (0.006, 0.016), (0.006, 0.019), (0.028, 0.023), (0.028, 0.031), (0.02, 0.035), (0.0, 0.035)]
M("toys_yoyo", xf(_lib.turn(yy, seg=28), T(-0.05, -0.2, 0)), comp.mat("toys_yoyo", (0.1, 0.7, 0.75), rough=0.25), smooth=True)
M("toys_yoyo_string", comp.tube([(-0.05 + 0.007, -0.2, 0.0175), (0.0, -0.17, 0.003), (0.06, -0.21, 0.002), (0.1, -0.15, 0.002), (0.07, -0.1, 0.002), (0.12, -0.08, 0.002)], 0.0008, res=10, sides=2), comp.mat("toys_string", (0.92, 0.9, 0.85), rough=0.8))
for k, (mx, my, c) in enumerate(((0.3, -0.25, (0.1, 0.4, 0.8)), (0.33, -0.22, (0.8, 0.2, 0.1)), (0.27, -0.2, (0.2, 0.7, 0.3)), (0.42, -0.3, (0.9, 0.8, 0.2)))):
    M(f"toys_marble_{k + 1}", xf(_lib.uv_sphere(0.008, seg=12, rings=8), T(mx, my, 0.008)), comp.mat(f"toys_marble_{k + 1}", _lib.srgb(c), rough=0.05), smooth=True)
# the duck
duck, credit = _lib.ph_add(col, root, "rubber_duck_toy", "toys_duck", X=T(-0.45, -0.22, 0) @ R(40, "Z"), scale=0.5)
d = comp.Vector((math.sin(math.radians(25)), -math.cos(math.radians(25)), 0))   # the car's nose: its local -y, turned -25 degrees
_lib.channel("car", [(car, "location", 0, car.location.x, car.location.x + d.x * 0.35), (car, "location", 1, car.location.y, car.location.y + d.y * 0.35)])
comp.channel("car", [(w, "rotation_euler", 0, 0, -0.35 / 0.0065) for w in wheels])
comp.channel("ball", [(ball, "location", 0, ball.location.x, ball.location.x + 0.3)])
comp.channel("ball", [(roll, "rotation_euler", 1, 0, 0.3 / 0.075)])
_lib.channel("blocks", [(top_block, "location", 0, top_block.location.x, top_block.location.x + 0.06), (top_block, "rotation_euler", 1, 0, math.radians(90)), (top_block, "location", 2, top_block.location.z, top_block.location.z - 0.03)])
comp.export(col, root, _lib.PLACE, "toys", made="blender/components/bedroom/toys.py",
            source="own geometry; the duck: https://polyhaven.com/a/rubber_duck_toy; blocks: https://polyhaven.com/a/plywood", license="ours; the duck and texture CC0", credit=f"Poly Haven ({credit}: rubber_duck_toy; plywood)",
            rig={"car": "the toy car rolls 0.35 m forward along its nose, its four wheels turning with it", "ball": "the ball rolls 0.3 m toward +x, turning with it",
                 "blocks": "the stack's top block slides off and tips over 90 degrees"})
