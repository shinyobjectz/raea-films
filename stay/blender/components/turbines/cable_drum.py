# turbines/cable-drum: a timber cable drum left by the crane pad, modelled by hand: two 1.8 m plank flanges with steel
# rims, tie bolts and a stencilled plate, a slatted barrel wound with turns of black armoured cable (its tail tucked
# through the flange), and two timber chocks under it. Planks from a Poly Haven texture set. It stands on its rims;
# its axle lies along y. Rig: "roll" rolls it one whole turn along +x, 5.65 m, off its chocks.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe

col, root = comp.fresh("cable_drum")
wood = comp.ph_texture("drum_planks", "weathered_planks", tile=1.2, res="1k")
steel = comp.mat("drum_steel", (0.35, 0.33, 0.3), rough=0.6, metal=0.8)
cable = comp.mat("drum_cable", (0.015, 0.015, 0.017), rough=0.45)
plate = comp.mat("drum_plate", (0.85, 0.85, 0.8), rough=0.6)
black = comp.mat("drum_black", (0.01, 0.01, 0.012), rough=0.6)
M = _lib.maker(col, root)
RAD, WID = 0.9, 1.1
roll = comp.pivot(col, root, "cable_drum_roll", (0, 0, RAD))
spin = comp.pivot(col, root, "cable_drum_spin", (0, 0, RAD), parent=roll)


def along_y(bm):
    return xf(xf(bm, R(-90, "X")), T(0, 0, RAD))


fl = []
for s in (-1, 1):
    d = comp.cyl(RAD - 0.01, 0.07, at=(0, 0, s * (WID / 2) - 0.035), seg=56)
    fl.append(d)
fo = M("cable_drum_flanges", along_y(comp.merge(*fl)), wood, parent=spin)
comp.uv_box(fo, 1.0)
grooves = []
for s in (-1, 1):
    for i in range(-5, 6):
        w = 2 * math.sqrt(max(0.0, (RAD - 0.012) ** 2 - (i * 0.16) ** 2))
        grooves.append(comp.box((0.012, w, 0.006), at=(i * 0.16 + 0.08, 0, s * (WID / 2 + 0.036))))
M("cable_drum_plank_gaps", along_y(comp.merge(*grooves)), black, parent=spin)
iron = [lathe([(RAD - 0.012, s * (WID / 2) - 0.04), (RAD + 0.004, s * (WID / 2) - 0.04), (RAD + 0.004, s * (WID / 2) + 0.04), (RAD - 0.012, s * (WID / 2) + 0.04)], seg=56) for s in (-1, 1)]
iron += [comp.cyl(0.13, WID + 0.2, at=(0, 0, -WID / 2 - 0.1), seg=20), comp.cyl(0.045, WID + 0.3, at=(0, 0, -WID / 2 - 0.15), seg=12)]
for k in range(6):
    a = math.radians(k * 60 + 15)
    iron += [comp.cyl(0.012, WID + 0.18, at=(0.5 * math.cos(a), 0.5 * math.sin(a), -WID / 2 - 0.09), seg=6)]
    iron += [comp.cyl(0.035, 0.012, at=(0.5 * math.cos(a), 0.5 * math.sin(a), s * (WID / 2 + 0.04) - 0.006), seg=6) for s in (-1, 1)]
M("cable_drum_ironwork", along_y(comp.merge(*iron)), steel, parent=spin)
comp.uv_box(M("cable_drum_barrel", along_y(comp.cyl(0.42, WID - 0.14, at=(0, 0, -WID / 2 + 0.07), seg=28)), wood, parent=spin), 1.0)
turns = []
n = 16
for layer, r in enumerate((0.46, 0.53, 0.6)):
    for i in range(n - layer):
        z = -WID / 2 + 0.1 + (i + 0.5 * layer + 0.5) * (WID - 0.2) / n
        turns.append(lathe([(r + 0.036 * math.cos(q * math.pi / 4), z + 0.036 * math.sin(q * math.pi / 4)) for q in range(9)], seg=40))
M("cable_drum_cable", along_y(comp.merge(*turns)), cable, parent=spin, smooth=True)
tail = comp.tube([(0.6, -0.3, RAD + 0.1), (0.72, -0.5, RAD + 0.05), (0.7, -WID / 2 - 0.03, RAD - 0.1), (0.55, -WID / 2 - 0.06, RAD - 0.35)], 0.034, sides=3)
M("cable_drum_cable_tail", tail, cable, parent=spin, smooth=True)
M("cable_drum_plate", comp.box((0.34, 0.006, 0.2), at=(0, -WID / 2 - 0.038, RAD + 0.42)), plate, parent=spin)
tx = comp.text("3 x 240  33kV", 0.045, depth=0.002)
xf(tx, T(0, -WID / 2 - 0.043, RAD + 0.45))
tx2 = comp.text("ROLL THIS WAY  >", 0.03, depth=0.002)
xf(tx2, T(0, -WID / 2 - 0.043, RAD + 0.38))
M("cable_drum_plate_text", comp.merge(tx, tx2), black, parent=spin)
ch = []
for s in (-1, 1):
    w = bmesh.new()
    vs = [w.verts.new(p) for p in ((0.0, -0.45, 0), (0.42, -0.45, 0), (0.42, -0.45, 0.2), (0.0, 0.45, 0), (0.42, 0.45, 0), (0.42, 0.45, 0.2))]
    for q in ((0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)):
        w.faces.new([vs[i] for i in q])
    bmesh.ops.recalc_face_normals(w, faces=w.faces)
    if s > 0:
        xf(w, R(180, "Z"))
    xf(w, T(-s * 0.72, 0, 0))
    ch.append(w)
co = M("cable_drum_chocks", comp.merge(*ch), wood)
comp.uv_box(co, 1.0)
comp.channel("roll", [(roll, "location", 0, 0.0, 2 * math.pi * RAD), (spin, "rotation_euler", 1, 0.0, 2 * math.pi)])
comp.export(col, root, "turbines", "cable_drum", made="blender/components/turbines/cable_drum.py", source="own geometry (a generic timber cable drum); texture: https://polyhaven.com/a/weathered_planks; lettering in Blender's built-in font",
            license="ours; texture CC0", credit="Poly Haven (weathered_planks)",
            rig={"roll": "the drum rolls one whole turn along +x (5.65 m), turning about its axle; the chocks stay"})
