# ferris/litter: a night's litter on a 2.4 m patch of ground, modelled by hand: three paper cups (one upright with
# its lid and straw, two on their sides), a striped popcorn box on its side with spilt popcorn, a strip of five
# ticket stubs and loose stubs, two balls of screwed-up paper, a crushed can, a candy-floss stick, a paper napkin
# and a flyer lying flat. Origin: the patch's centre, on the ground.
# Rig: "blow" is a gust along +x: the flyer lifts and slides 1.3 m, turning over; one cup rolls 0.9 m on its side;
# a paper ball rolls 1.1 m; the ticket strip skitters 0.5 m round.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

random.seed(21)
col, root = comp.fresh("litter")
cup_m = comp.mat("litter_cup", (0.88, 0.86, 0.8), rough=0.55)
red = comp.mat("fair_red", (0.55, 0.05, 0.04), rough=0.5)
cream = comp.mat("fair_cream", (0.88, 0.82, 0.62), rough=0.55)
corn = comp.mat("litter_popcorn", (0.92, 0.84, 0.55), rough=0.7)
paper = comp.mat("litter_paper", (0.86, 0.85, 0.8), rough=0.65)
ticket = comp.mat("litter_ticket", (0.85, 0.5, 0.45), rough=0.6)
tin = comp.mat("litter_can", (0.7, 0.72, 0.73), rough=0.3, metal=1.0)
ink = comp.mat("litter_ink", (0.12, 0.12, 0.14), rough=0.6)
yellow = comp.mat("litter_flyer", (0.9, 0.72, 0.15), rough=0.6)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
def cup(h=0.11, r0=0.026, r1=0.04):
    bm = comp.cyl(r0, h, seg=18, r2=r1)
    top = [f for f in bm.faces if f.normal.z > 0.9]
    bmesh.ops.delete(bm, geom=top, context="FACES")
    return bm
# upright cup with lid and straw
c1 = M("litter_cup_upright", xf(cup(), T(-0.7, 0.5, 0)), cup_m, None, True)
comp.solidify(c1, 0.0015)
M("litter_cup_band", comp.cyl(0.0385, 0.03, at=(-0.7, 0.5, 0.06), seg=18, r2=0.0425), red, None, True)
M("litter_cup_lid", comp.merge(comp.cyl(0.043, 0.008, at=(-0.7, 0.5, 0.108), seg=18), xf(comp.cyl(0.003, 0.09, seg=6), comp.Matrix.Translation((-0.69, 0.5, 0.09)) @ R(14, "Y"))), comp.mat("litter_lid", (0.9, 0.9, 0.92), rough=0.3, alpha=0.7), None, True)
# the rolling cup: on its side along y, on a slide pivot and a roll pivot
slide = comp.pivot(col, root, "litter_cup_slide", (0.1, -0.3, 0.04))
roll = comp.pivot(col, root, "litter_cup_roll", (0.1, -0.3, 0.04), parent=slide)
c2 = M("litter_cup_rolling", xf(cup(), comp.Matrix.Translation((0.1, -0.3 + 0.055, 0.04)) @ R(90, "X")), cup_m, roll, True)
comp.solidify(c2, 0.0015)
M("litter_cup_rolling_band", xf(comp.cyl(0.0385, 0.03, at=(0, 0, 0.06), seg=18, r2=0.0425), comp.Matrix.Translation((0.1, -0.3 + 0.055, 0.04)) @ R(90, "X")), red, roll, True)
c3 = M("litter_cup_crushed", xf(cup(), comp.Matrix.Translation((0.85, 0.75, 0.022)) @ R(40, "Z") @ R(90, "X") @ S(1.0, 0.55, 1.0)), cup_m, None, True)
comp.solidify(c3, 0.0015)
# the popcorn box on its side, striped, and the spill
bx, by = -0.25, 0.75
box_r, box_c = [], []
for i in range(6):
    (box_r if i % 2 else box_c).append(comp.box((0.11 / 6, 0.19, 0.075), at=(-0.055 + (i + 0.5) * 0.11 / 6, 0, 0.0375)))
MB = comp.Matrix.Translation((bx, by, 0)) @ R(25, "Z")
M("litter_box_red", xf(comp.merge(*box_r), MB), red)
M("litter_box_cream", xf(comp.merge(*box_c), MB), cream)
M("litter_box_inside", xf(comp.box((0.1, 0.004, 0.065), at=(0, -0.094, 0.0375)), MB), ink)
pops = []
for i in range(46):
    a, d = random.uniform(-0.9, 0.9), random.uniform(0.02, 0.42) ** 1.2
    p = MB @ Vector((math.sin(a) * d, -0.1 - math.cos(a) * d, 0.009))
    k = L.ico(random.uniform(0.008, 0.012), tuple(p), 1)
    for v in k.verts:
        v.co += (v.co - p) * random.uniform(-0.3, 0.35)
    pops.append(k)
