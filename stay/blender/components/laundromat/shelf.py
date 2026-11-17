# laundromat/shelf: the wall shelf over the washers, 1.5 m long and 0.28 m deep, modelled by hand: a white laminate
# board with a dark front edge on three pressed-steel brackets screwed to the wall, and a price strip along its
# front. Its back is at y 0 and its origin is the board's top at the wall, so what stands on it goes at its origin's
# height. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rbox, label, T, R, S, xf

col, root = comp.fresh("shelf")
M = _lib.maker(col, root)
lam = comp.mat("shelf_laminate", (0.84, 0.84, 0.8), rough=0.3)
edge = comp.mat("shelf_edge", (0.1, 0.1, 0.11), rough=0.5)
steel = comp.mat("shelf_bracket", (0.8, 0.8, 0.78), rough=0.4)
chrome = comp.mat("shelf_screws", (0.7, 0.7, 0.72), rough=0.25, metal=0.9)
L, Dp, TH = 1.5, 0.28, 0.025
M("shelf_board", rbox((L, Dp, TH), at=(0, -Dp / 2, -TH / 2), r=0.002, seg=1), lam)
M("shelf_edge", rbox((L + 0.002, 0.005, TH + 0.002), at=(0, -Dp - 0.002, -TH / 2), r=0.002), edge)
br, sc = [], []
for x in (-0.6, 0.0, 0.6):
    br.append(comp.box((0.035, Dp - 0.03, 0.004), at=(x, -(Dp - 0.03) / 2, -TH - 0.002)))
    br.append(comp.box((0.035, 0.004, 0.22), at=(x, -0.002, -TH - 0.11)))
    g = comp.taper((x, -0.004, -TH - 0.004), (x, -Dp + 0.05, -TH - 0.004), 0.004, 0.004, 0.2, 0.012)
    br.append(g)
    sc += [turn([(0.0, 0.003), (0.005, 0.003), (0.007, 0.0)], seg=10, axis="F", at=(x, -0.004, -TH - z)) for z in (0.05, 0.18)]
M("shelf_brackets", comp.merge(*br), steel)
M("shelf_screws", comp.merge(*sc), chrome)
M("shelf_strip", rbox((0.5, 0.002, 0.03), at=(-0.35, -Dp - 0.0055, -TH / 2 - 0.004), r=0.0005, seg=1), comp.mat("shelf_strip", (0.9, 0.82, 0.2), rough=0.5))
M("shelf_strip_print", label("SOAP AT THE VENDOR  -  ASK FOR BLEACH", 0.014, (-0.35, -Dp - 0.0068, -TH / 2 - 0.004)), edge)
comp.export(col, root, _lib.PLACE, "shelf", made="blender/components/laundromat/shelf.py", source="own geometry (a generic bracketed wall shelf)", license="ours", credit="", rig={},
            notes="Back at y 0; the origin is the board's top, so what stands on it shares its origin's height (and stands 0.14 m out from the wall).")
