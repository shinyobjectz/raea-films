# clocktower/movement: a flatbed turret-clock movement, 2 m long on its cast-iron stand, modelled by hand: two bed
# rails on four turned legs, brass plummer blocks, and the going train between the rails, every wheel cut with real
# teeth and meshed: the winding barrel with its rope and the 96-tooth great wheel (0.78 m, the shot's circle, at the
# front), a second arbor (24-leaf pinion, 72-tooth wheel, the setting dial on its front end), a third (24, 60) and
# the escape arbor (20-leaf pinion, a 30-tooth recoil escape wheel) under its anchor, the crutch hanging behind; the
# barrel's ratchet, click and winding square; a bevel wheel on the second arbor's back end for the leading-off rod
# (0.345 m behind the origin, 0.08 m left); a maker's plate. Front toward -y.
# Rig: "push" is the cursor's push: the great wheel 30 degrees and every wheel after it in its ratio (second -120,
# third 360, escape -1080; the setting hand with the second). "turn" is the train running: the great wheel one whole
# turn, second 4 back, third 12, escape 36 back (loops). "tick" rocks the anchor and crutch 8 degrees.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, gear, mesh_phase, bolt

col, root = comp.fresh("movement")
iron = comp.mat("movement_iron", (0.005, 0.022, 0.015), rough=0.5)
gilt = comp.mat("movement_gilt", (0.85, 0.66, 0.2), rough=0.35, metal=1.0)
brass = comp.mat("movement_brass", (0.72, 0.43, 0.1), rough=0.3, metal=1.0)
steel = comp.mat("movement_steel", (0.55, 0.56, 0.58), rough=0.3, metal=1.0)
dark = comp.mat("movement_blued", (0.05, 0.07, 0.13), rough=0.3, metal=1.0)
rope_m = comp.mat("movement_rope", (0.33, 0.24, 0.13), rough=0.9)
wood = comp.mat("movement_wood", (0.3, 0.17, 0.08), rough=0.6)
enamel = comp.mat("movement_enamel", (0.92, 0.9, 0.84), rough=0.3)
ink = comp.mat("movement_ink", (0.02, 0.02, 0.02), rough=0.5)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)

BED, RY, X0, X1 = 0.98, 0.25, -1.08, 0.92
AZ = BED + 0.075  # the arbors' height on their blocks
# --- the stand ------------------------------------------------------------------------------------------------------
rails = []
for y in (-RY, RY):
    rails.append(comp.box((X1 - X0, 0.06, 0.1), at=((X0 + X1) / 2, y, BED - 0.05)))
    rails.append(comp.box((X1 - X0 + 0.04, 0.085, 0.018), at=((X0 + X1) / 2, y, BED - 0.009)))
    rails.append(comp.box((X1 - X0 + 0.04, 0.085, 0.018), at=((X0 + X1) / 2, y, BED - 0.095)))
for x in (X0 + 0.03, X1 - 0.03):
    rails.append(comp.box((0.06, 2 * RY, 0.1), at=(x, 0, BED - 0.05)))
bed = M("movement_bed", comp.merge(*rails), iron)
comp.bevel(bed, 0.004, 2)
LEG = [(0.07, 0.0), (0.07, 0.02), (0.045, 0.04), (0.035, 0.1), (0.05, 0.2), (0.055, 0.25), (0.04, 0.3), (0.032, 0.5), (0.04, 0.68), (0.055, 0.74), (0.04, 0.78), (0.06, 0.84), (0.06, BED - 0.1)]
legs, feet = [], []
for x in (X0 + 0.06, X1 - 0.06):
    for y in (-RY, RY):
        legs.append(lathe(LEG, seg=24, at=(x, y, 0)))
        feet += [bolt((x + dx, y + dy, 0.02), 0.009, 0.008) for dx, dy in ((0.05, 0), (-0.05, 0), (0, 0.05), (0, -0.05))]
    legs.append(comp.box((0.03, 2 * RY, 0.05), at=(x, 0, 0.23)))
