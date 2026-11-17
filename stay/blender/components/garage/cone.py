# garage/cone: a 0.75 m traffic cone, modelled by hand: a square black rubber foot with chamfered corners and feet, an
# orange cone with a rolled lip and an open top, and two white reflective collars. Rig: "tip" tips it 82 degrees over
# its front edge onto its side (knocked by the car, or the reroll's mistake).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("cone")
M = L.maker(col, root)
orange = comp.mat("cone_orange", (0.95, 0.25, 0.02), rough=0.5)
white = comp.mat("cone_collar", (0.92, 0.92, 0.9), rough=0.25)
black = comp.mat("cone_foot", (0.02, 0.02, 0.022), rough=0.8)
tip = comp.pivot(col, root, "cone_tip", (0, -0.19, 0))
foot = L.plate([(0.19, 0.15), (0.15, 0.19), (-0.15, 0.19), (-0.19, 0.15), (-0.19, -0.15), (-0.15, -0.19), (0.15, -0.19), (0.19, -0.15)], 0.03)
f = M("cone_foot", comp.merge(foot, L.lathe([(0.15, 0.03), (0.15, 0.042), (0.136, 0.05), (0.13, 0.03)], 32)), black, parent=tip)
comp.bevel(f, 0.004, 2)
R0, R1, H = 0.132, 0.028, 0.75
rr = lambda z: R0 + (R1 - R0) * (z - 0.045) / (H - 0.045)
body = L.lathe([(rr(0.045) - 0.004, 0.04), (rr(0.045), 0.045), (rr(H), H), (rr(H) - 0.004, H), (rr(H) - 0.006, H - 0.02)], 36)
L.sharp(M("cone_body", body, orange, parent=tip, smooth=True), 40)
cl = [L.lathe([(rr(z0) + 0.0012, z0), (rr(z1) + 0.0012, z1)], 36) for z0, z1 in ((0.3, 0.42), (0.5, 0.58))]
M("cone_collars", comp.merge(*cl), white, parent=tip, smooth=True)
comp.channel("tip", [(tip, "rotation_euler", 0, 0, math.radians(82))])
L.look(col, "cone", lens=50, frame=None)
comp.export(col, root, "garage", "cone", made="blender/components/garage/cone.py", source="own geometry (a generic traffic cone)", license="ours", credit="",
            rig={"tip": "the cone tips 82 degrees forward over its foot's front edge, onto its side"})
