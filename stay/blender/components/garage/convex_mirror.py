# garage/convex-mirror: a 0.6 m convex traffic mirror for the blind corner, modelled by hand: a wall plate and a
# jointed tube arm (its plate's back at y 0, the origin at the plate's middle), an orange back shell with a black
# rubber rim, and the domed mirror in the material mirror_glass, facing -y and tipped 8 degrees down. A wall item.
# Rig: "swivel" turns the mirror 40 degrees on its arm's joint (the cursor aiming it; what it shows is the scene's).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("convex_mirror")
M = L.maker(col, root)
orange = comp.mat("mirror_shell", (0.9, 0.3, 0.03), rough=0.5)
black = comp.mat("mirror_rim", (0.02, 0.02, 0.022), rough=0.7)
glass = comp.mat("mirror_glass", (0.9, 0.91, 0.93), rough=0.03, metal=1.0)
galv = comp.mat("mirror_arm", (0.62, 0.63, 0.64), rough=0.36, metal=1.0)
pl = M("convex_mirror_plate", comp.merge(comp.box((0.12, 0.008, 0.18), at=(0, -0.004, 0)), *[comp.cyl(0.008, 0.006, at=(sx * 0.04, -0.014, sz * 0.065), seg=6, axis="Y") for sx in (-1, 1) for sz in (-1, 1)]), galv)
M("convex_mirror_arm", comp.merge(comp.cyl(0.015, 0.22, at=(0, -0.228, 0), seg=14, axis="Y"), comp.cyl(0.024, 0.05, at=(0, -0.25, -0.025), seg=14)), galv, smooth=False)
sw = comp.pivot(col, root, "convex_mirror_swivel", (0, -0.25, 0))
R_ = 0.3
def head(bm):
    return xf(bm, T(0, -0.33, 0) @ R(8, "X"))
M("convex_mirror_yoke", head(comp.merge(comp.cyl(0.014, 0.09, at=(0, 0.0, 0), seg=12, axis="Y"), comp.box((0.1, 0.01, 0.1), at=(0, 0.0, 0)))), galv, parent=sw)
shell = L.lathe([(0, 0.07), (0.12, 0.062), (0.24, 0.035), (R_ + 0.012, 0.0), (R_ + 0.012, -0.012)], 48, axis="Y")
bmesh.ops.recalc_face_normals(shell, faces=shell.faces)
M("convex_mirror_shell", head(shell), orange, parent=sw, smooth=True)
rim = L.sweep([((R_ + 0.006) * math.cos(a), -0.012, (R_ + 0.006) * math.sin(a)) for a in [2 * math.pi * k / 48 for k in range(48)]], L.circle(0.012, 8), closed=True, up=(0, 1, 0))
M("convex_mirror_rim", head(rim), black, parent=sw, smooth=True)
dome = L.lathe([(0, 0.075), (0.06, 0.072), (0.12, 0.063), (0.18, 0.048), (0.24, 0.027), (R_, 0.0)], 48, axis="Y")
xf(dome, S(1, -1, 1))
xf(dome, T(0, -0.012, 0))
bmesh.ops.recalc_face_normals(dome, faces=dome.faces)
for f_ in dome.faces:
    if f_.normal.y > 0:
        f_.normal_flip()
M("convex_mirror_glass", head(xf(dome, S(1, 1, 1))), glass, parent=sw, smooth=True)
comp.channel("swivel", [(sw, "rotation_euler", 2, 0, math.radians(40))])
L.look(col, "convex-mirror", eye=(0.9, -1.5, 0.3), target=(0, -0.2, 0), lens=45, frame=None)
comp.export(col, root, "garage", "convex_mirror", made="blender/components/garage/convex_mirror.py", source="own geometry (a generic convex traffic mirror)", license="ours", credit="",
            rig={"swivel": "the mirror head turns 40 degrees about the joint at the arm's end", "reflection": "in the scene: the material mirror_glass"})