legs.append(comp.box((X1 - X0 - 0.12, 0.03, 0.05), at=((X0 + X1) / 2, 0, 0.23)))
M("movement_legs", comp.merge(*legs), iron, smooth=True)
M("movement_foot_bolts", comp.merge(*feet), steel)
# gilt lining and the maker's plate on the front rail
M("movement_lining", comp.merge(comp.box((X1 - X0 - 0.1, 0.002, 0.006), at=((X0 + X1) / 2, -RY - 0.031, BED - 0.025)), comp.box((X1 - X0 - 0.1, 0.002, 0.006), at=((X0 + X1) / 2, -RY - 0.031, BED - 0.075))), gilt)
plate = M("movement_plate", comp.box((0.36, 0.004, 0.036), at=(0.38, -RY - 0.045, BED - 0.05)), brass)
comp.bevel(plate, 0.002, 2)
M("movement_plate_words", xf(comp.text("STAY & SONS  TOWER CLOCKS  No. 31", 0.016, depth=0.0015), T(0.38, -RY - 0.0475, BED - 0.05)), ink)

# --- the train: arbors (x, z), each a pivot its wheels hang from -------------------------------------------------------
MOD = 0.008
A = {"barrel": (-0.56, AZ)}
A["second"] = (A["barrel"][0] + (96 + 24) * MOD / 2, AZ)
A["third"] = (A["second"][0] + (72 + 24) * MOD / 2, AZ)
ESC_T = math.radians(52)
A["escape"] = (A["third"][0] + (60 + 20) * MOD / 2 * math.cos(ESC_T), AZ + (60 + 20) * MOD / 2 * math.sin(ESC_T))
A["anchor"] = (A["escape"][0], A["escape"][1] + 0.19)
piv = {k: comp.pivot(col, root, f"movement_{k}", (x, 0, z)) for k, (x, z) in A.items()}


def at(k, bm, y=0.0):
    return xf(bm, T(A[k][0], y, A[k][1]))


def arbor(k, y0=-RY - 0.03, y1=RY + 0.03, r=0.014):
    return M(f"movement_{k}_arbor", comp.cyl(r, y1 - y0, at=(A[k][0], y0, A[k][1]), seg=16, axis="Y"), steel, parent=piv[k], smooth=True)


def blocks(k, name):
    bs, caps = [], []
    x, z = A[k]
    for y in (-RY, RY):
        bs.append(comp.box((0.11, 0.05, z - BED - 0.004), at=(x, y, (z + BED) / 2 - 0.002)))
        bs.append(comp.cyl(0.034, 0.05, at=(x, y - 0.025, z), seg=24, axis="Y"))
        bs.append(comp.box((0.15, 0.056, 0.012), at=(x, y, BED + 0.006)))
        caps += [bolt((x + s * 0.06, y, BED + 0.012), 0.008, 0.007) for s in (-1, 1)]
    b = M(f"movement_{name}_blocks", comp.merge(*bs), brass)
    comp.bevel(b, 0.003, 2)
    M(f"movement_{name}_bolts", comp.merge(*caps), steel)


for k in ("barrel", "second", "third"):
    arbor(k)
    blocks(k, k)
PH0 = 0.0
YG, YS, YT = -0.13, 0.0, 0.12  # the planes of the great wheel, the second wheel, the third wheel
great = M("movement_great_wheel", at("barrel", gear(96, MOD, 0.024, PH0, spokes=6), YG), brass, parent=piv["barrel"])
ph_p2 = mesh_phase(96, PH0, 0.0, 24)
M("movement_second_pinion", at("second", gear(24, MOD, 0.04, ph_p2, spokes=0, bore=0.013), YG), steel, parent=piv["second"])
PH2 = 0.3
M("movement_second_wheel", at("second", gear(72, MOD, 0.02, PH2, spokes=5), YS), brass, parent=piv["second"])
M("movement_third_pinion", at("third", gear(24, MOD, 0.036, mesh_phase(72, PH2, 0.0, 24), spokes=0, bore=0.013), YS), steel, parent=piv["third"])
PH3 = 0.1
M("movement_third_wheel", at("third", gear(60, MOD, 0.018, PH3, spokes=5), YT), brass, parent=piv["third"])
M("movement_escape_pinion", at("escape", gear(20, MOD, 0.034, mesh_phase(60, PH3, ESC_T, 20), spokes=0, bore=0.011), YT), steel, parent=piv["escape"])
M("movement_escape_wheel", at("escape", gear(30, 0.0085, 0.01, 0.0, spokes=4, rim=0.012, hub=0.022, bore=0.011, kind="escape"), -0.1), brass, parent=piv["escape"])
# collets pinning each wheel to its arbor
M("movement_collets", comp.merge(*[comp.cyl(0.024, 0.02, at=(A[k][0], y, A[k][1]), seg=20, axis="Y") for k, y in (("second", YS + 0.016), ("third", YT + 0.014))]), steel, smooth=True)

