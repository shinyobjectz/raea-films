# laundromat/posters: the laundromat's notices, a group 2.5 m wide to hang on one wall, modelled by hand, every word
# our own: the house rules on a white board with a blue head, a black price board with white letters, a red NO DYEING
# sign, a yellow sign about unattended laundry, a framed sun poster (a disc over stripes: the film's circle), and a
# small camera notice. Each is a board with its own print; backs at y 0, the origin the group's middle. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, disc, rbox, label, T, R, S, xf

col, root = comp.fresh("posters")
M = _lib.maker(col, root)
white = comp.mat("posters_white", (0.93, 0.93, 0.9), rough=0.5)
ink = comp.mat("posters_ink", (0.03, 0.03, 0.035), rough=0.6)
blue = comp.mat("posters_blue", (0.05, 0.16, 0.5), rough=0.45)
red = comp.mat("posters_red", (0.75, 0.08, 0.06), rough=0.45)
yellow = comp.mat("posters_yellow", (0.95, 0.8, 0.1), rough=0.5)
black = comp.mat("posters_black", (0.03, 0.03, 0.035), rough=0.7)
frame = comp.mat("posters_frame", (0.6, 0.62, 0.64), rough=0.3, metal=0.7)
sun = comp.mat("posters_sun", (0.98, 0.55, 0.08), rough=0.5)
sky = comp.mat("posters_sky", (0.98, 0.86, 0.6), rough=0.5)
sea = [comp.mat("posters_sea_1", (0.1, 0.32, 0.5), rough=0.5), comp.mat("posters_sea_2", (0.16, 0.45, 0.6), rough=0.5)]
screws = []
def board(name, x, z, w, h, m, t=0.004):
    M(f"posters_{name}", rbox((w, t, h), at=(x, -t / 2, z), r=0.0015, seg=1), m)
    screws.extend(turn([(0.0, 0.002), (0.004, 0.002), (0.005, 0.0)], seg=8, axis="F", at=(x + sx * (w / 2 - 0.015), -t, z + sz * (h / 2 - 0.015))) for sx in (-1, 1) for sz in (-1, 1))
Y = -0.0046
# the rules
board("rules", -0.9, 0.0, 0.6, 0.9, white)
M("posters_rules_head", rbox((0.6, 0.002, 0.14), at=(-0.9, -0.005, 0.38), r=0.0005, seg=1), blue)
M("posters_rules_head_print", label("HOUSE RULES", 0.06, (-0.9, -0.0064, 0.38)), white)
rules = ["1  EMPTY YOUR POCKETS", "2  DO NOT OVERLOAD THE WASHERS", "3  NO DYEING IN ANY MACHINE", "4  STAY WITH YOUR LAUNDRY", "5  CLEAN THE LINT SCREEN", "6  NO SITTING ON THE TABLES", "7  CARTS STAY INSIDE", "8  BE KIND AT 3 A.M."]
M("posters_rules_print", comp.merge(*[label(r, 0.03, (-1.17, Y, 0.24 - i * 0.075), align="LEFT") for i, r in enumerate(rules)]), ink)
# the prices: a letter board
board("prices", -0.1, 0.2, 0.75, 0.5, black)
M("posters_prices_frame", comp.merge(comp.box((0.77, 0.012, 0.015), at=(-0.1, -0.006, 0.4575)), comp.box((0.77, 0.012, 0.015), at=(-0.1, -0.006, -0.0575)), comp.box((0.015, 0.012, 0.53), at=(-0.4775, -0.006, 0.2)), comp.box((0.015, 0.012, 0.53), at=(0.2775, -0.006, 0.2))), frame)
rows = [("WASH  14 LB", "2.00"), ("WASH  30 LB", "4.50"), ("DRY  8 MIN", ".25"), ("FLUFF + FOLD / LB", "1.10"), ("SOAP", ".75")]
M("posters_prices_print", comp.merge(label("PRICES", 0.05, (-0.1, Y, 0.395)), *[label(a, 0.036, (-0.43, Y, 0.31 - i * 0.07), align="LEFT") for i, (a, b) in enumerate(rows)], *[label(b, 0.036, (0.23, Y, 0.31 - i * 0.07), align="RIGHT") for i, (a, b) in enumerate(rows)]), white)
# the small signs
board("no_dye", -0.25, -0.26, 0.42, 0.26, red)
M("posters_no_dye_print", comp.merge(label("NO DYEING", 0.06, (-0.25, Y, -0.22)), label("IN THESE MACHINES", 0.028, (-0.25, Y, -0.3))), white)
board("unattended", 0.24, -0.26, 0.46, 0.26, yellow)
M("posters_unattended_print", comp.merge(label("NOT RESPONSIBLE", 0.038, (0.24, Y, -0.2)), label("FOR LAUNDRY LEFT ALONE", 0.026, (0.24, Y, -0.26)), label("OR FOR SOCKS", 0.026, (0.24, Y, -0.31))), ink)
# the sun poster, framed
PX, PZ, PW, PH_ = 0.85, 0.1, 0.56, 0.76
board("sun_sky", PX, PZ, PW, PH_, sky, t=0.006)
M("posters_sun_disc", disc(0.15, seg=48, at=(PX, -0.0064, PZ + 0.12)), sun)
for i in range(6):
    M(f"posters_sun_sea_{i + 1}", comp.box((PW, 0.001, 0.045), at=(PX, -0.0068, PZ - 0.08 - i * 0.045)), sea[i % 2])
M("posters_sun_print", label("STAY A WHILE", 0.04, (PX, -0.0078, PZ - 0.335)), white)
M("posters_sun_frame", comp.merge(comp.box((PW + 0.03, 0.02, 0.02), at=(PX, -0.01, PZ + PH_ / 2)), comp.box((PW + 0.03, 0.02, 0.02), at=(PX, -0.01, PZ - PH_ / 2)), comp.box((0.02, 0.02, PH_), at=(PX - PW / 2, -0.01, PZ)), comp.box((0.02, 0.02, PH_), at=(PX + PW / 2, -0.01, PZ))), frame)
# the camera notice
board("camera", -0.9, -0.56, 0.36, 0.12, white)
M("posters_camera_print", label("SMILE  -  YOU ARE ON CAMERA", 0.02, (-0.9, Y, -0.56)), ink)
M("posters_screws", comp.merge(*screws), frame)
comp.export(col, root, _lib.PLACE, "posters", made="blender/components/laundromat/posters.py", source="own geometry and our own words; letters in Blender's built-in font", license="ours", credit="", rig={},
            notes="Backs at y 0, origin the group's middle: hang it with its middle about 1.75 m up.")
