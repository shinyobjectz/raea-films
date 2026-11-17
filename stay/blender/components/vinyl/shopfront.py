# vinyl/shopfront: the shop's street wall from inside, modelled by hand: 5 x 3 m of red brick 0.2 m thick, a 2.6 m
# shop window in a painted timber frame with a mullion and a deep display sill (three LPs leaning in it, facing the
# street), cream RECORDS lettering on the glass (it reads backwards from inside), and a half-glazed door with a brass
# handle, a kick plate, an OPEN card on a string, a closer arm and a sprung bell on its bracket above. The shell's
# side wall: its inside face at y 0. Rig: "door" swings the door 80 degrees into the shop about its hinges; "bell"
# kicks the bell 30 degrees on its spring. The afternoon sun through the window is the scene's.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("shopfront")
rng = random.Random(9)
brick = comp.ph_texture("shopfront_brick", "red_brick", tile=1.4, res="2k")
paintm = comp.mat("shopfront_paint", (0.022, 0.085, 0.08), rough=0.42)
glass = comp.mat("shopfront_glass", (0.8, 0.88, 0.9), rough=0.04, alpha=0.12)
cream = comp.mat("shopfront_letters", (0.92, 0.86, 0.7), rough=0.6)
brass = comp.mat("shopfront_brass", (0.78, 0.6, 0.25), rough=0.25, metal=1.0)
card = comp.mat("shopfront_card", (0.9, 0.88, 0.8), rough=0.7)
ink = comp.mat("shopfront_ink", (0.7, 0.08, 0.05), rough=0.6)
sillm = comp.ph_texture("shopfront_sill", "oak_veneer_01", tile=0.9, res="1k", tint=(0.72, 0.56, 0.4))
INK = inks()
TH, HT = 0.2, 3.0
WX0, WX1, WZ0, WZ1 = -2.1, 0.5, 0.7, 2.4       # the window's opening
DX0, DX1, DZ1 = 1.0, 1.92, 2.1                 # the door's opening
def wall(x0, x1, z0, z1):
    return comp.box((x1 - x0, TH, z1 - z0), at=((x0 + x1) / 2, TH / 2, (z0 + z1) / 2))
w = M("shopfront_brick", comp.merge(wall(-2.5, WX0, 0, HT), wall(WX0, WX1, 0, WZ0), wall(WX0, WX1, WZ1, HT), wall(WX1, DX0, 0, HT), wall(DX0, DX1, WZ1, HT), wall(DX1, 2.5, 0, HT)), brick)
comp.uv_box(w, 1.0)
def frame(x0, x1, z0, z1, t=0.06, d=0.1, y=0.1):
    return comp.merge(comp.box((x1 - x0, d, t), at=((x0 + x1) / 2, y, z0 + t / 2)), comp.box((x1 - x0, d, t), at=((x0 + x1) / 2, y, z1 - t / 2)),
                      comp.box((t, d, z1 - z0), at=(x0 + t / 2, y, (z0 + z1) / 2)), comp.box((t, d, z1 - z0), at=(x1 - t / 2, y, (z0 + z1) / 2)))
wf = M("shopfront_window_frame", comp.merge(frame(WX0, WX1, WZ0, WZ1), comp.box((0.05, 0.08, WZ1 - WZ0), at=((WX0 + WX1) / 2, 0.1, (WZ0 + WZ1) / 2)), comp.box((WX1 - WX0, 0.08, 0.05), at=((WX0 + WX1) / 2, 0.1, 2.0))), paintm)
comp.bevel(wf, 0.004, 2)
M("shopfront_window_glass", comp.box((WX1 - WX0 - 0.1, 0.008, WZ1 - WZ0 - 0.1), at=((WX0 + WX1) / 2, 0.1, (WZ0 + WZ1) / 2)), glass)
letters = comp.merge(xf(comp.text("RECORDS", 0.3, depth=0.002), T((WX0 + WX1) / 2, 0.094, 1.62) @ S(-1, 1, 1)), xf(comp.text("BOUGHT   SOLD   TRADED", 0.085, depth=0.002), T((WX0 + WX1) / 2, 0.094, 1.3) @ S(-1, 1, 1)))
bmesh.ops.reverse_faces(letters, faces=letters.faces)
M("shopfront_letters", letters, cream)
sill = M("shopfront_sill", comp.box((WX1 - WX0 + 0.1, 0.42, 0.04), at=((WX0 + WX1) / 2, -0.03, WZ0 - 0.02)), sillm)
comp.uv_box(sill, 1.0)
comp.bevel(sill, 0.008, 3)
M("shopfront_sill_records", comp.merge(*[xf(sleeve(rng, art=True), T(WX0 + 0.5 + k * 0.75, 0.0, WZ0) @ R(10, "X") @ R(180, "Z")) for k in range(3)]), INK)
# the door
df = M("shopfront_door_frame", comp.merge(frame(DX0, DX1, 0, WZ1, t=0.05, d=0.12, y=0.1), comp.box((DX1 - DX0, 0.1, 0.05), at=((DX0 + DX1) / 2, 0.1, DZ1 + 0.025))), paintm)
comp.bevel(df, 0.004, 2)
M("shopfront_transom_glass", comp.box((DX1 - DX0 - 0.1, 0.008, WZ1 - DZ1 - 0.1), at=((DX0 + DX1) / 2, 0.1, (DZ1 + 0.05 + WZ1 - 0.05) / 2)), glass)
HX, DY = DX0 + 0.05, 0.06
door = comp.pivot(col, root, "shopfront_door", (HX, DY, 0))
LW, LH, LT = DX1 - DX0 - 0.1, DZ1 - 0.01, 0.045
leaf = comp.merge(comp.box((LW, LT, 0.85), at=(HX + LW / 2, DY, 0.01 + 0.425)), comp.box((LW, LT, 0.14), at=(HX + LW / 2, DY, LH - 0.07)),
                  comp.box((0.12, LT, LH - 0.99), at=(HX + 0.06, DY, 0.86 + (LH - 0.99) / 2)), comp.box((0.12, LT, LH - 0.99), at=(HX + LW - 0.06, DY, 0.86 + (LH - 0.99) / 2)))
