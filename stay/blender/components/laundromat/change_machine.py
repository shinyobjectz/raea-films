# laundromat/change-machine: a wall-mounted note changer, 0.56 m wide and 0.86 m tall, modelled by hand: a brushed
# steel cabinet with a door on a piano hinge and two barrel locks, a lit CHANGE header, a blue instruction plate, a
# note reader in a black bezel with two lit arrows, a coin cup under a chute with a steel lip, and a taped paper
# note. Its back is at y 0 and its origin its middle. Rig: "glow" is the scene's (the material change_glow: the
# header and the arrows); "coins" drops four quarters down the chute into the cup.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rod, rbox, label, disc, T, R, S, xf

col, root = comp.fresh("change_machine")
M = _lib.maker(col, root)
steel = comp.mat("change_steel", (0.68, 0.69, 0.7), rough=0.35, metal=0.55)
dark = comp.mat("change_dark", (0.02, 0.02, 0.022), rough=0.5)
blue = comp.mat("change_plate", (0.05, 0.16, 0.5), rough=0.4)
glow = comp.mat("change_glow", (1.0, 0.92, 0.3), rough=0.4, emit=(1.0, 0.85, 0.2), strength=4.0)
green = comp.mat("change_arrows", (0.2, 0.9, 0.3), rough=0.4, emit=(0.2, 1.0, 0.3), strength=3.0)
white = comp.mat("change_print", (0.95, 0.95, 0.92), rough=0.5)
chrome = comp.mat("change_chrome", (0.85, 0.85, 0.87), rough=0.15, metal=0.9)
coin_m = comp.mat("change_coin", (0.75, 0.75, 0.72), rough=0.3, metal=0.9)
paper = comp.mat("change_note", (0.93, 0.92, 0.85), rough=0.7)
tape = comp.mat("change_tape", (0.8, 0.75, 0.5), rough=0.3, alpha=0.6)
W, H, D = 0.56, 0.86, 0.3
c = M("change_machine_cabinet", rbox((W, D, H), at=(0, -D / 2, 0), r=0.008), steel)
d = M("change_machine_door", rbox((W - 0.05, 0.012, H - 0.05), at=(0, -D - 0.005, 0), r=0.004), steel)
M("change_machine_hinge", comp.merge(comp.cyl(0.006, H - 0.07, at=(-W / 2 + 0.02, -D - 0.008, -H / 2 + 0.035), seg=10), *[comp.cyl(0.0075, 0.012, at=(-W / 2 + 0.02, -D - 0.008, z), seg=10) for z in [-0.38 + 0.076 * i for i in range(11)]]), chrome, smooth=True)
M("change_machine_locks", comp.merge(*[comp.merge(turn([(0.0, 0.008), (0.012, 0.008), (0.015, 0.0)], seg=20, axis="F", at=(W / 2 - 0.06, -D - 0.011, z)), comp.box((0.003, 0.002, 0.012), at=(W / 2 - 0.06, -D - 0.0195, z))) for z in (0.3, -0.3)]), chrome, smooth=True)
M("change_machine_header", rbox((W - 0.12, 0.006, 0.12), at=(-0.01, -D - 0.013, 0.33), r=0.002, seg=1), glow)
M("change_machine_header_print", label("CHANGE", 0.075, (-0.01, -D - 0.0166, 0.33)), dark)
M("change_machine_plate", rbox((W - 0.12, 0.004, 0.16), at=(-0.01, -D - 0.012, 0.16), r=0.002, seg=1), blue)
M("change_machine_plate_print", comp.merge(label("INSERT NOTE FACE UP", 0.026, (-0.01, -D - 0.0146, 0.205)), label("1s AND 5s ONLY  -  GIVES QUARTERS", 0.016, (-0.01, -D - 0.0146, 0.165)), label("NO CHANGE GIVEN FOR TORN NOTES", 0.013, (-0.01, -D - 0.0146, 0.125))), white)
# the note reader
M("change_machine_reader", rbox((0.2, 0.03, 0.11), at=(-0.01, -D - 0.02, 0.0), r=0.008), dark)
M("change_machine_reader_slot", comp.merge(rbox((0.15, 0.004, 0.012), at=(-0.01, -D - 0.0355, -0.005), r=0.001, seg=1)), steel)
ar = lambda x: _lib.outline([(x - 0.012, 0.022), (x + 0.012, 0.022), (x, 0.044)], y=-D - 0.0356)
M("change_machine_reader_arrows", comp.merge(ar(-0.06), ar(0.04)), green)
# the chute and the cup
M("change_machine_cup_recess", rbox((0.24, 0.006, 0.15), at=(-0.01, -D - 0.011, -0.25), r=0.003, seg=1), dark)
cupb = turn([(0.0, -0.045), (0.07, -0.04), (0.1, -0.01), (0.105, 0.03), (0.098, 0.03), (0.094, -0.006), (0.066, -0.032), (0.0, -0.037)], seg=28, at=(-0.01, -D - 0.014, -0.275))
import bmesh
bmesh.ops.bisect_plane(cupb, geom=cupb.verts[:] + cupb.edges[:] + cupb.faces[:], plane_co=(0, -D - 0.012, 0), plane_no=(0, 1, 0), clear_outer=True)
M("change_machine_cup", cupb, chrome, smooth=True)
M("change_machine_chute", comp.box((0.1, 0.004, 0.03), at=(-0.01, -D - 0.0145, -0.19)), comp.mat("change_chute", (0.0, 0.0, 0.0), rough=0.9))
rnd = random.Random(3)
keys = []
for i in range(4):
    rest = (-0.01 + rnd.uniform(-0.045, 0.045), -D - 0.05 - rnd.uniform(0, 0.03), -0.308 + i * 0.0035)
    p = comp.pivot(col, root, f"change_machine_coin_{i + 1}", (rest[0], -D + 0.03, -0.16))
    cb = xf(xf(comp.cyl(0.0121, 0.00175, seg=20), R(rnd.uniform(-8, 8), "X")), T(rest[0], -D + 0.03, -0.16))
    M(f"change_machine_coin_{i + 1}_disc", cb, coin_m, parent=p, smooth=True)
    keys += [(p, "location", 1, -D + 0.03, rest[1]), (p, "location", 2, -0.16, rest[2]), (p, "rotation_euler", 2, 0, rnd.uniform(1, 5))]
