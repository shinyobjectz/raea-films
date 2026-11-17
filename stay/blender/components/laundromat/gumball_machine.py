# laundromat/gumball-machine: a gumball machine on a stand, 1.2 m, modelled by hand: a cast iron foot and a chrome
# pole, a red enamel body with a chrome coin plate, a turn handle and a chute with a flap, a glass globe two thirds
# full of gumballs in six colours, and a red cap with a lock. It stands by the door.
# Rig: "crank" turns the coin handle one whole turn; "ball" rolls one gumball down the chute to the flap.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rod, rbox, label, sphere, T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("gumball_machine")
M = _lib.maker(col, root)
red = comp.mat("gumball_red", (0.7, 0.05, 0.04), rough=0.25)
iron = comp.mat("gumball_iron", (0.05, 0.05, 0.055), rough=0.5)
chrome = comp.mat("gumball_chrome", (0.85, 0.85, 0.87), rough=0.12, metal=0.9)
glass = _lib.glass("gumball_glass", alpha=0.14, spec=0.4)
white = comp.mat("gumball_print", (0.95, 0.95, 0.92), rough=0.5)
PAL = [(0.85, 0.1, 0.1), (0.95, 0.8, 0.1), (0.1, 0.4, 0.85), (0.15, 0.65, 0.25), (0.95, 0.5, 0.1), (0.95, 0.95, 0.92)]
balls_m = [comp.mat(f"gumball_ball_{i + 1}", c, rough=0.25) for i, c in enumerate(PAL)]
M("gumball_machine_foot", turn([(0.0, 0.0), (0.19, 0.0), (0.2, 0.012), (0.17, 0.03), (0.07, 0.05), (0.035, 0.09), (0.0, 0.09)], seg=40), iron, smooth=True)
M("gumball_machine_pole", comp.merge(comp.cyl(0.02, 0.7, at=(0, 0, 0.07), seg=20), turn([(0.02, 0.0), (0.06, 0.02), (0.085, 0.025), (0.0, 0.025)], seg=24, at=(0, 0, 0.765))), chrome, smooth=True)
BZ = 0.79
M("gumball_machine_body", turn([(0.0, 0.0), (0.105, 0.0), (0.115, 0.012), (0.115, 0.03), (0.1, 0.045), (0.1, 0.13), (0.125, 0.15), (0.13, 0.165), (0.118, 0.175), (0.0, 0.175)], seg=40, at=(0, 0, BZ)), red, smooth=True)
GZ = BZ + 0.175 + 0.12
M("gumball_machine_globe", turn([(0.105, -0.12), (0.135, -0.07), (0.148, 0.0), (0.135, 0.07), (0.095, 0.115), (0.075, 0.125)], seg=40, at=(0, 0, GZ)), glass, smooth=True)
M("gumball_machine_cap", turn([(0.07, 0.12), (0.085, 0.125), (0.09, 0.14), (0.07, 0.16), (0.02, 0.172), (0.0, 0.172)], seg=32, at=(0, 0, GZ)), red, smooth=True)
M("gumball_machine_cap_lock", comp.cyl(0.01, 0.012, at=(0, 0, GZ + 0.17), seg=12), chrome, smooth=True)
rnd = random.Random(5)
by = {i: [] for i in range(len(PAL))}
count = 0
while count < 150:
    p = Vector((rnd.uniform(-0.14, 0.14), rnd.uniform(-0.14, 0.14), rnd.uniform(-0.115, 0.035)))
    rmax = 0.136 * math.sqrt(max(0.0, 1 - (p.z / 0.16) ** 2)) - 0.004
    if Vector((p.x, p.y)).length > rmax or (p.z > 0.0 and rnd.random() < 0.5):
        continue
    by[rnd.randrange(len(PAL))].append(sphere(0.0125, at=(p.x, p.y, GZ + p.z), u=8, v=6))
    count += 1
for i, bs in by.items():
    M(f"gumball_machine_balls_{i + 1}", comp.merge(*bs), balls_m[i], smooth=True)
# the coin plate, handle and chute on the front
FY = -0.1
M("gumball_machine_coin_plate", rbox((0.09, 0.012, 0.09), at=(0, FY - 0.004, BZ + 0.09), r=0.004), chrome)
cp = comp.pivot(col, root, "gumball_machine_crank", (0, FY - 0.01, BZ + 0.09))
M("gumball_machine_crank_handle", comp.merge(turn([(0.0, 0.02), (0.026, 0.02), (0.03, 0.0)], seg=24, axis="F", at=(0, FY - 0.01, BZ + 0.09)), rbox((0.016, 0.02, 0.07), at=(0, FY - 0.04, BZ + 0.09), r=0.005)), chrome, parent=cp, smooth=True)
M("gumball_machine_coin_slot", comp.box((0.003, 0.003, 0.02), at=(0.03, FY - 0.0105, BZ + 0.12)), iron)
M("gumball_machine_chute", comp.merge(rbox((0.06, 0.03, 0.05), at=(0, FY - 0.012, BZ + 0.025), r=0.006), comp.box((0.05, 0.035, 0.004), at=(0, FY - 0.03, BZ + 0.002))), chrome)
M("gumball_machine_chute_flap", rbox((0.044, 0.004, 0.036), at=(0, FY - 0.029, BZ + 0.024), r=0.002, seg=1), comp.mat("gumball_flap", (0.6, 0.6, 0.62), rough=0.3, metal=0.8))
M("gumball_machine_print", comp.merge(label("25", 0.02, (-0.028, FY - 0.0106, BZ + 0.12)), label("GUM", 0.014, (0, FY - 0.0106, BZ + 0.052))), iron)
bp = comp.pivot(col, root, "gumball_machine_ball", (0, FY + 0.02, BZ + 0.1))
M("gumball_machine_ball_mesh", sphere(0.0125, at=(0, FY + 0.02, BZ + 0.1), u=12, v=8), balls_m[1], parent=bp, smooth=True)
_lib.channel("crank", [(cp, "rotation_euler", 1, 0, 2 * math.pi)])
_lib.channel("ball", [(bp, "location", 1, FY + 0.02, FY - 0.045), (bp, "location", 2, BZ + 0.1, BZ + 0.018), (bp, "rotation_euler", 0, 0, 6.0)])
comp.export(col, root, _lib.PLACE, "gumball_machine", made="blender/components/laundromat/gumball_machine.py", source="own geometry (a generic gumball machine on a stand)", license="ours", credit="",
            rig={"crank": "the coin handle one whole turn (gumball_machine_crank)", "ball": "one gumball rolls from inside the body down the chute and out past the flap (gumball_machine_ball)"})
