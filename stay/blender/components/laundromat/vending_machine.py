# laundromat/vending-machine: a glass-front snack and drink machine, 0.99 m wide and 1.83 m tall, modelled by hand: a
# dark blue steel cabinet on four feet, a door with a big window on five trays of packets, bars, cans and bottles
# between chrome dividers (each tray with its price strip), lit from two strips inside and a lit header, and a
# control column to the right: a display, a twelve-key pad, a coin slot, a note reader, a coin return, a lock; a
# delivery flap along the bottom. Its front faces -y.
# Rig: "glow" is the scene's (the materials vending_glow, the strips and header, and vending_display); "flap" pushes
# the delivery flap 55 degrees in on its top hinge; "drop" lets one packet go from the second tray, down behind the
# glass to the bin.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rod, rbox, label, T, R, S, xf

col, root = comp.fresh("vending_machine")
M = _lib.maker(col, root)
body = comp.mat("vending_body", (0.04, 0.07, 0.2), rough=0.4)
black = comp.mat("vending_black", (0.02, 0.02, 0.022), rough=0.5)
inner = comp.mat("vending_inner", (0.8, 0.8, 0.78), rough=0.5)
chrome = comp.mat("vending_chrome", (0.8, 0.81, 0.83), rough=0.2, metal=0.85)
glass = _lib.glass("vending_glass", alpha=0.08)
glow = comp.mat("vending_glow", (1.0, 1.0, 0.96), rough=0.4, emit=(1.0, 0.97, 0.9), strength=4.0)
disp = comp.mat("vending_display", (0.2, 0.9, 0.3), rough=0.4, emit=(0.2, 1.0, 0.3), strength=3.0)
white = comp.mat("vending_print", (0.95, 0.95, 0.92), rough=0.5)
key_m = comp.mat("vending_keys", (0.75, 0.75, 0.73), rough=0.4)
PAL = [(0.85, 0.12, 0.1), (0.95, 0.75, 0.1), (0.1, 0.45, 0.8), (0.15, 0.6, 0.25), (0.9, 0.45, 0.1), (0.55, 0.2, 0.6), (0.9, 0.9, 0.85), (0.1, 0.1, 0.12)]
packs = [comp.mat(f"vending_pack_{i + 1}", c, rough=0.35) for i, c in enumerate(PAL)]
W, D, H = 0.99, 0.86, 1.83
YF = -D / 2
FOOT = 0.1
WX0, WX1, WZ0, WZ1 = -W / 2 + 0.06, W / 2 - 0.3, 0.52, H - 0.2    # the window
t = 0.025
cab = comp.merge(comp.box((t, D, H - FOOT), at=(-W / 2 + t / 2, 0, FOOT + (H - FOOT) / 2)), comp.box((t, D, H - FOOT), at=(W / 2 - t / 2, 0, FOOT + (H - FOOT) / 2)), comp.box((W, D, t), at=(0, 0, H - t / 2)),
                 comp.box((W, D, t), at=(0, 0, FOOT + t / 2)), comp.box((W, t, H - FOOT), at=(0, D / 2 - t / 2, FOOT + (H - FOOT) / 2)))
c = M("vending_machine_cabinet", cab, body)
comp.bevel(c, 0.006, 3)
M("vending_machine_feet", comp.merge(*[comp.cyl(0.03, FOOT, at=(x, y, 0), seg=12) for x in (-W / 2 + 0.08, W / 2 - 0.08) for y in (YF + 0.08, D / 2 - 0.08)], comp.box((W - 0.1, 0.02, FOOT - 0.02), at=(0, YF + 0.06, FOOT / 2 + 0.01))), black)
# the door: a frame round the window, the column, the bottom panel
door = comp.merge(comp.box((W, 0.04, H - WZ1 - 0.0), at=(0, YF + 0.02, (H + WZ1) / 2)), comp.box((W, 0.04, WZ0 - FOOT), at=(0, YF + 0.02, (WZ0 + FOOT) / 2)),
                  comp.box((WX0 + W / 2, 0.04, WZ1 - WZ0), at=((WX0 - W / 2) / 2, YF + 0.02, (WZ0 + WZ1) / 2)), comp.box((W / 2 - WX1, 0.04, WZ1 - WZ0), at=((WX1 + W / 2) / 2, YF + 0.02, (WZ0 + WZ1) / 2)))
d = M("vending_machine_door", door, body)
comp.bevel(d, 0.004, 2)
M("vending_machine_window_trim", comp.merge(comp.box((WX1 - WX0 + 0.03, 0.012, 0.015), at=((WX0 + WX1) / 2, YF - 0.004, WZ0 - 0.0075)), comp.box((WX1 - WX0 + 0.03, 0.012, 0.015), at=((WX0 + WX1) / 2, YF - 0.004, WZ1 + 0.0075)),
                                           comp.box((0.015, 0.012, WZ1 - WZ0), at=(WX0 - 0.0075, YF - 0.004, (WZ0 + WZ1) / 2)), comp.box((0.015, 0.012, WZ1 - WZ0), at=(WX1 + 0.0075, YF - 0.004, (WZ0 + WZ1) / 2))), black)
