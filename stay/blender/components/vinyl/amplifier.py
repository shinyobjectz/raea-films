# vinyl/amplifier: the listening deck's stereo amplifier, modelled by hand: a black steel case with walnut cheeks,
# 0.43 x 0.14 x 0.32 m on four feet, a brushed aluminium face with two lit VU meters (scale ticks, needles on their
# pivots), a big volume knob with an index line, four small knobs, three toggle switches, a power lamp, a headphone
# socket, and cooling slots in the lid. Its front faces -y.
# Rig: "level" swings both VU needles from rest to the red (65 degrees); "volume" turns the volume knob 270 degrees.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("amplifier")
wood = comp.ph_texture("amplifier_cheeks", "walnut_veneer", tile=0.5, res="1k", tint=(0.5, 0.36, 0.27))
case = comp.mat("amplifier_case", (0.025, 0.025, 0.028), rough=0.5, metal=0.4)
face = comp.mat("amplifier_face", (0.72, 0.72, 0.74), rough=0.3, metal=1.0)
knob = comp.mat("amplifier_knob", (0.85, 0.85, 0.87), rough=0.18, metal=1.0)
ink = comp.mat("amplifier_ink", (0.03, 0.03, 0.03), rough=0.6)
meter = comp.mat("amplifier_meter", (0.95, 0.8, 0.5), rough=0.5, emit=(1.0, 0.72, 0.32), strength=1.6)
red = comp.mat("amplifier_red", (0.75, 0.05, 0.04), rough=0.5)
lamp = comp.mat("amplifier_lamp", (0.9, 0.3, 0.05), rough=0.3, emit=(1.0, 0.35, 0.05), strength=5.0)
W, H, D, F = 0.43, 0.13, 0.32, 0.012
c = M("amplifier_case", comp.box((W - 0.03, D, H), at=(0, 0.005, F + H / 2)), case)
comp.bevel(c, 0.002, 2)
for i, sx in enumerate((-1, 1)):
    ch = M(f"amplifier_cheek_{i + 1}", comp.box((0.016, D + 0.012, H + 0.006), at=(sx * (W / 2 - 0.008), 0.003, F + H / 2)), wood)
    comp.uv_box(ch, 1.0)
    comp.bevel(ch, 0.004, 3)
M("amplifier_feet", comp.merge(*[comp.cyl(0.016, F, at=(sx * 0.17, sy * 0.12, 0), seg=16) for sx in (-1, 1) for sy in (-1, 1)]), case)
FY = -D / 2 + 0.005
fp = M("amplifier_face", comp.box((W - 0.034, 0.005, H - 0.006), at=(0, FY - 0.0025, F + H / 2)), face)
comp.bevel(fp, 0.001, 2)
FY -= 0.005
M("amplifier_slots", comp.merge(*[comp.box((0.2, 0.012, 0.001), at=(0.02, -0.07 + i * 0.03, F + H + 0.0005)) for i in range(7)]), ink)
needles = []
for i, x in enumerate((-0.135, -0.05)):
    MZ = F + 0.082
    M(f"amplifier_meter_bezel_{i + 1}", comp.box((0.074, 0.003, 0.05), at=(x, FY - 0.0015, MZ)), case)
    M(f"amplifier_meter_{i + 1}", comp.box((0.066, 0.001, 0.042), at=(x, FY - 0.0035, MZ)), meter)
    ticks = []
    for k in range(11):
        a = math.radians(-40 + k * 8)
        t = comp.box((0.0007, 0.0006, 0.004 if k % 5 else 0.007), at=(0, 0, 0.03))
        xf(t, T(x, FY - 0.0043, MZ - 0.017) @ Matrix.Rotation(-a, 4, "Y"))
        ticks.append(t)
    M(f"amplifier_meter_ticks_{i + 1}", comp.merge(*ticks), ink)
    zone = comp.box((0.012, 0.0006, 0.002), at=(0.0, 0, 0.034))
    xf(zone, T(x, FY - 0.0043, MZ - 0.017) @ Matrix.Rotation(math.radians(33), 4, "Y"))
    M(f"amplifier_meter_red_{i + 1}", zone, red)
    nd = comp.pivot(col, root, f"amplifier_needle_{i + 1}", (x, FY - 0.0052, MZ - 0.017))
    M(f"amplifier_needle_{i + 1}_arm", comp.box((0.0007, 0.0005, 0.031), at=(x, FY - 0.0052, MZ - 0.017 + 0.0155)), ink, parent=nd)
    nd.rotation_euler[1] = math.radians(-38)
    needles.append(nd)
