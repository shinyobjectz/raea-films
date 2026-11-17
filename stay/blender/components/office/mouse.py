# office/mouse: a two-button wheel mouse with its cable, modelled by hand. Lies on a desk beside a keyboard, its
# buttons toward +y (away from the sitter).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("mouse")
body_m = comp.mat("mouse_body", (0.72, 0.7, 0.64), rough=0.5)
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1)
xf(bm, S(0.031, 0.056, 0.034))
bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, -0.004), plane_no=(0, 0, -1), clear_outer=True)
bmesh.ops.holes_fill(bm, edges=bm.edges)
for v in bm.verts:
    v.co.z += 0.004
    if v.co.y > 0:
        v.co.z *= 1 - 0.35 * (v.co.y / 0.056) ** 2   # the nose slopes down to the buttons
body = comp.mesh(col, root, "mouse_body", bm, body_m, smooth=True)
comp.mesh(col, root, "mouse_split", comp.box((0.0012, 0.05, 0.03), at=(0, 0.034, 0.02)), comp.mat("mouse_gap", (0.03, 0.03, 0.03), rough=0.8))
comp.mesh(col, root, "mouse_wheel", comp.cyl(0.0085, 0.007, at=(-0.0035, 0.03, 0.0235), seg=20, axis="X"), comp.mat("mouse_wheel", (0.12, 0.12, 0.13), rough=0.7), smooth=True)
comp.mesh(col, root, "mouse_cable", comp.tube([(0, 0.054, 0.008), (0, 0.09, 0.004), (-0.03, 0.15, 0.003), (-0.01, 0.24, 0.003)], 0.0017), comp.mat("mouse_cable", (0.05, 0.05, 0.05), rough=0.6), smooth=True)
comp.export(col, root, "office", "mouse", made="blender/components/office/mouse.py", source="own geometry (a generic wheel mouse)", license="ours", credit="")
