# subway/train: a 1930s steel subway car, 15.6 m, seen head-on, modelled by hand: a riveted body with an arched roof
# and ventilators, the front end with its storm door and safety chains, two cab windows, grab irons, a wiper, a
# ribbed anticlimber, coupler and air hoses, roll signs (STAY ST, LOCAL: our own), marker lamps, and high in the
# middle the one big headlight in its chromed bezel (the shot's circle; its lens is its own material,
# train_headlight); down each side three pairs of sliding doors, fourteen windows lit from inside (train_window), a
# belt rail and letterboard with rivets, the car's number; underneath two trucks (side frames, springs, journal
# boxes, four axles of flanged wheels on the rails), a third-rail shoe beam, and the equipment boxes.
# Origin: the track's centre on the bed, the car's front face at y 0, the car running back along +y.
# Rig: "arrive" runs the whole car 20 m toward the front (-y), its wheels rolling 7.4 turns with it (the cursor
# pulling it in by its light; start it deep in the tunnel); "wheels" turns every axle once (loops); "doors" slides the
# platform side's six leaves 0.62 m open; "headlight" is the scene's: train_headlight's glow and the beam.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, sphere, prism, slab, bolt

col, root = comp.fresh("train")
green = comp.mat("train_body", (0.022, 0.05, 0.032), rough=0.42, metal=0.3)
roof_m = comp.mat("train_roof", (0.05, 0.05, 0.052), rough=0.7)
black = comp.mat("train_under", (0.02, 0.02, 0.022), rough=0.6, metal=0.4)
steel = comp.mat("train_steel", (0.5, 0.5, 0.52), rough=0.3, metal=1.0)
chrome = comp.mat("train_chrome", (0.9, 0.9, 0.92), rough=0.08, metal=1.0)
wheel_m = comp.mat("train_wheel", (0.16, 0.13, 0.11), rough=0.5, metal=0.8)
tread = comp.mat("train_tread", (0.7, 0.7, 0.72), rough=0.2, metal=1.0)
glass = comp.mat("train_window", (0.85, 0.75, 0.5), rough=0.15, emit=(1.0, 0.82, 0.5), strength=900.0)
cab = comp.mat("train_cab_glass", (0.02, 0.025, 0.03), rough=0.05)
lens = comp.mat("train_headlight", (1.0, 0.98, 0.9), rough=0.1, emit=(1.0, 0.95, 0.8), strength=500000.0)
marker = comp.mat("train_marker", (0.9, 0.5, 0.05), rough=0.2, emit=(1.0, 0.5, 0.05), strength=3000.0)
sign_bg = comp.mat("train_sign", (0.012, 0.012, 0.012), rough=0.5)
sign_fg = comp.mat("train_sign_letters", (0.95, 0.93, 0.85), rough=0.5, emit=(1.0, 0.95, 0.85), strength=500.0)
gold = comp.mat("train_number", (0.8, 0.62, 0.2), rough=0.4)
hose = comp.mat("train_hose", (0.015, 0.015, 0.015), rough=0.7)
inside = comp.mat("train_inside", (0.5, 0.42, 0.28), rough=0.6, emit=(1.0, 0.8, 0.5), strength=500.0)
wood = comp.mat("train_shoe_beam", (0.22, 0.14, 0.08), rough=0.7)
run = comp.pivot(col, root, "train_run", (0, 0, 0))
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent or run, smooth=smooth)
L, HW, FL, EV = 15.6, 1.35, 1.15, 3.25  # length, half width, floor, eaves
ROOF = [(HW, EV), (1.28, 3.4), (1.1, 3.55), (0.8, 3.68), (0.45, 3.76), (0.0, 3.79)]
prof = [(-HW, FL), (HW, FL)] + ROOF + [(-x, z) for x, z in reversed(ROOF[:-1])]
M("train_body", prism(prof, 0.0, L), green)
roofp = [(x * 1.004, z + 0.006) for x, z in ROOF] + [(-x * 1.004, z + 0.006) for x, z in reversed(ROOF[:-1])]
M("train_roof", comp.merge(prism(roofp + [(-HW * 1.004, EV + 0.02), (HW * 1.004, EV + 0.02)][:0], -0.01, L + 0.01), *[comp.box((0.5, 0.9, 0.14), at=(0, 1.6 + i * 2.5, 3.83)) for i in range(6)]), roof_m)