# the barrel: a drum with flanges, the rope wound on it in a helix and running down through the floor
bx, bz = A["barrel"]
BR, BY0, BY1 = 0.115, -0.085, 0.2
drum = lathe([(0.014, 0), (0.15, 0), (0.15, 0.012), (BR, 0.012), (BR, BY1 - BY0 - 0.012), (0.15, BY1 - BY0 - 0.012), (0.15, BY1 - BY0), (0.014, BY1 - BY0)], seg=48, at=(bx, BY0, bz), axis="Y")
M("movement_barrel_drum", drum, wood, parent=piv["barrel"], smooth=False)
pts = []
TURNS, RR = 11, 0.009
for i in range(TURNS * 14 + 1):
    a = math.pi + 2 * math.pi * i / 14
    pts.append((bx + (BR + RR) * math.cos(a), BY0 + 0.022 + (RR * 2.05) * i / 14, bz + (BR + RR) * math.sin(a)))
M("movement_rope_coil", comp.tube(pts, RR, res=2, sides=2), rope_m, parent=piv["barrel"], smooth=True)
M("movement_rope_fall", comp.cyl(RR, bz, at=(bx - BR - RR, BY0 + 0.022, 0), seg=10), rope_m, smooth=True)
# the ratchet on the barrel's front and its click on the rail
M("movement_ratchet", at("barrel", gear(24, 0.0075, 0.014, 0.0, spokes=0, bore=0.013, kind="escape"), -0.19), steel, parent=piv["barrel"])
click = comp.merge(comp.box((0.09, 0.012, 0.014), at=(-0.045, -0.19, 0)), comp.cyl(0.011, 0.05, at=(0, -0.215, 0), seg=12, axis="Y"))
xf(click, R(-35, "Y")); xf(click, T(bx + 0.165, 0, bz - 0.02))
M("movement_click", click, steel)
# the winding square on the barrel's front end (clocktower/crank fits it)
M("movement_winding_square", comp.box((0.02, 0.07, 0.02), at=(bx, -RY - 0.06, bz)), steel, parent=piv["barrel"])
# the bevel wheel on the second arbor's back end, which the leading-off rod's bevel sits on (clocktower/leading-off)
sx0, sz0 = A["second"]
M("movement_second_arbor_back", comp.cyl(0.014, 0.12, at=(sx0, RY + 0.03, sz0), seg=16, axis="Y"), steel, parent=piv["second"], smooth=True)
M("movement_bevel", xf(_lib.bevel_gear(24, 0.006, 0.03, 0.0), T(sx0, RY + 0.095, sz0)), brass, parent=piv["second"])
# the setting dial on the second arbor's front end: an enamel disc on the rail, a hand on the arbor
sx, sz = A["second"]
M("movement_setting_dial", comp.cyl(0.085, 0.006, at=(sx, -RY - 0.034, sz), seg=48, axis="Y"), enamel, smooth=False)
ticks = []
for i in range(60):
    a = 2 * math.pi * i / 60
    long = i % 5 == 0
    t = comp.box((0.0045 if long else 0.002, 0.0015, 0.016 if long else 0.008), at=(0, 0, 0.074 if long else 0.077))
    xf(t, R(math.degrees(a), "Y")); xf(t, T(sx, -RY - 0.0348, sz)); ticks.append(t)
M("movement_setting_ticks", comp.merge(*ticks), ink)
hand = comp.merge(comp.taper((0, 0, 0), (0.07, 0, 0), 0.012, 0.003, 0.002, 0.002), comp.taper((0, 0, 0), (-0.022, 0, 0), 0.012, 0.014, 0.002, 0.002))
xf(hand, R(90, "X")); xf(hand, R(-70, "Y")); xf(hand, T(sx, -RY - 0.04, sz))
M("movement_setting_hand", comp.merge(hand, comp.cyl(0.011, 0.008, at=(sx, -RY - 0.046, sz), seg=16, axis="Y")), dark, parent=piv["second"])

