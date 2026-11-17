# bedroom/crt: a 14-inch portable colour television from the early nineties, modelled by hand, 0.40 x 0.37 x 0.40 m:
# a charcoal plastic cabinet with a deep tapered back and its vent slots, a front bezel round the bulging tube, the
# tube's face a part of its own (crt_screen, UVs 0 to 1 across it, 4:3), a control strip under it with a power button,
# channel and volume keys, a standby light (crt_led), a headphone jack and a speaker grille, a telescopic aerial
# folded along the top, four feet and the mains and aerial leads out the back.
# Rig: "screen" is the scene's: crt_screen's picture and glow (the raea app's captures; a render holds its first
# frame's material, so a key per state); "aerial" swings the aerial up 70 degrees; "power" presses the power button.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from comp import T, R, xf
import numpy as np
col, root = comp.fresh("crt")
M = _lib.maker(col, root)
W, H, D = 0.40, 0.37, 0.40
shell = comp.mat("crt_shell", (0.045, 0.045, 0.05), rough=0.55)
shell2 = comp.mat("crt_trim", (0.11, 0.11, 0.12), rough=0.45)
key = comp.mat("crt_key", (0.2, 0.2, 0.21), rough=0.4)
led = comp.mat("crt_led", (0.9, 0.1, 0.05), rough=0.3, emit=(1.0, 0.1, 0.03), strength=3.0)
chrome = comp.mat("crt_chrome", (0.85, 0.85, 0.87), rough=0.15, metal=1.0)
# the screen's rest picture: a dark tube with a faint reflection
px = _lib.canvas(256, 192, (0.03, 0.04, 0.045))
X, Y = _lib.grid_xy(px)
px += (0.05 * np.exp(-(((X - 0.3) / 0.25) ** 2 + ((Y - 0.25) / 0.2) ** 2)))[..., None]
scr_m = _lib.image_mat("crt_screen", _lib.save_image("crt_screen", px), rough=0.08, emit=1.0)
FZ = 0.012   # feet
SW, SH, SZ = 0.29, 0.2175, FZ + 0.215
yf = -D / 2
# front bezel: a frame of four pieces round the tube, rounded
bz = comp.merge(comp.box((W, 0.07, 0.05), at=(0, yf + 0.035, FZ + H - 0.025)), comp.box((W, 0.07, 0.085), at=(0, yf + 0.035, FZ + 0.0425)),
                comp.box(((W - SW) / 2, 0.07, H - 0.13), at=(-W / 2 + (W - SW) / 4, yf + 0.035, FZ + 0.085 + (H - 0.135) / 2)), comp.box(((W - SW) / 2, 0.07, H - 0.13), at=(W / 2 - (W - SW) / 4, yf + 0.035, FZ + 0.085 + (H - 0.135) / 2)))
bmesh.ops.remove_doubles(bz, verts=bz.verts, dist=1e-4)
b = M("crt_bezel", bz, shell)
comp.bevel(b, 0.008, 3)
# the tube's face: bulging, set back in the bezel
sc = _lib.panel(SW + 0.01, SH + 0.01, nx=16, ny=12)
for v in sc.verts:
    v.co.y = 0.014 * ((2 * v.co.x / SW) ** 2 + (2 * v.co.z / SH) ** 2) * 0.5
xf(sc, T(0, yf + 0.014, SZ))
M("crt_screen", sc, scr_m, smooth=True)
M("crt_mask", comp.box((SW + 0.02, 0.004, SH + 0.02), at=(0, yf + 0.034, SZ)), comp.mat("crt_mask", (0.01, 0.01, 0.01), rough=0.8))
# the back: tapered
bk = comp.box((W - 0.012, D - 0.07, H - 0.012), at=(0, yf + 0.07 + (D - 0.07) / 2, FZ + H / 2))
for v in bk.verts:
    if v.co.y > 0:
        v.co.x *= 0.68
        v.co.z = FZ + H / 2 + (v.co.z - FZ - H / 2) * 0.66 - 0.02
bo = M("crt_back", bk, shell)
comp.bevel(bo, 0.012, 3)
vents = [xf(comp.box((W * 0.55, 0.006, 0.004)), R(-9.5, "X") @ T(0, 0, 0)) for i in range(9)]
for i, v in enumerate(vents):
    xf(v, T(0, yf + 0.11 + i * 0.026, FZ + H - 0.004 - (0.11 + i * 0.026 - 0.07) * 0.168))
