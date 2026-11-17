# gym/rope: a climbing rope hung from the roof, 6.2 m, modelled by hand: a steel beam clamp and swivel eye, a three-
# strand manila rope 38 mm thick (three strands twisted round each other, so it reads as rope close up), a whipped
# top, a leather-bound knot at the foot, and a red tape mark at 4.5 m. Its origin is the clamp at the roof.
# Rig: "swing" swings it 12 degrees about the swivel; "twist" turns it one whole turn about its own length.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import pipe, lathe, rbox, T, R, S, xf

col, root = comp.fresh("rope")
M = _lib.maker(col, root)
manila = comp.mat("rope_manila", (0.55, 0.4, 0.2), rough=0.9)
steel = comp.mat("rope_steel", (0.4, 0.4, 0.42), rough=0.4, metal=1.0)
leather = comp.mat("rope_leather", (0.12, 0.06, 0.03), rough=0.7)
tape = comp.mat("rope_tape", (0.5, 0.03, 0.02), rough=0.6)
LEN = 6.2
M("rope_clamp", comp.merge(rbox((0.14, 0.1, 0.03), at=(0, 0, -0.015), r=0.004, seg=1), comp.cyl(0.012, 0.07, at=(0, 0, -0.1), seg=10)), steel, smooth=False)
sw = comp.pivot(col, root, "rope_swing", (0, 0, -0.1))
tw = comp.pivot(col, root, "rope_twist", (0, 0, -0.1), parent=sw)
M("rope_eye", _lib.torus(0.03, 0.008, seg=20, sides=6, at=(0, 0, -0.135), axis="Y"), steel, parent=tw)
strands = []
steps = 420
for k in range(3):
    pts = []
    for i in range(steps + 1):
        z = -0.17 - (LEN - 0.3) * i / steps
        a = 2 * math.pi * (k / 3 + i / 14.0)
        pts.append((0.0105 * math.cos(a), 0.0105 * math.sin(a), z))
    strands.append(pipe(pts, 0.0105, sides=1))
M("rope_strands", comp.merge(*strands), manila, parent=tw)
M("rope_whipping", lathe([(0.021, -0.16), (0.024, -0.165), (0.024, -0.3), (0.021, -0.305)], seg=16), leather, parent=tw)
M("rope_knot", comp.merge(_lib.sphere(0.05, at=(0, 0, -LEN + 0.1), seg=16, rings=10, scale=(1, 1, 1.25)), lathe([(0.023, -LEN + 0.16), (0.03, -LEN + 0.15), (0.03, -LEN + 0.05), (0.02, -LEN), (0, -LEN)], seg=16)), leather, parent=tw)
M("rope_mark", lathe([(0.0225, -4.5), (0.0235, -4.5), (0.0235, -4.56), (0.0225, -4.56)], seg=16), tape, parent=tw)
comp.channel("swing", [(sw, "rotation_euler", 1, 0, math.radians(12))])
comp.channel("twist", [(tw, "rotation_euler", 2, 0, 2 * math.pi)])
comp.export(col, root, "gym", "rope", made="blender/components/gym/rope.py",
            source="own geometry (a generic climbing rope)", license="ours", credit="",
            rig={"swing": "the rope swings 12 degrees about its swivel at the roof", "twist": "the rope one whole turn about its own length"})