bpy.context.view_layer.update()
VX, VZ = 0.135, F + 0.07
vol = comp.pivot(col, root, "amplifier_volume", (VX, FY, VZ))
shade(M("amplifier_volume_knob", xf(turn([(0, 0.022), (0.026, 0.022), (0.028, 0.019), (0.028, 0.004), (0.031, 0.0), (0, 0.0)], seg=48), T(VX, FY, VZ) @ R(90, "X")), knob, parent=vol))
M("amplifier_volume_index", comp.box((0.002, 0.001, 0.016), at=(VX, FY - 0.0224, VZ + 0.017)), ink, parent=vol)
vol.rotation_euler[1] = math.radians(-135)
M("amplifier_volume_marks", comp.merge(*[xf(comp.box((0.001, 0.0006, 0.004), at=(0, 0, 0.037)), T(VX, FY - 0.0003, VZ) @ Matrix.Rotation(math.radians(-135 + k * 27), 4, "Y")) for k in range(11)]), ink)
small = []
for k in range(4):
    small.append(xf(turn([(0, 0.014), (0.01, 0.014), (0.011, 0.012), (0.011, 0.0), (0, 0.0)], seg=24), T(-0.01 + k * 0.034, FY, F + 0.035) @ R(90, "X")))
shade(M("amplifier_knobs", comp.merge(*small), knob))
M("amplifier_knob_marks", comp.merge(*[comp.box((0.001, 0.001, 0.008), at=(-0.01 + k * 0.034 + (k - 1.5) * 0.002, FY - 0.0143, F + 0.039)) for k in range(4)]), ink)
tg = []
for k in range(3):
    x = 0.0 + k * 0.03
    tg.append(comp.cyl(0.005, 0.003, at=(x, FY - 0.003, F + 0.095), seg=12, axis="Y"))
    tg.append(xf(comp.cyl(0.002, 0.014, seg=8, r2=0.003), T(x, FY - 0.002, F + 0.095) @ R(90 + (25 if k % 2 else -25), "X")))
shade(M("amplifier_toggles", comp.merge(*tg), knob))
M("amplifier_power_lamp", comp.cyl(0.004, 0.002, at=(-0.185, FY - 0.002, F + 0.035), seg=12, axis="Y"), lamp)
M("amplifier_socket", comp.merge(comp.cyl(0.007, 0.002, at=(-0.16, FY - 0.002, F + 0.035), seg=14, axis="Y"), comp.cyl(0.0032, 0.0022, at=(-0.16, FY - 0.0022, F + 0.035), seg=10, axis="Y")), ink)
M("amplifier_words", comp.merge(xf(comp.text("VOLUME", 0.006, depth=0.0004), T(VX, FY - 0.0003, F + 0.022)), xf(comp.text("L", 0.006, depth=0.0004), T(-0.135, FY - 0.0003, F + 0.05)), xf(comp.text("R", 0.006, depth=0.0004), T(-0.05, FY - 0.0003, F + 0.05)),
                                   xf(comp.text("STEREO  40", 0.007, depth=0.0004), T(0.03, FY - 0.0003, F + 0.117))), ink)
channel("level", [(n, "rotation_euler", 1, math.radians(-38), math.radians(27)) for n in needles])
channel("volume", [(vol, "rotation_euler", 1, math.radians(-135), math.radians(135))])
done(col, root, "amplifier", "own geometry (a generic stereo amplifier; cheeks https://polyhaven.com/a/walnut_veneer, CC0)",
     rig={"level": "both VU needles from rest to the red zone, 65 degrees about their pivots", "volume": "the volume knob 270 degrees clockwise",
          "glow": "in the scene: the materials amplifier_meter (the lit meter faces) and amplifier_lamp (the power lamp)"})
