# bedroom/wall-front: the room's fourth wall, 4.2 x 2.5 m, the one the camera stands in for most of both shots (the
# half-turn pan ends on it): the same pale-blue plaster, skirting and star border, with a built-in wardrobe's pair of
# louvred bifold doors, 1.2 x 2.0 m, in a painted frame, each leaf with its slats and a wooden knob.
# Its room face is at y 0, its foot at z 0, centred in x. Rig: "wardrobe" folds the two doors open (each leaf pair
# swings 75 degrees about its jamb). Off the stand (the stand's camera looks through it); library-bedroom-walls shows it.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from comp import T, R, xf
col, root = comp.fresh("wall_front")
M = _lib.plain_wall(col, root, "wall_front", _lib.ROOM_W)
white = comp.mat("wall_trim", (0.9, 0.89, 0.84), rough=0.4)
knob = comp.mat("wall_wardrobe_knob", (0.45, 0.28, 0.14), rough=0.4)
dark = comp.mat("wall_wardrobe_dark", (0.02, 0.02, 0.02), rough=0.9)
WX, WW, WH = 0.9, 1.2, 2.0
fr = M("wall_front_wardrobe_frame", comp.merge(comp.box((0.07, 0.03, WH + 0.07), at=(WX - WW / 2 - 0.035, -0.015, (WH + 0.07) / 2)), comp.box((0.07, 0.03, WH + 0.07), at=(WX + WW / 2 + 0.035, -0.015, (WH + 0.07) / 2)), comp.box((WW + 0.14, 0.03, 0.07), at=(WX, -0.015, WH + 0.035))), white)
comp.bevel(fr, 0.004, 2)
M("wall_front_wardrobe_inside", comp.box((WW, 0.002, WH), at=(WX, -0.001, WH / 2)), dark)
hinges = []
for s in (-1, 1):
    h = comp.pivot(col, root, f"wall_front_wardrobe_door_{'lr'[s > 0]}", (WX + s * WW / 2, -0.02, 0))
    lw = WW / 4
    for k in range(2):
        cx = WX + s * (WW / 2 - lw / 2 - k * lw)
        leaf = [comp.box((0.04, 0.024, WH - 0.02), at=(cx - lw / 2 + 0.022, -0.02, WH / 2)), comp.box((0.04, 0.024, WH - 0.02), at=(cx + lw / 2 - 0.022, -0.02, WH / 2)),
                comp.box((lw - 0.004, 0.024, 0.07), at=(cx, -0.02, 0.045)), comp.box((lw - 0.004, 0.024, 0.07), at=(cx, -0.02, WH - 0.045)), comp.box((lw - 0.004, 0.024, 0.06), at=(cx, -0.02, WH / 2))]
        slats = [xf(comp.box((lw - 0.08, 0.004, 0.034)), T(cx, -0.02, 0.1 + j * 0.03) @ R(35, "X")) for j in range(60) if abs(0.1 + j * 0.03 - WH / 2) > 0.05 and 0.1 + j * 0.03 < WH - 0.09]
        o = M(f"wall_front_wardrobe_leaf_{'lr'[s > 0]}{k + 1}", comp.merge(*leaf, *slats), white, parent=h)
    M(f"wall_front_wardrobe_knob_{'lr'[s > 0]}", comp.merge(comp.cyl(0.008, 0.02, at=(WX + s * 0.04, -0.052, 1.0), seg=10, axis="Y"), comp.cyl(0.016, 0.014, at=(WX + s * 0.04, -0.064, 1.0), seg=14, axis="Y")), knob, parent=h, smooth=True)
    hinges.append((h, s))
comp.channel("wardrobe", [(h, "rotation_euler", 2, 0, math.radians(75 * s)) for h, s in hinges])
comp.export(col, root, _lib.PLACE, "wall_front", made="blender/components/bedroom/wall_front.py",
            source="own geometry; plaster: https://polyhaven.com/a/painted_plaster_wall", license="ours; texture CC0", credit="Poly Haven (painted_plaster_wall)",
            rig={"wardrobe": "the two louvred doors swing 75 degrees open into the room about their jambs (each pair of leaves as one; they do not fold)"})
