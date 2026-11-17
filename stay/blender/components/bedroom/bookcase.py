# bedroom/bookcase: the low bookcase by the door that the fish tank stands on, modelled by hand, 1.40 x 0.36 m and
# 0.80 m high: a white melamine carcass with a pine top, a plinth, a fixed middle shelf and an upright, its bays full:
# comics in a slumped row, big picture books lying flat, four board-game boxes stacked (made-up games), a shoebox of
# trading cards with its lid off, a wicker basket of building bricks, a football boot box and a row of video tapes
# with hand-written spines. Rig: "tape" pulls one video tape 9 cm out of its row (the cursor's pick); "lid" slides
# the top game box's lid 8 cm askew.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from comp import T, R, xf
col, root = comp.fresh("bookcase")
M = _lib.maker(col, root)
rnd = random.Random(21)
W, D, H = 1.4, 0.36, 0.8
white = comp.mat("bookcase_melamine", (0.86, 0.85, 0.8), rough=0.45)
pine = comp.ph_texture("bookcase_top", "stained_pine", tile=0.9, res="1k")
card = comp.mat("bookcase_card", (0.62, 0.5, 0.36), rough=0.8)
top = M("bookcase_top", comp.box((W + 0.02, D + 0.015, 0.022), at=(0, -0.0075, H - 0.011)), pine)
comp.bevel(top, 0.004, 2); comp.uv_box(top, 1.0)
MID = 0.42
carc = [comp.box((0.018, D, H - 0.022), at=(s * (W / 2 - 0.009), 0, (H - 0.022) / 2)) for s in (-1, 1)] + [
    comp.box((W - 0.036, D - 0.01, 0.018), at=(0, 0.005, 0.069)), comp.box((W - 0.036, D - 0.01, 0.018), at=(0, 0.005, MID)), comp.box((0.018, D - 0.01, H - 0.1), at=(0.1, 0.005, 0.06 + (H - 0.1) / 2)),
    comp.box((W - 0.036, 0.006, H - 0.08), at=(0, D / 2 - 0.003, 0.06 + (H - 0.08) / 2)), comp.box((W - 0.036, 0.016, 0.06), at=(0, -D / 2 + 0.03, 0.03))]
c = M("bookcase_carcass", comp.merge(*carc), white)
comp.bevel(c, 0.0015, 2)
Y0 = -D / 2 + 0.02     # the front of what stands on a shelf
LO, UP = 0.078, MID + 0.009
# upper left bay: comics, slumped
x = -W / 2 + 0.03
CC = [(0.85, 0.15, 0.1), (0.98, 0.85, 0.2), (0.15, 0.35, 0.8), (0.95, 0.5, 0.1), (0.2, 0.65, 0.35), (0.9, 0.9, 0.85), (0.55, 0.2, 0.6)]
i = 0
while x < -0.25:
    t = rnd.uniform(0.003, 0.007)
    lean = min(16, 3 + i * 0.5) if x > -0.42 else rnd.uniform(0, 3)
    b = comp.box((t, 0.17, 0.258), at=(t / 2, 0, 0.129))
    M(f"bookcase_comic_{i + 1:02d}", xf(b, T(x, Y0 + 0.1, UP) @ R(lean, "Y")), comp.mat(f"bookcase_comic_{i % 7}", _lib.srgb(CC[i % 7]), rough=0.45))
    x += t + 0.0008 + (0.0012 * lean / 16)
    i += 1
# picture books lying flat in a pile
z = UP
for k in range(6):
    w, d, t = rnd.uniform(0.22, 0.3), rnd.uniform(0.2, 0.26), rnd.uniform(0.008, 0.02)
    b = M(f"bookcase_picturebook_{k + 1}", xf(comp.box((w, d, t), at=(0, 0, t / 2)), T(-0.08, Y0 + 0.14, z) @ R(rnd.uniform(-8, 8), "Z")), comp.mat(f"bookcase_picturebook_{k + 1}", _lib.srgb(CC[(k * 3 + 1) % 7]), rough=0.4))
    comp.bevel(b, 0.0015, 1)
    z += t + 0.0005
