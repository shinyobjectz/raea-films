# laundromat/duct: a dryer's exhaust, one module a dryer (0.81 m), modelled by hand in galvanised steel: a riser from
# the flue collar on the dryer's top (x 0.12, y 0.2, 2.02 m up) through a crimped elbow into a 0.3 m trunk that runs
# the row under the ceiling at 2.68 m, its seams banded, hung from the ceiling on two straps. Stands where its dryer
# stands (the same origin). No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, disc, rbox, T, R, S, xf

col, root = comp.fresh("duct")
M = _lib.maker(col, root)
galv = comp.mat("duct_galvanised", (0.66, 0.68, 0.7), rough=0.38, metal=0.6)
band = comp.mat("duct_band", (0.5, 0.52, 0.54), rough=0.35, metal=0.7)
FX, FY, TOP, TZ, TR, RR = 0.12, 0.2, 2.02, 2.68, 0.15, 0.095
trunk = M("duct_trunk", comp.cyl(TR, 0.81, at=(-0.405, FY, TZ), seg=40, axis="X"), galv, smooth=True)
riser = M("duct_riser", comp.cyl(RR, TZ - TOP - 0.02, at=(FX, FY, TOP), seg=32), galv, smooth=True)
bands = [turn([(TR + 0.001, -0.012), (TR + 0.006, -0.008), (TR + 0.006, 0.008), (TR + 0.001, 0.012)], seg=40, axis="X", at=(x, FY, TZ)) for x in (-0.395, 0.0, 0.395)]
bands += [turn([(RR + 0.001, -0.01), (RR + 0.005, -0.006), (RR + 0.005, 0.006), (RR + 0.001, 0.01)], seg=32, at=(FX, FY, z)) for z in (TOP + 0.03, TOP + 0.3, TZ - TR - 0.02)]
M("duct_bands", comp.merge(*bands), band, smooth=True)
# the saddle where the riser meets the trunk, and a clean-out cap on the trunk's face
M("duct_saddle", turn([(RR + 0.03, 0.0), (RR + 0.012, 0.03), (RR + 0.004, 0.06)], seg=32, at=(FX, FY, TZ - TR - 0.05)), band, smooth=True)
M("duct_cleanout", comp.merge(turn([(0.0, 0.012), (0.05, 0.012), (0.056, 0.0)], seg=24, axis="F", at=(-0.2, FY - TR + 0.004, TZ)), comp.box((0.03, 0.02, 0.008), at=(-0.2, FY - TR - 0.012, TZ))), band, smooth=True)
straps = []
for x in (-0.3, 0.3):
    straps.append(turn([(TR + 0.002, -0.015), (TR + 0.004, -0.015), (TR + 0.004, 0.015), (TR + 0.002, 0.015)], seg=40, axis="X", at=(x, FY, TZ)))
    straps.append(comp.box((0.03, 0.002, 3.0 - TZ - TR), at=(x, FY, (3.0 + TZ + TR) / 2)))
M("duct_straps", comp.merge(*straps), band)
comp.export(col, root, _lib.PLACE, "duct", made="blender/components/laundromat/duct.py",
            source="own geometry (a generic galvanised exhaust duct)", license="ours", credit="", rig={},
            notes="One module a dryer, at the dryer's own position; the trunk joins end to end along the row. The straps reach a 3 m ceiling.")
