# laundromat/wall-side: the laundromat's side wall, 6.4 m long and 3 m high, its room face at y 0, in the same
# finishes as the back wall (painted plaster over a white tile wainscot), with the back room's door in it: a flush
# grey steel door in a steel frame with a lever handle, a kick plate, a closer and an EMPLOYEES ONLY plate, and beside
# it a grey breaker panel. Rig: "door" swings the back room's door 80 degrees into the back room on its hinges.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, disc, rbox, label, T, R, S, xf

col, root = comp.fresh("wall_side")
M = _lib.maker(col, root)
m = _lib.wall_mats()
door_m = comp.mat("laundromat_door_paint", (0.42, 0.45, 0.47), rough=0.45)
frame_m = comp.mat("laundromat_door_frame", (0.3, 0.32, 0.34), rough=0.4)
sign_m = comp.mat("laundromat_sign_blue", (0.05, 0.14, 0.4), rough=0.4)
L, Hh, TH = 6.4, 3.0, 0.2
DX, DW, DH = 1.9, 0.92, 2.1               # the doorway's centre, width and height
# the wall in three pieces round the doorway
for i, (x0, x1, z0, z1) in enumerate(((-L / 2, DX - DW / 2, 0, Hh), (DX + DW / 2, L / 2, 0, Hh), (DX - DW / 2, DX + DW / 2, DH, Hh))):
    w = M(f"wall_side_plaster_{i + 1}", comp.box((x1 - x0, TH, z1 - z0), at=((x0 + x1) / 2, TH / 2, (z0 + z1) / 2)), m["plaster"])
    comp.uv_box(w, 1.0)
    if z0 == 0:
        t = M(f"wall_side_wainscot_{i + 1}", comp.box((x1 - x0, 0.012, 1.1), at=((x0 + x1) / 2, -0.006, 0.65)), m["tile"])
        comp.uv_box(t, 1.0)
        M(f"wall_side_cap_{i + 1}", rbox((x1 - x0, 0.022, 0.035), at=((x0 + x1) / 2, -0.011, 1.2175), r=0.006), m["rail"])
        M(f"wall_side_cove_base_{i + 1}", comp.merge(comp.box((x1 - x0, 0.008, 0.1), at=((x0 + x1) / 2, -0.016, 0.05)), comp.box((x1 - x0, 0.02, 0.012), at=((x0 + x1) / 2, -0.022, 0.006))), m["base"])
# the frame, and the dark of the back room behind the door
fr = comp.merge(comp.box((0.05, TH + 0.04, DH), at=(DX - DW / 2 + 0.025, TH / 2 - 0.01, DH / 2)), comp.box((0.05, TH + 0.04, DH), at=(DX + DW / 2 - 0.025, TH / 2 - 0.01, DH / 2)), comp.box((DW, TH + 0.04, 0.05), at=(DX, TH / 2 - 0.01, DH - 0.025)))
fo = M("wall_side_door_frame", fr, frame_m)
comp.bevel(fo, 0.003, 2)
M("wall_side_back_room", comp.merge(comp.box((DW + 0.6, 0.05, DH + 0.3), at=(DX, TH + 1.0, DH / 2)), comp.box((0.05, 1.0, DH + 0.3), at=(DX - DW / 2 - 0.3, TH + 0.5, DH / 2)), comp.box((0.05, 1.0, DH + 0.3), at=(DX + DW / 2 + 0.3, TH + 0.5, DH / 2)), comp.box((DW + 0.6, 1.0, 0.05), at=(DX, TH + 0.5, DH + 0.15))), m["dark"])
# the door, hinged on its right edge, swinging into the back room (+y)
hp = comp.pivot(col, root, "wall_side_door", (DX + DW / 2 - 0.05, 0.02, 0))
leaf = M("wall_side_door_leaf", comp.box((DW - 0.11, 0.045, DH - 0.06), at=(DX - 0.002, 0.0225, DH / 2 - 0.02)), door_m, parent=hp)
comp.bevel(leaf, 0.003, 2)
M("wall_side_door_kick", rbox((DW - 0.16, 0.003, 0.25), at=(DX, -0.0015, 0.16), r=0.001, seg=1), m["steel"], parent=hp)
HXh = DX - DW / 2 + 0.12
M("wall_side_door_handle", comp.merge(turn([(0.0, 0.012), (0.026, 0.012), (0.03, 0.0)], seg=24, axis="F", at=(HXh, 0.0, 1.02)), comp.cyl(0.009, 0.05, at=(HXh, -0.05, 1.02), seg=12, axis="Y"),
                                        rbox((0.12, 0.018, 0.018), at=(HXh + 0.05, -0.052, 1.02), r=0.008), turn([(0.0, 0.006), (0.014, 0.006), (0.016, 0.0)], seg=16, axis="F", at=(HXh, 0.0, 1.14))), m["steel"], parent=hp, smooth=True)
M("wall_side_door_plate", rbox((0.34, 0.004, 0.09), at=(DX, -0.002, 1.62), r=0.002, seg=1), sign_m, parent=hp)
M("wall_side_door_plate_print", label("EMPLOYEES ONLY", 0.03, (DX, -0.0045, 1.62)), m["white"], parent=hp)
M("wall_side_door_hinges", comp.merge(*[comp.cyl(0.008, 0.1, at=(DX + DW / 2 - 0.05, -0.006, z), seg=12) for z in (0.25, 1.0, 1.8)]), m["steel"], smooth=True)
M("wall_side_door_closer", comp.merge(rbox((0.24, 0.05, 0.06), at=(DX + 0.2, -0.025, DH - 0.11), r=0.006), comp.box((0.3, 0.012, 0.014), at=(DX + 0.12, -0.03, DH - 0.065))), m["steel"], parent=hp)
# the breaker panel and a conduit up from it
M("wall_side_panel_box", rbox((0.4, 0.09, 0.62), at=(2.8, -0.045, 1.72), r=0.004), frame_m)
pd = M("wall_side_panel_door", rbox((0.36, 0.008, 0.58), at=(2.8, -0.094, 1.72), r=0.003), door_m)
M("wall_side_panel_latch", comp.merge(rbox((0.016, 0.01, 0.05), at=(2.95, -0.1, 1.72), r=0.003), comp.cyl(0.013, Hh - 2.03, at=(2.8, -0.03, 2.03), seg=12)), m["steel"], smooth=True)
M("wall_side_panel_print", comp.merge(label("ELECTRICAL PANEL", 0.018, (2.8, -0.0986, 1.93)), label("KEEP CLEAR", 0.014, (2.8, -0.0986, 1.9))), m["white"])
pl = _lib.outlet((-2.4, 0.45), None, None)
M("wall_side_socket_plate", comp.merge(pl[0], pl[1]), m["white"])
M("wall_side_socket_slots", pl[2], m["dark"])
comp.channel("door", [(hp, "rotation_euler", 2, 0, math.radians(-80))])
comp.export(col, root, _lib.PLACE, "wall_side", made="blender/components/laundromat/wall_side.py",
            source="own geometry; plaster: https://polyhaven.com/a/painted_plaster_wall; tiles: https://polyhaven.com/a/long_white_tiles", license="ours; textures CC0", credit="Poly Haven (painted_plaster_wall, long_white_tiles)",
            rig={"door": "the back room's door swings 80 degrees into the back room on its hinges at the right (wall_side_door)"},
            notes="Its room face is at y 0. Turn it a quarter (yaw -90 degrees in raea) to stand it along the floor's right edge.")