# the escapement's cock: two uprights on the rails carrying the escape and anchor arbors
ex, ez = A["escape"]
up = bmesh.new()
for y in (-RY, RY):
    s = 1 if y > 0 else -1
    prof = [(-0.065, BED), (0.065, BED), (0.04, ez), (0.035, A["anchor"][1] + 0.04), (-0.035, A["anchor"][1] + 0.04), (-0.04, ez)]
    f = [up.verts.new((ex + px, y - 0.012, pz)) for px, pz in prof]
    b = [up.verts.new((ex + px, y + 0.012, pz)) for px, pz in prof]
    up.faces.new(f); up.faces.new(list(reversed(b)))
    for i in range(len(prof)):
        j = (i + 1) % len(prof)
        up.faces.new((f[j], f[i], b[i], b[j]))
bmesh.ops.recalc_face_normals(up, faces=up.faces)
u = M("movement_cock", comp.merge(up, *[comp.cyl(0.028, 0.04, at=(ex, y - 0.02, z), seg=20, axis="Y") for y in (-RY, RY) for z in (ez, A["anchor"][1])],
                                  *[comp.box((0.16, 0.056, 0.012), at=(ex, y, BED + 0.006)) for y in (-RY, RY)]), iron)
comp.bevel(u, 0.003, 2)
arbor("escape", r=0.011)
arbor("anchor", y1=RY + 0.1, r=0.011)
# the anchor: two arms down to their pallets either side of the escape wheel
ax, az = A["anchor"]
arms = []
for s in (-1, 1):
    arm = comp.box((0.022, 0.012, 0.2), at=(0, 0, -0.1))
    pal = comp.box((0.03, 0.016, 0.03), at=(-s * 0.012, 0, -0.2))
    arms.append(xf(comp.merge(arm, pal), comp.Matrix.Translation((ax, -0.1, az)) @ R(s * 38, "Y")))
arms.append(comp.cyl(0.026, 0.03, at=(ax, -0.115, az), seg=20, axis="Y"))
an = M("movement_anchor", comp.merge(*arms), steel, parent=piv["anchor"])
comp.bevel(an, 0.003, 2)
# the crutch behind the back rail, its fork at the bottom taking the pendulum rod
crutch = comp.merge(comp.box((0.012, 0.008, 0.52), at=(ax, RY + 0.08, az - 0.26)), comp.box((0.05, 0.03, 0.012), at=(ax, RY + 0.095, az - 0.52)),
                    comp.box((0.01, 0.03, 0.05), at=(ax - 0.02, RY + 0.095, az - 0.54)), comp.box((0.01, 0.03, 0.05), at=(ax + 0.02, RY + 0.095, az - 0.54)))
M("movement_crutch", crutch, steel, parent=piv["anchor"])

# --- the rig -------------------------------------------------------------------------------------------------------
G = math.radians(30)
RAT = {"barrel": 1.0, "second": -96 / 24, "third": 96 / 24 * 72 / 24, "escape": -96 / 24 * 72 / 24 * 60 / 20}
comp.channel("push", [(piv[k], "rotation_euler", 1, 0, G * r) for k, r in RAT.items()])
comp.channel("turn", [(piv[k], "rotation_euler", 1, 0, 2 * math.pi * r) for k, r in RAT.items()])
comp.channel("tick", [(piv["anchor"], "rotation_euler", 1, math.radians(-4), math.radians(4))])
comp.export(col, root, "clocktower", "movement", made="blender/components/clocktower/movement.py", source="own geometry (a generic flatbed turret-clock movement); letters in Blender's built-in font", license="ours", credit="",
            rig={"push": "the great wheel (movement_barrel) 30 degrees and the train after it in ratio: second -120, third 360, escape -1080 degrees",
                 "turn": "the train running, loops: the great wheel one whole turn, second 4 turns back, third 12, escape 36 back",
                 "tick": "the anchor and its crutch rock from -4 to 4 degrees"},
            notes="The great wheel (0.78 m across, centre 1.055 m up, 0.56 m left of the origin, facing the front) is the shot's circle.")
