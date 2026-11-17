# vinyl/counter: the shop's counter, modelled by hand: 1.9 m long, 1.0 m high, a painted panelled front (three
# recessed panels in moulded frames), a black kick plinth, an oak worktop with a rounded nosing, a brass foot rail on
# three brackets, a shelf behind, and at the right end a lift-up flap resting on an end post. Its front faces -y.
# Rig: "hatch" lifts the flap 85 degrees about its hinge.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("counter")
paintm = comp.mat("counter_paint", (0.022, 0.085, 0.08), rough=0.42)
oak = comp.ph_texture("counter_top", "oak_veneer_01", tile=0.9, res="1k", tint=(0.72, 0.56, 0.4))
black = comp.mat("counter_kick", (0.02, 0.02, 0.02), rough=0.6)
brass = comp.mat("counter_brass", (0.78, 0.6, 0.25), rough=0.25, metal=1.0)
H, D, TOPT = 1.0, 0.62, 0.04
X0, X1, XF = -0.95, 0.45, 0.95          # the body's ends, the flap's far end
body = M("counter_front", comp.box((X1 - X0, 0.03, H - TOPT - 0.1), at=((X0 + X1) / 2, -D / 2 + 0.035, 0.1 + (H - TOPT - 0.1) / 2)), paintm)
comp.bevel(body, 0.003, 2)
for i, x in enumerate((X0 + 0.015, X1 - 0.015)):
    e = M(f"counter_end_{i + 1}", comp.box((0.03, D - 0.04, H - TOPT - 0.1), at=(x, 0, 0.1 + (H - TOPT - 0.1) / 2)), paintm)
    comp.bevel(e, 0.003, 2)
M("counter_kick", comp.box((X1 - X0 - 0.02, D - 0.12, 0.1), at=((X0 + X1) / 2, 0.01, 0.05)), black)
M("counter_shelf", comp.box((X1 - X0 - 0.06, D - 0.1, 0.02), at=((X0 + X1) / 2, 0.02, 0.55)), paintm)
pw = (X1 - X0 - 0.16) / 3
for i in range(3):
    cx = X0 + 0.05 + pw / 2 + i * (pw + 0.03)
    fr = comp.merge(comp.box((pw, 0.012, 0.05), at=(cx, -D / 2 + 0.016, 0.82)), comp.box((pw, 0.012, 0.05), at=(cx, -D / 2 + 0.016, 0.2)),
                    comp.box((0.05, 0.012, 0.67), at=(cx - pw / 2 + 0.025, -D / 2 + 0.016, 0.51)), comp.box((0.05, 0.012, 0.67), at=(cx + pw / 2 - 0.025, -D / 2 + 0.016, 0.51)))
    o = M(f"counter_panel_{i + 1}", fr, paintm)
    comp.bevel(o, 0.004, 3)
wt = M("counter_worktop", comp.box((X1 - X0 + 0.03, D + 0.05, TOPT), at=((X0 + X1) / 2 - 0.015, -0.015, H - TOPT / 2)), oak)
comp.uv_box(wt, 1.0)
comp.bevel(wt, 0.012, 4)
rail = comp.merge(comp.cyl(0.016, X1 - X0 - 0.1, at=(X0 + 0.05, -D / 2 - 0.07, 0.17), seg=20, axis="X"),
                  *[comp.merge(comp.cyl(0.009, 0.09, at=(x, -D / 2 - 0.07, 0.17), seg=12, axis="Y"), sphere(0.02, at=(x, -D / 2 - 0.07, 0.17), u=16, v=10), comp.cyl(0.022, 0.006, at=(x, -D / 2 + 0.014, 0.17), seg=16, axis="Y")) for x in (X0 + 0.12, (X0 + X1) / 2, X1 - 0.12)])
shade(M("counter_rail", rail, brass))
post = M("counter_post", comp.box((0.07, D - 0.04, H - TOPT), at=(XF - 0.035, 0, (H - TOPT) / 2)), paintm)
comp.bevel(post, 0.003, 2)
hatch = comp.pivot(col, root, "counter_hatch", (X1 + 0.004, 0, H - TOPT))
fl = M("counter_flap", comp.box((XF - X1 - 0.008, D + 0.05, TOPT), at=((X1 + XF) / 2, -0.015, H - TOPT / 2)), oak, parent=hatch)
comp.uv_box(fl, 1.0)
comp.bevel(fl, 0.012, 4)
for i, y in enumerate((-0.2, 0.2)):
    shade(M(f"counter_hinge_{i + 1}", comp.merge(comp.cyl(0.006, 0.07, at=(X1 + 0.004, y - 0.035, H + 0.002), seg=12, axis="Y"), comp.box((0.07, 0.06, 0.002), at=(X1 + 0.004, y, H + 0.001))), brass))
channel("hatch", [(hatch, "rotation_euler", 1, 0, math.radians(-85))])
done(col, root, "counter", "own geometry (a generic shop counter; worktop https://polyhaven.com/a/oak_veneer_01, CC0)",
     rig={"hatch": "the lift-up flap at the right end 85 degrees up about its hinge on the worktop"})
