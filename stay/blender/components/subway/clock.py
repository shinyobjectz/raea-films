# subway/clock: the platform's hanging clock, modelled by hand: a two-faced drum 0.62 m across on a pipe drop from the
# ceiling with a scrolled bracket, each face lit opal glass (its own material, clock_glow) with painted hour figures
# and minute marks under a chromed bezel, black spade hands. It reads 2:10. A ceiling item: its top at z 0, its
# faces toward -y and +y (along the platform). Rig: "hands" winds an hour on, clockwise on both faces (minute a whole
# turn, hour 30 degrees); "glow" is the scene's: clock_glow.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, slab

col, root = comp.fresh("clock")
green = comp.mat("clock_case", (0.03, 0.09, 0.06), rough=0.4)
chrome = comp.mat("clock_bezel", (0.85, 0.85, 0.87), rough=0.12, metal=1.0)
face = comp.mat("clock_glow", (0.95, 0.93, 0.85), rough=0.4, emit=(1.0, 0.94, 0.8), strength=600.0)
ink = comp.mat("clock_ink", (0.015, 0.015, 0.015), rough=0.5)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
CZ, RD, HD = -0.95, 0.31, 0.11
M("clock_drop", comp.merge(comp.cyl(0.022, -CZ - RD + 0.02, at=(0, 0, CZ + RD - 0.02), seg=14), lathe([(0.0, 0.0), (0.07, 0.0), (0.07, -0.015), (0.03, -0.05), (0.022, -0.05)], seg=20),
                           comp.box((0.5, 0.012, 0.03), at=(0, 0, CZ + RD + 0.1)), *[xf(comp.box((0.012, 0.012, 0.3), at=(0, 0, 0.15)), comp.Matrix.Translation((s * 0.25, 0, CZ + RD - 0.07)) @ R(s * -50, "Y")) for s in (-1, 1)]), green)
M("clock_drum", lathe([(RD - 0.02, -HD), (RD, -HD), (RD + 0.012, -HD + 0.02), (RD + 0.012, HD - 0.02), (RD, HD), (RD - 0.02, HD)], seg=64, at=(0, 0, CZ), axis="Y"), green, smooth=False)
bez, faces, marks = [], [], []
hands = []
for s in (-1, 1):
    bez.append(lathe([(RD - 0.035, s * (HD + 0.012)), (RD, s * (HD + 0.012)), (RD + 0.004, s * HD), (RD - 0.03, s * HD)], seg=64, at=(0, 0, CZ), axis="Y"))
    faces.append(comp.cyl(RD - 0.02, 0.004, at=(0, s * (HD - 0.004) - 0.002, CZ), seg=64, axis="Y"))
    for h in range(1, 13):
        t = comp.text(str(h), 0.07, depth=0.001)
        a = math.radians(h * 30)
        xf(t, T(math.sin(a) * 0.215, 0, math.cos(a) * 0.215))
        if s > 0:
            xf(t, R(180, "Z"))
        marks.append(xf(t, T(0, s * (HD + 0.0005), CZ)))
    for i in range(60):
        b = comp.box((0.004 if i % 5 else 0.009, 0.001, 0.014 if i % 5 else 0.026), at=(0, s * (HD + 0.0005), 0.268))
        xf(b, R(i * 6, "Y")); marks.append(xf(b, T(0, 0, CZ)))
    for nm, L, w, turn in (("minute", 0.24, 0.022, 10 / 60 * 360), ("hour", 0.16, 0.03, (2 + 10 / 60) * 30)):
        p = comp.pivot(col, root, f"clock_{nm}_{'front' if s < 0 else 'back'}", (0, s * (HD + 0.006), CZ))
        hd = comp.merge(comp.taper((0, 0, 0), (0, L, 0), w, w * 0.25, 0.003, 0.003), comp.taper((0, 0, 0), (0, -L * 0.25, 0), w, w * 1.3, 0.003, 0.003))
        xf(hd, R(90, "X"))  # the hand's length up z
        xf(hd, R(-s * turn, "Y")); xf(hd, T(0, s * (HD + 0.006 + (0.004 if nm == "minute" else 0)), CZ))
        M(f"clock_{nm}_hand_{'front' if s < 0 else 'back'}", hd, ink, parent=p)
        hands.append((p, nm, s))
    marks.append(comp.cyl(0.018, 0.016, at=(0, s * (HD + 0.008) - 0.008, CZ), seg=16, axis="Y"))
M("clock_bezels", comp.merge(*bez), chrome, smooth=True)
M("clock_faces", comp.merge(*faces), face)
M("clock_figures", comp.merge(*marks), ink)
comp.channel("hands", [(p, "rotation_euler", 1, 0, -s * 2 * math.pi / (1 if nm == "minute" else 12)) for p, nm, s in hands])
comp.export(col, root, "subway", "clock", made="blender/components/subway/clock.py", source="own geometry (a generic two-faced platform clock); figures in Blender's built-in font", license="ours", credit="",
            rig={"hands": "one hour on, clockwise on both faces: the minute hands a whole turn, the hour hands 30 degrees", "glow": "in the scene: the material clock_glow's glow, a key per state"})
