# laundromat/dryer: a commercial stack dryer, two 30 lb pockets one over the other, 0.8 m wide and 1.95 m tall, modelled
# by hand: a painted steel cabinet, a stainless front in panels (a lint drawer with its louvre and lock, the two
# pockets, the control strip between them with a coin drop, a display and heat buttons for each pocket), and in each
# pocket a round door on two hinge knuckles (a cast ring, flat glass, a pull handle) over a throat that leads to a
# perforated drum with three lifter ribs and a lamp in the throat's roof. Its front faces -y; it stands on the floor.
# Rig: "drum" turns both drums one whole turn about their axles; "door" swings the upper pocket's door 115 degrees
# open on its hinge (the cursor's pull; the shot's circle on the upper right); "door lower" the lower one. The lamps
# are their own material (dryer_light): the window's glow is the scene's.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, holed, disc, label, rbox, T, R, S, xf
import bmesh
from mathutils import Vector

col, root = comp.fresh("dryer")
M = _lib.maker(col, root)
steel = comp.mat("dryer_steel", (0.7, 0.71, 0.72), rough=0.34, metal=0.55)
paint = comp.mat("dryer_cabinet", (0.8, 0.8, 0.76), rough=0.5)
dark = comp.mat("dryer_dark", (0.03, 0.03, 0.035), rough=0.6)
drum_m = comp.mat("dryer_drum", (0.74, 0.75, 0.76), rough=0.4, metal=0.3)
hole_m = comp.mat("dryer_holes", (0.02, 0.02, 0.022), rough=0.8)
chrome = comp.mat("dryer_chrome", (0.88, 0.88, 0.9), rough=0.12, metal=1.0)
ring_m = comp.mat("dryer_door_ring", (0.78, 0.79, 0.8), rough=0.25, metal=0.6)
glass = _lib.glass("dryer_glass", alpha=0.1)
gasket = comp.mat("dryer_gasket", (0.05, 0.05, 0.055), rough=0.7)
light = comp.mat("dryer_light", (1.0, 0.95, 0.82), rough=0.4, emit=(1.0, 0.86, 0.6), strength=4.0)
panel = comp.mat("dryer_panel", (0.05, 0.06, 0.08), rough=0.25)
display = comp.mat("dryer_display", (0.9, 0.12, 0.05), rough=0.4, emit=(1.0, 0.12, 0.04), strength=3.0)
white = comp.mat("dryer_print", (0.92, 0.92, 0.9), rough=0.5)
red = comp.mat("dryer_button_hot", (0.75, 0.1, 0.06), rough=0.4)
amber = comp.mat("dryer_button_warm", (0.85, 0.5, 0.06), rough=0.4)
blue = comp.mat("dryer_button_cool", (0.1, 0.3, 0.7), rough=0.4)

W, D, H = 0.80, 0.92, 1.95
YF = -D / 2
TOE, LINT, POCKET, CTRL = 0.08, 0.18, 0.74, 0.20
Z_LOW = TOE + LINT + POCKET / 2          # 0.63
Z_CTRL = TOE + LINT + POCKET             # 1.00
Z_UP = Z_CTRL + CTRL + POCKET / 2        # 1.57
R_OPEN, R_DRUM, DRUM_D = 0.235, 0.345, 0.62

# --- the cabinet: two sides, a top, a floor and a back, hollow so the drums show -----------------------------------
t = 0.02
cab = comp.merge(comp.box((t, D, H - TOE), at=(-W / 2 + t / 2, 0, TOE + (H - TOE) / 2)), comp.box((t, D, H - TOE), at=(W / 2 - t / 2, 0, TOE + (H - TOE) / 2)),
                 comp.box((W, D, t), at=(0, 0, H - t / 2)), comp.box((W, D, t), at=(0, 0, TOE + t / 2)), comp.box((W, t, H - TOE), at=(0, D / 2 - t / 2, TOE + (H - TOE) / 2)),
                 comp.box((W, D - 0.1, t), at=(0, 0.05, Z_CTRL + CTRL / 2)))
c = M("dryer_cabinet", cab, paint)
comp.bevel(c, 0.003, 2)
M("dryer_toe", comp.box((W - 0.04, D - 0.06, TOE), at=(0, 0.03, TOE / 2)), dark)
M("dryer_feet", comp.merge(*[comp.cyl(0.02, 0.012, at=(x, y, 0), seg=12) for x in (-W / 2 + 0.06, W / 2 - 0.06) for y in (YF + 0.05, D / 2 - 0.06)]), dark)
# a flue collar and a junction box on the top, where the duct and the feed come in
M("dryer_flue", comp.merge(turn([(0.1, 0), (0.1, 0.06), (0.104, 0.06), (0.104, 0.07), (0.095, 0.07), (0.095, 0.0)], seg=32, at=(0.12, 0.2, H)), comp.box((0.16, 0.1, 0.05), at=(-0.22, 0.28, H + 0.025))), steel, smooth=True)

