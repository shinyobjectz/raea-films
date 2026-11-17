# stairwell/doormat: a coir doormat, 70 x 45 cm and 18 mm thick, modelled by hand: a rubber backing with a lip, the
# coir pile (Poly Haven's hessian_380, tinted) rising inside it with rounded edges. Origin: its centre on the floor,
# its long side across the door. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("doormat")
coir = comp.ph_texture("doormat_coir", "hessian_380", tile=0.18, res="1k", tint=(0.62, 0.46, 0.28))
rubber = comp.mat("doormat_rubber", (0.02, 0.02, 0.022), rough=0.8)
b = comp.mesh(col, root, "doormat_backing", comp.box((0.7, 0.45, 0.006), at=(0, 0, 0.003)), rubber)
comp.bevel(b, 0.002, 2)
p = comp.mesh(col, root, "doormat_pile", comp.box((0.67, 0.42, 0.014), at=(0, 0, 0.011)), coir)
comp.bevel(p, 0.005, 3)
comp.uv_box(p, 1.0)
comp.export(col, root, "stairwell", "doormat", made="blender/components/stairwell/doormat.py", source="own geometry; texture: https://polyhaven.com/a/hessian_380", license="ours; texture CC0", credit="Poly Haven (hessian_380)")
