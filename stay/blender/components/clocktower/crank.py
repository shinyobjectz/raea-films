# clocktower/crank: the movement's winding crank, lifted off its square and laid down, modelled by hand: a cast arm
# 0.3 m long with a square socket boss at one end and a turned wooden grip on a pin at the other. Lies flat, the
# socket at the origin, the arm along +x.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe

col, root = comp.fresh("crank")
iron = comp.mat("crank_iron", (0.03, 0.03, 0.035), rough=0.5, metal=0.6)
wood = comp.mat("crank_wood", (0.32, 0.18, 0.08), rough=0.55)
dark = comp.mat("crank_socket", (0.005, 0.005, 0.005), rough=0.8)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
a = M("crank_arm", comp.merge(comp.cyl(0.03, 0.045, seg=24), comp.taper((0, 0, 0.022), (0.3, 0, 0.022), 0.04, 0.028, 0.016, 0.016), comp.cyl(0.018, 0.022, at=(0.3, 0, 0), seg=16), comp.cyl(0.008, 0.14, at=(0.3, 0, 0.02), seg=12)), iron)
comp.bevel(a, 0.003, 2)
M("crank_socket", comp.box((0.021, 0.021, 0.002), at=(0, 0, 0.0455)), dark)
M("crank_grip", lathe([(0.009, 0), (0.017, 0.004), (0.021, 0.03), (0.02, 0.07), (0.016, 0.1), (0.009, 0.106)], seg=20, at=(0.3, 0, 0.045)), wood, smooth=True)
comp.export(col, root, "clocktower", "crank", made="blender/components/clocktower/crank.py", source="own geometry (a generic clock winding crank)", license="ours", credit="")
