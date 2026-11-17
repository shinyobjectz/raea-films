# pool/diving-board: a one-metre springboard on its stand, modelled by hand at real size: a 4.9 m aqua board with a
# white grit top, hinged at the back and lying on a roller fulcrum 1.8 m forward of the hinge, on a painted steel
# stand with a wheel that moves the fulcrum, three steps up the back and a handrail each side. Its origin is the deck
# under the fulcrum; the tip is 3.1 m toward -y (the water), so the pool's edge belongs about 1.2 m in front of the
# origin. Rig: "bounce" bends the board down in front of the fulcrum, its tip 38 cm (six sections, 2 degrees each);
# "fulcrum" rolls the fulcrum 0.45 m back and turns its wheel twice.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("diving_board")
board_m = comp.mat("pool_board", (0.16, 0.6, 0.66), rough=0.4)
grit_m = comp.mat("pool_board_grit", (0.86, 0.9, 0.9), rough=0.95)
stand_m = paint_m("pool_board_stand", (0.83, 0.85, 0.86), 0.4)
st = steel("pool_steel", 0.15)
rub = comp.mat("pool_rubber", (0.02, 0.02, 0.02), rough=0.8)
tread_m = comp.mat("pool_ladder_tread", (0.9, 0.9, 0.87), rough=0.6)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
HINGE, TIP, TOP, BW = 1.8, -3.1, 0.85, 0.5
FZ = TOP - 0.045            # the board's underside at the fulcrum

# the stand: two base rails, a rear pedestal with the hinge, a front pedestal carrying the fulcrum's track
base = [comp.box((0.07, HINGE + 0.75, 0.07), at=(sx * 0.3, (HINGE - 0.35) / 2 + 0.1, 0.035)) for sx in (-1, 1)]
base += [comp.box((0.67, 0.07, 0.07), at=(0, y, 0.035)) for y in (-0.25, HINGE + 0.4)]
base += [comp.box((0.16, 0.16, 0.012), at=(sx * 0.3, y, 0.006)) for sx in (-1, 1) for y in (-0.2, 0.8, HINGE + 0.35)]
base += [comp.box((0.07, 0.09, FZ - 0.05), at=(sx * 0.3, HINGE, (FZ - 0.05) / 2 + 0.035)) for sx in (-1, 1)]
base += [comp.box((0.67, 0.09, 0.07), at=(0, HINGE, FZ - 0.07))]
for sx in (-1, 1):
    base.append(comp.taper((sx * 0.3, -0.22, 0.07 + 0.0), (sx * 0.3, 0.08, FZ - 0.11), 0.07, 0.07, 0.0, 0.07))
    base.append(comp.taper((sx * 0.3, 0.7, 0.07), (sx * 0.3, 0.38, FZ - 0.11), 0.07, 0.07, 0.0, 0.07))
    base.append(comp.box((0.07, 0.95, 0.06), at=(sx * 0.3, 0.22, FZ - 0.11)))     # the fulcrum's track
    base.append(comp.taper((sx * 0.3, HINGE - 0.04, 0.07), (sx * 0.3, 1.0, 0.07), 0.05, 0.05, -0.0, 0.0))
legs = []
for sx in (-1, 1):
    legs += [rod((sx * 0.3, -0.2, 0.05), (sx * 0.3, 0.02, FZ - 0.13), 0.03), rod((sx * 0.3, 0.72, 0.05), (sx * 0.3, 0.42, FZ - 0.13), 0.03), rod((sx * 0.3, HINGE - 0.05, FZ - 0.12), (sx * 0.3, 1.05, 0.06), 0.022)]
so = M("diving_board_stand", comp.merge(*base, *legs), stand_m)
comp.bevel(so, 0.006, 2)
M("diving_board_bolts", comp.merge(*[comp.cyl(0.011, 0.012, at=(sx * 0.3 + dx, y + dy, 0.012), seg=6) for sx in (-1, 1) for y in (-0.2, 0.8, HINGE + 0.35) for dx in (-0.055, 0.055) for dy in (-0.055, 0.055)]), st)
M("diving_board_hinge", comp.merge(comp.cyl(0.018, 0.62, at=(-0.31, HINGE, FZ - 0.018), seg=16, axis="X"), *[comp.box((0.05, 0.12, 0.012), at=(sx * 0.17, HINGE - 0.02, FZ + 0.045 + 0.006)) for sx in (-1, 1)],
                                     *[comp.cyl(0.01, 0.01, at=(sx * 0.17, HINGE - 0.02 + dy, FZ + 0.057), seg=6) for sx in (-1, 1) for dy in (-0.035, 0.035)]), st, smooth=False)

