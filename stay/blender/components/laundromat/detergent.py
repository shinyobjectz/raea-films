# laundromat/detergent: what stands on the shelf over the washers, 1.3 m of it: two white gallon jugs (Poly Haven's
# plastic_bottle_gallon), two bottles of bleach (bleach_bottle), a cleaner bottle (multi_cleaner_bottle), all CC0, and
# by hand three boxes of soap powder with our own labels, a stack of dryer-sheet boxes, a measuring scoop and a spray
# bottle. Its origin is the shelf's top under its middle. Rig: "tip" tips the end jug 24 degrees over its base's edge
# (a reroll's nudge, the cursor's knock).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rbox, label, ph_add, T, R, S, xf

col, root = comp.fresh("detergent")
M = _lib.maker(col, root)
credits = set()
def put(asset, prefix, at, turn_deg=0.0, scale=1.0, parent=None):
    parts, credit = ph_add(col, root, asset, prefix, at=at, turn_deg=turn_deg, scale=scale, parent=parent)
    credits.add(credit)
    return parts
tip = comp.pivot(col, root, "detergent_tip", (-0.636, 0.0, 0.0))
put("plastic_bottle_gallon", "detergent_jug_1", (-0.55, 0.0, 0), turn_deg=12, parent=tip)
put("plastic_bottle_gallon", "detergent_jug_2", (-0.34, 0.02, 0), turn_deg=-170)
put("bleach_bottle", "detergent_bleach_1", (-0.18, -0.02, 0), turn_deg=8)
put("bleach_bottle", "detergent_bleach_2", (-0.08, 0.03, 0), turn_deg=-20)
put("multi_cleaner_bottle", "detergent_cleaner", (0.5, 0.02, 0), turn_deg=15)
# soap powder: three boxes, a colour each, our own words
card = [comp.mat("detergent_box_blue", (0.08, 0.25, 0.7), rough=0.5), comp.mat("detergent_box_orange", (0.9, 0.42, 0.05), rough=0.5), comp.mat("detergent_box_green", (0.1, 0.55, 0.3), rough=0.5)]
white = comp.mat("detergent_print", (0.95, 0.95, 0.92), rough=0.5)
yellow = comp.mat("detergent_burst", (0.98, 0.85, 0.1), rough=0.5)
prints, bursts = [], []
for i, (x, y, yaw, w, h, d, word, sub) in enumerate(((0.07, 0.0, 6, 0.16, 0.24, 0.06, "SUDS", "SOAP POWDER"), (0.23, 0.02, -10, 0.15, 0.22, 0.06, "BRIGHT", "COLOUR WASH"), (0.37, 0.0, 3, 0.11, 0.17, 0.05, "SOFT", "BABY CLOTHES"))):
    b = xf(xf(rbox((w, d, h), at=(0, 0, h / 2), r=0.003, seg=2), R(yaw, "Z")), T(x, y, 0))
    M(f"detergent_box_{i + 1}", b, card[i])
    prints.append(xf(xf(comp.merge(label(word, w * 0.24, (0, -d / 2 - 0.0005, h * 0.62)), label(sub, w * 0.085, (0, -d / 2 - 0.0005, h * 0.3))), R(yaw, "Z")), T(x, y, 0)))
    bursts.append(xf(xf(_lib.disc(w * 0.16, seg=12, at=(w * 0.28, -d / 2 - 0.0004, h * 0.84)), R(yaw, "Z")), T(x, y, 0)))
M("detergent_box_print", comp.merge(*prints), white)
M("detergent_box_bursts", comp.merge(*bursts), yellow)
# dryer sheets: three flat boxes stacked askew
sheet_m = comp.mat("detergent_sheets_box", (0.75, 0.6, 0.85), rough=0.5)
SX = -0.02
M("detergent_sheets", comp.merge(*[xf(xf(rbox((0.11, 0.2, 0.055), at=(0, 0, 0.0275 + k * 0.055), r=0.003, seg=2), R((4, -7, 9)[k], "Z")), T(0.62, -0.02, 0)) for k in range(3)]), sheet_m)
M("detergent_sheets_print", comp.merge(*[xf(xf(label("DRYER SHEETS", 0.011, (0, -0.1005, 0.0275 + k * 0.055)), R((4, -7, 9)[k], "Z")), T(0.62, -0.02, 0)) for k in range(3)]), white)
# a scoop and a spray bottle
scoop_m = comp.mat("detergent_scoop", (0.2, 0.5, 0.85), rough=0.4)
M("detergent_scoop", comp.merge(turn([(0.03, 0.0), (0.036, 0.05), (0.034, 0.05), (0.028, 0.004), (0.0, 0.004)], seg=20, at=(0.15, -0.09, 0)), rbox((0.07, 0.016, 0.004), at=(0.2, -0.09, 0.046), r=0.0015)), scoop_m, smooth=True)
spray_m = comp.mat("detergent_spray", (0.85, 0.9, 0.95), rough=0.2, alpha=0.6)
M("detergent_spray_bottle", turn([(0.0, 0.0), (0.036, 0.0), (0.038, 0.01), (0.038, 0.12), (0.03, 0.16), (0.014, 0.18), (0.014, 0.2), (0.0, 0.2)], seg=24, at=(0.31, -0.085, 0)), spray_m, smooth=True)
M("detergent_spray_head", comp.merge(comp.cyl(0.017, 0.022, at=(0.31, -0.085, 0.198), seg=16), rbox((0.03, 0.075, 0.03), at=(0.31, -0.105, 0.235), r=0.006), rbox((0.012, 0.012, 0.05), at=(0.31, -0.117, 0.2), r=0.003)), card[1], smooth=True)
_lib.channel("tip", [(tip, "rotation_euler", 1, 0, math.radians(-24))])
comp.export(col, root, _lib.PLACE, "detergent", made="blender/components/laundromat/detergent.py",
            source="https://polyhaven.com/a/plastic_bottle_gallon, https://polyhaven.com/a/bleach_bottle, https://polyhaven.com/a/multi_cleaner_bottle; boxes, scoop and spray bottle own geometry with our own labels",
            license="CC0; ours", credit="Poly Haven: " + "; ".join(sorted(credits)),
            rig={"tip": "the end jug tips 24 degrees over the edge of its base, toward the row's end (detergent_tip)"},
            notes="Origin: the surface it stands on, under its middle. The bottles' printed labels are the Poly Haven models' own made-up brands.")
