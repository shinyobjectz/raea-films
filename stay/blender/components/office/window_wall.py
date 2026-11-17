# office/window-wall: a wall bay with a window in it, 3.2 m wide and 2.7 m high: painted plaster round an opening
# 1.5 m wide and 1.7 m high (sill at 0.75 m), a white aluminium frame with one mullion and a transom, two panes of
# glass, a stone sill inside, a skirting. Its outside is at y 0, its inside face toward -y, its origin on the floor
# at its middle. The blinds hang inside it; the sun comes through the glass.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("window_wall")
plaster = comp.ph_texture("office_plaster", "painted_plaster_wall", tile=2.4, tint=(0.86, 0.85, 0.8), grey=True, res="1k")
skirt = comp.mat("office_skirting", (0.2, 0.21, 0.23), rough=0.6)
frame_m = comp.mat("office_window_frame", (0.88, 0.88, 0.86), rough=0.35)
glass = comp.mat("office_window_glass", (0.8, 0.9, 0.95), rough=0.02, alpha=0.12)
sill_m = comp.mat("office_sill", (0.75, 0.74, 0.7), rough=0.5)
W, H, OW, OH, SILL, TH = 3.2, 2.7, 1.5, 1.7, 0.75, 0.2
pieces = [
    comp.box((W, TH, SILL), at=(0, -TH / 2, SILL / 2)),                                   # under the window
    comp.box((W, TH, H - SILL - OH), at=(0, -TH / 2, SILL + OH + (H - SILL - OH) / 2)),   # over it
    comp.box(((W - OW) / 2, TH, OH), at=(-(OW + (W - OW) / 2) / 2, -TH / 2, SILL + OH / 2)),
    comp.box(((W - OW) / 2, TH, OH), at=((OW + (W - OW) / 2) / 2, -TH / 2, SILL + OH / 2)),
]
w = comp.mesh(col, root, "window_wall_face", comp.merge(*pieces), plaster)
comp.uv_box(w, 1.0)
comp.mesh(col, root, "window_wall_skirting", comp.box((W, 0.012, 0.1), at=(0, -TH - 0.006, 0.05)), skirt)
F = 0.05
fr = comp.merge(
    comp.box((OW, F, F), at=(0, -0.06, SILL + F / 2)), comp.box((OW, F, F), at=(0, -0.06, SILL + OH - F / 2)),
    comp.box((F, F, OH), at=(-OW / 2 + F / 2, -0.06, SILL + OH / 2)), comp.box((F, F, OH), at=(OW / 2 - F / 2, -0.06, SILL + OH / 2)),
    comp.box((F * 0.8, F, OH), at=(0, -0.06, SILL + OH / 2)), comp.box((OW, F, F * 0.8), at=(0, -0.06, SILL + OH * 0.72)),
)
fo = comp.mesh(col, root, "window_wall_frame", fr, frame_m)
comp.bevel(fo, 0.004, 2)
comp.mesh(col, root, "window_wall_glass", comp.box((OW - 2 * F, 0.006, OH - 2 * F), at=(0, -0.06, SILL + OH / 2)), glass)
so = comp.mesh(col, root, "window_wall_sill", comp.box((OW + 0.08, TH + 0.06, 0.03), at=(0, -TH / 2 - 0.03, SILL - 0.015)), sill_m)
comp.bevel(so, 0.006, 2)
comp.export(col, root, "office", "window_wall", made="blender/components/office/window_wall.py", source="own geometry; plaster: https://polyhaven.com/a/painted_plaster_wall", license="ours; texture CC0", credit="Poly Haven (painted_plaster_wall)")
