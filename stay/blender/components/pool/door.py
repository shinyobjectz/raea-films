# pool/door: the far door, a pair of steel fire-exit doors in their frame for a 1.9 x 2.15 m doorway, modelled by hand:
# a pressed-steel frame, two leaves with wired-glass vision panels, panic bars and kick plates on the room side, three
# hinges each, a closer on each leaf's head. Its origin is the middle of the threshold at the wall's room face (y 0).
# Rig: "open" swings both leaves 95 degrees out of the hall about their hinges.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("door")
frame_m = paint_m("pool_door_frame", (0.3, 0.33, 0.36), 0.45)
leaf_m = paint_m("pool_door_leaf", (0.12, 0.3, 0.42), 0.5)
glass_m = comp.mat("pool_door_glass", (0.6, 0.72, 0.7), rough=0.1, alpha=0.35)
metal_m = steel("pool_steel")
dark_m = comp.mat("pool_door_seal", (0.03, 0.03, 0.03), rough=0.7)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
_, W, H = DOOR
FW, FD, LY, LT = 0.05, 0.14, 0.07, 0.045
fr = M("door_frame", comp.merge(comp.box((FW, FD, H), at=(-W / 2 + FW / 2, FD / 2, H / 2)), comp.box((FW, FD, H), at=(W / 2 - FW / 2, FD / 2, H / 2)), comp.box((W, FD, FW), at=(0, FD / 2, H - FW / 2)),
                                comp.box((W - 2 * FW, 0.02, 0.012), at=(0, LY + LT / 2 + 0.012, H - FW - 0.006))), frame_m)
comp.bevel(fr, 0.004, 2)
M("door_threshold", comp.box((W - 2 * FW, FD, 0.012), at=(0, FD / 2, 0.006)), metal_m)
LW, LH = (W - 2 * FW) / 2 - 0.004, H - FW - 0.012 - 0.006
hinges = []
for s, side in ((-1, "l"), (1, "r")):
    hx = s * (W / 2 - FW)
    hp = comp.pivot(col, root, f"door_leaf_{side}", (hx, LY + LT / 2, 0))
    cx = hx - s * (LW / 2 + 0.002)
    vx0, vx1 = (-0.2, -0.02) if s < 0 else (0.02, 0.2)     # the vision panel, toward the meeting edge
    leaf = wall(LW, LH, LT, holes=[(s * 0.11 - 0.09 - 0, s * 0.11 + 0.09, 1.15, 1.85)])
    xf(leaf, T(cx, LY - LT / 2, 0.012))
    lo = M(f"door_leaf_{side}_panel", leaf, leaf_m, parent=hp)
    comp.bevel(lo, 0.003, 2)
    M(f"door_leaf_{side}_glass", comp.box((0.18, 0.008, 0.7), at=(cx + s * 0.11, LY, 1.512)), glass_m, parent=hp)
    bead = comp.merge(comp.box((0.21, 0.006, 0.018), at=(cx + s * 0.11, LY - LT / 2 - 0.003, 1.15 + 0.012 - 0.009)), comp.box((0.21, 0.006, 0.018), at=(cx + s * 0.11, LY - LT / 2 - 0.003, 1.85 + 0.012 + 0.009)),
                      comp.box((0.018, 0.006, 0.7), at=(cx + s * 0.11 - 0.099, LY - LT / 2 - 0.003, 1.512)), comp.box((0.018, 0.006, 0.7), at=(cx + s * 0.11 + 0.099, LY - LT / 2 - 0.003, 1.512)))
    M(f"door_leaf_{side}_bead", bead, frame_m, parent=hp)
    M(f"door_leaf_{side}_kick", comp.box((LW - 0.03, 0.002, 0.25), at=(cx, LY - LT / 2 - 0.001, 0.15)), metal_m, parent=hp)
    # the panic bar: two end housings and the push bar between them
    bar = comp.merge(comp.box((0.07, 0.06, 0.1), at=(cx - LW / 2 + 0.09, LY - LT / 2 - 0.03, 1.02)), comp.box((0.07, 0.06, 0.1), at=(cx + LW / 2 - 0.09, LY - LT / 2 - 0.03, 1.02)))
    bo = M(f"door_leaf_{side}_bar_ends", bar, dark_m, parent=hp)
    comp.bevel(bo, 0.006, 2)
    M(f"door_leaf_{side}_bar", comp.cyl(0.014, LW - 0.2, at=(cx - LW / 2 + 0.1, LY - LT / 2 - 0.05, 1.02), seg=16, axis="X"), metal_m, parent=hp, smooth=True)
    cl = M(f"door_leaf_{side}_closer", comp.box((0.24, 0.045, 0.06), at=(hx - s * 0.2, LY - LT / 2 - 0.0225, LH - 0.05)), metal_m, parent=hp)
    comp.bevel(cl, 0.005, 2)
    M(f"door_leaf_{side}_edge", comp.box((0.012, LT + 0.004, LH), at=(cx - s * (LW / 2 - 0.004), LY, 0.012 + LH / 2)), dark_m, parent=hp)
    M(f"door_hinges_{side}", comp.merge(*[comp.cyl(0.009, 0.1, at=(hx, LY - LT / 2 - 0.004, z), seg=12) for z in (0.22, 1.05, 1.88)]), metal_m, smooth=True)
    hinges.append((hp, s))
comp.channel("open", [(hp, "rotation_euler", 2, 0, -s * math.radians(95)) for hp, s in hinges])
done(col, root, "door", source="own geometry (a generic pair of steel fire-exit doors)",
     rig={"open": "both leaves swing 95 degrees out of the hall (away from the room) about their hinges"},
     notes="origin: the threshold's middle at the wall's room face; fits pool/wall-end's doorway")