# --- the front's fixed panels ------------------------------------------------------------------------------------------
def screws(pts, y):
    return comp.merge(*[turn([(0.0, 0.003), (0.004, 0.003), (0.006, 0.0)], seg=10, axis="F", at=(x, y, z)) for x, z in pts])

lint = M("dryer_lint_panel", rbox((W - 0.012, 0.018, LINT - 0.008), at=(0, YF + 0.009, TOE + LINT / 2), r=0.004), steel)
M("dryer_lint_louvre", comp.merge(*[xf(xf(comp.box((0.34, 0.006, 0.013)), R(-28, "X")), T(-0.16, YF - 0.002, TOE + 0.04 + i * 0.024)) for i in range(5)]), dark)
M("dryer_lint_recess", comp.box((0.36, 0.004, 0.125), at=(-0.16, YF + 0.001, TOE + LINT / 2)), dark)
M("dryer_lint_handle", comp.merge(rbox((0.16, 0.022, 0.02), at=(0.2, YF - 0.022, TOE + LINT / 2 + 0.02), r=0.006), comp.box((0.014, 0.022, 0.014), at=(0.135, YF - 0.008, TOE + LINT / 2 + 0.02)), comp.box((0.014, 0.022, 0.014), at=(0.265, YF - 0.008, TOE + LINT / 2 + 0.02))), chrome)
M("dryer_lint_lock", comp.merge(turn([(0.0, 0.008), (0.011, 0.008), (0.013, 0.0)], seg=20, axis="F", at=(0.33, YF, TOE + LINT / 2 + 0.02)), comp.box((0.003, 0.002, 0.012), at=(0.33, YF - 0.0085, TOE + LINT / 2 + 0.02))), chrome, smooth=True)
M("dryer_lint_label", label("LINT SCREEN - CLEAN DAILY", 0.016, (0.2, YF - 0.0006, TOE + LINT / 2 - 0.035)), dark)

