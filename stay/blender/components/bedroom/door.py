# bedroom/door: a six-panel interior door in its frame, for the side wall's doorway (0.82 x 2.03 m): a painted frame
# and architrave, the leaf 0.80 x 2.02 m with six raised panels front and back, three brass butt hinges, a brass knob
# on a rose each side, a coat hook with a kid's cap's worth of room, and a hand-lettered KEEP OUT sign. Its origin is
# the doorway's foot centre on the wall's room face (y 0); the leaf is flush with it and swings into the room.
# Rig: "open" swings the leaf 80 degrees into the room about its hinges; "knob" turns the knob 50 degrees.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from comp import T, R, xf
col, root = comp.fresh("door")
M = _lib.maker(col, root)
DW, DH, TH = 0.82, 2.03, 0.14
white = comp.mat("door_paint", (0.9, 0.89, 0.84), rough=0.38)
brass = comp.mat("door_brass", (0.74, 0.58, 0.28), rough=0.25, metal=1.0)
sign_m = comp.mat("door_sign", (0.9, 0.7, 0.05), rough=0.6)
ink = comp.mat("door_sign_ink", (0.4, 0.01, 0.01), rough=0.6)
AW = 0.07
fr = comp.merge(comp.box((0.03, TH, DH), at=(-DW / 2 + 0.015 - 0.03, TH / 2, DH / 2)), comp.box((0.03, TH, DH), at=(DW / 2 - 0.015 + 0.03, TH / 2, DH / 2)), comp.box((DW + 0.06, TH, 0.03), at=(0, TH / 2, DH + 0.015)),
                comp.box((AW, 0.02, DH + AW), at=(-DW / 2 - AW / 2, -0.01, (DH + AW) / 2)), comp.box((AW, 0.02, DH + AW), at=(DW / 2 + AW / 2, -0.01, (DH + AW) / 2)), comp.box((DW + 2 * AW, 0.02, AW), at=(0, -0.01, DH + AW / 2)))
f = M("door_frame", fr, white)
comp.bevel(f, 0.004, 2)
LW, LH, LT = DW - 0.008, DH - 0.012, 0.04
hinge = comp.pivot(col, root, "door_hinge", (-DW / 2 + 0.004, 0.0, 0.0))
leaf = [comp.box((LW, LT, LH), at=(0, LT / 2, LH / 2 + 0.006))]
# six raised panels each face: two small on top, two tall, two medium
rows = [(1.62, 0.3), (1.02, 0.72), (0.33, 0.44)]
for zc, ph in rows:
    for sx in (-1, 1):
        for y in (-0.004, LT + 0.004):
            leaf.append(comp.box((0.27, 0.012, ph), at=(sx * 0.185, y, zc)))
            leaf.append(comp.box((0.21, 0.02, ph - 0.06), at=(sx * 0.185, y, zc)))
lo = M("door_leaf", comp.merge(*leaf), white, parent=hinge)
comp.bevel(lo, 0.004, 2)
hs = [comp.merge(comp.cyl(0.006, 0.09, at=(-DW / 2 + 0.002, -0.004, z), seg=12), comp.box((0.03, 0.003, 0.09), at=(-DW / 2 + 0.018, -0.0015, z + 0.045))) for z in (0.2, 0.98, 1.76)]
M("door_hinges", comp.merge(*hs), brass, parent=hinge)
kx, kz = DW / 2 - 0.07, 1.0
knob = comp.pivot(col, root, "door_knob", (kx, 0, kz), parent=hinge)
prof = [(0.0, 0.0), (0.03, 0.0), (0.032, 0.004), (0.012, 0.008), (0.011, 0.03), (0.022, 0.04), (0.029, 0.052), (0.027, 0.066), (0.015, 0.074), (0.0, 0.076)]
k1 = xf(_lib.turn(prof, seg=28), R(90, "X") @ T(0, 0, 0)); xf(k1, T(kx, 0, kz))
k2 = xf(_lib.turn(prof, seg=28), R(-90, "X")); xf(k2, T(kx, LT, kz))
M("door_knob_mesh", comp.merge(k1, k2), brass, parent=knob, smooth=True)
M("door_hook", comp.merge(comp.box((0.03, 0.004, 0.06), at=(0, -0.002, 1.82)), comp.tube([(0, -0.004, 1.81), (0, -0.04, 1.8), (0, -0.05, 1.825), (0, -0.04, 1.85)], 0.004)), brass, parent=hinge, smooth=True)
sg = M("door_sign", xf(comp.box((0.3, 0.003, 0.16)), R(-4, "Y") @ T(0, -0.012, 1.42)), sign_m, parent=hinge)
M("door_sign_text", xf(comp.merge(xf(comp.text("KEEP", 0.055, depth=0.001), T(0, 0, 0.035)), xf(comp.text("OUT!", 0.055, depth=0.001), T(0, 0, -0.035))), R(-4, "Y") @ T(0, -0.0145, 1.42)), ink, parent=hinge)
comp.channel("open", [(hinge, "rotation_euler", 2, 0, math.radians(-80))])
comp.channel("knob", [(knob, "rotation_euler", 1, 0, math.radians(50))])
comp.export(col, root, _lib.PLACE, "door", made="blender/components/bedroom/door.py", source="own geometry (a generic six-panel door)", license="ours", credit="",
            rig={"open": "the leaf swings 80 degrees into the room about its hinges (door_hinge)", "knob": "the knob turns 50 degrees on its spindle"})
