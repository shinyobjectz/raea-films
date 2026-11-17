# garage/bollard: a steel impact bollard, 1 m high and 114 mm across, modelled by hand: a domed yellow tube with two
# black bands, on a base plate with four anchor bolts. It guards the ticket machine and the booth. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("bollard")
M = L.maker(col, root)
yellow = comp.mat("bollard_yellow", (0.92, 0.7, 0.04), rough=0.45)
black = comp.mat("bollard_black", (0.02, 0.02, 0.02), rough=0.5)
steel = comp.mat("bollard_steel", (0.5, 0.5, 0.52), rough=0.4, metal=1.0)
r = 0.057
L.sharp(M("bollard_tube", L.lathe([(r, 0.01), (r, 0.94), (r * 0.92, 0.975), (r * 0.7, 0.993), (r * 0.35, 1.0), (0, 1.002)], 28), yellow, smooth=True), 40)
M("bollard_bands", comp.merge(L.lathe([(r + 0.001, 0.62), (r + 0.001, 0.72)], 28), L.lathe([(r + 0.001, 0.8), (r + 0.001, 0.9)], 28)), black, smooth=True)
bp = M("bollard_base", comp.merge(comp.box((0.2, 0.2, 0.01), at=(0, 0, 0.005)), *[comp.cyl(0.011, 0.012, at=(sx * 0.075, sy * 0.075, 0.01), seg=6) for sx in (-1, 1) for sy in (-1, 1)]), steel)
L.look(col, "bollard", lens=50)
comp.export(col, root, "garage", "bollard", made="blender/components/garage/bollard.py", source="own geometry", license="ours", credit="", rig={})
