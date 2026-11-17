# garage/signs: the hanging way-finding sign, modelled by hand: two drop rods from the soffit (their tops at z 0, the
# origin) carrying a lit green box 1.5 m long, EXIT and an arrow in white on both faces (the material signs_glow),
# over a blue plate naming the level and its bays. Rig: "on" is the scene's (signs_glow).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("signs")
M = L.maker(col, root)
green = comp.mat("signs_glow", (0.02, 0.42, 0.16), rough=0.4, emit=(0.02, 0.6, 0.2), strength=1.6)
white = comp.mat("signs_white", (0.92, 0.92, 0.9), rough=0.5, emit=(0.9, 0.9, 0.85), strength=1.2)
blue = comp.mat("signs_blue", (0.02, 0.1, 0.38), rough=0.5)
alu = comp.mat("signs_frame", (0.7, 0.7, 0.72), rough=0.3, metal=1.0)
W = 1.5
rods = [comp.cyl(0.006, 0.26, at=(s * 0.6, 0, -0.26), seg=10) for s in (-1, 1)] + [comp.cyl(0.02, 0.008, at=(s * 0.6, 0, -0.008), seg=12) for s in (-1, 1)]
rods += [comp.cyl(0.004, 0.1, at=(s * 0.6, 0, -0.66), seg=8) for s in (-1, 1)]
M("signs_rods", comp.merge(*rods), alu)
bx = M("signs_exit_box", comp.box((W, 0.07, 0.3), at=(0, 0, -0.41)), green)
fr = M("signs_exit_frame", comp.merge(comp.box((W + 0.02, 0.08, 0.015), at=(0, 0, -0.255)), comp.box((W + 0.02, 0.08, 0.015), at=(0, 0, -0.565)), comp.box((0.015, 0.08, 0.31), at=(-W / 2 - 0.005, 0, -0.41)), comp.box((0.015, 0.08, 0.31), at=(W / 2 + 0.005, 0, -0.41))), alu)
def face(turn):
    t = xf(comp.text("EXIT", 0.2, 0.002), T(-0.28, 0, 0))
    a = xf(L.plate([(-0.2, -0.03), (0.02, -0.03), (0.02, -0.09), (0.2, 0), (0.02, 0.09), (0.02, 0.03), (-0.2, 0.03)], 0.002), R(90, "X"))
    xf(a, T(0.42, 0, 0))
    out = comp.merge(t, a)
    xf(out, T(0, -0.037, -0.41))
    return xf(out, R(turn, "Z"))
M("signs_exit_text", comp.merge(face(0), face(180)), white)
M("signs_level_plate", comp.box((W, 0.02, 0.2), at=(0, 0, -0.69)), blue)
lv = lambda turn: xf(xf(comp.text("LEVEL 2    BAYS 61-68", 0.095, 0.002), T(0, -0.011, -0.69)), R(turn, "Z"))
M("signs_level_text", comp.merge(lv(0), lv(180)), comp.mat("signs_paint", (0.9, 0.9, 0.88), rough=0.5))
L.look(col, "signs", eye=(1.2, -2.6, -0.9), target=(0, 0, -0.45), lens=45)
comp.export(col, root, "garage", "signs", made="blender/components/garage/signs.py", source="own geometry", license="ours", credit="",
            rig={"on": "in the scene: the material signs_glow's glow (the lit green box)"})
