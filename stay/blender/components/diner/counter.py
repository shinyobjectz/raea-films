# diner/counter: a 3.6 m run of lunch counter, modelled by hand: a cream laminate top with a ribbed aluminium edge,
# overhanging the customer's side (-y) by 20 cm; a front of cream enamel panels with a red band between chrome strips
# and a chrome seam every 90 cm; a recessed black kick; a chrome foot rail on five brackets. 1.02 m to the top.
# The origin is the middle of its footprint; things on it stand at z 1.02.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, rod, rbox, T, R, S, xf

col, root = comp.fresh("counter")
M = _lib.maker(col, root)
L, H = 3.6, 1.02
chrome = comp.mat("counter_chrome", (0.86, 0.86, 0.88), rough=0.14, metal=1.0)
alu = comp.mat("counter_edge", (0.78, 0.78, 0.8), rough=0.3, metal=1.0)
enamel = comp.mat("counter_enamel", (0.86, 0.82, 0.7), rough=0.22)
red = comp.mat("counter_red", (0.33, 0.008, 0.01), rough=0.2)
black = comp.mat("counter_kick", (0.02, 0.02, 0.022), rough=0.5)
lam = comp.mat("counter_top", (0.72, 0.66, 0.5), rough=0.22)
inside = comp.mat("counter_inside", (0.55, 0.56, 0.58), rough=0.35, metal=1.0)

body = M("counter_body", comp.box((L, 0.5, H - 0.14), at=(0, 0.05, 0.1 + (H - 0.14) / 2)), enamel, smooth=False)
M("counter_back", comp.box((L - 0.02, 0.01, H - 0.2), at=(0, 0.302, 0.1 + (H - 0.14) / 2)), inside, smooth=False)
M("counter_kick", comp.box((L - 0.04, 0.4, 0.1), at=(0, 0.08, 0.05)), black, smooth=False)
M("counter_band", comp.box((L + 0.002, 0.006, 0.16), at=(0, -0.201, 0.62)), red, smooth=False)
strips = [comp.box((L + 0.004, 0.012, 0.018), at=(0, -0.204, z)) for z in (0.53, 0.71, 0.12, 0.945)]
strips += [comp.box((0.02, 0.012, H - 0.16), at=(x, -0.203, 0.1 + (H - 0.16) / 2)) for x in (-L / 2 + 0.01, -0.9, 0, 0.9, L / 2 - 0.01)]
M("counter_trim", comp.merge(*strips), chrome, smooth=False)
top = M("counter_top", rbox((L + 0.04, 0.74, 0.036), at=(0, -0.03, H - 0.018), r=0.004, seg=2), lam, smooth=False)
# the edge: a ribbed aluminium band round the front and both ends
ribs = []
for z in (H - 0.031, H - 0.018, H - 0.005):
    ribs.append(comp.cyl(0.0055, L + 0.05, at=(-(L + 0.05) / 2, -0.402, z), seg=8, axis="X"))
    for sx in (-1, 1):
        ribs.append(comp.cyl(0.0055, 0.745, at=(sx * (L / 2 + 0.022), -0.4025, z), seg=8, axis="Y"))
M("counter_edge", comp.merge(*ribs), alu)
# the foot rail
RZ, RY = 0.2, -0.33
rail = [comp.cyl(0.019, L - 0.1, at=(-(L - 0.1) / 2, RY, RZ), seg=20, axis="X")]
for x in (-1.7, -0.85, 0, 0.85, 1.7):
    rail.append(rod((x, -0.2, RZ + 0.05), (x, RY, RZ), 0.011))
    rail.append(lathe([(0, 0), (0.03, 0), (0.03, 0.006), (0, 0.006)], seg=16, at=(x, -0.2, RZ + 0.05), axis="Y"))
for sx in (-1, 1):
    rail.append(_lib.sphere(0.019, at=(sx * (L - 0.1) / 2, RY, RZ), seg=16, rings=8))
M("counter_foot_rail", comp.merge(*rail), chrome)
comp.export(col, root, "diner", "counter", made="blender/components/diner/counter.py",
            source="own geometry (a generic enamel-fronted lunch counter)", license="ours", credit="",
            notes="the top is at 1.02 m; the customer's side is -y (raea +z)")
