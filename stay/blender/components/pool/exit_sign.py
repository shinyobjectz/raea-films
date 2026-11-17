# pool/exit-sign: the lit exit sign over the far door, the office's (blender/components/office/exit_sign.py) made a
# wall box: a steel box 40 x 20 cm, its back on the wall (y 0, the origin its middle), a green lit face with white
# letters, a running-man arrow bar under them, and its conduit up the wall. The face and letters are their own
# materials (exit_glow, exit_letters). Two sets of letters: EXIT, and the generator's EXTI (scenes.ts: "an exit sign
# reading EXTI"). Rig: "misspell" swaps EXIT for EXTI (0 or 1; between them both are half size); "glow" is the scene's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("exit_sign")
box_m = comp.mat("exit_box", (0.82, 0.82, 0.8), rough=0.45)
face_m = comp.mat("exit_glow", (0.02, 0.5, 0.16), rough=0.3, emit=(0.05, 0.9, 0.3), strength=3.0)
letter_m = comp.mat("exit_letters", (0.98, 1.0, 0.98), rough=0.3, emit=(0.9, 1.0, 0.92), strength=5.0)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, H, D = 0.4, 0.2, 0.07
b = M("exit_sign_box", comp.box((W, D, H), at=(0, -D / 2, 0)), box_m)
comp.bevel(b, 0.005, 2)
M("exit_sign_face", comp.box((W - 0.03, 0.002, H - 0.03), at=(0, -D - 0.0005, 0)), face_m)
M("exit_sign_arrow", comp.merge(comp.box((0.2, 0.002, 0.008), at=(0, -D - 0.002, -0.064)), xf(comp.box((0.03, 0.002, 0.008)), T(0.09, -D - 0.002, -0.056) @ R(-35, "Y")), xf(comp.box((0.03, 0.002, 0.008)), T(0.09, -D - 0.002, -0.072) @ R(35, "Y"))), letter_m)
M("exit_sign_conduit", comp.merge(comp.cyl(0.008, 0.5, at=(0.12, -0.008, H / 2), seg=10), comp.box((0.03, 0.02, 0.02), at=(0.12, -0.01, H / 2 + 0.01))), box_m)
C = (0, -D - 0.0022, 0.012)
right = comp.pivot(col, root, "exit_sign_right", C)
wrong = comp.pivot(col, root, "exit_sign_wrong", C)
M("exit_sign_letters", xf(comp.text("EXIT", 0.105, depth=0.002), T(*C)), letter_m, parent=right)
M("exit_sign_letters_wrong", xf(comp.text("EXTI", 0.105, depth=0.002), T(*C)), letter_m, parent=wrong)
wrong.scale = (0.001, 0.001, 0.001)
comp.channel("misspell", [(right, "scale", i, 1.0, 0.001) for i in range(3)] + [(wrong, "scale", i, 0.001, 1.0) for i in range(3)])
done(col, root, "exit_sign", source="own geometry (a generic lit exit sign); letters in Blender's built-in font (Bfont, GPL font exception: output is free)",
     rig={"misspell": "EXIT shrinks away and EXTI takes its place (hold it at 0 or 1)", "glow": "in the scene: the materials exit_glow and exit_letters glow, a key per state"})