drums, doors = [], []
for tag, zc in (("lower", Z_LOW), ("upper", Z_UP)):
    plate = M(f"dryer_front_{tag}", holed(W - 0.012, POCKET - 0.008, R_OPEN + 0.012, seg=72), steel)
    plate.location = (0, YF, zc)
    comp.solidify(plate, 0.018, -1)
    M(f"dryer_front_{tag}_screws", screws([(sx * (W / 2 - 0.03), zc + sz * (POCKET / 2 - 0.028)) for sx in (-1, 1) for sz in (-1, 1)], YF - 0.003), chrome)
    # the throat: a rolled lip round the opening and a cone back to the drum's mouth
    M(f"dryer_throat_{tag}", turn([(R_OPEN + 0.02, 0.006), (R_OPEN + 0.006, 0.01), (R_OPEN, 0.0), (R_OPEN, -0.05), (R_OPEN + 0.03, -0.1), (R_DRUM - 0.03, -0.1)], seg=72, axis="F", at=(0, YF, zc)), steel, smooth=True)
    M(f"dryer_lamp_{tag}", xf(xf(rbox((0.09, 0.03, 0.012), r=0.004), R(20, "X")), T(0, YF + 0.075, zc + R_OPEN + 0.012)), light)
    # what stands behind the drum: the pocket's dark back wall and the bearing boss
    M(f"dryer_bulkhead_{tag}", comp.box((W - 0.05, 0.01, POCKET - 0.03), at=(0, YF + 0.105 + DRUM_D + 0.03, zc)), dark)

    # the drum, on its axle
    y0 = YF + 0.105                      # the drum's mouth
    dp = comp.pivot(col, root, f"dryer_drum_{tag}", (0, y0 + DRUM_D / 2, zc))
    sh = M(f"dryer_drum_{tag}_shell", turn([(R_OPEN + 0.035, 0.0), (R_DRUM, -0.035), (R_DRUM, -DRUM_D), (0.0, -DRUM_D)], seg=72, axis="F", at=(0, y0, zc)), drum_m, parent=dp, smooth=True)
    comp.solidify(sh, 0.004, 1)
    holes = []
    for k in range(1, 10):               # the back plate's rings of perforations
        rr = 0.045 + k * 0.031
        n = int(2 * math.pi * rr / 0.034)
        for j in range(n):
            a = 2 * math.pi * (j + 0.5 * (k % 2)) / n
            holes.append(disc(0.0062, seg=6, at=(rr * math.cos(a), y0 + DRUM_D - 0.005, zc + rr * math.sin(a))))
    for i in range(72):                  # the wall's perforations, between the ribs
        a = 2 * math.pi * i / 72
        if min(abs(((math.degrees(a) - c0 + 180) % 360) - 180) for c0 in (0, 120, 240)) < 9:
            continue
        for k in range(14):
            q = comp.box((0.011, 0.011, 0.001))
            xf(q, T(0, 0, -(R_DRUM - 0.0052)))
            xf(q, R(math.degrees(a), "Y"))
            xf(q, T(0, y0 + 0.07 + k * 0.038 + (0.019 if i % 2 else 0), zc))
            holes.append(q)
    M(f"dryer_drum_{tag}_holes", comp.merge(*holes), hole_m, parent=dp)
    ribs = []
    for c0 in (0, 120, 240):             # three lifter ribs: what makes the turn read
        rib = rbox((0.075, DRUM_D - 0.1, 0.07), r=0.022, seg=4)
        for v in rib.verts:
            if v.co.z > 0:
                v.co.x *= 0.45
        xf(rib, T(0, 0, -(R_DRUM - 0.036)))
        xf(rib, R(c0, "Y"))
        xf(rib, T(0, y0 + DRUM_D / 2 + 0.01, zc))
        ribs.append(rib)
    M(f"dryer_drum_{tag}_ribs", comp.merge(*ribs), drum_m, parent=dp, smooth=True)
    M(f"dryer_drum_{tag}_hub", turn([(0.0, 0.02), (0.035, 0.018), (0.05, 0.0)], seg=24, axis="F", at=(0, y0 + DRUM_D - 0.004, zc)), drum_m, parent=dp, smooth=True)
    drums.append(dp)

    # the door, on its hinge at the right
    HX = R_OPEN + 0.085
    hp = comp.pivot(col, root, f"dryer_door_{tag}", (HX, YF - 0.016, zc))
    ring = [(0.185, 0.004), (0.295, 0.004), (0.303, 0.012), (0.303, 0.03), (0.292, 0.042), (0.215, 0.05), (0.19, 0.04), (0.185, 0.03), (0.185, 0.004)]
    M(f"dryer_door_{tag}_ring", turn(ring, seg=72, axis="F", at=(0, YF, zc)), ring_m, parent=hp, smooth=True)
    M(f"dryer_door_{tag}_glass", turn([(0.0, 0.03), (0.12, 0.028), (0.188, 0.022), (0.188, 0.016), (0.0, 0.02)], seg=48, axis="F", at=(0, YF, zc)), glass, parent=hp, smooth=True)
    M(f"dryer_door_{tag}_gasket", turn([(0.186, 0.004), (0.186, -0.012), (0.228, -0.012), (0.232, 0.004)], seg=72, axis="F", at=(0, YF, zc)), gasket, parent=hp, smooth=True)
    hd = comp.merge(rbox((0.026, 0.03, 0.15), at=(-0.262, YF - 0.085, zc), r=0.009, seg=3), comp.box((0.02, 0.04, 0.02), at=(-0.262, YF - 0.06, zc + 0.055)), comp.box((0.02, 0.04, 0.02), at=(-0.262, YF - 0.06, zc - 0.055)))
    M(f"dryer_door_{tag}_handle", hd, chrome, parent=hp, smooth=True)
    M(f"dryer_door_{tag}_leaf", comp.merge(*[rbox((0.075, 0.012, 0.06), at=(HX - 0.04, YF - 0.012, zc + s * 0.13), r=0.003) for s in (-1, 1)]), ring_m, parent=hp)
    M(f"dryer_door_{tag}_knuckles", comp.merge(*[comp.cyl(0.011, 0.03, at=(HX, YF - 0.016, zc + s * 0.13 - 0.015), seg=16) for s in (-1, 1)]), chrome, parent=hp, smooth=True)
    # the hinge's fixed half on the panel, and the latch's strike on the other side
    M(f"dryer_hinge_{tag}", comp.merge(*[comp.merge(comp.cyl(0.011, 0.024, at=(HX, YF - 0.016, zc + s * 0.13 + e * 0.027 - 0.012), seg=16), rbox((0.05, 0.008, 0.024), at=(HX + 0.02, YF - 0.004, zc + s * 0.13 + e * 0.027), r=0.002)) for s in (-1, 1) for e in (-1, 1)]), steel)
    M(f"dryer_strike_{tag}", rbox((0.02, 0.012, 0.05), at=(-(R_OPEN + 0.075), YF - 0.006, zc), r=0.003), chrome)
    doors.append(hp)

