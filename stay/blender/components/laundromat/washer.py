# laundromat/washer: a commercial front-load washer, 0.68 m wide and 1.12 m tall, all stainless, modelled by hand: a
# hollow cabinet on a dark plinth with a screwed kick panel, a front panel with a round opening and a grey bellows
# gasket, a door on two hinge knuckles (a cast ring, a bowl of glass that reaches into the drum, a pull handle), a
# perforated drum with three paddles behind it, a control head with a display, four cycle buttons and a coin drop,
# and on the top a soap drawer of three lidded cups. Its front faces -y.
# Rig: "drum" turns the drum one whole turn about its axle; "door" swings the door 110 degrees open on its hinge at
# the right. The display's digits are their own material (washer_display).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, holed, disc, label, rbox, T, R, S, xf

col, root = comp.fresh("washer")
M = _lib.maker(col, root)
steel = comp.mat("washer_steel", (0.7, 0.71, 0.72), rough=0.34, metal=0.55)
dark = comp.mat("washer_dark", (0.03, 0.03, 0.035), rough=0.6)
drum_m = comp.mat("washer_drum", (0.76, 0.77, 0.78), rough=0.3, metal=0.4)
hole_m = comp.mat("washer_holes", (0.02, 0.02, 0.022), rough=0.8)
chrome = comp.mat("washer_chrome", (0.88, 0.88, 0.9), rough=0.12, metal=1.0)
ring_m = comp.mat("washer_door_ring", (0.8, 0.81, 0.82), rough=0.22, metal=0.6)
glass = _lib.glass("washer_glass", alpha=0.12)
gasket = comp.mat("washer_gasket", (0.32, 0.33, 0.34), rough=0.7)
panel = comp.mat("washer_panel", (0.04, 0.07, 0.16), rough=0.25)
display = comp.mat("washer_display", (0.1, 0.9, 0.5), rough=0.4, emit=(0.1, 1.0, 0.45), strength=3.0)
white = comp.mat("washer_print", (0.92, 0.92, 0.9), rough=0.5)
cup = comp.mat("washer_soap_lid", (0.2, 0.35, 0.6), rough=0.35)
btn = [comp.mat("washer_button_hot", (0.75, 0.1, 0.06), rough=0.4), comp.mat("washer_button_warm", (0.85, 0.5, 0.06), rough=0.4), comp.mat("washer_button_cold", (0.1, 0.3, 0.7), rough=0.4), comp.mat("washer_button_delicate", (0.8, 0.8, 0.78), rough=0.4)]

W, D, H = 0.68, 0.76, 1.12
YF = -D / 2
KICK, FRONT, HEAD = 0.14, 0.72, 0.26
ZC = KICK + FRONT / 2 - 0.02              # the door's centre, 0.48
R_OPEN, R_DRUM, DRUM_D = 0.19, 0.275, 0.42
t = 0.018
cab = comp.merge(comp.box((t, D, H - 0.04), at=(-W / 2 + t / 2, 0, 0.04 + (H - 0.04) / 2)), comp.box((t, D, H - 0.04), at=(W / 2 - t / 2, 0, 0.04 + (H - 0.04) / 2)), comp.box((W, D, t), at=(0, 0, H - t / 2)),
                 comp.box((W, D, t), at=(0, 0, 0.04 + t / 2)), comp.box((W, t, H - 0.04), at=(0, D / 2 - t / 2, 0.04 + (H - 0.04) / 2)))
c = M("washer_cabinet", cab, steel)
comp.bevel(c, 0.004, 2)
M("washer_plinth", comp.box((W - 0.05, D - 0.06, 0.04), at=(0, 0.02, 0.02)), dark)
kp = M("washer_kick_panel", rbox((W - 0.012, 0.016, KICK - 0.05), at=(0, YF + 0.008, 0.04 + (KICK - 0.04) / 2), r=0.003), steel)
scr = lambda pts, y: comp.merge(*[turn([(0.0, 0.003), (0.004, 0.003), (0.006, 0.0)], seg=10, axis="F", at=(x, y, z)) for x, z in pts])
M("washer_screws", scr([(sx * (W / 2 - 0.03), z) for sx in (-1, 1) for z in (0.09, KICK + 0.03, KICK + FRONT - 0.03)] + [(0, 0.09)], YF - 0.002), chrome)
plate = M("washer_front", holed(W - 0.012, FRONT - 0.006, R_OPEN + 0.03, seg=72, cz=ZC - (KICK + FRONT / 2)), steel)
plate.location = (0, YF, KICK + FRONT / 2)
comp.solidify(plate, 0.016, -1)
# the bellows gasket from the opening back to the drum's mouth
M("washer_gasket", turn([(R_OPEN + 0.032, 0.004), (R_OPEN + 0.02, 0.008), (R_OPEN + 0.006, 0.0), (R_OPEN + 0.002, -0.03), (R_OPEN + 0.022, -0.045), (R_OPEN + 0.004, -0.06), (R_OPEN + 0.03, -0.085), (R_DRUM - 0.02, -0.09)], seg=72, axis="F", at=(0, YF, ZC)), gasket, smooth=True)
M("washer_bulkhead", comp.box((W - 0.05, 0.01, FRONT - 0.03), at=(0, YF + 0.1 + DRUM_D + 0.03, ZC)), dark)
# the drum
y0 = YF + 0.095
dp = comp.pivot(col, root, "washer_drum", (0, y0 + DRUM_D / 2, ZC))
sh = M("washer_drum_shell", turn([(R_OPEN + 0.03, 0.0), (R_DRUM, -0.03), (R_DRUM, -DRUM_D), (0.0, -DRUM_D)], seg=72, axis="F", at=(0, y0, ZC)), drum_m, parent=dp, smooth=True)
comp.solidify(sh, 0.004, 1)
holes = []
for k in range(1, 8):
    rr = 0.04 + k * 0.03
    n = int(2 * math.pi * rr / 0.03)
    for j in range(n):
        a = 2 * math.pi * (j + 0.5 * (k % 2)) / n
        holes.append(disc(0.005, seg=6, at=(rr * math.cos(a), y0 + DRUM_D - 0.005, ZC + rr * math.sin(a))))