# --- the front end (y 0, facing -y) ---------------------------------------------------------------------------------
F = 0.0
front = [slab(-0.47, 0.47, F - 0.03, F, 1.2, 3.12)]  # the door's frame
front += [slab(-HW, HW, F - 0.02, F, 1.98, 2.04), slab(-HW, HW, F - 0.02, F, 3.1, 3.16)]  # belt rail, letterboard
front += [slab(s * HW - 0.04, s * HW + 0.04, F - 0.02, F, FL, EV) for s in (-1, 1)]  # corner posts
for s in (-1, 1):
    front += [slab(s * 0.875 - 0.36, s * 0.875 + 0.36, F - 0.025, F, z, z + 0.04) for z in (2.08, 2.9)]
    front += [slab(s * 0.875 + d * 0.36 - 0.02, s * 0.875 + d * 0.36 + 0.02, F - 0.025, F, 2.08, 2.94) for d in (-1, 1)]
M("train_front_trim", comp.merge(*front), green)
M("train_storm_door", comp.merge(slab(-0.42, 0.42, F - 0.04, F - 0.03, 1.22, 3.08), slab(-0.3, 0.3, F - 0.05, F - 0.04, 1.3, 1.95), comp.box((0.03, 0.05, 0.12), at=(0.34, F - 0.06, 2.0))), green)
M("train_cab_glass", comp.merge(*[slab(s * 0.875 - 0.34, s * 0.875 + 0.34, F - 0.012, F - 0.008, 2.12, 2.9) for s in (-1, 1)]), cab)
M("train_door_glass", slab(-0.27, 0.27, F - 0.046, F - 0.04, 2.12, 2.92), glass)
# the headlight: a spun bowl and chromed bezel on a bracket at the roof line
HZ = 3.42
M("train_headlight_bowl", lathe([(0.0, 0.0), (0.1, 0.01), (0.165, 0.06), (0.185, 0.14), (0.185, 0.2)], seg=48, at=(0, F + 0.02, HZ), axis="Y") if False else xf(lathe([(0.0, 0.0), (0.1, -0.01), (0.165, -0.06), (0.185, -0.14), (0.185, -0.2)], seg=48, axis="Y"), T(0, F + 0.02, HZ)), black, smooth=True)
M("train_headlight_bezel", xf(_lib.lathe([(0.15, -0.2), (0.15, -0.215), (0.2, -0.215), (0.2, -0.185), (0.185, -0.185)], seg=48, axis="Y"), T(0, F + 0.02, HZ)), chrome, smooth=True)
M("train_headlight_lens", xf(lathe([(0.0, -0.212), (0.08, -0.208), (0.152, -0.196)], seg=48, axis="Y"), T(0, F + 0.02, HZ)), lens, smooth=True)
M("train_headlight_bracket", comp.merge(slab(-0.2, 0.2, F - 0.1, F + 0.05, HZ - 0.22, HZ - 0.19), slab(-0.03, 0.03, F - 0.08, F, HZ - 0.3, HZ - 0.19)), green)
mk = []
for s in (-1, 1):
    mk.append(xf(lathe([(0.0, -0.05), (0.04, -0.045), (0.05, -0.02), (0.05, 0.0)], seg=20, axis="Y"), T(s * 1.05, F, 3.33)))
