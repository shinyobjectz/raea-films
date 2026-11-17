# stairwell/door: a landing's fire door in its frame, 0.9 x 2.05 m, modelled by hand: a deep painted casing (13 cm,
# so it sits proud of the round wall) with an architrave, a leaf with two sunk panels, a wired-glass vision panel,
# a steel kick plate, a lever handle on its rose both sides, three butt hinges, an overhead closer with its arm, and
# a floor-number plate. Behind the leaf is the dark of the corridor (door_beyond). A wall item: its back at y 0, its
# front toward -y. Rig: "open" swings the leaf 85 degrees out on its hinges; "handle" turns the lever 35 degrees.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("door")
paint = comp.mat("door_paint", (0.11, 0.2, 0.19), rough=0.42)
casing_m = comp.mat("door_casing", (0.72, 0.7, 0.63), rough=0.5)
steel = comp.mat("door_steel", (0.74, 0.74, 0.76), rough=0.3, metal=1.0)
glass = comp.mat("door_glass", (0.55, 0.62, 0.6), rough=0.08, alpha=0.35)
wire = comp.mat("door_wire", (0.05, 0.05, 0.05), rough=0.5)
beyond = comp.mat("door_beyond", (0.012, 0.012, 0.014), rough=0.9)
plate = comp.mat("door_plate", (0.86, 0.84, 0.76), rough=0.4)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, HT, TH, DEPTH = 0.9, 2.05, 0.045, 0.13
YL = -DEPTH + 0.035     # the leaf's centre plane
jamb = comp.merge(comp.box((0.06, DEPTH, HT + 0.06), at=(-W / 2 - 0.03, -DEPTH / 2, (HT + 0.06) / 2)), comp.box((0.06, DEPTH, HT + 0.06), at=(W / 2 + 0.03, -DEPTH / 2, (HT + 0.06) / 2)),
                  comp.box((W + 0.12, DEPTH, 0.06), at=(0, -DEPTH / 2, HT + 0.03)))
j = M("door_frame", jamb, casing_m)
comp.bevel(j, 0.004, 2)
arch = comp.merge(comp.box((0.09, 0.022, HT + 0.1), at=(-W / 2 - 0.075, -DEPTH - 0.011, (HT + 0.1) / 2)), comp.box((0.09, 0.022, HT + 0.1), at=(W / 2 + 0.075, -DEPTH - 0.011, (HT + 0.1) / 2)),
                  comp.box((W + 0.33, 0.022, 0.1), at=(0, -DEPTH - 0.011, HT + 0.08)), comp.box((W + 0.38, 0.04, 0.03), at=(0, -DEPTH - 0.02, HT + 0.145)))
a = M("door_architrave", arch, casing_m)
comp.bevel(a, 0.006, 3)
M("door_beyond", comp.box((W, 0.004, HT), at=(0, -0.012, HT / 2)), beyond)
M("door_threshold", comp.box((W, DEPTH, 0.012), at=(0, -DEPTH / 2, 0.006)), steel)
hinge = comp.pivot(col, root, "door_leaf", (-W / 2, YL, 0))
# the leaf: stiles and rails round two sunk panels and the vision panel's opening
G0, G1, GX = 1.22, 1.82, 0.2     # the vision panel: from, to, and its half width (set toward the latch side)
GC = 0.14
parts = [comp.box((W - 0.004, TH, 0.26), at=(0, YL, 0.008 + 0.13)), comp.box((W - 0.004, TH, 0.13), at=(0, YL, 1.07)), comp.box((W - 0.004, TH, HT - G1 - 0.006), at=(0, YL, (HT + G1) / 2 - 0.003)),
         comp.box((0.13, TH, HT - 0.008), at=(-W / 2 + 0.067, YL, HT / 2)), comp.box((0.13, TH, HT - 0.008), at=(W / 2 - 0.067, YL, HT / 2)),
         comp.box((W - 0.2, TH - 0.02, 0.76), at=(0, YL, 0.64)),
         comp.box((GC - GX + W / 2 - 0.1, TH, G1 - 1.1), at=((-W / 2 + 0.1 + GC - GX) / 2, YL, (G1 + 1.1) / 2)), comp.box((W / 2 - 0.1 - GC - GX, TH, G1 - 1.1), at=((W / 2 - 0.1 + GC + GX) / 2, YL, (G1 + 1.1) / 2)),
         comp.box((2 * GX + 0.02, TH, G0 - 1.13), at=(GC, YL, (G0 + 1.13) / 2))]