# a taped note
n = xf(xf(rbox((0.2, 0.0008, 0.09), r=0.0003, seg=1), R(-4, "Y")), T(0.02, -D - 0.0135, -0.115))
M("change_machine_note", n, paper)
M("change_machine_note_print", xf(xf(comp.merge(label("EATS 5s SOMETIMES", 0.018, (0, -0.001, 0.015)), label("TELL THE DAY MAN", 0.014, (0, -0.001, -0.015))), R(-4, "Y")), T(0.02, -D - 0.0135, -0.115)), dark)
M("change_machine_note_tape", comp.merge(*[xf(xf(rbox((0.05, 0.0006, 0.018), at=(s * 0.08, -0.0008, 0.04), r=0.0002, seg=1), R(-4, "Y")), T(0.02, -D - 0.0135, -0.115)) for s in (-1, 1)]), tape)
_lib.channel("coins", keys)
comp.export(col, root, _lib.PLACE, "change_machine", made="blender/components/laundromat/change_machine.py", source="own geometry (a generic wall-mounted note changer); letters in Blender's built-in font", license="ours", credit="",
            rig={"glow": "in the scene: the materials change_glow (the CHANGE header) and change_arrows (the reader's arrows), a key per state",
                 "coins": "four quarters come down the chute and land in the cup (change_machine_coin_1 to 4)"},
            notes="Back at y 0, origin its middle: mount it with its middle about 1.25 m up.")
