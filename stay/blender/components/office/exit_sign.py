# office/exit-sign: a lit EXIT sign hung from the ceiling on two rods, modelled by hand: a steel box, a green lit face
# both sides with the letters cut out in white, a running-arrow chevron. The face is its own material (exit_glow).
# Its origin is the ceiling, between the rods. Rig: "glow" is the scene's: exit_glow's glow (a key per state).
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("exit_sign")
box_m = comp.mat("exit_box", (0.82, 0.82, 0.8), rough=0.45)
face_m = comp.mat("exit_glow", (0.02, 0.5, 0.16), rough=0.3, emit=(0.05, 0.9, 0.3), strength=3.0)
letter_m = comp.mat("exit_letters", (0.98, 1.0, 0.98), rough=0.3, emit=(0.9, 1.0, 0.92), strength=5.0)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
W, H, D, TOP = 0.36, 0.19, 0.055, -0.14
M("exit_sign_rods", comp.merge(*[comp.cyl(0.004, -TOP, at=(x, 0, TOP), seg=10) for x in (-0.12, 0.12)], *[comp.cyl(0.018, 0.006, at=(x, 0, -0.006), seg=16) for x in (-0.12, 0.12)]), box_m)
b = M("exit_sign_box", comp.box((W, D, H), at=(0, 0, TOP - H / 2)), box_m)
comp.bevel(b, 0.004, 2)
faces, letters = [], []
for s in (-1, 1):
    faces.append(comp.box((W - 0.03, 0.002, H - 0.03), at=(0, s * (D / 2 + 0.0005), TOP - H / 2)))
    t = comp.text("EXIT", 0.105, depth=0.002)
    if s > 0:
        xf(t, R(180, "Z"))
    xf(t, T(0, s * (D / 2 + 0.0022), TOP - H / 2))
    letters.append(t)
M("exit_sign_face", comp.merge(*faces), face_m)
M("exit_sign_letters", comp.merge(*letters), letter_m)
comp.export(col, root, "office", "exit_sign", made="blender/components/office/exit_sign.py", source="own geometry (a generic lit exit sign); letters in Blender's built-in font (Bfont, GPL font exception: output is free)", license="ours", credit="",
            rig={"glow": "in the scene: the materials exit_glow and exit_letters glow, a key per state"})
