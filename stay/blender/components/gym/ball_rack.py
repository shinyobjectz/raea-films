# gym/ball-rack: a ball cart on four casters, modelled by hand: a chromed steel tube frame, two tiers of twin rails, and
# nine basketballs on it (five below, four above), each turned its own way. 1.3 m long, 1.0 m tall.
# Rig: "take" lifts the upper tier's left ball 45 cm up and out toward the front; "roll" rolls the cart 1.2 m along its
# length.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rod, pipe, fillet, T, R, S, xf, BALL_R

col, root = comp.fresh("ball_rack")
M = _lib.maker(col, root)
chrome = comp.mat("rack_chrome", (0.8, 0.8, 0.82), rough=0.2, metal=1.0)
rubber = comp.mat("rack_casters", (0.02, 0.02, 0.02), rough=0.7)
L, Wd = 1.3, 0.3
cart = comp.pivot(col, root, "ball_rack_cart", (0, 0, 0))
tubes = []
for sx in (-1, 1):   # the two end hoops
    tubes.append(pipe(fillet([(sx * L / 2, -Wd / 2, 0.09), (sx * L / 2, -Wd / 2, 1.0), (sx * L / 2, Wd / 2, 1.0), (sx * L / 2, Wd / 2, 0.09)], 0.06), 0.0125, sides=3))
    tubes.append(rod((sx * L / 2, -Wd / 2, 0.12), (sx * L / 2, Wd / 2, 0.12), 0.0125))
TIER = (0.3, 0.72)
for z in TIER:
    for sy in (-1, 1):
        tubes.append(rod((-L / 2, sy * 0.085, z), (L / 2, sy * 0.085, z), 0.01))
    for sx in (-1, 1):
        tubes.append(rod((sx * L / 2, -Wd / 2, z), (sx * L / 2, Wd / 2, z), 0.01))
tubes.append(rod((-L / 2, 0, 0.12), (L / 2, 0, 0.12), 0.0125))
M("ball_rack_frame", comp.merge(*tubes), chrome, parent=cart)
cs = []
for sx in (-1, 1):
    for sy in (-1, 1):
        cs.append(comp.cyl(0.04, 0.025, at=(sx * L / 2 - 0.0125, sy * Wd / 2, 0.04), seg=16, axis="X"))
M("ball_rack_casters", comp.merge(*cs), rubber, parent=cart)
M("ball_rack_forks", comp.merge(*[comp.box((0.035, 0.012, 0.06), at=(sx * L / 2, sy * Wd / 2, 0.07)) for sx in (-1, 1) for sy in (-1, 1)]), chrome, parent=cart, smooth=False)
rnd = random.Random(11)
mat = _lib.ball_mat()
dz = math.sqrt(BALL_R ** 2 - 0.085 ** 2)     # a ball's centre above the rails it sits between
balls = []
for t, (z, n) in enumerate(zip(TIER, (5, 4))):
    for i in range(n):
        x = (i - (n - 1) / 2) * 0.245
        at = (x, 0, z + 0.01 + dz)
        if t == 1 and i == 0:
            take = comp.pivot(col, root, "ball_rack_take", at, parent=cart)
            M("ball_rack_ball_taken", _lib.ball_bm(at=at, turn=[rnd.uniform(0, 6.28) for _ in range(3)]), mat, parent=take)
        else:
            balls.append(_lib.ball_bm(at=at, turn=[rnd.uniform(0, 6.28) for _ in range(3)]))
M("ball_rack_balls", comp.merge(*balls), mat, parent=cart)
comp.channel("take", [(take, "location", 2, take.location.z, take.location.z + 0.45)])
comp.channel("roll", [(cart, "location", 0, 0, 1.2)])
comp.export(col, root, "gym", "ball_rack", made="blender/components/gym/ball_rack.py",
            source="own geometry (a generic ball cart and nine basketballs)", license="ours", credit="",
            rig={"take": "the upper tier's left ball 45 cm straight up out of the rack", "roll": "the cart and its balls 1.2 m along its length"})
