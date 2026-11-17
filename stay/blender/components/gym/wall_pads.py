# gym/wall-pads: the padding on the baseline wall under a goal, modelled by hand: six vinyl-covered foam panels, each
# 0.6 x 1.8 m and 5 cm thick with rounded edges, on a timber nailing strip, the school's green with one cream panel
# either side of the middle, 10 cm off the floor. Its back at y 0, standing on the floor. 3.6 m wide.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rbox

col, root = comp.fresh("wall_pads")
M = _lib.maker(col, root)
green = _lib.ph_plain("pads_green", "leather_white", (0.03, 0.2, 0.11))
cream = _lib.ph_plain("pads_cream", "leather_white", (0.75, 0.7, 0.5))
wood = comp.mat("pads_strip", (0.4, 0.28, 0.14), rough=0.6)
g, c = [], []
for i in range(6):
    (c if i in (1, 4) else g).append(rbox((0.59, 0.05, 1.8), at=(-1.5 + i * 0.6, -0.03, 1.0), r=0.018, seg=3))
for bms, name, m in ((g, "wall_pads_green", green), (c, "wall_pads_cream", cream)):
    o = M(name, comp.merge(*bms), m, smooth=False)
    comp.uv_box(o, 0.3)
M("wall_pads_strip", comp.box((3.6, 0.02, 0.07), at=(0, -0.01, 1.935)), wood, smooth=False)
comp.export(col, root, "gym", "wall_pads", made="blender/components/gym/wall_pads.py",
            source="own geometry; vinyl grain: https://polyhaven.com/a/leather_white", license="ours; texture CC0", credit="Poly Haven (leather_white)")