M("train_marker_lamps", comp.merge(*mk), marker, smooth=True)
M("train_marker_rims", comp.merge(*[xf(lathe([(0.05, -0.03), (0.062, -0.03), (0.062, 0.0)], seg=20, axis="Y"), T(s * 1.05, F, 3.33)) for s in (-1, 1)]), chrome, smooth=True)
# roll signs over the cab windows, the car's number under the right one
M("train_sign_boxes", comp.merge(*[slab(s * 0.875 - 0.34, s * 0.875 + 0.34, F - 0.03, F, 2.955, 3.095) for s in (-1, 1)]), sign_bg)
M("train_sign_letters", comp.merge(xf(comp.text("STAY ST", 0.095, depth=0.002), T(-0.875, F - 0.031, 3.025)), xf(comp.text("LOCAL", 0.095, depth=0.002), T(0.875, F - 0.031, 3.025))), sign_fg)
M("train_number", comp.merge(xf(comp.text("31", 0.16, depth=0.003), T(0.875, F - 0.003, 1.7)),
                              *[xf(xf(comp.text("31", 0.2, depth=0.003), R(s * 90, "Z")), T(s * (HW + 0.002), 6.9, 1.6)) for s in (-1, 1)]), gold)
# the anticlimber, coupler and hoses
anti = [slab(-1.2, 1.2, F - 0.14, F + 0.05, 1.03 + i * 0.055, 1.03 + i * 0.055 + 0.03) for i in range(4)] + [slab(-1.2, 1.2, F - 0.1, F + 0.05, 1.03, 1.225)]
M("train_anticlimber", comp.merge(*anti), black)
cp = comp.merge(slab(-0.12, 0.12, F - 0.3, F + 0.5, 0.74, 0.94), slab(-0.17, 0.17, F - 0.42, F - 0.3, 0.7, 0.98), comp.cyl(0.05, 0.3, at=(0.09, F - 0.46, 0.69), seg=12), slab(-0.5, 0.5, F + 0.1, F + 0.2, 0.9, 1.05))
c = M("train_coupler", cp, black)
comp.bevel(c, 0.01, 2)
hs = []
for x in (-0.5, 0.45, 0.6):
    hs.append(comp.tube([(x, F + 0.05, 1.0), (x, F - 0.1, 0.95), (x + 0.03, F - 0.2, 0.7), (x + 0.1, F - 0.22, 0.55), (x + 0.2, F - 0.18, 0.62)], 0.022, res=4, sides=2))
M("train_hoses", comp.merge(*hs), hose, smooth=True)
ch = []
for z in (1.75, 2.0, 2.25):
    ch.append(comp.tube([(-0.5 + i * 0.1, F - 0.075, z - 0.09 * math.sin(math.pi * i / 10)) for i in range(11)], 0.008, res=2, sides=1))
M("train_chains", comp.merge(*ch), steel, smooth=True)
gr = []
for s in (-1, 1):
    gr += [comp.cyl(0.013, 1.2, at=(s * 0.53, F - 0.08, 1.45), seg=10), comp.cyl(0.01, 0.08, at=(s * 0.53, F - 0.08, 1.47), seg=8, axis="Y"), comp.cyl(0.01, 0.08, at=(s * 0.53, F - 0.08, 2.63), seg=8, axis="Y")]
gr += [xf(comp.box((0.012, 0.012, 0.5), at=(0, 0, 0.25)), comp.Matrix.Translation((0.875, F - 0.03, 2.1)) @ R(-35, "Y")), comp.cyl(0.014, 0.03, at=(0.875, F - 0.04, 2.1), seg=10, axis="Y")]
gr += [slab(-0.45, 0.45, F - 0.2, F - 0.14, 1.19, 1.215)]
M("train_irons", comp.merge(*gr), steel, smooth=False)
rv = []
for s in (-1, 1):
    rv += [sphere(0.011, at=(s * (HW - 0.04), F - 0.02, 1.25 + i * 0.13), scale=(1, 0.6, 1), u=8, v=4) for i in range(15)]
    rv += [sphere(0.011, at=(s * (0.52 + i * 0.105), F - 0.02, 2.01), scale=(1, 0.6, 1), u=8, v=4) for i in range(8)]
    rv += [sphere(0.011, at=(s * (0.05 + i * 0.105), F - 0.02, 3.13), scale=(1, 0.6, 1), u=8, v=4) for i in range(13)]