# upper right bay: board games stacked, a cards shoebox
GAMES = [("MOUSE MAZE", (0.8, 0.15, 0.12), 0.4, 0.27, 0.06), ("SPACE RACE", (0.1, 0.15, 0.5), 0.38, 0.26, 0.05), ("WORD STORM", (0.95, 0.75, 0.1), 0.36, 0.25, 0.045), ("TREASURE BAY", (0.1, 0.5, 0.45), 0.3, 0.24, 0.05)]
z = UP
lid = None
for k, (name, cl, w, d, h) in enumerate(GAMES):
    a = rnd.uniform(-5, 5)
    X = T(0.42, Y0 + 0.15, z) @ R(a, "Z")
    p = comp.pivot(col, root, f"bookcase_game_{k + 1}", (0.42, Y0 + 0.15, z))
    b = M(f"bookcase_game_{k + 1}_box", xf(comp.box((w, d, h), at=(0, 0, h / 2)), X), comp.mat(f"bookcase_game_{k + 1}", _lib.srgb(cl), rough=0.45), parent=p)
    comp.bevel(b, 0.002, 1)
    M(f"bookcase_game_{k + 1}_title", xf(comp.merge(xf(comp.text(name, 0.026, depth=0.0006), T(0, -d / 2 - 0.0006, h / 2)), xf(comp.box((w - 0.02, 0.0004, 0.006)), T(0, -d / 2 - 0.0003, h / 2 - 0.02))), X), comp.mat("bookcase_game_ink", (0.96, 0.95, 0.9), rough=0.5), parent=p)
    z += h + 0.001
    lid = p
sb = comp.merge(comp.box((0.2, 0.3, 0.004), at=(0, 0, 0.002)), comp.box((0.004, 0.3, 0.1), at=(-0.098, 0, 0.05)), comp.box((0.004, 0.3, 0.1), at=(0.098, 0, 0.05)), comp.box((0.2, 0.004, 0.1), at=(0, -0.148, 0.05)), comp.box((0.2, 0.004, 0.1), at=(0, 0.148, 0.05)))
M("bookcase_cardbox", xf(sb, T(0.21, Y0 + 0.16, UP)), card)
cards = [xf(comp.box((0.063, 0.0008, 0.088), at=(0, 0, 0.044)), T(0.21 + rnd.uniform(-0.05, 0.05), Y0 + 0.03 + j * 0.0055, UP + 0.006) @ R(rnd.uniform(-12, 12), "X")) for j in range(46)]
M("bookcase_cards", comp.merge(*cards), comp.mat("bookcase_cards", (0.9, 0.85, 0.6), rough=0.4))
M("bookcase_card_tops", comp.merge(*[xf(comp.box((0.063, 0.001, 0.02), at=(0, -0.0002, 0.076)), T(0.21 + (j % 5 - 2) * 0.02, Y0 + 0.03 + j * 0.022, UP + 0.008)) for j in range(11)]), comp.mat("bookcase_card_top", (0.85, 0.2, 0.15), rough=0.4))
# lower left bay: a basket of bricks, a boot box
bk = comp.merge(comp.box((0.4, 0.26, 0.006), at=(0, 0, 0.003)), *[comp.box((0.4, 0.008, 0.2), at=(0, s * 0.126, 0.1)) for s in (-1, 1)], *[comp.box((0.008, 0.26, 0.2), at=(s * 0.196, 0, 0.1)) for s in (-1, 1)])
wick = comp.ph_texture("bookcase_wicker", "hessian_230", tile=0.15, res="1k", tint=(0.8, 0.62, 0.4))
bo = M("bookcase_basket", xf(bk, T(-0.42, Y0 + 0.15, LO)), wick)
comp.uv_box(bo, 1.0)
BR = [(0.85, 0.1, 0.08), (0.1, 0.3, 0.75), (0.95, 0.8, 0.1), (0.1, 0.55, 0.2), (0.92, 0.92, 0.9)]
bricks = {i: [] for i in range(5)}
for j in range(70):
    w = rnd.choice((0.032, 0.064, 0.064, 0.096))
    b = comp.merge(comp.box((w, 0.032, 0.019), at=(0, 0, 0)), *[comp.cyl(0.0048, 0.0036, at=(-w / 2 + 0.008 + n * 0.016, s * 0.008, 0.0095), seg=8) for n in range(int(w / 0.016)) for s in (-1, 1)])
    xf(b, T(-0.42 + rnd.uniform(-0.16, 0.16), Y0 + 0.15 + rnd.uniform(-0.09, 0.09), LO + 0.1 + rnd.uniform(0, 0.11)) @ R(rnd.uniform(0, 360), "Z") @ R(rnd.uniform(-40, 40), "X") @ R(rnd.uniform(-40, 40), "Y"))
    bricks[j % 5].append(b)
