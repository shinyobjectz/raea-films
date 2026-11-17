# cathedral/flagstones: the nave's floor, 10 x 26 m of worn stone flags (Poly Haven's monastery_stone_floor, CC0), a
# slab 2 cm thick standing on the origin (so what stands on it is placed 2 cm up), with three ledger stones let into
# the crossing before the altar steps (toward +y): dark slate slabs with an incised border and a worn brass plate each. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp
from comp import T, R, S, xf

col, root = comp.fresh("flagstones")
flags = comp.ph_texture("cathedral_flags", "monastery_stone_floor", tile=1.8, res="2k", tint=(0.8, 0.78, 0.74))
slate = comp.mat("cathedral_slate", (0.07, 0.075, 0.08), rough=0.45)
brass = comp.mat("cathedral_worn_brass", (0.6, 0.45, 0.2), rough=0.4, metal=1.0)
W, D, TH = 10.0, 26.0, 0.02
f = comp.mesh(col, root, "flagstones_floor", comp.box((W, D, TH), at=(0, 0, TH / 2)), flags)
L.finish(f, 1.0)
for i, (x, y, w, d) in enumerate(((-1.9, 7.2, 0.95, 2.05), (1.85, 6.3, 0.9, 1.9), (0.1, 3.2, 1.0, 2.1))):
    s = comp.mesh(col, root, f"flagstones_ledger_{i + 1}", comp.box((w, d, 0.012), at=(x, y, TH + 0.002)), slate)
    comp.bevel(s, 0.004, 2)
    rim = comp.merge(comp.box((w - 0.16, 0.012, 0.003), at=(x, y + d / 2 - 0.08, TH + 0.009)), comp.box((w - 0.16, 0.012, 0.003), at=(x, y - d / 2 + 0.08, TH + 0.009)),
                     comp.box((0.012, d - 0.16, 0.003), at=(x - w / 2 + 0.08, y, TH + 0.009)), comp.box((0.012, d - 0.16, 0.003), at=(x + w / 2 - 0.08, y, TH + 0.009)))
    comp.mesh(col, root, f"flagstones_ledger_{i + 1}_border", rim, brass)
    plate_ = comp.merge(comp.box((0.42, 0.3, 0.004), at=(x, y + d * 0.2, TH + 0.009)), xf(comp.cyl(0.16, 0.004, seg=24), T(x, y - d * 0.18, TH + 0.007)))
    comp.mesh(col, root, f"flagstones_ledger_{i + 1}_brass", plate_, brass)
comp.export(col, root, "cathedral", "flagstones", made="blender/components/cathedral/flagstones.py",
            source="own geometry; flags: https://polyhaven.com/a/monastery_stone_floor", license="ours; texture CC0", credit="Poly Haven (monastery_stone_floor)",
            notes="The floor's top is 2 cm above the origin.")
