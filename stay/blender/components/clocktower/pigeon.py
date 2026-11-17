# clocktower/pigeon: a feral pigeon, 0.33 m, modelled by hand: a grey body and paler folded wings with two dark bars,
# a darker head on a green-purple neck, a white cere over a dark beak, orange eyes, a dark-tipped tail, pink legs and
# toes. Stands on the origin facing -y. Rig: "peck" tips it forward on its legs 50 degrees, head to the floor;
# "flap" lifts both wings 95 degrees about the shoulders.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, sphere

col, root = comp.fresh("pigeon")
grey = comp.mat("pigeon_grey", (0.3, 0.32, 0.36), rough=0.6)
pale = comp.mat("pigeon_wing", (0.5, 0.52, 0.56), rough=0.6)
dark = comp.mat("pigeon_dark", (0.06, 0.065, 0.08), rough=0.55)
neck_m = comp.mat("pigeon_neck", (0.1, 0.28, 0.2), rough=0.25, metal=0.6)
bib = comp.mat("pigeon_bib", (0.3, 0.14, 0.3), rough=0.25, metal=0.6)
white = comp.mat("pigeon_cere", (0.9, 0.9, 0.88), rough=0.5)
eye_m = comp.mat("pigeon_eye", (0.9, 0.35, 0.05), rough=0.2)
pink = comp.mat("pigeon_feet", (0.75, 0.3, 0.3), rough=0.5)
M = lambda n, bm, m, parent=None, smooth=True: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
body = comp.pivot(col, root, "pigeon_body", (0, 0.0, 0.062))
b = sphere(1, scale=(0.056, 0.115, 0.062), u=24, v=16)
xf(b, R(-14, "X")); xf(b, T(0, 0.005, 0.118))
M("pigeon_breast", b, grey, parent=body)
M("pigeon_rump", sphere(1, at=(0, 0.085, 0.108), scale=(0.04, 0.07, 0.036), u=16, v=10), pale, parent=body)
n = sphere(1, scale=(0.034, 0.036, 0.06), u=16, v=12)
xf(n, R(22, "X")); xf(n, T(0, -0.078, 0.17))
M("pigeon_neck", n, neck_m, parent=body)
M("pigeon_bib", sphere(1, at=(0, -0.086, 0.145), scale=(0.036, 0.03, 0.03), u=16, v=10), bib, parent=body)
M("pigeon_head", sphere(1, at=(0, -0.098, 0.212), scale=(0.025, 0.03, 0.026), u=20, v=14), grey, parent=body)
M("pigeon_beak", comp.merge(comp.cyl(0.0065, 0.026, at=(0, -0.124, 0.207), seg=10, r2=0.002, axis="Y") if False else xf(comp.cyl(0.0065, 0.026, seg=10, r2=0.0015), comp.Matrix.Translation((0, -0.122, 0.208)) @ R(100, "X"))), dark, parent=body)
M("pigeon_cere", sphere(1, at=(0, -0.124, 0.213), scale=(0.007, 0.007, 0.0045), u=10, v=6), white, parent=body)
M("pigeon_eyes", comp.merge(*[sphere(0.0048, at=(s * 0.0215, -0.106, 0.217), u=10, v=6) for s in (-1, 1)]), eye_m, parent=body)
M("pigeon_pupils", comp.merge(*[sphere(0.0026, at=(s * 0.0252, -0.1065, 0.217), u=8, v=5) for s in (-1, 1)]), dark, parent=body)
tail = comp.taper((0, 0.1, 0.112), (0, 0.215, 0.082), 0.05, 0.075, 0.012, 0.006)
M("pigeon_tail", tail, grey, parent=body, smooth=False)
M("pigeon_tail_tip", comp.taper((0, 0.185, 0.0905), (0, 0.218, 0.0822), 0.07, 0.077, 0.0125, 0.007), dark, parent=body, smooth=False)
wings = []
for s, nm in ((-1, "left"), (1, "right")):
    wp = comp.pivot(col, root, f"pigeon_wing_{nm}", (s * 0.046, -0.04, 0.158), parent=body)
    w = sphere(1, scale=(0.011, 0.105, 0.046), u=20, v=12)
    xf(w, R(-16, "X")); xf(w, T(s * 0.054, 0.035, 0.122))
    M(f"pigeon_wing_{nm}_mesh", w, pale, parent=wp)
    bars = []
    for y, zz in ((0.055, 0.108), (0.092, 0.1)):
        bar = comp.box((0.004, 0.012, 0.06), at=(0, 0, 0))
        xf(bar, R(-30, "X")); xf(bar, T(s * 0.0635, y, zz)); bars.append(bar)
    tip = sphere(1, scale=(0.006, 0.05, 0.016), u=12, v=8)
    xf(tip, R(-16, "X")); xf(tip, T(s * 0.05, 0.13, 0.098)); bars.append(tip)
    M(f"pigeon_wing_{nm}_bars", comp.merge(*bars), dark, parent=wp, smooth=False)
    wings.append((wp, s))
legs = []
for s in (-1, 1):
    legs.append(comp.cyl(0.0035, 0.07, at=(s * 0.022, 0.012, 0.003), seg=8))
    for a, L in ((0, 0.032), (32, 0.028), (-32, 0.028), (180, 0.016)):
        toe = comp.box((0.0045, L, 0.004), at=(0, -L / 2, 0.002))
        xf(toe, R(a, "Z")); xf(toe, T(s * 0.022, 0.012, 0)); legs.append(toe)
M("pigeon_legs", comp.merge(*legs), pink, smooth=False)
comp.channel("peck", [(body, "rotation_euler", 0, 0, math.radians(50))])
comp.channel("flap", [(wp, "rotation_euler", 1, 0, s * math.radians(-95)) for wp, s in wings])
comp.export(col, root, "clocktower", "pigeon", made="blender/components/clocktower/pigeon.py", source="own geometry (a feral pigeon)", license="ours", credit="",
            rig={"peck": "the body tips forward 50 degrees on its legs, the head to the floor", "flap": "both wings lift 95 degrees about the shoulders"})