# --- the sides -------------------------------------------------------------------------------------------------------
DOORS, WINS = (2.2, 7.8, 13.4), (0.75, 3.85, 4.9, 5.95, 9.45, 10.5, 11.55, 14.85)
trim, glz, sills, dark, leaves = [], [], [], [], []
for s in (-1, 1):
    X = s * HW
    trim += [slab(X - 0.012 if s < 0 else X, X if s < 0 else X + 0.012, 0.0, L, z0, z1) for z0, z1 in ((1.98, 2.04), (3.1, 3.18), (FL, FL + 0.08))]
    for y in WINS:
        glz.append(slab(X - 0.006 if s < 0 else X, X if s < 0 else X + 0.006, y - 0.36, y + 0.36, 2.1, 2.9))
        for z in (2.08, 2.9):
            sills.append(slab(X - 0.022 if s < 0 else X, X if s < 0 else X + 0.022, y - 0.4, y + 0.4, z, z + 0.035))
        for d in (-1, 1):
            sills.append(slab(X - 0.022 if s < 0 else X, X if s < 0 else X + 0.022, y + d * 0.38 - 0.02, y + d * 0.38 + 0.02, 2.08, 2.935))
    for y in DOORS:
        dark.append(slab(X - 0.004 if s < 0 else X, X if s < 0 else X + 0.004, y - 0.62, y + 0.62, 1.2, 3.08))
        for d in (-1, 1):
            leaves.append((s, y, d))
    rv += [sphere(0.011, at=(X + s * 0.012, 0.1 + i * 0.155, z), scale=(0.6, 1, 1), u=8, v=4) for i in range(100) for z in (2.01, 3.14)]
M("train_side_trim", comp.merge(*trim, *sills), green)
M("train_windows", comp.merge(*glz), glass)
M("train_doorways", comp.merge(*dark), inside)
M("train_rivets", comp.merge(*rv), green)
door_piv = []
for s, y, d in leaves:
    X = s * HW
    side = "platform" if s > 0 else "far"
    nm = f"train_door_{side}_{DOORS.index(y) + 1}{'ab'[d > 0]}"
    y0, y1 = (y - 0.62, y) if d < 0 else (y, y + 0.62)
    xa, xb = (X - 0.022, X - 0.006) if s < 0 else (X + 0.006, X + 0.022)
    p = comp.pivot(col, root, nm, (X, (y0 + y1) / 2, 2.1), parent=run)
    lf = comp.merge(slab(xa, xb, y0 + 0.005, y1 - 0.005, 1.2, 3.08), slab(xa - 0.004 if s < 0 else xb, xa if s < 0 else xb + 0.004, y0 + 0.08, y1 - 0.08, 1.3, 1.95))
    M(nm + "_leaf", lf, green, parent=p)
    M(nm + "_glass", slab(xa - 0.003 if s < 0 else xb, xa if s < 0 else xb + 0.003, y0 + 0.1, y1 - 0.1, 2.1, 2.9), glass, parent=p)
    M(nm + "_edge", slab(xa - 0.004 if s < 0 else xb, xa if s < 0 else xb + 0.004, (y1 - 0.03) if d < 0 else y0, y1 if d < 0 else y0 + 0.03, 1.2, 3.08), black, parent=p)
    if s > 0:
        door_piv.append((p, d))