for i in range(60):
    a = 2 * math.pi * i / 60
    if min(abs(((math.degrees(a) - c0 + 180) % 360) - 180) for c0 in (0, 120, 240)) < 10:
        continue
    for k in range(10):
        q = xf(xf(xf(comp.box((0.009, 0.009, 0.001)), T(0, 0, -(R_DRUM - 0.0052))), R(math.degrees(a), "Y")), T(0, y0 + 0.06 + k * 0.035 + (0.017 if i % 2 else 0), ZC))
        holes.append(q)
M("washer_drum_holes", comp.merge(*holes), hole_m, parent=dp)
ribs = []
for c0 in (0, 120, 240):
    rib = rbox((0.07, DRUM_D - 0.08, 0.06), r=0.02, seg=4)
    for v in rib.verts:
        if v.co.z > 0:
            v.co.x *= 0.4
    ribs.append(xf(xf(xf(rib, T(0, 0, -(R_DRUM - 0.031))), R(c0, "Y")), T(0, y0 + DRUM_D / 2 + 0.01, ZC)))
M("washer_drum_paddles", comp.merge(*ribs), drum_m, parent=dp, smooth=True)
# the door
HX = 0.3
hp = comp.pivot(col, root, "washer_door", (HX, YF - 0.016, ZC))
ring = [(0.15, 0.004), (0.262, 0.004), (0.27, 0.012), (0.27, 0.03), (0.258, 0.044), (0.185, 0.052), (0.158, 0.04), (0.15, 0.03), (0.15, 0.004)]
M("washer_door_ring", turn(ring, seg=72, axis="F", at=(0, YF, ZC)), ring_m, parent=hp, smooth=True)
bowl = [(0.0, -0.1), (0.07, -0.096), (0.115, -0.075), (0.14, -0.03), (0.153, 0.02), (0.153, 0.028), (0.146, 0.028), (0.133, -0.028), (0.11, -0.068), (0.068, -0.089), (0.0, -0.093)]
M("washer_door_glass", turn(bowl, seg=56, axis="F", at=(0, YF, ZC)), glass, parent=hp, smooth=True)
hd = comp.merge(rbox((0.026, 0.03, 0.13), at=(-0.228, YF - 0.085, ZC), r=0.009, seg=3), comp.box((0.02, 0.04, 0.02), at=(-0.228, YF - 0.06, ZC + 0.045)), comp.box((0.02, 0.04, 0.02), at=(-0.228, YF - 0.06, ZC - 0.045)))
M("washer_door_handle", hd, chrome, parent=hp, smooth=True)
M("washer_door_leaf", comp.merge(*[rbox((0.07, 0.012, 0.055), at=(HX - 0.038, YF - 0.012, ZC + s * 0.11), r=0.003) for s in (-1, 1)]), ring_m, parent=hp)
M("washer_door_knuckles", comp.merge(*[comp.cyl(0.011, 0.03, at=(HX, YF - 0.016, ZC + s * 0.11 - 0.015), seg=16) for s in (-1, 1)]), chrome, parent=hp, smooth=True)
M("washer_hinge", comp.merge(*[comp.merge(comp.cyl(0.011, 0.024, at=(HX, YF - 0.016, ZC + s * 0.11 + e * 0.027 - 0.012), seg=16), rbox((0.035, 0.008, 0.024), at=(HX + 0.012, YF - 0.004, ZC + s * 0.11 + e * 0.027), r=0.002)) for s in (-1, 1) for e in (-1, 1)]), steel)
# the control head: a sloped fascia over the door
ZH = KICK + FRONT
M("washer_head", rbox((W - 0.012, 0.03, HEAD - 0.01), at=(0, YF + 0.01, ZH + HEAD / 2), r=0.005), steel)
M("washer_head_glass", rbox((0.4, 0.006, HEAD - 0.07), at=(-0.11, YF - 0.007, ZH + HEAD / 2), r=0.002), panel)
prints = [label("WASH", 0.02, (-0.25, YF - 0.0108, ZH + HEAD / 2 + 0.065), align="CENTER"), label("14 LB", 0.012, (-0.17, YF - 0.0108, ZH + HEAD / 2 + 0.066))]
M("washer_display_window", rbox((0.11, 0.003, 0.045), at=(-0.235, YF - 0.0105, ZH + HEAD / 2 + 0.012), r=0.001), dark)
M("washer_display_digits", label("2.00", 0.03, (-0.235, YF - 0.0126, ZH + HEAD / 2 + 0.012)), display)
for i, lab in enumerate(("HOT", "WARM", "COLD", "DELIC")):
    bx = -0.13 + i * 0.058
    M(f"washer_button_{lab.lower()}", rbox((0.04, 0.008, 0.028), at=(bx, YF - 0.011, ZH + HEAD / 2 + 0.014), r=0.003), btn[i])
    prints.append(label(lab, 0.0095, (bx, YF - 0.0108, ZH + HEAD / 2 - 0.016)))
