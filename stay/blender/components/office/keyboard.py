# office/keyboard: a full-size office keyboard, 0.44 m, modelled by hand: a wedge case, 104 keys in their rows (the
# long ones too), two feet. Lies on a desk before its monitor, the space bar toward -y.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("keyboard")
case_m = comp.mat("keyboard_case", (0.72, 0.7, 0.64), rough=0.55)
key_m = comp.mat("keyboard_keys", (0.8, 0.78, 0.72), rough=0.5)
dark_m = comp.mat("keyboard_keys_grey", (0.42, 0.42, 0.4), rough=0.5)
W, D = 0.44, 0.14
case = comp.box((W, D, 0.02), at=(0, 0, 0.01))
for v in case.verts:
    if v.co.z > 0.01:
        v.co.z += 0.012 * (v.co.y + D / 2) / D   # the wedge: higher at the back
co = comp.mesh(col, root, "keyboard_case", case, case_m)
comp.bevel(co, 0.004, 3)
U, GAP = 0.019, 0.0025
ROWS = [  # each row: key widths in units, negative = a gap; from the back row to the front
    [1, -1, 1, 1, 1, 1, -0.5, 1, 1, 1, 1, -0.5, 1, 1, 1, 1, -0.25, 1, 1, 1],
    [1] * 13 + [2, -0.25, 1, 1, 1, -0.25, 1, 1, 1, 1],
    [1.5] + [1] * 12 + [1.5, -0.25, 1, 1, 1, -0.25, 1, 1, 1, 1],
    [1.75] + [1] * 11 + [2.25, -3.5, 1, 1, 1, 1],
    [2.25] + [1] * 10 + [2.75, -1.25, 1, -1.25, 1, 1, 1, 1],
    [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25, -0.25, 1, 1, 1, -0.25, 2, 1, 1],
]
light, dark = [], []
total = 22.5 * U
for r, row in enumerate(ROWS):
    y = D / 2 - 0.016 - r * U - (0.004 if r else 0)
    x = -total / 2
    zt = 0.02 + 0.012 * (y + D / 2) / D
    for i, k in enumerate(row):
        if k < 0:
            x += -k * U
            continue
        kw = k * U - GAP
        b = comp.box((kw, U - GAP, 0.008), at=(x + k * U / 2, y, zt + 0.004))
        for v in b.verts:
            if v.co.z > zt + 0.004:   # a key's top is smaller than its foot
                v.co.x += -0.0018 if v.co.x > x + k * U / 2 else 0.0018
                v.co.y += -0.0018 if v.co.y > y else 0.0018
        (dark if (r == 0 or k > 1 or i >= len(row) - 4 and r > 0 and False) else light).append(b)
        x += k * U
ko = comp.mesh(col, root, "keyboard_keys", comp.merge(*light), key_m)
kd = comp.mesh(col, root, "keyboard_keys_grey", comp.merge(*dark), dark_m)
comp.mesh(col, root, "keyboard_cable", comp.tube([(0, D / 2, 0.02), (0, D / 2 + 0.05, 0.012), (0.03, D / 2 + 0.12, 0.004), (0.02, D / 2 + 0.2, 0.004)], 0.002), comp.mat("keyboard_cable", (0.05, 0.05, 0.05), rough=0.6), smooth=True)
comp.export(col, root, "office", "keyboard", made="blender/components/office/keyboard.py", source="own geometry (a generic 104-key keyboard)", license="ours", credit="")
