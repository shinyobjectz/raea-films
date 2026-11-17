# diner/coffee-cup: the montage's circle (board/chain.ts: "the coffee cup from above ... the cream turns"). A heavy
# white diner cup with a green band under its rim, on its saucer, a teaspoon on the saucer, black coffee with cream
# poured in and half stirred. Modelled by hand, real size: the saucer 15 cm, the cup 9.3 cm across and 6.9 cm tall.
# The origin is the saucer's centre on the counter; the cup's axis is the origin's, so a top shot centres on it.
# Rig: "swirl" turns the coffee's surface (the cream's spiral) one whole turn about the cup's axis, anticlockwise from
# above; "lift" raises the cup 12 cm off the saucer; "spoon" slides the teaspoon round the saucer's rim a quarter turn.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, sphere, T, R, S, xf
import numpy as np

col, root = comp.fresh("coffee_cup")
M = _lib.maker(col, root)
china = comp.mat("cup_china", (0.86, 0.85, 0.8), rough=0.16)
band = comp.mat("cup_band", (0.02, 0.2, 0.09), rough=0.2)
steel = comp.mat("cup_spoon", (0.86, 0.86, 0.88), rough=0.3, metal=1.0)


def swirl(u, v):
    x, y = u * 2 - 1, v * 2 - 1
    r = np.sqrt(x * x + y * y) + 1e-6
    th = np.arctan2(y, x)
    rng = np.random.default_rng(7)
    # two arms of cream winding out from the middle, feathered, broken by a slow wobble
    wob = 0.35 * np.sin(3 * th + 9 * r) + 0.2 * np.sin(7 * th - 5 * r + 1.3)
    arm = np.sin(2 * th - 11.0 * np.sqrt(r) + wob)
    cream = np.clip((arm - 0.15) / 0.55, 0, 1) ** 1.3
    cream *= np.clip(1.15 - r, 0, 1) ** 0.6
    cream = np.maximum(cream, np.exp(-(r / 0.16) ** 2))          # the pool where it was poured
    fine = 0.5 + 0.5 * np.sin(6 * th - 40 * r + 2 * wob)           # finer marbling inside the arms
    cream = np.clip(cream * (0.72 + 0.28 * fine), 0, 1)
    coffee = np.array([0.16, 0.075, 0.03])
    milk = np.array([0.93, 0.82, 0.64])
    rgb = coffee[None, None, :] * (1 - cream[..., None]) + milk[None, None, :] * cream[..., None]
    rgb *= (1 - 0.35 * np.clip((r - 0.86) / 0.14, 0, 1))[..., None]  # the dark ring at the china
    rgb += rng.normal(0, 0.006, rgb.shape)
    return rgb


surface = _lib.image_mat("coffee_cream", _lib.paint("coffee_cream", 1024, 1024, swirl), rough=0.06)

# --- the saucer ------------------------------------------------------------------------------------------------------
sauc = [(0, 0.003), (0.033, 0.003), (0.034, 0.0), (0.038, 0.0), (0.0395, 0.004), (0.052, 0.0075), (0.064, 0.0115), (0.0735, 0.016),
        (0.0752, 0.0178), (0.0745, 0.0192), (0.0725, 0.0188), (0.063, 0.0145), (0.05, 0.0105), (0.037, 0.0078), (0.034, 0.0068), (0.0315, 0.0062), (0, 0.0062)]
M("coffee_cup_saucer", lathe(sauc, seg=72), china)
M("coffee_cup_saucer_band", lathe([(0.0705, 0.01795), (0.0722, 0.0188), (0.0722, 0.0191), (0.0705, 0.0182)], seg=72), band)

# --- the cup, on its own pivot (the lift) ----------------------------------------------------------------------------
Z0 = 0.0062
up = comp.pivot(col, root, "coffee_cup_lift", (0, 0, Z0))
prof = [(0, 0.0035), (0.0235, 0.0035), (0.025, 0.0), (0.0295, 0.0), (0.031, 0.005), (0.0355, 0.011), (0.0405, 0.022), (0.0435, 0.036), (0.0452, 0.05),
        (0.0462, 0.062), (0.0466, 0.0665), (0.0458, 0.0686), (0.0442, 0.069), (0.0428, 0.0678), (0.0418, 0.062), (0.0405, 0.048), (0.038, 0.032), (0.033, 0.019),
        (0.025, 0.0125), (0.012, 0.0105), (0, 0.0102)]
