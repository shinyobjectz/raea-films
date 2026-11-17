# ferris/controls: the wheel operator's console, 1.15 m high, modelled by hand: a steel pedestal with a door and a
# padlock hasp, a sloped panel with a long brake lever in a gated slot, a red mushroom stop, a green start button,
# a key switch with its key, an ammeter with a needle, and an armoured cable out of its base. Its front (the side
# the operator stands at) faces -y. The start button's lens is its own material (controls_lamp).
# Rig: "lever" throws the lever 56 degrees from off to full; "needle" swings the ammeter's needle 100 degrees;
# "key" turns the key a quarter turn.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("controls")
grey = comp.mat("controls_cabinet", (0.3, 0.34, 0.33), rough=0.45, metal=0.4)
panel_m = comp.mat("controls_panel", (0.62, 0.62, 0.6), rough=0.35, metal=1.0)
black = comp.mat("controls_black", (0.02, 0.02, 0.02), rough=0.5)
redm = comp.mat("controls_stop", (0.7, 0.03, 0.03), rough=0.3)
lamp = comp.mat("controls_lamp", (0.1, 0.6, 0.15), rough=0.2, emit=(0.1, 1.0, 0.2), strength=4.0)
chrome = comp.mat("controls_chrome", (0.85, 0.85, 0.87), rough=0.15, metal=1.0)
dial = comp.mat("controls_dial", (0.9, 0.9, 0.85), rough=0.5)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, D, HT = 0.6, 0.45, 0.95
b = M("controls_cabinet", comp.merge(comp.box((W, D, HT), at=(0, 0, HT / 2 + 0.05)), comp.box((W + 0.06, D + 0.06, 0.05), at=(0, 0, 0.025))), grey)
comp.bevel(b, 0.008, 2)
M("controls_door", comp.merge(comp.box((W - 0.08, 0.008, HT - 0.2), at=(0, -D / 2 - 0.004, HT / 2)), comp.box((0.03, 0.02, 0.06), at=(W / 2 - 0.08, -D / 2 - 0.016, HT / 2)),
                              *[comp.cyl(0.008, 0.06, at=(-W / 2 + 0.045, -D / 2 - 0.01, z), seg=8) for z in (0.25, 0.75)]), grey)
# the panel: sloped 25 degrees down toward the operator; things on it are built flat and tipped with it
TIP = comp.Matrix.Translation((0, 0, HT + 0.05)) @ R(-25, "X")
def on_panel(bm):
    return xf(bm, TIP)
