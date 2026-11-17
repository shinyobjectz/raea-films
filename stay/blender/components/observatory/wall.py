# observatory/wall: the drum the dome turns on, modelled by hand: a round wall 9 m inside and 2.6 m high, 35 cm thick,
# plastered (Poly Haven beige_wall_001) over a dark boarded wainscot with its battens, cap rail and skirting, a
# panelled door in its frame on the far left, and on the wall's top the dome's track: a steel rail and twelve roller
# trucks. The origin is the middle of the floor.
# Rig: "door" opens the door 75 degrees into the room about its hinges.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, rbox, rod, sphere, T, R, S, xf, RD, HW

col, root = comp.fresh("wall")
M = _lib.maker(col, root)
plaster = comp.ph_texture("wall_plaster", "beige_wall_001", tile=3.0, res="2k", tint=(0.8, 0.8, 0.74))
wood = comp.ph_texture("wall_wainscot", "dark_wood", tile=2.0, res="2k", tint=(0.75, 0.7, 0.66))
steel = comp.mat("wall_track", (0.3, 0.32, 0.33), rough=0.35, metal=1.0)
brass = comp.mat("wall_brass", (0.72, 0.55, 0.22), rough=0.3, metal=1.0)
w = M("wall_drum", lathe([(RD, 0.0), (RD, HW), (RD + 0.35, HW), (RD + 0.35, 0.0), (RD, 0.0)], seg=96), plaster)
_lib.uv_round(w, RD)
ws = M("wall_wainscot", lathe([(RD, 0.0), (RD - 0.03, 0.0), (RD - 0.03, 0.12), (RD - 0.018, 0.13), (RD - 0.018, 1.02), (RD - 0.05, 1.03), (RD - 0.05, 1.07), (RD - 0.018, 1.085), (RD, 1.085)], seg=96), wood, smooth=False)
_lib.uv_round(ws, RD)
bt = M("wall_battens", comp.merge(*[xf(comp.box((0.022, 0.05, 0.88)), R(a, "Z") @ T(RD - 0.028, 0, 0.58)) for a in (i * 6 for i in range(60))]), wood, smooth=False)
_lib.uv_round(bt, RD)
# the door, proud of the wall on the far left (150 degrees round from +x)
DA = 148
door = R(DA - 90, "Z") @ T(0, RD - 0.035, 0)          # the door's own frame: x along the wall, -y into the room
DW, DH = 0.92, 2.05
fr = [comp.box((0.09, 0.07, DH + 0.09), at=(sx * (DW / 2 + 0.045), 0, (DH + 0.09) / 2)) for sx in (-1, 1)] + [comp.box((DW + 0.18, 0.07, 0.09), at=(0, 0, DH + 0.045))]
f = M("wall_door_frame", xf(comp.merge(*fr), door), wood, smooth=False)
comp.uv_box(f, 1.0)
hinge = _lib.axis_pivot(col, root, "wall_door_hinge", door @ T(-DW / 2, -0.03, 0), mode="ZYX")
leaf = [comp.box((DW - 0.01, 0.045, DH - 0.01), at=(0, -0.03, DH / 2))]
leaf += [comp.box((DW - 0.26, 0.012, hh), at=(0, -0.056, zz)) for hh, zz in ((0.62, 0.5), (0.78, 1.38))] + [comp.box((DW - 0.2, 0.008, 0.012), at=(0, -0.058, zz)) for zz in (0.17, 0.83, 0.97, 1.79)]
lf = M("wall_door_leaf", xf(comp.merge(*leaf), door), wood, parent=hinge, smooth=False)
comp.uv_box(lf, 1.0)
M("wall_door_knob", xf(comp.merge(sphere(0.028, at=(DW / 2 - 0.08, -0.105, 1.02), seg=14, rings=8), comp.cyl(0.01, 0.05, at=(DW / 2 - 0.08, -0.1, 1.02), seg=8, axis="Y"), rbox((0.05, 0.004, 0.16), at=(DW / 2 - 0.08, -0.054, 1.02), r=0.0015, seg=1)), door), brass, parent=hinge)
# the dome's track on the wall's top
M("wall_rail", lathe([(RD - 0.05, HW), (RD + 0.07, HW), (RD + 0.07, HW + 0.02), (RD + 0.03, HW + 0.02), (RD + 0.025, HW + 0.05), (RD - 0.005, HW + 0.05), (RD - 0.01, HW + 0.02), (RD - 0.05, HW + 0.02), (RD - 0.05, HW)], seg=96), steel, smooth=False)
trucks = []
for i in range(12):
    t = [comp.cyl(0.045, 0.05, at=(RD - 0.015, 0, HW + 0.095), seg=16, axis="X"), comp.box((0.012, 0.12, 0.09), at=(RD - 0.03, 0, HW + 0.09)), comp.box((0.012, 0.12, 0.09), at=(RD + 0.05, 0, HW + 0.09)), comp.cyl(0.012, 0.11, at=(RD - 0.045, 0, HW + 0.095), seg=8, axis="X")]
    trucks.append(xf(comp.merge(*t), R(i * 30 + 15, "Z")))
M("wall_rollers", comp.merge(*trucks), steel, smooth=False)
_lib.channel("door", [(hinge, "rotation_euler", 2, 0, math.radians(-75))])
comp.export(col, root, "observatory", "wall", made="blender/components/observatory/wall.py", source="own geometry; Poly Haven textures beige_wall_001 and dark_wood", license="CC0", credit="Poly Haven",
            rig={"door": "the door opens 75 degrees into the room about its hinges"}, notes="origin: the middle of the floor; the rollers' tops are 2.74 m up, where the dome's ring sits")
