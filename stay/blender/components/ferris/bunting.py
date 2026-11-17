# ferris/bunting: an 8 m line of bunting, modelled by hand: a white tape sagging 0.4 m between its ends with 24
# triangular pennants, 20 x 28 cm, in red, cream, blue and yellow, each a part of its own on its hem. A hanging
# item: its origin is the middle of the straight line between its ends (4 m either side along x).
# Rig: "flutter" kicks every pennant out 20 to 55 degrees about its hem, alternately forward and back.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("bunting")
tape = comp.mat("bunting_tape", (0.9, 0.9, 0.86), rough=0.7)
COLS = [comp.mat("bunting_red", (0.6, 0.05, 0.04), rough=0.7), comp.mat("bunting_cream", (0.88, 0.82, 0.62), rough=0.7), comp.mat("bunting_blue", (0.05, 0.2, 0.5), rough=0.7), comp.mat("bunting_yellow", (0.85, 0.6, 0.06), rough=0.7)]
SPAN, SAG, NF = 8.0, 0.4, 24
cz = lambda x: -SAG * (1 - (2 * x / SPAN) ** 2)
comp.mesh(col, root, "bunting_tape", comp.tube([(x, 0, cz(x)) for x in [-SPAN / 2 + SPAN * k / 24 for k in range(25)]], 0.005, res=3, sides=2), tape, smooth=True)
chans = []
for i in range(NF):
    x = -SPAN / 2 + SPAN * (i + 0.5) / NF
    z = cz(x)
    slope = math.degrees(math.atan(2 * SAG * 4 * x / SPAN ** 2 * 2))
    p = comp.pivot(col, root, f"bunting_flag_{i + 1:02d}", (x, 0, z))
    bm = bmesh.new()
    bm.faces.new([bm.verts.new(q) for q in ((-0.1, 0, 0.004), (0.1, 0, 0.004), (0.0, 0, -0.28))])
    xf(bm, comp.Matrix.Translation((x, 0, z)) @ R(-slope, "Y"))
    o = comp.mesh(col, root, f"bunting_flag_{i + 1:02d}_cloth", bm, COLS[i % 4], parent=p)
    comp.solidify(o, 0.002)
    chans.append((p, "rotation_euler", 0, 0, math.radians((20 + (i * 53) % 36) * (1 if i % 2 else -1))))
comp.channel("flutter", chans)
comp.export(col, root, "ferris", "bunting", made="blender/components/ferris/bunting.py", source="own geometry", license="ours", credit="",
            rig={"flutter": "every pennant kicks out 20 to 55 degrees about its hem, alternate ones the other way"}, notes="origin: the middle of the line between its two ends, 4 m either side along x")
