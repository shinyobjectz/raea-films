# stairwell/wall: one storey of the stairwell's round wall, modelled by hand: a 30 cm masonry drum 2.4 m in radius
# inside and 3.23 m high, painted plaster (Poly Haven's painted_plaster_wall) wrapped round the well at real scale.
# Origin: the well's axis, 21 cm under its
# landing's top (so storeys stack without a seam). No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("wall")
plaster = comp.ph_texture("wall_plaster", "painted_plaster_wall", tile=2.4, res="2k")
w = comp.mesh(col, root, "wall_drum", L.arc_block(L.R_WALL, L.R_WALL + 0.3, 0, 360, -0.215, L.H - 0.215, seg=96), plaster, smooth=True)
L.uv_cyl(w, 1.0)
comp.export(col, root, "stairwell", "wall", made="blender/components/stairwell/wall.py", source="own geometry; texture: https://polyhaven.com/a/painted_plaster_wall", license="ours; texture CC0", credit="Poly Haven (painted_plaster_wall)",
            notes="origin: the well's axis, 0.215 m under the landing's top; stack it every 3.23 m")
