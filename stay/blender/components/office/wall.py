# office/wall: a plain wall bay, 3.2 m wide and 2.7 m high, painted plaster (Poly Haven's painted_plaster_wall, CC0)
# with a grey vinyl skirting and a picture rail's shadow line. Its back is at y 0, its face toward -y, its origin on
# the floor at its middle. Bays set side by side make a wall.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("wall")
plaster = comp.ph_texture("office_plaster", "painted_plaster_wall", tile=2.4, tint=(0.86, 0.85, 0.8), grey=True, res="1k")
skirt = comp.mat("office_skirting", (0.2, 0.21, 0.23), rough=0.6)
W, H = 3.2, 2.7
w = comp.mesh(col, root, "wall_face", comp.box((W, 0.12, H), at=(0, -0.06, H / 2)), plaster)
comp.uv_box(w, 1.0)
s = comp.mesh(col, root, "wall_skirting", comp.box((W, 0.012, 0.1), at=(0, -0.126, 0.05)), skirt)
comp.export(col, root, "office", "wall", made="blender/components/office/wall.py", source="own geometry; plaster: https://polyhaven.com/a/painted_plaster_wall", license="ours; texture CC0", credit="Poly Haven (painted_plaster_wall)")