p = M("controls_panel", on_panel(comp.box((W + 0.04, D + 0.12, 0.03), at=(0, -0.02, 0.06))), panel_m)
comp.bevel(p, 0.004, 2)
PZ = 0.075
M("controls_slot", on_panel(comp.merge(comp.box((0.05, 0.3, 0.004), at=(-0.17, -0.02, PZ + 0.002)), *[comp.box((0.07, 0.006, 0.006), at=(-0.17, -0.02 + y, PZ + 0.004)) for y in (-0.15, 0, 0.15)])), black)
M("controls_stop_base", on_panel(comp.cyl(0.035, 0.02, at=(0.19, -0.14, PZ), seg=20)), comp.mat("controls_yellow", (0.85, 0.65, 0.05), rough=0.4))
M("controls_stop", on_panel(comp.merge(comp.cyl(0.012, 0.03, at=(0.19, -0.14, PZ + 0.02), seg=12), comp.cyl(0.03, 0.02, at=(0.19, -0.14, PZ + 0.045), seg=20, r2=0.024))), redm, None, True)
M("controls_start", on_panel(comp.merge(comp.cyl(0.022, 0.012, at=(0.07, -0.14, PZ), seg=20))), chrome, None, True)
M("controls_start_lens", on_panel(comp.cyl(0.017, 0.01, at=(0.07, -0.14, PZ + 0.012), seg=20, r2=0.014)), lamp, None, True)
M("controls_meter", on_panel(comp.merge(comp.cyl(0.06, 0.02, at=(0.13, 0.08, PZ), seg=28), L.torus(0.06, 0.006, seg_=28, sides=6, at=(0.13, 0.08, PZ + 0.02)))), black, None, True)
M("controls_meter_dial", on_panel(comp.merge(comp.cyl(0.055, 0.002, at=(0.13, 0.08, PZ + 0.02), seg=28))), dial)
M("controls_meter_marks", on_panel(comp.merge(*[xf(comp.box((0.002, 0.012, 0.0006), at=(0, 0.042, 0)), comp.Matrix.Translation((0.13, 0.07, PZ + 0.0225)) @ R(-50 + 12.5 * k, "Z")) for k in range(9)])), black)
ldp = comp.pivot(col, root, "controls_lever", tuple(TIP @ Vector((-0.17, -0.02, PZ - 0.04))))
ldp.rotation_euler[0] = math.radians(-25)
np_ = comp.pivot(col, root, "controls_needle", tuple(TIP @ Vector((0.13, 0.07, PZ + 0.024))))
np_.rotation_euler[0] = math.radians(-25)
kp = comp.pivot(col, root, "controls_key", tuple(TIP @ Vector((-0.02, -0.14, PZ))))
kp.rotation_euler[0] = math.radians(-25)
comp.bpy.context.view_layer.update()
lever = comp.merge(comp.cyl(0.011, 0.36, at=(-0.17, -0.02, PZ - 0.04), seg=10), L.sphere(0.03, at=(-0.17, -0.02, PZ + 0.335), u=14, v=8), comp.cyl(0.016, 0.1, at=(-0.17, -0.02, PZ + 0.21), seg=12))
xf(lever, comp.Matrix.Translation((-0.17, -0.02, PZ - 0.04)) @ R(28, "X") @ comp.Matrix.Translation((0.17, 0.02, -PZ + 0.04)))   # off: leaning back
M("controls_lever_arm", on_panel(lever), chrome, ldp, True)
M("controls_needle_hand", on_panel(xf(comp.merge(comp.box((0.003, 0.05, 0.001), at=(0, 0.02, 0)), comp.cyl(0.006, 0.003, seg=10)), comp.Matrix.Translation((0.13, 0.07, PZ + 0.024)) @ R(50, "Z"))), redm, np_)
M("controls_key_switch", on_panel(comp.merge(comp.cyl(0.018, 0.012, at=(-0.02, -0.14, PZ), seg=16))), chrome, None, True)
M("controls_key_blade", on_panel(comp.merge(comp.box((0.004, 0.012, 0.03), at=(-0.02, -0.14, PZ + 0.025)), comp.cyl(0.014, 0.004, at=(-0.022, -0.14, PZ + 0.05), seg=12, axis="X"))), chrome, kp)
M("controls_cable", comp.tube([(0.2, D / 2 - 0.02, 0.2), (0.25, D / 2 + 0.15, 0.03), (0.5, D / 2 + 0.4, 0.02), (1.0, D / 2 + 0.5, 0.02), (1.5, D / 2 + 0.35, 0.02)], 0.018, res=6, sides=3), black, None, True)
comp.channel("lever", [(ldp, "rotation_euler", 0, ldp.rotation_euler[0], ldp.rotation_euler[0] - math.radians(56))])
comp.channel("needle", [(np_, "rotation_euler", 2, 0, math.radians(-100))])
comp.channel("key", [(kp, "rotation_euler", 2, 0, math.radians(-90))])
comp.export(col, root, "ferris", "controls", made="blender/components/ferris/controls.py", source="own geometry (a generic ride operator's console)", license="ours", credit="",
            rig={"lever": "the brake lever is thrown 56 degrees forward, from off to full", "needle": "the ammeter's needle swings 100 degrees across its scale", "key": "the key turns a quarter turn",
                 "lamp": "in the scene: the material controls_lamp (the start button's lens) glows"})
