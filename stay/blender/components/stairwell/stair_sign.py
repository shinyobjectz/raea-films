# stairwell/stair-sign: an enamelled wayfinding plate, 30 x 40 cm, modelled by hand: a deep green plate with a white
# border, a staircase pictogram of five steps with an arrow up it, the word STAIRS, and four domed screws. A wall
# item: its back at y 0, its front toward -y, its origin at its centre. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("stair_sign")
green = comp.mat("sign_enamel", (0.02, 0.2, 0.11), rough=0.22)
white = comp.mat("sign_white", (0.92, 0.92, 0.88), rough=0.3)
steel = comp.mat("sign_screws", (0.7, 0.7, 0.72), rough=0.3, metal=1.0)
p = comp.mesh(col, root, "stair_sign_plate", comp.box((0.3, 0.004, 0.4), at=(0, -0.002, 0)), green)
comp.bevel(p, 0.0015, 2)
marks = [comp.box((0.27, 0.001, 0.006), at=(0, -0.0045, s * 0.182)) for s in (-1, 1)] + [comp.box((0.006, 0.001, 0.37), at=(s * 0.132, -0.0045, 0)) for s in (-1, 1)]
for k in range(5):   # the steps, climbing to the right
    marks.append(comp.box((0.036, 0.001, 0.03 * (k + 1)), at=(-0.072 + k * 0.036, -0.0045, -0.03 + 0.015 * (k + 1))))
arrow = comp.merge(comp.box((0.11, 0.001, 0.012), at=(0, 0, 0)), comp.box((0.045, 0.001, 0.012), at=(0.04, 0, 0.012)), comp.box((0.012, 0.001, 0.045), at=(0.052, 0, -0.012)))
xf(arrow, R(-40, "Y"))
xf(arrow, T(-0.035, -0.0045, 0.115))
marks.append(arrow)
t = comp.text("STAIRS", 0.05, depth=0.001)
xf(t, T(0, -0.0045, -0.11))
marks.append(t)
comp.mesh(col, root, "stair_sign_marks", comp.merge(*marks), white)
comp.mesh(col, root, "stair_sign_screws", comp.merge(*[L.sphere(0.006, at=(sx * 0.118, -0.004, sz * 0.168), u=8, v=4) for sx in (-1, 1) for sz in (-1, 1)]), steel, smooth=True)
comp.export(col, root, "stairwell", "stair_sign", made="blender/components/stairwell/stair_sign.py", source="own geometry (a generic enamel stair sign); letters in Blender's built-in font", license="ours", credit="", notes="origin: its centre on the wall")
