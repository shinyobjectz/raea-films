# garage/stair-door: the fire door to the stair core, modelled by hand: a steel frame 1.06 x 2.14 m standing 0.1 m
# proud of the wall (its back at y 0, its foot's middle at the origin), a dark red steel leaf with a wired-glass
# vision panel, a steel kick plate and push plate, a D pull handle, three hinges and an overhead closer; over it a
# lit green STAIRS box (stair_door_glow) and beside the handle a small level plate. Behind the leaf is a black
# reveal, so the open door shows a dark stair. Rig: "open" swings the leaf 85 degrees out into the car park.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("stair_door")
M = L.maker(col, root)
frame_m = comp.mat("stair_door_frame", (0.2, 0.21, 0.22), rough=0.45)
leaf_m = comp.mat("stair_door_leaf", (0.36, 0.035, 0.03), rough=0.5)
steel = comp.mat("stair_door_steel", (0.7, 0.7, 0.72), rough=0.3, metal=1.0)
glass = comp.mat("stair_door_glass", (0.55, 0.7, 0.72), rough=0.05, alpha=0.3)
wire = comp.mat("stair_door_wire", (0.1, 0.1, 0.1), rough=0.5)
black = comp.mat("stair_door_void", (0.004, 0.004, 0.004), rough=1.0)
green = comp.mat("stair_door_glow", (0.02, 0.45, 0.16), rough=0.35, emit=(0.03, 0.8, 0.25), strength=2.5)
white = comp.mat("stair_door_letters", (0.95, 0.97, 0.95), rough=0.4, emit=(0.9, 1.0, 0.92), strength=2.0)
W, H, FD = 0.96, 2.06, 0.1
fr = [comp.box((0.05, FD, H + 0.05), at=(sx * (W / 2 + 0.025), -FD / 2, (H + 0.05) / 2)) for sx in (-1, 1)] + [comp.box((W + 0.1, FD, 0.05), at=(0, -FD / 2, H + 0.025))]
f = M("stair_door_frame", comp.merge(*fr), frame_m)
comp.bevel(f, 0.004, 2)
M("stair_door_void", comp.box((W, 0.004, H), at=(0, -0.004, H / 2)), black)
M("stair_door_threshold", comp.box((W, FD, 0.012), at=(0, -FD / 2, 0.006)), steel)
HX, LY = -W / 2, -FD + 0.03
lp = comp.pivot(col, root, "stair_door_leaf", (HX, LY - 0.022, 0))
leaf = M("stair_door_leaf_panel", comp.box((W - 0.01, 0.045, H - 0.015), at=(0, LY, H / 2 + 0.005)), leaf_m, parent=lp)
comp.bevel(leaf, 0.003, 2)
FY = LY - 0.0225
M("stair_door_kick_plate", comp.box((W - 0.06, 0.002, 0.25), at=(0, FY - 0.001, 0.15)), steel, parent=lp)
M("stair_door_push_plate", comp.box((0.1, 0.002, 0.3), at=(W / 2 - 0.1, FY - 0.001, 1.25)), steel, parent=lp)
M("stair_door_handle", L.sweep([(W / 2 - 0.1, FY, 0.95), (W / 2 - 0.1, FY - 0.06, 0.95), (W / 2 - 0.1, FY - 0.06, 1.1), (W / 2 - 0.1, FY - 0.06, 1.25), (W / 2 - 0.1, FY, 1.25)], L.circle(0.01, 8), up=(1, 0, 0)), steel, parent=lp, smooth=True)
VW, VH, VZ, VX = 0.16, 0.62, 1.52, W / 2 - 0.22
M("stair_door_vision_glass", comp.box((VW, 0.047, VH), at=(VX, LY, VZ)), glass, parent=lp)
M("stair_door_vision_frame", L.sweep([(VX - VW / 2, FY - 0.001, VZ - VH / 2), (VX + VW / 2, FY - 0.001, VZ - VH / 2), (VX + VW / 2, FY - 0.001, VZ + VH / 2), (VX - VW / 2, FY - 0.001, VZ + VH / 2)], L.rrect(0.02, 0.006, 0.001, 1), closed=True, up=(0, -1, 0)), steel, parent=lp)
ws = [comp.box((0.0015, 0.0015, VH), at=(VX - VW / 2 + 0.02 + i * 0.02, FY - 0.0005, VZ)) for i in range(7)] + [comp.box((VW, 0.0015, 0.0015), at=(VX, FY - 0.0005, VZ - VH / 2 + 0.02 + j * 0.02)) for j in range(30)]
M("stair_door_vision_wires", comp.merge(*ws), wire, parent=lp)
M("stair_door_level_plate", comp.box((0.16, 0.003, 0.16), at=(-0.1, FY - 0.0015, 1.55)), frame_m, parent=lp)
M("stair_door_level_text", xf(comp.text("2", 0.14, 0.002), T(-0.1, FY - 0.004, 1.55)), white, parent=lp)
M("stair_door_closer_body", comp.box((0.24, 0.05, 0.06), at=(-0.2, FY - 0.025, H - 0.07)), steel, parent=lp)
M("stair_door_closer_arm", comp.merge(xf(comp.box((0.3, 0.006, 0.014)), T(-0.05, FY - 0.06, H - 0.03) @ R(12, "Z")), comp.box((0.06, 0.03, 0.02), at=(0.1, -FD - 0.012, H + 0.02))), steel)
M("stair_door_hinges", comp.merge(*[comp.cyl(0.009, 0.1, at=(HX - 0.004, FY - 0.004, z), seg=10) for z in (0.2, 1.0, 1.8)]), steel)
bx = M("stair_door_sign_box", comp.box((0.5, 0.07, 0.17), at=(0, -0.035, H + 0.2)), green)
comp.bevel(bx, 0.004, 2)
M("stair_door_sign_letters", xf(comp.text("STAIRS", 0.1, 0.002), T(0, -0.072, H + 0.2)), white)
comp.channel("open", [(lp, "rotation_euler", 2, 0, math.radians(-85))])
L.look(col, "stair-door", eye=(1.8, -4.2, 1.6), target=(0, 0, 1.15), lens=45, frame=None)
comp.export(col, root, "garage", "stair_door", made="blender/components/garage/stair_door.py", source="own geometry (a generic steel fire door)", license="ours", credit="",
            rig={"open": "the leaf swings 85 degrees out toward the car park about its left-hand hinges",
                 "glow": "in the scene: the glow of stair_door_glow and stair_door_letters (the lit STAIRS box)"})