leaf = M("door_leaf_panel", comp.merge(*parts), paint, parent=hinge)
comp.bevel(leaf, 0.004, 2)
beads = []
for sy in (-1, 1):
    y = YL + sy * (TH / 2 - 0.004)
    beads += [comp.box((2 * GX + 0.03, 0.012, 0.016), at=(GC, y, G0)), comp.box((2 * GX + 0.03, 0.012, 0.016), at=(GC, y, G1)), comp.box((0.016, 0.012, G1 - G0), at=(GC - GX, y, (G0 + G1) / 2)), comp.box((0.016, 0.012, G1 - G0), at=(GC + GX, y, (G0 + G1) / 2))]
M("door_beads", comp.merge(*beads), paint, parent=hinge)
M("door_glass", comp.box((2 * GX, 0.006, G1 - G0), at=(GC, YL, (G0 + G1) / 2)), glass, parent=hinge)
wires = [comp.box((0.0012, 0.0012, G1 - G0), at=(GC - GX + 0.0125 * k, YL, (G0 + G1) / 2)) for k in range(1, 32)] + [comp.box((2 * GX, 0.0012, 0.0012), at=(GC, YL, G0 + 0.0125 * k)) for k in range(1, 48)]
M("door_wire", comp.merge(*wires), wire, parent=hinge)
M("door_kick_plate", comp.merge(*[comp.box((W - 0.06, 0.0015, 0.2), at=(0, YL + sy * (TH / 2 + 0.0008), 0.125)) for sy in (-1, 1)]), steel, parent=hinge)
M("door_hinges", comp.merge(*[comp.cyl(0.007, 0.1, at=(-W / 2 - 0.002, YL - TH / 2 - 0.004, z), seg=12) for z in (0.2, 1.0, 1.8)]), steel, parent=hinge)
# the lever handle on its rose, both sides, on one spindle
hp = comp.pivot(col, root, "door_handle", (W / 2 - 0.07, YL, 1.02), parent=hinge)
hb = []
for sy in (-1, 1):
    y = YL + sy * (TH / 2)
    hb += [comp.cyl(0.026, 0.008, at=(W / 2 - 0.07, y - (0.008 if sy < 0 else 0), 1.02), seg=24, axis="Y"),
           comp.cyl(0.009, 0.05, at=(W / 2 - 0.07, y - (0.05 if sy < 0 else 0), 1.02), seg=14, axis="Y"),
           comp.cyl(0.009, 0.12, at=(W / 2 - 0.07 - 0.12, y + sy * 0.045, 1.02), seg=14, axis="X")]
M("door_handle_lever", comp.merge(*hb), steel, parent=hp, smooth=True)
M("door_lock", comp.merge(*[comp.cyl(0.02, 0.006, at=(W / 2 - 0.07, YL + sy * TH / 2 - (0.006 if sy < 0 else 0), 0.92), seg=20, axis="Y") for sy in (-1, 1)]), steel, parent=hinge, smooth=True)
# the closer: its body on the leaf's top rail, its arm to the frame's head
cl = M("door_closer", comp.box((0.22, 0.045, 0.06), at=(-W / 2 + 0.2, YL - TH / 2 - 0.023, HT - 0.07)), steel, parent=hinge)
comp.bevel(cl, 0.006, 3)
M("door_closer_arm", comp.merge(comp.taper((-W / 2 + 0.2, YL - TH / 2 - 0.05, HT - 0.035), (-W / 2 + 0.42, YL - TH / 2 - 0.12, HT - 0.035), 0.022, 0.018, 0.006, 0.006),
                                comp.taper((-W / 2 + 0.42, YL - TH / 2 - 0.12, HT - 0.027), (-W / 2 + 0.34, -DEPTH - 0.02, HT - 0.027), 0.018, 0.018, 0.006, 0.006)), steel, parent=hinge)
M("door_number_plate", comp.box((0.11, 0.003, 0.11), at=(-0.17, YL - TH / 2 - 0.0015, 1.52)), plate, parent=hinge)
M("door_number", xf(comp.text("3", 0.085, depth=0.002), T(-0.17, YL - TH / 2 - 0.004, 1.52)), wire, parent=hinge)
comp.channel("open", [(hinge, "rotation_euler", 2, 0, math.radians(-85))])
comp.channel("handle", [(hp, "rotation_euler", 1, 0, math.radians(-35))])
comp.export(col, root, "stairwell", "door", made="blender/components/stairwell/door.py", source="own geometry (a generic panelled fire door); the number in Blender's built-in font", license="ours", credit="",
            rig={"open": "the leaf swings 85 degrees out toward the landing on its hinges", "handle": "the lever turns 35 degrees down",
                 "light": "in the scene: the material door_beyond is the corridor behind the leaf (dark at rest; give it a glow for a lit corridor)"})
