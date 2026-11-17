# bedroom/shelves: two wall shelves and what a ten-year-old keeps on them, modelled by hand: pine boards 1.0 x 0.2 m
# on white steel brackets, 0.36 m apart; on the lower one a row of sixteen books between a pair of bookends, a
# puzzle cube and a stack of cassette tapes; on the upper one a gold cup trophy on a marble base, a tin robot with a
# wind-up key, a snow globe, a framed photo and a toy rocket. The origin is the lower board's top at the wall (y 0).
# Rig: "key" turns the robot's wind-up key one whole turn and "robot" lifts its arms 50 degrees; "cube" turns the
# puzzle cube's top layer a quarter turn.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from comp import T, R, S, xf
col, root = comp.fresh("shelves")
M = _lib.maker(col, root)
rnd = random.Random(10)
pine = comp.ph_texture("shelves_pine", "stained_pine", tile=0.9, res="1k")
white = comp.mat("shelves_bracket", (0.9, 0.9, 0.88), rough=0.4)
gold = comp.mat("shelves_gold", (0.9, 0.68, 0.22), rough=0.18, metal=1.0)
W, D, GAP = 1.0, 0.2, 0.36
for i, z in enumerate((0.0, GAP)):
    b = M(f"shelves_board_{i + 1}", comp.box((W, D, 0.02), at=(0, -D / 2, z - 0.01)), pine)
    comp.bevel(b, 0.003, 2); comp.uv_box(b, 1.0)
    br = [comp.merge(comp.box((0.025, 0.004, 0.16), at=(x, -0.002, z - 0.1)), comp.box((0.025, D - 0.03, 0.004), at=(x, -(D - 0.03) / 2, z - 0.022)), comp.taper((x, -0.004, z - 0.16), (x, -D + 0.04, z - 0.026), 0.004, 0.004, 0.012, 0.012)) for x in (-0.36, 0.36)]
    M(f"shelves_brackets_{i + 1}", comp.merge(*br), white)
# books on the lower shelf
BC = [(0.7, 0.1, 0.1), (0.1, 0.3, 0.6), (0.9, 0.7, 0.1), (0.15, 0.45, 0.2), (0.85, 0.85, 0.8), (0.5, 0.2, 0.5), (0.9, 0.4, 0.1), (0.1, 0.1, 0.12), (0.2, 0.6, 0.7)]
x = -0.4
for i in range(16):
    t, h, d = rnd.uniform(0.014, 0.036), rnd.uniform(0.17, 0.24), rnd.uniform(0.12, 0.16)
    lean = 0 if i < 13 else 9
    c = _lib.srgb(BC[rnd.randrange(len(BC))])
    cover = comp.merge(comp.box((0.0025, d, h), at=(-t / 2 + 0.00125, 0, h / 2)), comp.box((0.0025, d, h), at=(t / 2 - 0.00125, 0, h / 2)), comp.box((t, 0.003, h), at=(0, -d / 2 + 0.0015, h / 2)))
    pages = comp.box((t - 0.005, d - 0.008, h - 0.008), at=(0, 0.002, h / 2))
    band = comp.merge(comp.box((t + 0.0004, 0.0006, 0.014), at=(0, -d / 2 - 0.0002, h * 0.78)), comp.box((t + 0.0004, 0.0006, 0.006), at=(0, -d / 2 - 0.0002, h * 0.2)))
    X = T(x + t / 2 + (0.012 if lean else 0), -d / 2 - 0.02, 0) @ R(-lean, "Y")
    M(f"shelves_book_{i + 1:02d}", xf(cover, X), comp.mat(f"shelves_book_{i + 1:02d}", c, rough=0.55))
    M(f"shelves_book_{i + 1:02d}_pages", xf(pages, X), comp.mat("shelves_pages", (0.9, 0.87, 0.78), rough=0.8))
    M(f"shelves_book_{i + 1:02d}_band", xf(band, X), comp.mat("shelves_band", (0.92, 0.85, 0.5), rough=0.4, metal=0.6))
    x += t + 0.001
