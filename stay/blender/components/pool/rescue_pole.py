# pool/rescue-pole: a reaching pole with a shepherd's crook on the wall, modelled by hand at real size: a 3.6 m
# aluminium pole with a red grip and a blue body hook 45 cm across, lying in two rubber-lined J brackets screwed to the
# wall. Its origin is the wall behind the pole's middle (y 0). No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("rescue_pole")
alu = comp.mat("pool_pole", (0.8, 0.81, 0.82), rough=0.3, metal=1.0)
blue = comp.mat("pool_pole_hook", (0.05, 0.25, 0.75), rough=0.4)
red = comp.mat("pool_pole_grip", (0.8, 0.08, 0.05), rough=0.7)
st = steel("pool_steel", 0.25)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
PY, L = -0.075, 3.6
M("rescue_pole_pole", comp.cyl(0.016, L, at=(-L / 2, PY, 0), seg=16, axis="X"), alu, smooth=True)
M("rescue_pole_grip", comp.merge(comp.cyl(0.02, 0.32, at=(-L / 2 - 0.005, PY, 0), seg=16, axis="X"), comp.cyl(0.02, 0.25, at=(-0.3, PY, 0), seg=16, axis="X")), red, smooth=True)
R0 = 0.225
hook = [(L / 2 - 0.02, PY, 0.0), (L / 2 + 0.06, PY, 0.0)] + [(L / 2 + 0.06 + R0 * math.sin(a), PY, -R0 + R0 * math.cos(a)) for a in [math.radians(d) for d in range(15, 271, 15)]] + [(L / 2 + 0.06 - R0 - 0.06, PY, -R0 + 0.07)]
M("rescue_pole_hook", pipe(hook, 0.014, sides=4), blue, smooth=True)
br = []
for x in (-1.15, 1.15):
    br.append(comp.box((0.05, 0.006, 0.16), at=(x, -0.003, 0.02)))
    br.append(pipe(bend([(x, -0.006, -0.03), (x, PY - 0.0, -0.045), (x, PY - 0.035, -0.02), (x, PY - 0.04, 0.03)], 0.02, 4), 0.007))
    br += [comp.cyl(0.006, 0.004, at=(x, -0.01, z), seg=8, axis="Y") for z in (0.075, -0.035)]
M("rescue_pole_brackets", comp.merge(*br), st, smooth=False)
done(col, root, "rescue_pole", source="own geometry (a generic reaching pole and body hook)", notes="origin: the wall behind the pole's middle, about 1.9 m up")