lf = M("shopfront_door_leaf", leaf, paintm, parent=door)
comp.bevel(lf, 0.004, 2)
M("shopfront_door_glass", comp.box((LW - 0.24, 0.008, LH - 0.99), at=(HX + LW / 2, DY, 0.86 + (LH - 0.99) / 2)), glass, parent=door)
M("shopfront_door_kick", comp.box((LW - 0.04, 0.003, 0.22), at=(HX + LW / 2, DY - LT / 2 - 0.0015, 0.13)), brass, parent=door)
shade(M("shopfront_door_handle", comp.merge(comp.cyl(0.011, 0.3, at=(HX + LW - 0.06, DY - LT / 2 - 0.05, 0.95), seg=14), comp.cyl(0.008, 0.05, at=(HX + LW - 0.06, DY - LT / 2 - 0.05, 0.99), seg=10, axis="Y"), comp.cyl(0.008, 0.05, at=(HX + LW - 0.06, DY - LT / 2 - 0.05, 1.21), seg=10, axis="Y")), brass, parent=door))
M("shopfront_door_card", comp.merge(comp.box((0.26, 0.003, 0.15), at=(HX + LW / 2, DY - 0.012, 1.5)), comp.box((0.001, 0.001, 0.12), at=(HX + LW / 2 - 0.07, DY - 0.012, 1.63)), comp.box((0.001, 0.001, 0.12), at=(HX + LW / 2 + 0.07, DY - 0.012, 1.63))), card, parent=door)
M("shopfront_door_card_words", xf(comp.text("OPEN", 0.075, depth=0.001), T(HX + LW / 2, DY - 0.0145, 1.5)), ink, parent=door)
shade(M("shopfront_door_hinges", comp.merge(*[comp.cyl(0.008, 0.1, at=(HX - 0.004, DY - LT / 2 - 0.004, z), seg=10) for z in (0.2, 1.0, 1.8)]), brass))
# the bell on its spring above the door
BX, BZ = HX + LW - 0.12, DZ1 + 0.16
shade(M("shopfront_bell_bracket", comp.merge(comp.box((0.03, 0.006, 0.08), at=(BX, -0.003, BZ)), comp.tube([(BX, -0.006, BZ + 0.02), (BX, -0.06, BZ + 0.035), (BX, -0.1, BZ + 0.02), (BX, -0.12, BZ - 0.01)], 0.003, sides=2)), brass))
bell = comp.pivot(col, root, "shopfront_bell", (BX, -0.12, BZ - 0.01))
shade(M("shopfront_bell_cup", comp.merge(turn([(0.004, 0.0), (0.012, -0.004), (0.022, -0.02), (0.027, -0.04), (0.033, -0.05), (0.03, -0.05), (0.024, -0.04), (0.019, -0.022), (0.004, -0.006)], BZ - 0.01, seg=28, at=(BX, -0.12)), sphere(0.007, at=(BX, -0.12, BZ - 0.052), u=10, v=6)), brass, parent=bell))
channel("door", [(door, "rotation_euler", 2, 0, math.radians(-80))])
channel("bell", [(bell, "rotation_euler", 0, 0, math.radians(30))])
done(col, root, "shopfront", "own geometry (a generic shopfront; https://polyhaven.com/a/red_brick and https://polyhaven.com/a/oak_veneer_01, CC0)",
     rig={"door": "the door 80 degrees into the shop about its hinges", "bell": "the bell 30 degrees on its spring above the door"})
