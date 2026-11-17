# diner/window: a 3 m bay of the diner's street wall, 3 m tall, modelled by hand: a knee wall of white tile under a
# steel sill, three panes of plate glass between chrome mullions 1.55 m tall, a stainless header with a rounded cove,
# a roller blind half down on the left pane and the night outside behind the glass (a dark blue backing, window_night,
# which the scene can swap for a street). Its inside face at y 0, standing on the floor.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rbox, T, R, S, xf

col, root = comp.fresh("window")
M = _lib.maker(col, root)
W, H, KH, GH = 3.0, 3.0, 0.85, 1.55
tile = comp.ph_texture("window_tile", "long_white_tiles", tile=1.27, res="1k")
chrome = comp.mat("window_chrome", (0.86, 0.86, 0.88), rough=0.16, metal=1.0)
steel = comp.mat("window_steel", (0.7, 0.7, 0.72), rough=0.3, metal=1.0)
glass = comp.mat("window_glass", (0.08, 0.1, 0.12), rough=0.02, alpha=0.16)
night = comp.mat("window_night", (0.004, 0.006, 0.016), rough=0.9)
blind = comp.mat("window_blind", (0.8, 0.74, 0.58), rough=0.7)
red = comp.mat("window_red", (0.33, 0.008, 0.01), rough=0.25)
k = M("window_knee_wall", comp.box((W, 0.14, KH), at=(0, 0.07, KH / 2)), tile, smooth=False)
comp.uv_box(k, 1.0)
M("window_sill", rbox((W, 0.2, 0.035), at=(0, 0.05, KH + 0.0175), r=0.006), steel, smooth=False)
M("window_base", comp.box((W, 0.012, 0.1), at=(0, -0.006, 0.05)), comp.mat("window_baseboard", (0.02, 0.02, 0.022), rough=0.5), smooth=False)
frames = [comp.box((W, 0.06, 0.05), at=(0, 0.07, KH + 0.06)), comp.box((W, 0.06, 0.05), at=(0, 0.07, KH + GH + 0.01))]
frames += [comp.box((0.05, 0.06, GH), at=(x, 0.07, KH + 0.035 + GH / 2)) for x in (-W / 2 + 0.025, -W / 6, W / 6, W / 2 - 0.025)]
M("window_mullions", comp.merge(*frames), chrome, smooth=False)
M("window_glass", comp.box((W - 0.06, 0.008, GH), at=(0, 0.07, KH + 0.035 + GH / 2)), glass, smooth=False)
M("window_night", comp.box((W, 0.01, GH + 0.1), at=(0, 0.6, KH + 0.035 + GH / 2)), night, smooth=False)
hz = KH + GH + 0.035
h = M("window_header", comp.box((W, 0.14, H - hz), at=(0, 0.07, hz + (H - hz) / 2)), steel, smooth=False)
M("window_header_band", comp.merge(comp.box((W, 0.008, 0.1), at=(0, -0.004, hz + 0.2)), comp.cyl(0.03, W, at=(-W / 2, 0.0, hz + 0.02), seg=16, axis="X")), red, smooth=False)
M("window_blind", comp.merge(comp.box((W / 3 - 0.08, 0.004, 0.62), at=(-W / 3, 0.03, KH + GH + 0.035 - 0.31)), comp.cyl(0.022, W / 3 - 0.06, at=(-W / 2 + 0.03, 0.03, KH + GH + 0.02), seg=16, axis="X"),
                             comp.cyl(0.008, W / 3 - 0.08, at=(-W / 2 + 0.04, 0.03, KH + GH + 0.035 - 0.62), seg=10, axis="X")), blind, smooth=False)
comp.export(col, root, "diner", "window", made="blender/components/diner/window.py",
            source="own geometry; knee wall tile: https://polyhaven.com/a/long_white_tiles", license="ours; texture CC0", credit="Poly Haven (long_white_tiles)",
            rig={"night": "in the scene: the material window_night (the backing behind the glass) is the street outside"})
