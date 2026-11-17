# office/floor: the office's carpet, 14.4 x 27.4 m of grey-blue loop pile in 0.5 m tiles (Poly Haven's dirty_carpet,
# CC0, desaturated and tinted), its origin at the floor's middle, top at z 0. A vinyl skirting runs the room's edge.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("floor")
carpet = comp.ph_texture("office_carpet", "dirty_carpet", tile=2.0, tint=(0.42, 0.46, 0.55), grey=True, res="2k")
W, D = 14.4, 27.4
f = comp.mesh(col, root, "floor_carpet", comp.box((W, D, 0.05), at=(0, 0, -0.025)), carpet)
comp.uv_box(f, 1.0)
comp.export(col, root, "office", "floor", made="blender/components/office/floor.py", source="own geometry; carpet: https://polyhaven.com/a/dirty_carpet", license="ours; texture CC0", credit="Poly Haven (dirty_carpet)")
