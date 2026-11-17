# vinyl/record: one LP half out of its sleeve, lying flat (on the counter, by the deck), modelled by hand: a card
# outer sleeve with a design of our own, the white paper inner sleeve's lower leaf under it, and the record on that (five
# tracks, a two-colour label). 0.315 m square. Rig: "slide" pulls the inner sleeve and record 0.2 m out of the outer
# sleeve's mouth (toward +x); "spin" turns the bare record one whole turn in its sleeve's plane.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("record")
rng = random.Random(21)
INK = inks()
vm = vinyl_mats()
paper = comp.mat("record_inner_sleeve", (0.92, 0.91, 0.86), rough=0.7)
label_a = comp.mat("record_label", (0.7, 0.13, 0.02), rough=0.6)
label_b = comp.mat("record_label_cream", (0.9, 0.84, 0.68), rough=0.6)
w = SLEEVE
top = sleeve(rng, art=True, t=0.0012)
xf(top, T(0, -w / 2, 0.0056) @ R(-90, "X"))
bot = paint(comp.box((w, w, 0.0012), at=(0, 0, 0.0006)), 5)
edges = paint(comp.merge(comp.box((w, 0.002, 0.005), at=(0, -w / 2 + 0.001, 0.003)), comp.box((w, 0.002, 0.005), at=(0, w / 2 - 0.001, 0.003)), comp.box((0.002, w, 0.005), at=(-w / 2 + 0.001, 0, 0.003))), 5)
M("record_sleeve", comp.merge(top, bot, edges), INK)
slide = comp.pivot(col, root, "record_slide", (0, 0, 0.0025))
inner = comp.merge(comp.box((0.306, 0.306, 0.0003), at=(0, 0, 0.0016)), comp.box((0.306, 0.0006, 0.0012), at=(0, -0.153, 0.0022)), comp.box((0.306, 0.0006, 0.0012), at=(0, 0.153, 0.0022)))
M("record_inner", inner, paper, parent=slide)
turn_ = comp.pivot(col, root, "record_disc", (0, 0, 0.002), parent=slide)
for bm, key in lp(0.002):
    M(f"record_{key}", bm, vm[key], parent=turn_)
M("record_label_face", fan(0.0036, 0.05, 0.002 + LP_T + 0.0003, 64, index=lambda a: 1 if 200 < a < 320 else 0), [label_a, label_b], parent=turn_)
REST = 0.045
slide.location.x += REST
bpy.context.view_layer.update()
channel("slide", [(slide, "location", 0, slide.location.x, slide.location.x + 0.2)])
channel("spin", [(turn_, "rotation_euler", 2, 0, -2 * math.pi)])
done(col, root, "record", "own geometry (a 12-inch LP in its sleeves)",
     rig={"slide": "the inner sleeve and record 0.2 m further out of the outer sleeve's mouth, toward +x", "spin": "the record one whole turn clockwise from above, about its centre"})
