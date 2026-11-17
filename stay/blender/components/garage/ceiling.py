# garage/ceiling: one module of the deck above, 10 x 8 m of board-marked concrete (two side by side roof a run of
# eight bays) (Poly Haven's wood_textured_concrete, CC0): a
# 0.2 m slab whose soffit is at z 0 (the origin, at the module's middle), a main beam 0.58 wide and 0.45 deep along x
# at y 0.8 in front of the middle (it sits on the pillar line), and ribs 0.22 wide and 0.3 deep across it every 2.5 m.
# Cast-in conduit boxes mark where the lights hang. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("ceiling")
M = L.maker(col, root)
conc = comp.ph_texture("ceiling_concrete", "wood_textured_concrete", tile=1.8, res="1k", tint=(0.8, 0.88, 1.0))
W, D = 10.0, 8.0
BEAM_Y = -0.8
slab = M("ceiling_slab", comp.box((W, D, 0.2), at=(0, 0, 0.1)), conc)
beam = M("ceiling_beam", comp.box((W, 0.58, 0.45), at=(0, BEAM_Y, -0.225)), conc)
comp.bevel(beam, 0.02, 1)
ribs = [comp.box((0.22, D, 0.3), at=(-W / 2 + 1.25 + i * 2.5, 0, -0.15)) for i in range(4)]
rb = M("ceiling_ribs", comp.merge(*ribs), conc)
for o in (slab, beam, rb):
    comp.uv_box(o, 1.0)
steel = comp.mat("ceiling_boxes", (0.55, 0.55, 0.56), rough=0.4, metal=1.0)
boxes = [comp.cyl(0.05, 0.012, at=(-W / 2 + 2.5 * i, y, -0.012), seg=16) for i in range(1, 4) for y in (-2.4, 2.9)]
M("ceiling_conduit_boxes", comp.merge(*boxes), steel)
L.look(col, "ceiling", eye=(7, -9, -4), target=(0, 0, 0), lens=28)
comp.export(col, root, "garage", "ceiling", made="blender/components/garage/ceiling.py",
            source="own geometry; https://polyhaven.com/a/wood_textured_concrete", license="ours; texture CC0", credit="Poly Haven (wood_textured_concrete)", rig={},
            notes="The slab's soffit at z 0; the main beam's middle 0.8 m in front of the origin (y -0.8), to sit on the pillars.")