M("vending_machine_glass", comp.box((WX1 - WX0, 0.008, WZ1 - WZ0), at=((WX0 + WX1) / 2, YF + 0.012, (WZ0 + WZ1) / 2)), glass)
# inside: a pale back and sides, the light strips
M("vending_machine_inside", comp.merge(comp.box((WX1 - WX0 + 0.04, 0.01, WZ1 - WZ0 + 0.3), at=((WX0 + WX1) / 2, YF + 0.5, (WZ0 + WZ1) / 2 - 0.1)), comp.box((0.01, 0.48, WZ1 - WZ0 + 0.3), at=(WX0 - 0.015, YF + 0.27, (WZ0 + WZ1) / 2 - 0.1)),
                                       comp.box((0.01, 0.48, WZ1 - WZ0 + 0.3), at=(WX1 + 0.015, YF + 0.27, (WZ0 + WZ1) / 2 - 0.1)), comp.box((WX1 - WX0 + 0.04, 0.48, 0.01), at=((WX0 + WX1) / 2, YF + 0.27, WZ1 + 0.03))), inner)
M("vending_machine_light_strips", comp.merge(*[comp.box((0.012, 0.03, WZ1 - WZ0 - 0.06), at=(x, YF + 0.05, (WZ0 + WZ1) / 2)) for x in (WX0 - 0.006, WX1 + 0.006)], comp.box((WX1 - WX0 - 0.06, 0.03, 0.012), at=((WX0 + WX1) / 2, YF + 0.05, WZ1 + 0.02))), glow)
# the header
M("vending_machine_header", rbox((W - 0.1, 0.006, 0.12), at=(0, YF - 0.003, H - 0.1), r=0.002, seg=1), glow)
M("vending_machine_header_print", label("SNACKS   +   COLD DRINKS", 0.05, (0, YF - 0.0068, H - 0.1)), body)
# the trays and what is on them
rnd = random.Random(11)
trays, strips, prices, rods_ = [], [], [], []
by_mat = {i: [] for i in range(len(PAL))}
NC = 6
cw = (WX1 - WX0 - 0.04) / NC
tray_z = [0.6 + i * 0.218 for i in range(5)]
drop = None
for ti, z in enumerate(tray_z):
    trays.append(comp.box((WX1 - WX0, 0.42, 0.008), at=((WX0 + WX1) / 2, YF + 0.27, z)))
    strips.append(comp.box((WX1 - WX0, 0.004, 0.028), at=((WX0 + WX1) / 2, YF + 0.058, z + 0.004)))
    for cI in range(NC):
        cx = WX0 + 0.02 + (cI + 0.5) * cw
        rods_.append(rod((cx - cw / 2, YF + 0.065, z + 0.03), (cx - cw / 2, YF + 0.47, z + 0.03), 0.003, seg=5))
        prices.append(label(f"{'ABCDE'[4 - ti]}{cI + 1}  {rnd.choice(('.75', '1.00', '1.25', '1.50'))}", 0.012, (cx, YF + 0.0555, z + 0.004)))
        mi = rnd.randrange(len(PAL))
        for k in range(3):
            y = YF + 0.1 + k * 0.11
            kind = ("can", "bottle", "bag", "bag", "bar")[ti]
            if kind == "bag":
                b = rbox((cw * 0.82, 0.035, 0.15), at=(cx, y, z + 0.082), r=0.014, seg=2)
                for v in b.verts:
                    v.co.y += 0.012 * math.sin((v.co.z - z) * 40 + cI)
                xf(b, T(0, 0, 0))
            elif kind == "bar":
                b = comp.merge(*[rbox((cw * 0.8, 0.03, 0.045), at=(cx, y, z + 0.03 + s * 0.047), r=0.006, seg=2) for s in range(2)])
            elif kind == "can":
                b = turn([(0.0, 0.0), (0.028, 0.0), (0.033, 0.008), (0.033, 0.112), (0.028, 0.122), (0.0, 0.122)], seg=14, at=(cx, y, z + 0.004))
            else:
                b = turn([(0.0, 0.0), (0.03, 0.0), (0.032, 0.01), (0.032, 0.11), (0.014, 0.16), (0.014, 0.185), (0.0, 0.185)], seg=14, at=(cx, y, z + 0.004))
            if ti == 3 and cI == 2 and k == 0:
                drop = (b, mi, (cx, y, z + 0.082))
            else:
                by_mat[mi].append(b)
M("vending_machine_trays", comp.merge(*trays), black)
M("vending_machine_price_strips", comp.merge(*strips), white)
M("vending_machine_prices", comp.merge(*prices), black)
M("vending_machine_dividers", comp.merge(*rods_), chrome)
for mi, bs in by_mat.items():
    if bs:
        M(f"vending_machine_stock_{mi + 1}", comp.merge(*bs), packs[mi], smooth=True)
