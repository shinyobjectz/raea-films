# office/door: a pair of fire doors in their frame, 1.8 m wide and 2.1 m high, in a wall bay 3.2 m wide: grey laminate
# leaves each with a wired-glass vision panel, a steel push plate and a pull handle, a closer over each, the frame in
# painted steel. Its back is at y 0, its face toward -y, its origin on the floor at its middle. Rig: "open" swings the
# right leaf 70 degrees into the room.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("door")
plaster = comp.ph_texture("office_plaster", "painted_plaster_wall", tile=2.4, tint=(0.86, 0.85, 0.8), grey=True, res="1k")
leaf_m = comp.mat("office_door_leaf", (0.38, 0.4, 0.43), rough=0.45)
steel = comp.mat("office_door_steel", (0.7, 0.71, 0.72), rough=0.3, metal=1.0)
frame_m = comp.mat("office_door_frame", (0.3, 0.31, 0.33), rough=0.4)
glass = comp.mat("office_door_glass", (0.7, 0.8, 0.8), rough=0.05, alpha=0.25)
W, H, DW, DH, TH = 3.2, 2.7, 1.8, 2.1, 0.12
wall = comp.merge(comp.box(((W - DW) / 2, TH, H), at=(-(DW + (W - DW) / 2) / 2, -TH / 2, H / 2)), comp.box(((W - DW) / 2, TH, H), at=((DW + (W - DW) / 2) / 2, -TH / 2, H / 2)), comp.box((DW, TH, H - DH), at=(0, -TH / 2, DH + (H - DH) / 2)))
wo = comp.mesh(col, root, "door_wall", wall, plaster)
comp.uv_box(wo, 1.0)
fr = comp.merge(comp.box((0.06, TH + 0.02, DH), at=(-DW / 2 + 0.03, -TH / 2, DH / 2)), comp.box((0.06, TH + 0.02, DH), at=(DW / 2 - 0.03, -TH / 2, DH / 2)), comp.box((DW, TH + 0.02, 0.06), at=(0, -TH / 2, DH - 0.03)))
comp.mesh(col, root, "door_frame", fr, frame_m)
LW = (DW - 0.12) / 2
def leaf(side, name):
    x0 = side * (DW / 2 - 0.06)                      # the hinge
    piv = comp.pivot(col, root, f"door_{name}", (x0, -TH / 2, 0))
    cx = x0 - side * LW / 2
    l = comp.mesh(col, root, f"door_{name}_leaf", comp.box((LW - 0.006, 0.044, DH - 0.07), at=(cx, -TH / 2, (DH - 0.06) / 2 + 0.005)), leaf_m, parent=piv)
    comp.bevel(l, 0.003, 2)
    comp.mesh(col, root, f"door_{name}_glass", comp.box((0.16, 0.05, 0.6), at=(cx - side * 0.2, -TH / 2, 1.45)), glass, parent=piv)
    comp.mesh(col, root, f"door_{name}_plate", comp.box((0.1, 0.05, 0.3), at=(cx - side * (LW / 2 - 0.1), -TH / 2, 1.1)), steel, parent=piv)
    comp.mesh(col, root, f"door_{name}_pull", comp.merge(comp.cyl(0.012, 0.3, at=(cx - side * (LW / 2 - 0.1), -TH / 2 - 0.06, 0.95), seg=12), comp.box((0.02, 0.05, 0.02), at=(cx - side * (LW / 2 - 0.1), -TH / 2 - 0.035, 0.97)), comp.box((0.02, 0.05, 0.02), at=(cx - side * (LW / 2 - 0.1), -TH / 2 - 0.035, 1.23))), steel, parent=piv, smooth=True)
    comp.mesh(col, root, f"door_{name}_closer", comp.box((0.26, 0.06, 0.06), at=(cx + side * 0.1, -TH / 2 - 0.05, DH - 0.12)), steel, parent=piv)
    return piv
left, right = leaf(-1, "left"), leaf(1, "right")
comp.channel("open", [(right, "rotation_euler", 2, 0, math.radians(70))])
comp.export(col, root, "office", "door", made="blender/components/office/door.py", source="own geometry; plaster: https://polyhaven.com/a/painted_plaster_wall", license="ours; texture CC0", credit="Poly Haven (painted_plaster_wall)", rig={"open": "the right leaf swings 70 degrees into the room"})
