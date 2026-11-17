# office/partition: a cubicle panel, 1.6 m wide and 1.35 m tall, modelled by hand: grey fabric both sides in an
# aluminium frame, a cable trough along its foot, two flat feet, and a row of pinned papers. Stands between desk
# rows; rows of them end to end make a run.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("partition")
fabric = comp.ph_texture("partition_fabric", "hessian_230", tile=0.3, tint=(0.62, 0.68, 0.78), grey=True)
alu = comp.mat("partition_frame", (0.62, 0.63, 0.65), rough=0.35, metal=1.0)
grey = comp.mat("partition_trough", (0.3, 0.31, 0.33), rough=0.5)
paper = comp.mat("partition_paper", (0.9, 0.89, 0.85), rough=0.7)
W, H, TH = 1.6, 1.35, 0.05
p = comp.mesh(col, root, "partition_panel", comp.box((W - 0.05, TH - 0.008, H - 0.2), at=(0, 0, 0.15 + (H - 0.2) / 2)), fabric)
comp.uv_box(p, 1.0)
frame = comp.merge(comp.box((W, TH, 0.028), at=(0, 0, H - 0.014)), comp.box((0.028, TH, H - 0.04), at=(-W / 2 + 0.014, 0, (H - 0.04) / 2 + 0.04)),
                   comp.box((0.028, TH, H - 0.04), at=(W / 2 - 0.014, 0, (H - 0.04) / 2 + 0.04)))
f = comp.mesh(col, root, "partition_frame", frame, alu)
comp.bevel(f, 0.004, 2)
t = comp.mesh(col, root, "partition_trough", comp.box((W - 0.056, TH + 0.012, 0.11), at=(0, 0, 0.095)), grey)
comp.bevel(t, 0.004, 2)
feet = comp.merge(*[comp.box((0.06, 0.42, 0.016), at=(s * (W / 2 - 0.1), 0, 0.008)) for s in (-1, 1)], *[comp.box((0.04, 0.04, 0.03), at=(s * (W / 2 - 0.1), 0, 0.028)) for s in (-1, 1)])
ft = comp.mesh(col, root, "partition_feet", feet, alu)
comp.bevel(ft, 0.004, 2)
import random
rnd = random.Random(7)
sheets = []
for i in range(5):
    b = comp.box((0.21, 0.0006, 0.297), at=(0, 0, 0))
    xf(b, R(rnd.uniform(-4, 4), "Y"))
    xf(b, T(-0.55 + i * 0.27 + rnd.uniform(-0.02, 0.02), -TH / 2 + 0.0035, 0.95 + rnd.uniform(-0.05, 0.05)))
    sheets.append(b)
comp.mesh(col, root, "partition_papers", comp.merge(*sheets), paper)
comp.export(col, root, "office", "partition", made="blender/components/office/partition.py",
            source="own geometry (a generic cubicle panel); fabric: https://polyhaven.com/a/hessian_230", license="ours; texture CC0", credit="Poly Haven (hessian_230)")