# --- underneath ------------------------------------------------------------------------------------------------------
WR, GX = 0.43, 1.435 / 2 + 0.035
WHEEL = [(0.0, -0.07), (0.1, -0.07), (0.12, -0.045), (0.34, -0.03), (0.36, -0.065), (WR + 0.028, -0.065), (WR + 0.03, -0.045), (WR, -0.035), (WR - 0.006, 0.07), (0.36, 0.07), (0.34, 0.03), (0.12, 0.05), (0.1, 0.1), (0.0, 0.1)]
axles, under, frames = [], [], []
for ty in (2.6, 13.0):
    for dy in (-1.0, 1.0):
        y = ty + dy
        ap = comp.pivot(col, root, f"train_axle_{len(axles) + 1}", (0, y, 0.3 + WR), parent=run)
        ws = []
        for s in (-1, 1):
            w = lathe(WHEEL, seg=40)
            xf(w, R(s * 90, "Y")); xf(w, T(s * GX, y, 0.3 + WR)); ws.append(w)  # flanges inside the rails
        M(f"train_axle_{len(axles) + 1}_wheels", comp.merge(*ws), wheel_m, parent=ap, smooth=True)
        M(f"train_axle_{len(axles) + 1}_shaft", comp.merge(comp.cyl(0.075, 2.3, at=(-1.15, y, 0.3 + WR), seg=16, axis="X"), comp.box((0.3, 0.02, 0.5), at=(0, y, 0.3 + WR))), black, parent=ap)
        axles.append(ap)
        for s in (-1, 1):
            frames += [comp.box((0.16, 0.26, 0.26), at=(s * 1.14, y, 0.3 + WR)), comp.cyl(0.07, 0.03, at=(s * 1.22 - (0.03 if s < 0 else 0), y, 0.3 + WR), seg=12, axis="X")]
    for s in (-1, 1):
        frames += [slab(s * 1.14 - 0.04, s * 1.14 + 0.04, ty - 1.35, ty + 1.35, 0.3 + WR + 0.13, 0.3 + WR + 0.27), slab(s * 1.14 - 0.03, s * 1.14 + 0.03, ty - 0.5, ty + 0.5, 0.42, 0.5)]
        frames += [comp.cyl(0.06, 0.36, at=(s * 1.14, ty + d * 0.22, 0.5), seg=12) for d in (-1, 1)]
    frames += [slab(-1.2, 1.2, ty - 0.2, ty + 0.2, 0.86, 1.02), slab(-0.9, 0.9, ty - 0.6, ty + 0.6, 1.02, FL)]
    under += [slab(-1.56, -1.3, ty - 0.8, ty + 0.8, 0.5, 0.58)]
M("train_trucks", comp.merge(*frames), black)
M("train_shoe_beams", comp.merge(*under), wood)
M("train_shoes", comp.merge(*[slab(-1.5, -1.34, ty - 0.2, ty + 0.2, 0.362, 0.39) for ty in (2.6, 13.0)], *[slab(-1.45, -1.39, ty - 0.03, ty + 0.03, 0.39, 0.5) for ty in (2.6, 13.0)]), steel)
eq = [slab(-1.1, -0.3, 5.0, 6.6, 0.5, 1.1), slab(0.3, 1.15, 5.2, 7.4, 0.55, 1.1), slab(-1.15, 1.15, 8.2, 9.0, 0.6, 1.1), slab(-1.0, 0.2, 9.6, 11.0, 0.45, 1.1), comp.cyl(0.2, 1.6, at=(0.7, 9.4, 0.8), seg=20, axis="Y")]
eq += [slab(-1.3, 1.3, 0.0, L, 1.05, FL)]
e = M("train_equipment", comp.merge(*eq), black)
comp.bevel(e, 0.01, 2)

# --- the rig ---------------------------------------------------------------------------------------------------------
RUN = 20.0
comp.channel("arrive", [(run, "location", 1, 0.0, -RUN)] + [(a, "rotation_euler", 0, 0.0, RUN / WR) for a in axles])
comp.channel("wheels", [(a, "rotation_euler", 0, 0.0, 2 * math.pi) for a in axles])
comp.channel("doors", [(p, "location", 1, p.location.y, p.location.y + d * 0.62) for p, d in door_piv])
comp.export(col, root, "subway", "train", made="blender/components/subway/train.py", source="own geometry (a generic 1930s steel subway car); letters in Blender's built-in font", license="ours", credit="",
            rig={"arrive": "the whole car runs 20 m toward the front along the track, its wheels rolling 7.4 turns with it",
                 "wheels": "every axle one whole turn, loops",
                 "doors": "the platform side's six door leaves slide 0.62 m open",
                 "headlight": "in the scene: the material train_headlight's glow and the beam it throws, a key per state"},
            notes="The headlight (0.37 m across its bezel, 3.42 m above the bed on the car's centre line) is the shot's circle. Stand the car on subway/track at the same x; its floor is level with subway/platform's deck.")