ends = [comp.merge(comp.box((0.004, 0.1, 0.13), at=(ex, -0.09, 0.065)), comp.box((0.07, 0.1, 0.004), at=(ex + s * 0.035, -0.09, 0.002))) for ex, s in ((-0.404, 1), (x + 0.022, -1))]
M("shelves_bookends", comp.merge(*ends), comp.mat("shelves_bookend", (0.1, 0.1, 0.5), rough=0.35))
# the puzzle cube: 27 cubies' worth of stickers on a black cube, the top layer its own part
CX, CS = x + 0.1, 0.057
FC = {"+x": (0.8, 0.05, 0.05), "-x": (0.95, 0.45, 0.05), "+y": (0.05, 0.25, 0.7), "-y": (0.05, 0.55, 0.2), "+z": (0.95, 0.95, 0.9), "-z": (0.95, 0.85, 0.1)}
cube_top = comp.pivot(col, root, "shelves_cube_top", (CX, -0.09, CS))
blk = comp.mat("shelves_cube", (0.02, 0.02, 0.02), rough=0.35)
XC = T(CX, -0.09, 0) @ R(20, "Z")
for layer, parent in ((0, None), (1, None), (2, cube_top)):
    cubies, stick = [], {k: [] for k in FC}
    for ix in range(3):
        for iy in range(3):
            c = (-CS / 3 + ix * CS / 3, -CS / 3 + iy * CS / 3, CS / 6 + layer * CS / 3)
            cubies.append(comp.box((CS / 3 - 0.0006,) * 3, at=c))
            s = CS / 3 - 0.004
            if ix == 2: stick["+x"].append(comp.box((0.0004, s, s), at=(c[0] + CS / 6, c[1], c[2])))
            if ix == 0: stick["-x"].append(comp.box((0.0004, s, s), at=(c[0] - CS / 6, c[1], c[2])))
            if iy == 2: stick["+y"].append(comp.box((s, 0.0004, s), at=(c[0], c[1] + CS / 6, c[2])))
            if iy == 0: stick["-y"].append(comp.box((s, 0.0004, s), at=(c[0], c[1] - CS / 6, c[2])))
            if layer == 2: stick["+z"].append(comp.box((s, s, 0.0004), at=(c[0], c[1], c[2] + CS / 6)))
    o = M(f"shelves_cube_layer_{layer + 1}", xf(comp.merge(*cubies), XC), blk, parent=parent)
    comp.bevel(o, 0.0015, 2)
    for k, lst in stick.items():
        if lst:
            # a scrambled cube: the stickers' colours shuffled by layer
            cc = list(FC.values())[(list(FC).index(k) + layer * 2) % 6]
            M(f"shelves_cube_layer_{layer + 1}_{'pn'[k[0] == '-']}{k[1]}", xf(comp.merge(*lst), XC), comp.mat(f"shelves_cube_{list(FC.values()).index(cc)}", _lib.srgb(cc), rough=0.4), parent=parent)
# cassette tapes, stacked
tapes = []
for i in range(5):
    cs = comp.box((0.109, 0.07, 0.016), at=(0, 0, 0.008 + i * 0.0165))
    tapes.append(xf(cs, T(0.39, -0.09, 0) @ R(rnd.uniform(-12, 12), "Z")))