prints.append(label("ADD SOAP ON TOP  -  CLOSE THE DOOR  -  PAY  -  PICK A WASH", 0.0075, (-0.11, YF - 0.0108, ZH + HEAD / 2 - 0.06)))
M("washer_head_print", comp.merge(*prints), white)
CX = 0.22
M("washer_coin_plate", rbox((0.16, 0.012, HEAD - 0.07), at=(CX, YF - 0.007, ZH + HEAD / 2), r=0.004), chrome)
M("washer_coin_slot", comp.merge(comp.box((0.004, 0.004, 0.03), at=(CX - 0.035, YF - 0.0125, ZH + HEAD / 2 + 0.035)), comp.box((0.06, 0.02, 0.03), at=(CX + 0.025, YF - 0.006, ZH + HEAD / 2 - 0.05))), dark)
M("washer_coin_bezel", comp.merge(rbox((0.022, 0.006, 0.05), at=(CX - 0.035, YF - 0.0115, ZH + HEAD / 2 + 0.035), r=0.002), turn([(0.0, 0.012), (0.011, 0.012), (0.013, 0.0)], seg=20, axis="F", at=(CX + 0.03, YF - 0.011, ZH + HEAD / 2 + 0.036)),
                                    rbox((0.075, 0.018, 0.008), at=(CX + 0.025, YF - 0.019, ZH + HEAD / 2 - 0.068), r=0.002)), steel, smooth=True)
M("washer_coin_print", label("COINS", 0.011, (CX - 0.035, YF - 0.0136, ZH + HEAD / 2 - 0.008)), dark)
# the soap drawer on the top: a tray and three lids, each with a finger tab
M("washer_soap_tray", rbox((0.36, 0.14, 0.012), at=(-0.1, YF + 0.16, H + 0.004), r=0.004), dark)
M("washer_soap_lids", comp.merge(*[comp.merge(rbox((0.105, 0.12, 0.012), at=(-0.215 + i * 0.115, YF + 0.16, H + 0.014), r=0.005), rbox((0.04, 0.012, 0.008), at=(-0.215 + i * 0.115, YF + 0.095, H + 0.018), r=0.003)) for i in range(3)]), cup)
M("washer_soap_print", comp.merge(*[xf(label(s, 0.014, (0, 0, 0)), R(-90, "X")) and xf(xf(label(s, 0.014, (0, 0, 0)), R(-90, "X")), T(-0.215 + i * 0.115, YF + 0.16, H + 0.0206)) for i, s in enumerate(("SOAP", "BLEACH", "SOFTENER"))]), white)
comp.channel("drum", [(dp, "rotation_euler", 1, 0, 2 * math.pi)])
comp.channel("door", [(hp, "rotation_euler", 2, 0, math.radians(110))])
comp.export(col, root, _lib.PLACE, "washer", made="blender/components/laundromat/washer.py", source="own geometry (a generic commercial front-load washer); letters in Blender's built-in font", license="ours", credit="",
            rig={"drum": "the drum one whole turn about its axle (washer_drum)", "door": "the door swings 110 degrees open on its hinge at the right (washer_door)",
                 "display": "in the scene: the material washer_display, the green price on the control head"},
            notes="The drum's axle is at x 0, y -0.075, z 0.48 in Blender (raea: y 0.48, z 0.075).")