M("crt_vents", comp.merge(*vents), comp.mat("crt_vent", (0.005, 0.005, 0.005), rough=0.9))
# the control strip
power = comp.pivot(col, root, "crt_power", (-W / 2 + 0.045, yf, FZ + 0.04))
pb = M("crt_power_button", comp.box((0.03, 0.012, 0.018), at=(-W / 2 + 0.045, yf - 0.003, FZ + 0.04)), key, parent=power)
comp.bevel(pb, 0.003, 2)
M("crt_led", comp.cyl(0.004, 0.004, at=(-W / 2 + 0.085, yf - 0.003, FZ + 0.04), seg=12, axis="Y"), led)
keys = [comp.box((0.018, 0.008, 0.01), at=(0.02 + i * 0.026, yf - 0.002, FZ + 0.045)) for i in range(4)]
k = M("crt_keys", comp.merge(*keys), key)
comp.bevel(k, 0.002, 2)
M("crt_jack", comp.merge(comp.cyl(0.006, 0.003, at=(0.15, yf - 0.002, FZ + 0.045), seg=12, axis="Y")), chrome)
grille = [comp.cyl(0.0022, 0.002, at=(-0.07 + i * 0.008, yf - 0.0015, FZ + 0.028 + j * 0.008 + (i % 2) * 0.004), seg=6, axis="Y") for i in range(9) for j in range(4)]
M("crt_grille", comp.merge(*grille), comp.mat("crt_vent", (0.005, 0.005, 0.005), rough=0.9))
M("crt_badge", xf(comp.text("COLOR 14", 0.011, depth=0.0006), T(0.1, yf - 0.0006, FZ + 0.022)), comp.mat("crt_badge", (0.7, 0.7, 0.72), rough=0.3, metal=1.0))
M("crt_feet", comp.merge(*[comp.cyl(0.014, FZ, at=(sx * (W / 2 - 0.045), sy, 0), seg=14) for sx in (-1, 1) for sy in (yf + 0.04, 0.08)]), comp.mat("crt_rubber", (0.01, 0.01, 0.01), rough=0.8))
# the aerial, folded along the top, on a swivel at the back
ap = comp.pivot(col, root, "crt_aerial", (0.12, 0.03, FZ + H + 0.004))
aer = comp.merge(comp.cyl(0.0035, 0.3, at=(0.12 - 0.3, 0.03, FZ + H + 0.004), seg=10, axis="X"), comp.cyl(0.0025, 0.03, at=(0.12 - 0.33, 0.03, FZ + H + 0.004), seg=8, axis="X"), comp.cyl(0.0045, 0.008, at=(0.12 - 0.336, 0.03, FZ + H + 0.004), seg=8, axis="X"))
M("crt_aerial_rod", aer, chrome, parent=ap, smooth=True)
M("crt_aerial_base", comp.cyl(0.009, 0.012, at=(0.12, 0.03, FZ + H - 0.006), seg=14), shell2)
# leads
M("crt_leads", comp.merge(comp.tube([(0.06, D / 2 - 0.05, FZ + 0.1), (0.06, D / 2 + 0.03, FZ + 0.06), (0.08, D / 2 + 0.05, 0.004), (0.2, D / 2 + 0.06, 0.004)], 0.0035), comp.tube([(-0.05, D / 2 - 0.05, FZ + 0.14), (-0.05, D / 2 + 0.03, FZ + 0.09), (-0.09, D / 2 + 0.05, 0.004), (-0.25, D / 2 + 0.05, 0.004)], 0.003)), comp.mat("crt_lead", (0.02, 0.02, 0.02), rough=0.6), smooth=True)
comp.channel("aerial", [(ap, "rotation_euler", 1, 0, math.radians(70))])
comp.channel("power", [(power, "location", 1, power.location.y, power.location.y + 0.004)])
comp.export(col, root, _lib.PLACE, "crt", made="blender/components/bedroom/crt.py", source="own geometry (a generic 14-inch portable television)", license="ours", credit="",
            rig={"screen": "in the scene: crt_screen's picture and glow (the part crt_screen, UVs 0 to 1, 4:3, 0.30 x 0.23 m); crt_led is the standby light",
                 "aerial": "the telescopic aerial swings up 70 degrees from lying along the top", "power": "the power button goes in 4 mm"})