for k, lst in bricks.items():
    M(f"bookcase_bricks_{k + 1}", comp.merge(*lst), comp.mat(f"bookcase_brick_{k + 1}", _lib.srgb(BR[k]), rough=0.3))
bb = M("bookcase_bootbox", xf(comp.merge(comp.box((0.3, 0.19, 0.11), at=(0, 0, 0.055)), comp.box((0.306, 0.196, 0.03), at=(0, 0, 0.1))), T(-0.06, Y0 + 0.12, LO) @ R(4, "Z")), comp.mat("bookcase_bootbox", (0.15, 0.15, 0.16), rough=0.6))
M("bookcase_bootbox_label", xf(comp.merge(comp.box((0.1, 0.0005, 0.05), at=(0.07, -0.0955, 0.045)), xf(comp.text("SIZE 4", 0.016, depth=0.0005), T(0.07, -0.0962, 0.045))), T(-0.06, Y0 + 0.12, LO) @ R(4, "Z")), comp.mat("bookcase_bootbox_label", (0.92, 0.9, 0.85), rough=0.5))
# lower right bay: video tapes in card sleeves, upright, spines out
tape_m = comp.mat("bookcase_tape", (0.04, 0.04, 0.045), rough=0.4)
lab = comp.mat("bookcase_tape_label", (0.93, 0.91, 0.84), rough=0.6)
ink = comp.mat("bookcase_tape_ink", (0.1, 0.15, 0.5), rough=0.6)
NAMES = ["CARTOONS 3", "CUP FINAL", "XMAS 94", "DINOSAURS", "SPACE DOC", "HOLIDAY", "TAPE 7", "DO NOT WIPE", "FILMS", "MUM'S", "BIRTHDAY", "SAT A.M.", "TAPE 13", "RACING", "SCHOOL PLAY", "MISC", "??", "KEEP"]
x = 0.125
pick = None
for k, nm in enumerate(NAMES):
    if x > W / 2 - 0.05:
        break
    p = comp.pivot(col, root, f"bookcase_tape_{k + 1:02d}", (x + 0.0125, Y0, LO))
    b = M(f"bookcase_tape_{k + 1:02d}_case", comp.box((0.025, 0.105, 0.188), at=(x + 0.0125, Y0 + 0.0525, LO + 0.094)), tape_m, parent=p)
    comp.bevel(b, 0.0015, 1)
    M(f"bookcase_tape_{k + 1:02d}_label", comp.box((0.017, 0.0005, 0.15), at=(x + 0.0125, Y0 - 0.0002, LO + 0.094)), lab, parent=p)
    M(f"bookcase_tape_{k + 1:02d}_name", xf(xf(comp.text(nm, 0.009, depth=0.0004), R(90, "Y")), T(x + 0.0125, Y0 - 0.0006, LO + 0.094)), ink, parent=p)
    if k == 5:
        pick = p
    x += 0.0262
comp.channel("tape", [(pick, "location", 1, pick.location.y, pick.location.y - 0.09)])
comp.channel("lid", [(lid, "location", 0, lid.location.x, lid.location.x + 0.08)])
comp.export(col, root, _lib.PLACE, "bookcase", made="blender/components/bedroom/bookcase.py",
            source="own geometry (the games and tapes are made up); textures: https://polyhaven.com/a/stained_pine, https://polyhaven.com/a/hessian_230", license="ours; textures CC0", credit="Poly Haven (stained_pine, hessian_230)",
            rig={"tape": "the sixth video tape (bookcase_tape_06) comes 9 cm out of its row", "lid": "the top game box (bookcase_game_4) slides 8 cm to the right"},
            notes="top 0.80 m up: the fish tank stands on it")