# the fulcrum: a roller on a carriage that runs on the track, moved by a wheel on the left
car = comp.pivot(col, root, "diving_board_fulcrum", (0, 0, FZ - 0.035))
co = M("diving_board_carriage", comp.merge(*[comp.box((0.09, 0.16, 0.05), at=(sx * 0.3, 0, FZ - 0.06)) for sx in (-1, 1)], comp.box((0.6, 0.05, 0.03), at=(0, 0, FZ - 0.07))), st, parent=car)
comp.bevel(co, 0.004, 2)
M("diving_board_roller", comp.cyl(0.035, 0.54, at=(-0.27, 0, FZ - 0.035), seg=28, axis="X"), rub, parent=car, smooth=True)
wheel = comp.pivot(col, root, "diving_board_wheel", (-0.4, 0, FZ - 0.035), parent=car)
wm = comp.merge(turn([(0.13, -0.014), (0.15, -0.014), (0.158, 0.0), (0.15, 0.014), (0.13, 0.014), (0.125, 0.0), (0.13, -0.014)], seg=36, axis="X", at=(-0.4, 0, FZ - 0.035)),
                comp.cyl(0.03, 0.09, at=(-0.43, 0, FZ - 0.035), seg=16, axis="X"),
                *[xf(comp.box((0.012, 0.012, 0.27)), T(-0.4, 0, FZ - 0.035) @ R(a, "X")) for a in (0, 60, 120)])
M("diving_board_wheel_rim", wm, stand_m, parent=wheel, smooth=False)
M("diving_board_axle", comp.cyl(0.012, 0.14, at=(-0.44, 0, FZ - 0.035), seg=10, axis="X"), st, parent=car)

# the board: the back run from the hinge to the fulcrum stays; six sections in front of it bend, each from the last
def run(y0, y1, t0, t1, parent, n):
    b = comp.taper((0, y0, TOP), (0, y1, TOP), BW, BW, t0, t1)
    o = M(f"diving_board_board_{n}", b, board_m, parent=parent)
    comp.bevel(o, 0.008, 2, angle=50)
    g = comp.taper((0, y0, TOP + 0.004), (0, y1, TOP + 0.004), BW - 0.05, BW - 0.05, 0.004, 0.004)
    M(f"diving_board_grit_{n}", g, grit_m, parent=parent)
run(HINGE + 0.12, 0.0, 0.045, 0.045, None, 0)
N = 6
SEG = -TIP / N
joints, parent = [], None
for i in range(N):
    y0, y1 = -i * SEG, -(i + 1) * SEG
    j = comp.pivot(col, root, f"diving_board_bend_{i + 1}", (0, y0, TOP - 0.02), parent=parent)
    t0, t1 = 0.045 - 0.022 * i / N, 0.045 - 0.022 * (i + 1) / N
    run(y0 + 0.0005, y1 - (0.0 if i < N - 1 else 0.0), t0, t1, j, i + 1)
    joints.append(j)
    parent = j
M("diving_board_tip", comp.box((BW - 0.02, 0.02, 0.018), at=(0, TIP - 0.004, TOP - 0.012)), rub, parent=joints[-1])

# three steps up the back and a handrail each side
RY = HINGE + 0.15
steps = []
for i, z in enumerate((0.21, 0.42, 0.63)):
    y = RY + 0.75 - i * 0.25
    steps.append(comp.merge(comp.box((0.5, 0.2, 0.03), at=(0, y, z)), *[comp.box((0.46, 0.012, 0.004), at=(0, y - 0.06 + k * 0.04, z + 0.017)) for k in range(4)]))
so = M("diving_board_steps", comp.merge(*steps), tread_m)
comp.bevel(so, 0.003, 2)
rails = []
for sx in (-1, 1):
    x = sx * 0.33
    rails.append(pipe([(x, RY + 0.95, 0.03), (x, RY + 0.0, 0.79)], 0.02))                      # the stringer
    pts = [(x, RY + 0.95, 0.0), (x, RY + 0.95, 1.0), (x, RY + 0.05, 1.78), (x, 0.3, 1.78), (x, -0.25, 1.45), (x, -0.25, FZ - 0.1)]
    rails.append(pipe(bend(pts, 0.22, 7), 0.019, sides=4))
    rails.append(pipe(bend([(x, RY + 0.48, 0.42), (x, RY + 0.48, 0.98), (x, RY + 0.05, 1.33), (x, 0.3, 1.33), (x, 0.3, FZ - 0.1)], 0.15, 6), 0.014))
    rails.append(rod((x, 1.05, 1.33), (x, 1.05, 1.78), 0.014))
M("diving_board_rails", comp.merge(*rails), st, smooth=True)
M("diving_board_feet", comp.merge(*[turn([(0.02, 0.0), (0.05, 0.0), (0.05, 0.006), (0.03, 0.025), (0.02, 0.025)], seg=20, at=(sx * 0.33, RY + 0.95, 0)) for sx in (-1, 1)]), st, smooth=True)

comp.channel("bounce", [(j, "rotation_euler", 0, 0, math.radians(2.0)) for j in joints])
comp.channel("fulcrum", [(car, "location", 1, car.location.y, car.location.y + 0.45), (wheel, "rotation_euler", 0, 0, 4 * math.pi)])
done(col, root, "diving_board", source="own geometry (a generic one-metre springboard and stand)",
     rig={"bounce": "the board bends down in front of the fulcrum, six sections 2 degrees each, the tip 38 cm", "fulcrum": "the roller carriage runs 0.45 m back along its track and its wheel turns twice"},
     notes="origin: the deck under the fulcrum; the tip is 3.1 m toward -y. Stand it with the pool's edge about 1.2 m in front of the origin.")
