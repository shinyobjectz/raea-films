# vinyl/ceiling: the shop's ceiling, 6 x 5 m of white plaster (Poly Haven's white_plaster_02, CC0) on five dark
# timber joists and a moulded cornice along the back, with two ceiling roses where the pendants hang. The shell's
# ceiling: its underside at z 0 (ceiling fittings hang from it), the joists 0.16 m below. No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("ceiling")
plaster = comp.ph_texture("ceiling_plaster", "white_plaster_02", tile=1.0, res="1k")
timber = comp.ph_texture("ceiling_timber", "dark_wood", tile=1.0, res="1k")
white = comp.mat("ceiling_rose", (0.9, 0.9, 0.88), rough=0.6)
c = M("ceiling_plaster", comp.box((6.0, 5.0, 0.1), at=(0, 0, 0.05)), plaster)
comp.uv_box(c, 1.0)
j = M("ceiling_joists", comp.merge(*[comp.box((0.12, 5.0, 0.16), at=(-2.4 + i * 1.2, 0, -0.08)) for i in range(5)]), timber)
comp.uv_box(j, 1.0)
comp.bevel(j, 0.006, 2)
co = M("ceiling_cornice", comp.merge(comp.box((6.0, 0.06, 0.1), at=(0, 2.47, -0.05)), comp.box((6.0, 0.1, 0.04), at=(0, 2.45, -0.02))), white)
comp.bevel(co, 0.012, 3)
shade(M("ceiling_roses", comp.merge(*[turn([(0, -0.03), (0.04, -0.03), (0.06, -0.018), (0.1, -0.012), (0.12, 0.0), (0, 0.0)], seg=40, at=(x, y)) for x, y in ((-1.8, -0.3), (1.8, -1.2))]), white))
done(col, root, "ceiling", "own geometry; https://polyhaven.com/a/white_plaster_02 and https://polyhaven.com/a/dark_wood (CC0)", license="CC0", credit="Poly Haven (textures)")
