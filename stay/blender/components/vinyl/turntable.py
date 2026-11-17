# vinyl/turntable: the listening deck, modelled by hand: a walnut plinth on four rubber feet, a brushed deck plate,
# a heavy platter with strobe dots round its rim, a rubber mat, an LP (grooves in five tracks, a two-colour label of
# our own, STAY side A) on the spindle, a straight tonearm on a gimbal with its counterweight, headshell, cartridge
# and stylus, the arm's rest, a cue lever, start and speed buttons, a strobe lamp, a pitch fader, a 45 adapter, and a
# clear dust cover on two hinges. 0.45 x 0.36 m, the record's top 0.13 m up. Its front faces -y.
# Rig: "spin" turns the platter, mat and record one whole turn clockwise (the hook's circle); "swing" carries the arm
# from its rest to over the lead-in groove; "drop" lowers the stylus onto the record; "needle" does both at once
# (the shot's "the needle drops"); "lid" shuts the dust cover from open; "pitch" slides the fader.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("turntable")
wood = comp.ph_texture("turntable_plinth", "walnut_veneer", tile=0.45, res="1k", tint=(0.5, 0.36, 0.27))
alu = comp.mat("turntable_deck", (0.62, 0.62, 0.64), rough=0.34, metal=1.0)
plat = comp.mat("turntable_platter", (0.8, 0.8, 0.82), rough=0.2, metal=1.0)
chrome = comp.mat("turntable_chrome", (0.9, 0.9, 0.92), rough=0.08, metal=1.0)
black = comp.mat("turntable_black", (0.02, 0.02, 0.022), rough=0.45)
rubber = comp.mat("turntable_rubber", (0.03, 0.03, 0.032), rough=0.85)
label_a = comp.mat("record_label", (0.7, 0.13, 0.02), rough=0.6)
label_b = comp.mat("record_label_cream", (0.9, 0.84, 0.68), rough=0.6)
ink = comp.mat("record_label_ink", (0.03, 0.03, 0.03), rough=0.6)
cart = comp.mat("turntable_cartridge", (0.75, 0.08, 0.06), rough=0.35)
lamp = comp.mat("turntable_lamp", (0.9, 0.1, 0.05), rough=0.3, emit=(1.0, 0.15, 0.05), strength=4.0)
clear = comp.mat("turntable_cover", (0.75, 0.8, 0.85), rough=0.05, alpha=0.16)
vm = vinyl_mats()

W, D, H, FOOT = 0.45, 0.36, 0.075, 0.018
TOP = FOOT + H + 0.004
C = (-0.045, 0.0)

