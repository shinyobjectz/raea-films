# diner/pendant: a schoolhouse pendant lamp, modelled by hand: a chrome ceiling canopy, a 45 cm rod, a ribbed chrome
# fitter and an opal glass globe 30 cm across (material pendant_glow, the scene's). Its origin is the ceiling.
# Rig: "sway" swings it 9 degrees about the canopy; "on" is the scene's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, T, R, S, xf

col, root = comp.fresh("pendant")
M = _lib.maker(col, root)
chrome = comp.mat("pendant_chrome", (0.86, 0.86, 0.88), rough=0.14, metal=1.0)
opal = comp.mat("pendant_glow", (0.98, 0.95, 0.88), rough=0.35, emit=(1.0, 0.86, 0.62), strength=5.0)
M("pendant_canopy", lathe([(0, 0), (0.065, 0), (0.065, -0.006), (0.05, -0.03), (0.02, -0.045), (0, -0.045)], seg=40), chrome)
sw = comp.pivot(col, root, "pendant_sway", (0, 0, -0.04))
M("pendant_rod", comp.cyl(0.007, 0.45, at=(0, 0, -0.49), seg=16), chrome, parent=sw)
fit = [(0.012, -0.47), (0.03, -0.49)] + [p for i in range(4) for p in ((0.072 + (0.004 if i % 2 else 0), -0.5 - i * 0.012), (0.076, -0.506 - i * 0.012))] + [(0.074, -0.55), (0, -0.55)]
M("pendant_fitter", lathe(fit, seg=48), chrome, parent=sw)
g = [(0.068, -0.545), (0.072, -0.56), (0.11, -0.59), (0.14, -0.64), (0.15, -0.69), (0.14, -0.745), (0.11, -0.79), (0.06, -0.82), (0, -0.83)]
M("pendant_globe", lathe(g, seg=48), opal, parent=sw)
comp.channel("sway", [(sw, "rotation_euler", 1, 0, math.radians(9))])
comp.export(col, root, "diner", "pendant", made="blender/components/diner/pendant.py",
            source="own geometry (a generic schoolhouse pendant)", license="ours", credit="",
            rig={"sway": "the rod and globe swing 9 degrees about the ceiling canopy", "on": "in the scene: the material pendant_glow and the light under it"})
