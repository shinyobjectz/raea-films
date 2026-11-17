# vinyl/console: the listening station's sideboard, modelled by hand: a walnut hi-fi console 1.3 m long, 0.46 deep
# and 0.72 high on four tapered legs with brass ferrules, an open left bay of LPs spines out with a divider, and a
# right bay behind a door with a brass pull. The turntable and amplifier stand on it. Its front faces -y.
# Rig: "door" swings the right bay's door open 105 degrees about its hinges on the right.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("console")
rng = random.Random(5)
wood = comp.ph_texture("console_walnut", "walnut_veneer", tile=0.9, res="1k", tint=(0.5, 0.36, 0.27))
brass = comp.mat("console_brass", (0.78, 0.6, 0.25), rough=0.25, metal=1.0)
dark = comp.mat("console_inside", (0.05, 0.035, 0.03), rough=0.7)
INK = inks()
W, D, H, LEG, TH = 1.3, 0.46, 0.72, 0.2, 0.02
def P(name, size, at, parent=None):
    o = M(name, comp.box(size, at=at), wood, parent=parent)
    comp.uv_box(o, 1.0)
    comp.bevel(o, 0.003, 2)
    return o
P("console_top", (W, D, TH), (0, 0, H - TH / 2))
P("console_bottom", (W, D, TH), (0, 0, LEG + TH / 2))
for i, x in enumerate((-W / 2 + TH / 2, 0.0, W / 2 - TH / 2)):
    P(f"console_side_{i + 1}", (TH, D - 0.004, H - LEG - 2 * TH), (x, 0, (H + LEG) / 2))
M("console_back", comp.box((W - 0.01, 0.008, H - LEG - 0.01), at=(0, D / 2 - 0.006, (H + LEG) / 2)), dark)
legs = []
for sx in (-1, 1):
    for sy in (-1, 1):
        l = comp.cyl(0.022, LEG, seg=16, r2=0.013)
        xf(l, T(sx * (W / 2 - 0.09), sy * (D / 2 - 0.07), LEG) @ R(180, "X") @ R(sx * 6, "Y"))
        legs.append(l)
        f = comp.cyl(0.0135, 0.03, seg=16, r2=0.012)
        xf(f, T(sx * (W / 2 - 0.09), sy * (D / 2 - 0.07), LEG) @ R(180, "X") @ R(sx * 6, "Y") @ T(0, 0, LEG - 0.03))
        M(f"console_ferrule_{len(legs)}", f, brass, smooth=True)
lg = M("console_legs", comp.merge(*legs), wood, smooth=True)
comp.uv_box(lg, 1.0)
spines = []
x = -W / 2 + TH + 0.012
while x < -TH / 2 - 0.02:
    s = sleeve(rng, art=False)
    xf(s, T(x, -0.03, LEG + TH) @ R(rng.uniform(-2, 2), "Y") @ R(90, "Z"))
    spines.append(s)
    x += rng.choice((0.0058, 0.0066, 0.008))
M("console_records", comp.merge(*spines), INK)
door = comp.pivot(col, root, "console_door", (W / 2 - 0.004, -D / 2 + 0.01, (H + LEG) / 2))
dw = W / 2 - TH / 2 - 0.006
P("console_door_panel", (dw, 0.018, H - LEG - 2 * TH - 0.006), (W / 2 - 0.004 - dw / 2, -D / 2 + 0.009, (H + LEG) / 2), parent=door)
shade(M("console_door_pull", comp.merge(comp.cyl(0.004, 0.11, at=(0.05, -D / 2 - 0.02, (H + LEG) / 2 - 0.055), seg=10), comp.cyl(0.003, 0.02, at=(0.05, -D / 2 - 0.02, (H + LEG) / 2 - 0.04), seg=8, axis="Y"), comp.cyl(0.003, 0.02, at=(0.05, -D / 2 - 0.02, (H + LEG) / 2 + 0.04), seg=8, axis="Y")), brass, parent=door))
channel("door", [(door, "rotation_euler", 2, 0, math.radians(105))])
done(col, root, "console", "own geometry (a generic mid-century hi-fi console; veneer https://polyhaven.com/a/walnut_veneer, CC0)",
     rig={"door": "the right bay's door 105 degrees open about its hinges on the right edge"})