p = M("turntable_plinth", comp.box((W, D, H), at=(0, 0, FOOT + H / 2)), wood)
comp.uv_box(p, 1.0)
comp.bevel(p, 0.006, 3)
dk = M("turntable_deck", comp.box((W - 0.014, D - 0.014, 0.004), at=(0, 0, FOOT + H + 0.002)), alu)
comp.bevel(dk, 0.0012, 2)
for i, (sx, sy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
    f = M(f"turntable_foot_{i + 1}", turn([(0, 0), (0.024, 0), (0.027, 0.004), (0.027, 0.012), (0.02, FOOT), (0, FOOT)], seg=28, at=(sx * (W / 2 - 0.045), sy * (D / 2 - 0.045))), rubber)
    shade(f)

# --- the platter, the mat and the record: everything that spins --------------------------------------------------
spin = comp.pivot(col, root, "turntable_platter", (C[0], C[1], TOP))
pl = M("turntable_platter_rim", turn([(0, 0.001), (0.15, 0.001), (0.15, 0.005), (0.164, 0.005), (0.166, 0.007), (0.166, 0.024), (0.163, 0.028), (0, 0.028)], TOP, seg=96, at=C), plat, parent=spin)
shade(pl, 30)
dots = []
for row, n in ((0, 96), (1, 90)):
    for i in range(n):
        a = 2 * math.pi * i / n
        b = comp.box((0.0012, 0.0034, 0.0045))
        xf(b, T(0.1662, 0, 0.0115 + row * 0.0075))
        xf(b, Matrix.Rotation(a, 4, "Z"))
        xf(b, T(C[0], C[1], TOP))
        dots.append(b)
M("turntable_strobe_dots", comp.merge(*dots), black, parent=spin)
mt = M("turntable_mat", turn([(0.004, 0.028), (0.1485, 0.028), (0.1485, 0.0305), (0.004, 0.0305)], TOP, seg=72, at=C), rubber, parent=spin)
ZR = TOP + 0.0305                      # the record's underside
for bm, key in lp(ZR, at=C):
    M(f"turntable_record_{key}", bm, vm[key], parent=spin)
ZT = ZR + LP_T                          # the record's top: where the stylus lands
lab = M("turntable_record_label", fan(0.0036, 0.05, ZT + 0.0003, 72, index=lambda a: 1 if 200 < a < 320 else 0, at=C), [label_a, label_b], parent=spin)
words = comp.merge(xf(xf(comp.text("STAY", 0.014, depth=0.0004), R(-90, "X")), T(C[0], C[1] + 0.024, ZT + 0.0007)),
                   xf(xf(comp.text("SIDE A   33", 0.0055, depth=0.0004), R(-90, "X")), T(C[0], C[1] - 0.03, ZT + 0.0007)),
                   comp.box((0.06, 0.0012, 0.0004), at=(C[0], C[1] + 0.0125, ZT + 0.0006)))
M("turntable_record_words", words, ink, parent=spin)
sp = M("turntable_spindle", turn([(0, 0.028), (0.0036, 0.028), (0.0036, 0.042), (0.002, 0.045), (0, 0.045)], TOP, seg=20, at=C), chrome, parent=spin)
shade(sp)

# --- the tonearm ----------------------------------------------------------------------------------------------
P = Vector((0.165, 0.09))
ZP = ZT + 0.0215                        # the arm tube's height when the stylus sits on the record
L = 0.225
base = M("turntable_arm_base", comp.merge(turn([(0, 0), (0.026, 0), (0.026, 0.006), (0.021, 0.009), (0.021, 0.02), (0.012, 0.023), (0.012, ZP - TOP - 0.012), (0, ZP - TOP - 0.012)], TOP, seg=40, at=P)), black)
shade(base)
yaw = comp.pivot(col, root, "turntable_arm", (P.x, P.y, ZP))
pitch = comp.pivot(col, root, "turntable_arm_lift", (P.x, P.y, ZP), parent=yaw)
gim = M("turntable_arm_gimbal", comp.merge(comp.box((0.03, 0.024, 0.022), at=(P.x, P.y, ZP)), torus(0.019, 0.003, 32, 8, at=(P.x, P.y, ZP - 0.012))), chrome, parent=yaw)
comp.bevel(gim, 0.003, 2)
tubebm = comp.merge(comp.cyl(0.0042, 0.2, at=(P.x, P.y - 0.2, ZP), seg=16, axis="Y"), comp.cyl(0.005, 0.07, at=(P.x, P.y, ZP), seg=16, axis="Y"))
shade(M("turntable_arm_tube", tubebm, chrome, parent=pitch))
shade(M("turntable_arm_counterweight", comp.merge(comp.cyl(0.0175, 0.034, at=(P.x, P.y + 0.032, ZP), seg=36, axis="Y"), comp.cyl(0.0185, 0.004, at=(P.x, P.y + 0.03, ZP), seg=36, axis="Y")), plat, parent=pitch))
# the angle that carries the stylus from the rest to the lead-in groove, and the headshell's offset so the cartridge
# lies along the groove there
def stylus(t):
    return P + L * Vector((-math.sin(t), -math.cos(t)))
lo_t, hi_t = 0.0, math.radians(60)
for _ in range(40):
    mid = (lo_t + hi_t) / 2
    if (stylus(mid) - Vector(C)).length > 0.147:
        lo_t = mid
    else:
        hi_t = mid
SWING = (lo_t + hi_t) / 2
s = stylus(SWING) - Vector(C)
tangent = Vector((s.y, -s.x)).normalized()       # the groove's direction of travel under the stylus (clockwise)
d = Vector((-math.sin(SWING), -math.cos(SWING)))
off = math.atan2(d.x * tangent.y - d.y * tangent.x, d.dot(tangent))
if abs(off) > math.pi / 2:
    off -= math.copysign(math.pi, off)
TIP = Vector((P.x, P.y - L, ZP - 0.0215))
head = comp.merge(comp.box((0.02, 0.05, 0.0022), at=(0, 0.012, 0.0204)),            # the shell
                  comp.box((0.006, 0.014, 0.006), at=(0, 0.036, 0.0215)),            # its collar onto the tube
                  comp.cyl(0.0014, 0.03, at=(0.01, -0.006, 0.0215), seg=8, axis="X"))  # the finger lift
xf(head, Matrix.Rotation(off, 4, "Z"))
xf(head, T(TIP.x, TIP.y, TIP.z))
hs = M("turntable_arm_headshell", head, black, parent=pitch)
cbm = comp.merge(comp.box((0.016, 0.022, 0.013), at=(0, 0.006, 0.0125)), comp.box((0.008, 0.008, 0.004), at=(0, 0.0, 0.0045)))
xf(cbm, Matrix.Rotation(off, 4, "Z")); xf(cbm, T(TIP.x, TIP.y, TIP.z))
cg = M("turntable_arm_cartridge", cbm, cart, parent=pitch)
comp.bevel(cg, 0.0012, 2)
st = comp.cyl(0.0007, 0.0035, at=(0, 0, 0), seg=8, r2=0.0012)
xf(st, T(TIP.x, TIP.y, TIP.z))
M("turntable_arm_stylus", st, chrome, parent=pitch)
# the join between tube and headshell
RAISE = math.asin(0.011 / L)            # on its rest the stylus rides 11 mm above the record's level
pitch.rotation_euler[0] = -RAISE
bpy.context.view_layer.update()
rest_at = (P.x, P.y - 0.135)
rz = ZP + 0.135 * math.sin(RAISE) - 0.0042
rest = M("turntable_arm_rest", comp.merge(comp.cyl(0.005, rz - TOP - 0.004, at=(rest_at[0], rest_at[1], TOP), seg=16), comp.box((0.018, 0.012, 0.005), at=(rest_at[0], rest_at[1], rz - 0.0025)),
                                           comp.box((0.003, 0.012, 0.012), at=(rest_at[0] + 0.0075, rest_at[1], rz + 0.004)), comp.box((0.003, 0.012, 0.012), at=(rest_at[0] - 0.0075, rest_at[1], rz + 0.004)),
                                           comp.cyl(0.011, 0.004, at=(rest_at[0], rest_at[1], TOP), seg=20)), black)
cue = M("turntable_cue", comp.merge(comp.box((0.022, 0.03, 0.01), at=(P.x + 0.04, P.y - 0.03, TOP + 0.005)), xf(xf(comp.cyl(0.003, 0.035, seg=10), R(55, "X")), T(P.x + 0.04, P.y - 0.03, TOP + 0.008))), black)

# --- the deck's controls -------------------------------------------------------------------------------------------
btn = M("turntable_start", comp.box((0.05, 0.034, 0.008), at=(-W / 2 + 0.045, -D / 2 + 0.034, TOP + 0.004)), chrome)
comp.bevel(btn, 0.002, 2)
for i, n in enumerate(("33", "45")):
    b = M(f"turntable_speed_{n}", comp.box((0.022, 0.016, 0.006), at=(-W / 2 + 0.095 + i * 0.028, -D / 2 + 0.026, TOP + 0.003)), chrome)
    comp.bevel(b, 0.0015, 2)
M("turntable_strobe", turn([(0, 0), (0.013, 0), (0.013, 0.016), (0.01, 0.02), (0, 0.02)], TOP, seg=24, at=(-W / 2 + 0.03, -D / 2 + 0.085)), black)
M("turntable_strobe_lamp", comp.box((0.004, 0.008, 0.008), at=(-W / 2 + 0.042, -D / 2 + 0.085, TOP + 0.012)), lamp)
FX, FY0, FY1 = W / 2 - 0.022, -0.125, -0.025
M("turntable_pitch_slot", comp.box((0.018, FY1 - FY0 + 0.02, 0.001), at=(FX, (FY0 + FY1) / 2, TOP + 0.0005)), black)
ticks = comp.merge(*[comp.box((0.006 if i % 2 else 0.01, 0.0008, 0.0006), at=(FX - 0.016, FY0 + (FY1 - FY0) * i / 8, TOP + 0.0003)) for i in range(9)])
M("turntable_pitch_ticks", ticks, black)
fader = comp.pivot(col, root, "turntable_pitch", (FX, (FY0 + FY1) / 2, TOP))
fk = M("turntable_pitch_knob", comp.box((0.022, 0.011, 0.012), at=(FX, (FY0 + FY1) / 2, TOP + 0.007)), black, parent=fader)
comp.bevel(fk, 0.002, 2)
ad = M("turntable_adapter", turn([(0.0037, 0), (0.019, 0), (0.019, 0.006), (0.012, 0.009), (0.0037, 0.009)], TOP, seg=32, at=(-W / 2 + 0.035, D / 2 - 0.035)), plat)
shade(ad)

# --- the dust cover -----------------------------------------------------------------------------------------------
HY, CH, CT = D / 2 - 0.012, 0.085, 0.003
CW, CD = W - 0.016, D - 0.03
lid = comp.pivot(col, root, "turntable_lid", (0, HY, TOP + 0.004))
y0 = HY - CD
cover = comp.merge(comp.box((CW, CD, CT), at=(0, HY - CD / 2, TOP + CH)), comp.box((CW, CT, CH), at=(0, y0 + CT / 2, TOP + CH / 2)), comp.box((CW, CT, CH), at=(0, HY - CT / 2, TOP + CH / 2)),
                   comp.box((CT, CD, CH), at=(-CW / 2 + CT / 2, HY - CD / 2, TOP + CH / 2)), comp.box((CT, CD, CH), at=(CW / 2 - CT / 2, HY - CD / 2, TOP + CH / 2)))
M("turntable_cover", cover, clear, parent=lid)
for i, sx in enumerate((-1, 1)):
    M(f"turntable_hinge_{i + 1}", comp.merge(comp.box((0.03, 0.012, 0.02), at=(sx * 0.14, HY + 0.004, TOP + 0.006)), comp.cyl(0.004, 0.034, at=(sx * 0.14 - 0.017, HY, TOP + 0.004), seg=10, axis="X")), black)
OPEN = math.radians(72)
lid.rotation_euler[0] = -OPEN
bpy.context.view_layer.update()

channel("spin", [(spin, "rotation_euler", 2, 0, -2 * math.pi)])
channel("swing", [(yaw, "rotation_euler", 2, 0, -SWING)])
channel("drop", [(pitch, "rotation_euler", 0, -RAISE, 0)])
channel("needle", [(yaw, "rotation_euler", 2, 0, -SWING), (pitch, "rotation_euler", 0, -RAISE, 0)])
channel("lid", [(lid, "rotation_euler", 0, -OPEN, 0)])
channel("pitch", [(fader, "location", 1, fader.location.y - 0.045, fader.location.y + 0.045)])
print(f"turntable: swing {math.degrees(SWING):.1f} deg, headshell offset {math.degrees(off):.1f} deg, record top {ZT:.4f} m")
done(col, root, "turntable", "own geometry (a generic direct-drive turntable; plinth veneer https://polyhaven.com/a/walnut_veneer, CC0)",
     rig={"spin": "the platter, mat and record one whole turn clockwise from above, about the spindle",
          "swing": f"the tonearm from its rest to over the lead-in groove ({math.degrees(SWING):.0f} degrees about its pivot), still raised",
          "drop": "the stylus down 11 mm onto the record (the arm tips about its gimbal)",
          "needle": "swing and drop together: from the rest to the stylus in the lead-in groove",
          "lid": "the dust cover from open (72 degrees) to shut, about its hinges at the back",
          "pitch": "the pitch fader along its 9 cm slot, front to back",
          "lamp": "in the scene: the material turntable_lamp's glow (the strobe's red lamp)"})