M("coffee_cup_body", lathe(prof, seg=72, at=(0, 0, Z0)), china, parent=up)
M("coffee_cup_band", lathe([(0.04605, 0.0585), (0.0464, 0.0585), (0.04672, 0.0625), (0.0463, 0.0625)], seg=72, at=(0, 0, Z0)), band, parent=up)
# the handle: an ear of china, thicker where it joins
h = comp.tube([(0.042, 0, 0.056), (0.058, 0, 0.0595), (0.069, 0, 0.049), (0.069, 0, 0.035), (0.058, 0, 0.022), (0.039, 0, 0.0195)], 0.0048, res=10, sides=4)
xf(h, S(1, 1.25, 1))
xf(h, T(0, 0, Z0))
xf(h, R(-35, "Z"))
M("coffee_cup_handle", h, china, parent=up)
# the coffee: its surface is the swirl's own part, on the axis
swirl_p = comp.pivot(col, root, "coffee_cup_swirl", (0, 0, Z0 + 0.0565), parent=up)
RS = 0.0412
disc = lathe([(0, 0), (RS * 0.25, 0), (RS * 0.5, 0), (RS * 0.75, 0), (RS * 0.97, 0.0002), (RS, 0.0009)], seg=72, at=(0, 0, Z0 + 0.0565))
so = M("coffee_cup_coffee", disc, surface, parent=swirl_p)
_lib.uv_planar(so, (-RS, -RS), (RS, RS))

# --- the teaspoon on the saucer --------------------------------------------------------------------------------------
sp = comp.pivot(col, root, "coffee_cup_spoon", (0, 0, 0))
bowl = sphere(1.0, seg=24, rings=12, scale=(0.0105, 0.0155, 0.0032))
for v in bowl.verts:
    if v.co.z > 0:
        v.co.z *= -0.35  # hollow it
neck = comp.taper((0, 0.013, 0.0005), (0, 0.045, 0.004), 0.004, 0.0035, 0.0016, 0.0016)
grip = comp.taper((0, 0.045, 0.004), (0, 0.115, 0.0028), 0.0035, 0.009, 0.0016, 0.0016)
spoon = comp.merge(bowl, neck, grip)
xf(spoon, T(0, -0.05, 0))            # its middle over the origin
xf(spoon, R(90, "Z"))                 # along x, the bowl to the right
xf(spoon, T(0.0, -0.056, 0.0192))     # across the saucer's front, resting on its rim
xf(spoon, R(-24, "Z"))
s = M("coffee_cup_spoon_mesh", spoon, steel, parent=sp)
comp.bevel(s, 0.0006, 2, angle=40)

comp.channel("swirl", [(swirl_p, "rotation_euler", 2, 0, 2 * math.pi)])
comp.channel("lift", [(up, "location", 2, up.location.z, up.location.z + 0.12)])
comp.channel("spoon", [(sp, "rotation_euler", 2, 0, math.pi / 2)])
comp.export(col, root, "diner", "coffee_cup", made="blender/components/diner/coffee_cup.py",
            source="own geometry (a generic heavy diner cup, saucer and teaspoon); the cream's swirl is painted by the script", license="ours", credit="",
            rig={"swirl": "the coffee's surface (coffee_cup_coffee, material coffee_cream) one whole turn about the cup's axis, anticlockwise from above: the cream turning",
                 "lift": "the cup, its handle and its coffee 12 cm up off the saucer",
                 "spoon": "the teaspoon a quarter turn round the saucer's rim",
                 "position": "the Model's own position in the scene (on the counter, 1.0 m up)"},
            notes="the montage's circle: shot from straight above, the origin is the circle's centre and the saucer's rim (15 cm) its edge")