# --- the control strip between the pockets --------------------------------------------------------------------------------
ZC = Z_CTRL + CTRL / 2
M("dryer_control_strip", rbox((W - 0.012, 0.03, CTRL - 0.008), at=(0, YF + 0.009, ZC), r=0.004), steel)
M("dryer_control_glass", rbox((0.5, 0.006, CTRL - 0.05), at=(-0.115, YF - 0.008, ZC), r=0.002), panel)
prints, lit = [], []
for s, name in ((-1, "UPPER"), (1, "LOWER")):
    x0 = -0.115 + s * 0.125
    prints.append(label(name, 0.017, (x0, YF - 0.0118, ZC + 0.055)))
    M(f"dryer_display_{name.lower()}_window", rbox((0.075, 0.003, 0.036), at=(x0 - 0.055, YF - 0.0115, ZC + 0.012), r=0.001), dark)
    lit.append(label("30" if s < 0 else "00", 0.026, (x0 - 0.055, YF - 0.0136, ZC + 0.012)))
    for i, (bm_, lab) in enumerate(((red, "HIGH"), (amber, "MED"), (blue, "LOW"))):
        bx = x0 + 0.012 + i * 0.036
        M(f"dryer_button_{name.lower()}_{lab.lower()}", turn([(0.0, 0.006), (0.0105, 0.006), (0.0125, 0.0)], seg=20, axis="F", at=(bx, YF - 0.011, ZC + 0.012)), bm_, smooth=True)
        prints.append(label(lab, 0.0085, (bx, YF - 0.0118, ZC - 0.012)))
    prints.append(label("START", 0.0085, (x0 - 0.055, YF - 0.0118, ZC - 0.018)))
prints.append(label("8 MINUTES PER COIN  -  PICK A POCKET, THEN A HEAT", 0.0095, (-0.115, YF - 0.0118, ZC - 0.052)))
M("dryer_control_print", comp.merge(*prints), white)
M("dryer_display_digits", comp.merge(*lit), display)
# the coin drop: a steel plate, a slot, a return button and a cup
CX = 0.27
M("dryer_coin_plate", rbox((0.16, 0.012, CTRL - 0.05), at=(CX, YF - 0.008, ZC), r=0.004), chrome)
M("dryer_coin_slot", comp.merge(comp.box((0.004, 0.004, 0.03), at=(CX - 0.035, YF - 0.0135, ZC + 0.03)), comp.box((0.06, 0.02, 0.028), at=(CX + 0.025, YF - 0.008, ZC - 0.04))), dark)
M("dryer_coin_bezel", comp.merge(rbox((0.022, 0.006, 0.05), at=(CX - 0.035, YF - 0.0125, ZC + 0.03), r=0.002), turn([(0.0, 0.012), (0.011, 0.012), (0.013, 0.0)], seg=20, axis="F", at=(CX + 0.03, YF - 0.012, ZC + 0.032)),
                                   rbox((0.075, 0.018, 0.008), at=(CX + 0.025, YF - 0.02, ZC - 0.056), r=0.002)), steel, smooth=True)
M("dryer_coin_print", comp.merge(label("COINS", 0.011, (CX - 0.035, YF - 0.0146, ZC - 0.012)), label("RETURN", 0.009, (CX + 0.03, YF - 0.0146, ZC + 0.008))), dark)
M("dryer_top_trim", rbox((W - 0.004, 0.022, 0.012), at=(0, YF + 0.008, H - 0.006), r=0.003), steel)
M("dryer_capacity", comp.merge(label("30 LB", 0.03, (-W / 2 + 0.09, YF - 0.0006, Z_UP + POCKET / 2 - 0.04)), label("30 LB", 0.03, (-W / 2 + 0.09, YF - 0.0006, Z_LOW + POCKET / 2 - 0.04))), dark)

comp.channel("drum", [(d, "rotation_euler", 1, 0, 2 * math.pi) for d in drums])
comp.channel("door", [(doors[1], "rotation_euler", 2, 0, math.radians(115))])
comp.channel("door lower", [(doors[0], "rotation_euler", 2, 0, math.radians(115))])
comp.export(col, root, _lib.PLACE, "dryer", made="blender/components/laundromat/dryer.py", source="own geometry (a generic two-pocket stack dryer); letters in Blender's built-in font", license="ours", credit="",
            rig={"drum": "both drums one whole turn about their axles (the lifter ribs and perforations show it)",
                 "door": "the upper pocket's door swings 115 degrees open on its hinge at the right (dryer_door_upper)",
                 "door lower": "the lower pocket's door swings 115 degrees open (dryer_door_lower)",
                 "light": "in the scene: the material dryer_light (a lamp in each throat's roof) glows into the drum, a key per state",
                 "display": "in the scene: the material dryer_display, the red minutes on the control strip"},
            notes="The drums' axles are at x 0, y -0.045, z 0.63 (lower) and 1.57 (upper) in Blender (raea: y 0.63 / 1.57, z 0.045): the laundry component's origin goes there.")