dpv = comp.pivot(col, root, "vending_machine_drop", drop[2])
M("vending_machine_drop_packet", drop[0], packs[drop[1]], parent=dpv, smooth=True)
# the control column
CX = (WX1 + W / 2) / 2 + 0.005
M("vending_machine_column", rbox((0.2, 0.008, 0.95), at=(CX, YF - 0.004, 1.12), r=0.003, seg=1), black)
M("vending_machine_display_window", rbox((0.15, 0.004, 0.05), at=(CX, YF - 0.009, 1.5), r=0.001, seg=1), comp.mat("vending_display_window", (0.01, 0.03, 0.01), rough=0.2))
M("vending_machine_display", label("1.25", 0.034, (CX, YF - 0.0115, 1.5)), disp)
keys, kp = [], []
for i, ch in enumerate("123456789*0#"):
    kx, kz = CX - 0.045 + (i % 3) * 0.045, 1.4 - (i // 3) * 0.045
    keys.append(rbox((0.034, 0.008, 0.034), at=(kx, YF - 0.011, kz), r=0.003, seg=2))
    kp.append(label(ch if ch not in "*#" else ("C" if ch == "*" else "E"), 0.018, (kx, YF - 0.0155, kz)))
M("vending_machine_keys", comp.merge(*keys), key_m)
M("vending_machine_key_print", comp.merge(*kp, label("COINS", 0.012, (CX - 0.05, YF - 0.0085, 1.12)), label("NOTES", 0.012, (CX + 0.03, YF - 0.0085, 1.165)), label("RETURN", 0.01, (CX - 0.05, YF - 0.0085, 0.99)), label("PICK A LETTER, THEN A NUMBER", 0.0085, (CX, YF - 0.0085, 1.555))), white)
M("vending_machine_coin", comp.merge(rbox((0.04, 0.012, 0.06), at=(CX - 0.05, YF - 0.008, 1.165), r=0.003), rbox((0.09, 0.016, 0.07), at=(CX + 0.03, YF - 0.01, 1.105), r=0.004),
                                      turn([(0.0, 0.012), (0.014, 0.012), (0.017, 0.0)], seg=16, axis="F", at=(CX - 0.05, YF - 0.008, 1.03)), rbox((0.1, 0.014, 0.07), at=(CX, YF - 0.008, 0.88), r=0.004),
                                      turn([(0.0, 0.008), (0.014, 0.008), (0.017, 0.0)], seg=16, axis="F", at=(CX + 0.06, YF - 0.008, 0.72))), chrome, smooth=True)
M("vending_machine_coin_slots", comp.merge(comp.box((0.004, 0.004, 0.03), at=(CX - 0.05, YF - 0.0145, 1.165)), comp.box((0.07, 0.004, 0.006), at=(CX + 0.03, YF - 0.0185, 1.105)), rbox((0.08, 0.004, 0.045), at=(CX, YF - 0.0155, 0.875), r=0.001, seg=1)), black)
# the delivery flap
FZ = 0.42
M("vending_machine_bin", comp.merge(comp.box((0.62, 0.2, 0.01), at=(-0.1, YF + 0.12, 0.2)), comp.box((0.62, 0.01, 0.24), at=(-0.1, YF + 0.22, 0.31))), black)
M("vending_machine_bin_frame", comp.merge(comp.box((0.66, 0.012, 0.02), at=(-0.1, YF - 0.004, FZ + 0.01)), comp.box((0.66, 0.012, 0.02), at=(-0.1, YF - 0.004, 0.2)), comp.box((0.02, 0.012, 0.22), at=(-0.42, YF - 0.004, 0.31)), comp.box((0.02, 0.012, 0.22), at=(0.22, YF - 0.004, 0.31))), chrome)
fp = comp.pivot(col, root, "vending_machine_flap", (-0.1, YF + 0.004, FZ))
M("vending_machine_flap_plate", rbox((0.62, 0.008, 0.2), at=(-0.1, YF + 0.004, FZ - 0.1), r=0.002, seg=1), comp.mat("vending_flap", (0.12, 0.12, 0.13), rough=0.35), parent=fp)
M("vending_machine_flap_print", label("PUSH", 0.05, (-0.1, YF - 0.0006, FZ - 0.1)), white, parent=fp)
_lib.channel("flap", [(fp, "rotation_euler", 0, 0, math.radians(55))])
dz = 0.26 - drop[2][2]
_lib.channel("drop", [(dpv, "location", 2, drop[2][2], drop[2][2] + dz), (dpv, "location", 1, drop[2][1], drop[2][1] - 0.035), (dpv, "rotation_euler", 0, 0, math.radians(200))])
comp.export(col, root, _lib.PLACE, "vending_machine", made="blender/components/laundromat/vending_machine.py", source="own geometry (a generic glass-front vending machine); letters in Blender's built-in font", license="ours", credit="",
            rig={"glow": "in the scene: the material vending_glow (the strips inside and the header) and vending_display (the green price), a key per state",
                 "flap": "the delivery flap pushes 55 degrees in on its top hinge (vending_machine_flap)",
                 "drop": "one packet leaves the second tray from the top, falls behind the glass and lands in the bin, turning over (vending_machine_drop)"})