M("litter_popcorn", comp.merge(*pops), corn, None, True)
# tickets: a strip of five on a pivot, loose stubs
tp = comp.pivot(col, root, "litter_tickets", (0.5, 0.2, 0.002))
strip = [xf(comp.box((0.05, 0.025, 0.0006)), comp.Matrix.Translation((0.5 + (i - 2) * 0.05, 0.2 + 0.004 * (i % 2), 0.002 + 0.002 * (i == 3))) @ R(6 * (i - 2), "Z")) for i in range(5)]
M("litter_ticket_strip", comp.merge(*strip), ticket, tp)
M("litter_ticket_print", comp.merge(*[xf(comp.box((0.03, 0.004, 0.0002)), comp.Matrix.Translation((0.5 + (i - 2) * 0.05, 0.2 + 0.004 * (i % 2), 0.0028 + 0.002 * (i == 3))) @ R(6 * (i - 2), "Z")) for i in range(5)]), ink, tp)
M("litter_ticket_stubs", comp.merge(*[xf(comp.box((0.05, 0.025, 0.0006)), comp.Matrix.Translation((random.uniform(-1.1, 1.1), random.uniform(-1.0, 1.0), 0.001)) @ R(random.uniform(0, 180), "Z")) for i in range(9)]), ticket)
# paper balls: one rolls
def ball(r, at, seed):
    random.seed(seed)
    bm = L.ico(r, (0, 0, 0), 2)
    for v in bm.verts:
        v.co *= random.uniform(0.72, 1.12)
    return xf(bm, T(*at))
bp = comp.pivot(col, root, "litter_ball_slide", (-0.9, -0.7, 0.035))
br = comp.pivot(col, root, "litter_ball_roll", (-0.9, -0.7, 0.035), parent=bp)
M("litter_ball_rolling", ball(0.035, (-0.9, -0.7, 0.035), 3), paper, br)
M("litter_ball_still", ball(0.03, (0.95, -0.55, 0.028), 4), paper)
M("litter_can", xf(comp.cyl(0.033, 0.115, seg=14), comp.Matrix.Translation((0.3, 0.95, 0.02)) @ R(-60, "Z") @ R(90, "Y") @ S(0.6, 1.0, 1.0)), tin, None, True)
M("litter_floss_stick", comp.merge(xf(comp.cyl(0.004, 0.3, seg=6), comp.Matrix.Translation((-0.4, -0.2, 0.005)) @ R(70, "Z") @ R(90, "Y")), xf(L.ico(0.03, (0, 0, 0), 2), comp.Matrix.Translation((-0.31, 0.06, 0.02)) @ S(1.4, 1, 0.6))), comp.mat("litter_floss", (0.9, 0.55, 0.7), rough=0.9), None, True)
M("litter_napkin", xf(comp.grid(0.16, 0.16, 4, 4), comp.Matrix.Translation((0.7, -0.15, 0.003)) @ R(33, "Z") @ R(90, "X")), paper)
# the flyer: lies flat; a lift pivot at its edge and a slide pivot
fs = comp.pivot(col, root, "litter_flyer_slide", (-0.3, -0.75, 0.002))
fl = comp.pivot(col, root, "litter_flyer_lift", (-0.3 + 0.074, -0.75, 0.002), parent=fs)
M("litter_flyer", comp.box((0.148, 0.21, 0.0006), at=(-0.3, -0.75, 0.002)), yellow, fl)
M("litter_flyer_print", comp.merge(comp.box((0.11, 0.03, 0.0002), at=(-0.3, -0.69, 0.0026)), *[comp.box((0.1 - 0.02 * (i % 2), 0.006, 0.0002), at=(-0.3, -0.73 - i * 0.014, 0.0026)) for i in range(6)]), ink, fl)
L.clip("blow", fs, {("location", 0): [(0, fs.location.x), (1, fs.location.x + 1.3)], ("location", 2): [(0, fs.location.z), (0.4, fs.location.z + 0.09), (1, fs.location.z + 0.003)]})
L.clip("blow", fl, {("rotation_euler", 1): [(0, 0), (1, math.pi)]})
L.clip("blow", slide, {("location", 0): [(0, slide.location.x), (1, slide.location.x + 0.9)]})
L.clip("blow", roll, {("rotation_euler", 1): [(0, 0), (1, 0.9 / 0.04)]})
L.clip("blow", bp, {("location", 0): [(0, bp.location.x), (1, bp.location.x + 1.1)]})
L.clip("blow", br, {("rotation_euler", 1): [(0, 0), (1, 1.1 / 0.035)]})
L.clip("blow", tp, {("location", 0): [(0, tp.location.x), (1, tp.location.x + 0.5)], ("rotation_euler", 2): [(0, 0), (1, math.radians(70))]})
comp.export(col, root, "ferris", "litter", made="blender/components/ferris/litter.py", source="own geometry", license="ours", credit="",
            rig={"blow": "a gust along +x: the flyer lifts, slides 1.3 m and turns over; a cup rolls 0.9 m; a paper ball rolls 1.1 m; the ticket strip skitters 0.5 m and turns 70 degrees"})
