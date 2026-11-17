# stairwell/riser: one storey of the dry riser, modelled by hand: a red 100 mm steel main the storey's height on two
# strap brackets, a flanged tee at 0.85 m to a landing valve (a gunmetal body, a red handwheel on its spindle, a
# capped outlet on a short chain) and an enamel plate over it. A wall item: its back at y 0, its front toward -y;
# its origin is on the floor under the pipe. Rig: "valve" turns the handwheel one whole turn on its spindle.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("riser")
red = comp.mat("riser_red", (0.52, 0.03, 0.025), rough=0.35)
gun = comp.mat("riser_gunmetal", (0.5, 0.42, 0.25), rough=0.35, metal=1.0)
steel = comp.mat("riser_steel", (0.6, 0.6, 0.62), rough=0.35, metal=1.0)
enamel = comp.mat("riser_plate", (0.6, 0.04, 0.03), rough=0.3)
white = comp.mat("riser_letters", (0.92, 0.92, 0.9), rough=0.4)
M = lambda n, bm, m, parent=None, smooth=True: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
PR, PY, VZ = 0.057, -0.1, 0.85
pipe = [comp.cyl(PR, L.H, at=(0, PY, -0.215), seg=24)]
for z in (0.3, 1.9):   # couplings
    pipe.append(comp.cyl(PR + 0.012, 0.09, at=(0, PY, z), seg=24))
pipe += [comp.cyl(PR - 0.008, 0.11, at=(0, PY - 0.16, VZ), seg=20, axis="Y"), comp.cyl(PR + 0.03, 0.018, at=(0, PY - 0.075, VZ), seg=24, axis="Y"), comp.cyl(PR + 0.03, 0.018, at=(0, PY - 0.17, VZ), seg=24, axis="Y")]
M("riser_pipe", comp.merge(*pipe), red)
bolts = [comp.cyl(0.007, 0.05, at=(math.cos(math.radians(45 * k)) * (PR + 0.016), PY - 0.185, VZ + math.sin(math.radians(45 * k)) * (PR + 0.016)), seg=6, axis="Y") for k in range(8)]
br = []
for z in (0.45, 2.3):
    br += [comp.box((0.2, 0.006, 0.04), at=(0, -0.003, z)), L.torus(PR + 0.004, 0.005, seg=24, sides=6, at=(0, PY, z)), comp.box((0.03, -PY - PR, 0.03), at=(0, (PY + PR) / 2, z))]
M("riser_brackets", comp.merge(*br, *bolts), steel, smooth=False)
# the landing valve: a globe body, its bonnet up at 45 degrees toward the front, the outlet down and forward
body = comp.merge(L.sphere(0.062, at=(0, PY - 0.23, VZ), u=20, v=12), comp.cyl(0.04, 0.12, at=(0, PY - 0.23, VZ), seg=20, axis="Y"))
out = comp.cyl(0.036, 0.11, seg=20)
xf(out, R(180 - 35, "X"))
xf(out, T(0, PY - 0.25, VZ - 0.03))
cap = comp.merge(comp.cyl(0.046, 0.035, seg=20), *[comp.box((0.012, 0.012, 0.03), at=(0.05 * math.cos(a), 0.05 * math.sin(a), 0.017)) for a in (0, math.pi)])
xf(cap, R(180 - 35, "X"))
xf(cap, T(0, PY - 0.25 - 0.11 * math.sin(math.radians(35)), VZ - 0.03 - 0.11 * math.cos(math.radians(35))))
bonnet = comp.cyl(0.03, 0.1, seg=16)
xf(bonnet, R(35, "X"))
BON = Vector((0, -math.sin(math.radians(35)), math.cos(math.radians(35))))
xf(bonnet, T(0, PY - 0.23, VZ))
M("riser_valve", comp.merge(body, out, bonnet), gun)
M("riser_cap", cap, red)
ch = [(0.03, PY - 0.25, VZ - 0.02)] + [(0.05, PY - 0.27 - 0.01 * k, VZ - 0.1 - 0.012 * (3 - abs(k - 3))) for k in range(7)] + [(0.04, PY - 0.33, VZ - 0.12)]
M("riser_chain", comp.tube(ch, 0.0025, res=4, sides=2), steel)
hub_at = Vector((0, PY - 0.23, VZ)) + BON * 0.16
wp = comp.pivot(col, root, "riser_wheel", tuple(hub_at))
wp.rotation_euler[0] = math.radians(-35 - 0)    # its local z runs along the spindle
comp.bpy.context.view_layer.update()
wheel = comp.merge(L.torus(0.075, 0.009, seg=32, sides=8), comp.cyl(0.018, 0.03, at=(0, 0, -0.015), seg=14), *[xf(comp.cyl(0.006, 0.075, seg=8, axis="X"), R(72 * k, "Z")) for k in range(5)])
spind = comp.cyl(0.008, 0.07, at=(0, 0, -0.07), seg=10)
for bm_ in (wheel, spind):
    xf(bm_, R(35, "X"))
    xf(bm_, T(*hub_at))
M("riser_wheel_rim", wheel, red, parent=wp)
M("riser_spindle", spind, steel, parent=wp)
pl = M("riser_plate", comp.box((0.24, 0.003, 0.09), at=(0.28, -0.0015, 1.45)), enamel, smooth=False)
M("riser_plate_letters", xf(comp.text("DRY RISER", 0.034, depth=0.001), T(0.28, -0.004, 1.45)), white, smooth=False)
comp.channel("valve", [(wp, "rotation_euler", 2, 0, 2 * math.pi)])
comp.export(col, root, "stairwell", "riser", made="blender/components/stairwell/riser.py", source="own geometry (a generic dry riser and landing valve); letters in Blender's built-in font", license="ours", credit="",
            rig={"valve": "the handwheel turns one whole turn on its spindle"}, notes="origin: on the landing under the pipe, against the wall; the main runs the storey's height")
