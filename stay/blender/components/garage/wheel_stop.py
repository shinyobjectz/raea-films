# garage/wheel-stop: a rubber wheel stop bolted to the deck at the back of a bay, 1.65 m long, 0.15 m deep and 0.1 m
# high, modelled by hand: a chamfered black block with a cable channel under it, four yellow reflective inlays on
# each sloping face and three countersunk bolts. Its middle is on the origin, its length along x. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("wheel_stop")
M = L.maker(col, root)
black = comp.mat("wheel_stop_rubber", (0.018, 0.018, 0.02), rough=0.85)
yellow = comp.mat("wheel_stop_yellow", (0.95, 0.75, 0.05), rough=0.35)
steel = comp.mat("wheel_stop_bolts", (0.6, 0.6, 0.62), rough=0.35, metal=1.0)
LEN = 1.65
prof = [(-0.075, 0), (-0.075, 0.02), (-0.03, 0.1), (0.03, 0.1), (0.075, 0.02), (0.075, 0)]
b = M("wheel_stop_block", L.sweep([(-LEN / 2, 0, 0), (LEN / 2, 0, 0)], [(-n, u) for n, u in prof]), black)
comp.bevel(b, 0.006, 2)
ang = math.degrees(math.atan2(0.08, 0.045))
inl = []
for s in (-1, 1):
    for i in range(4):
        x = -LEN / 2 + 0.26 + i * 0.377
        inl.append(xf(comp.box((0.24, 0.07, 0.003)), T(x, s * 0.0545, 0.0615) @ R(s * -ang, "X")))
M("wheel_stop_inlays", comp.merge(*inl), yellow)
M("wheel_stop_bolts", comp.merge(*[comp.cyl(0.014, 0.004, at=(x, 0, 0.098), seg=6) for x in (-0.68, 0, 0.68)]), steel)
L.look(col, "wheel-stop", lens=50)
comp.export(col, root, "garage", "wheel_stop", made="blender/components/garage/wheel_stop.py", source="own geometry", license="ours", credit="", rig={})