tp = M("shelves_tapes", comp.merge(*tapes), comp.mat("shelves_tape", (0.75, 0.78, 0.8), rough=0.2, alpha=0.75))
M("shelves_tape_labels", comp.merge(*[comp.box((0.09, 0.0006, 0.009), at=(0.39, -0.126, 0.008 + i * 0.0165)) for i in range(5)]), comp.mat("shelves_tape_label", (0.95, 0.9, 0.75), rough=0.6))
# --- the upper shelf --------------------------------------------------------------------------------------------
Z = GAP
marble = comp.ph_texture("shelves_marble", "marble_01", tile=0.3, res="1k")
tb = M("shelves_trophy_base", comp.merge(comp.box((0.09, 0.09, 0.03), at=(-0.36, -0.1, Z + 0.015)), comp.box((0.07, 0.07, 0.03), at=(-0.36, -0.1, Z + 0.045))), marble)
comp.bevel(tb, 0.002, 2); comp.uv_box(tb, 1.0)
cup = [(0.0, 0.0), (0.028, 0.0), (0.03, 0.006), (0.012, 0.014), (0.007, 0.03), (0.007, 0.05), (0.014, 0.058), (0.03, 0.07), (0.042, 0.095), (0.047, 0.13), (0.05, 0.15), (0.047, 0.15), (0.043, 0.13), (0.03, 0.08), (0.0, 0.072)]
M("shelves_trophy", comp.merge(xf(_lib.turn(cup, seg=28), T(-0.36, -0.1, Z + 0.06)), *[comp.tube([(-0.36 + s * 0.045, -0.1, Z + 0.2), (-0.36 + s * 0.075, -0.1, Z + 0.19), (-0.36 + s * 0.07, -0.1, Z + 0.15), (-0.36 + s * 0.035, -0.1, Z + 0.135)], 0.004) for s in (-1, 1)]), gold, smooth=True)
M("shelves_trophy_plate", comp.merge(comp.box((0.05, 0.0008, 0.018), at=(-0.36, -0.1455, Z + 0.016)), ), gold)
M("shelves_trophy_text", xf(comp.text("1ST PLACE", 0.007, depth=0.0005), T(-0.36, -0.1462, Z + 0.016)), comp.mat("shelves_engraving", (0.1, 0.08, 0.03), rough=0.5))
# the tin robot
RX = -0.12
tin = comp.mat("shelves_robot", (0.03, 0.16, 0.5), rough=0.3, metal=0.7)
tin2 = comp.mat("shelves_robot_red", (0.55, 0.02, 0.01), rough=0.35, metal=0.5)
rb = M("shelves_robot_body", comp.merge(comp.box((0.07, 0.045, 0.075), at=(RX, -0.1, Z + 0.0875)), comp.box((0.05, 0.04, 0.045), at=(RX, -0.1, Z + 0.152)), *[comp.box((0.026, 0.04, 0.05), at=(RX + s * 0.02, -0.1, Z + 0.025)) for s in (-1, 1)], *[comp.box((0.03, 0.055, 0.012), at=(RX + s * 0.02, -0.105, Z + 0.006)) for s in (-1, 1)]), tin)
comp.bevel(rb, 0.003, 2)
M("shelves_robot_face", comp.merge(*[comp.cyl(0.007, 0.003, at=(RX + s * 0.012, -0.123, Z + 0.158), seg=12, axis="Y") for s in (-1, 1)], comp.box((0.026, 0.002, 0.005), at=(RX, -0.121, Z + 0.14)), comp.box((0.04, 0.002, 0.03), at=(RX, -0.1235, Z + 0.09)), comp.cyl(0.003, 0.02, at=(RX, -0.1, Z + 0.174), seg=8), comp.cyl(0.006, 0.006, at=(RX, -0.1, Z + 0.194), seg=10)), tin2)
arms = comp.pivot(col, root, "shelves_robot_arms", (RX, -0.1, Z + 0.115))
ao = M("shelves_robot_arms_mesh", comp.merge(*[comp.merge(comp.box((0.014, 0.018, 0.06), at=(RX + s * 0.043, -0.1, Z + 0.09)), comp.box((0.016, 0.022, 0.014), at=(RX + s * 0.043, -0.1, Z + 0.056))) for s in (-1, 1)]), tin2, parent=arms)
comp.bevel(ao, 0.002, 2)
keyp = comp.pivot(col, root, "shelves_robot_key", (RX, -0.075, Z + 0.09))
M("shelves_robot_key_mesh", comp.merge(comp.cyl(0.0025, 0.02, at=(RX, -0.0775, Z + 0.09), seg=8, axis="Y"), comp.box((0.03, 0.003, 0.016), at=(RX, -0.056, Z + 0.09))), gold, parent=keyp)
# the snow globe
SX = 0.08
M("shelves_snowglobe_base", xf(_lib.turn([(0.0, 0), (0.04, 0), (0.042, 0.006), (0.036, 0.02), (0.03, 0.026), (0.0, 0.026)], z0=Z, seg=28), T(SX, -0.1, 0)), comp.mat("shelves_snowglobe_base", (0.5, 0.1, 0.1), rough=0.35), smooth=True)
M("shelves_snowglobe_tree", xf(comp.merge(comp.cyl(0.018, 0.035, at=(0, 0, 0.026), seg=10, r2=0.0), comp.cyl(0.013, 0.025, at=(0, 0, 0.046), seg=10, r2=0.0), comp.cyl(0.02, 0.004, at=(0, 0, 0.024), seg=12)), T(SX, -0.1, Z)), comp.mat("shelves_snowglobe_tree", (0.1, 0.4, 0.15), rough=0.6))
sg = _lib.uv_sphere(0.04, seg=24, rings=12)
M("shelves_snowglobe_glass", xf(sg, T(SX, -0.1, Z + 0.055)), comp.mat("shelves_snowglobe_glass", (0.85, 0.93, 0.98), rough=0.03, alpha=0.18), smooth=True)
# the framed photo, leaning on the wall
fr = comp.merge(comp.box((0.15, 0.012, 0.11), at=(0, 0, 0.055)))
fo = M("shelves_frame", xf(fr, T(0.27, -0.03, Z) @ R(-12, "X")), comp.mat("shelves_frame", (0.12, 0.08, 0.05), rough=0.4))
comp.bevel(fo, 0.003, 2)
import numpy as np
ph = _lib.gradient(_lib.canvas(128, 96), (0.5, 0.75, 0.95), (0.85, 0.9, 0.7))
_lib.rect(ph, 0, 0.7, 1, 1, (0.3, 0.6, 0.25)); _lib.disc(ph, 0.75, 0.25, 0.1, (1, 0.95, 0.6)); _lib.poly(ph, [(0.1, 0.7), (0.35, 0.3), (0.6, 0.7)], (0.45, 0.45, 0.5)); _lib.poly(ph, [(0.27, 0.42), (0.35, 0.3), (0.43, 0.42)], (0.95, 0.95, 0.95))
M("shelves_photo", xf(_lib.panel(0.125, 0.085), T(0.27, -0.03, Z) @ R(-12, "X") @ T(0, -0.0065, 0.055)), _lib.image_mat("shelves_photo", _lib.save_image("shelf_photo", ph), rough=0.25))
# the toy rocket
rk = _lib.turn([(0.0, 0.0), (0.014, 0.0), (0.02, 0.02), (0.022, 0.07), (0.018, 0.11), (0.008, 0.14), (0.0, 0.15)], seg=20)
M("shelves_rocket", xf(rk, T(0.42, -0.1, Z + 0.02)), comp.mat("shelves_rocket", (0.92, 0.92, 0.9), rough=0.3), smooth=True)
M("shelves_rocket_fins", comp.merge(*[xf(xf(comp.taper((0.014, 0, 0.06), (0.045, 0, 0.0), 0.003, 0.003, 0.05, 0.02), R(a, "Z")), T(0.42, -0.1, Z)) for a in (0, 120, 240)], xf(comp.cyl(0.0225, 0.012, seg=20), T(0.42, -0.1, Z + 0.1))), comp.mat("shelves_rocket_red", (0.8, 0.1, 0.08), rough=0.35))
comp.channel("key", [(keyp, "rotation_euler", 1, 0, 2 * math.pi)])
comp.channel("robot", [(arms, "rotation_euler", 0, 0, math.radians(50))])
comp.channel("cube", [(cube_top, "rotation_euler", 2, 0, math.pi / 2)])
comp.export(col, root, _lib.PLACE, "shelves", made="blender/components/bedroom/shelves.py",
            source="own geometry; textures: https://polyhaven.com/a/stained_pine, https://polyhaven.com/a/marble_01", license="ours; textures CC0", credit="Poly Haven (stained_pine, marble_01)",
            rig={"key": "the tin robot's wind-up key one whole turn", "robot": "the robot's arms lift 50 degrees forward", "cube": "the puzzle cube's top layer a quarter turn"},
            notes="origin = the lower board's top at the wall; the upper board is 0.36 m above it")
