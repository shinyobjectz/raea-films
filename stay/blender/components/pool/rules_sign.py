# pool/rules-sign: the pool rules, modelled by hand: a white aluminium panel 60 x 86 cm on four stand-off screws, a navy
# header, six rules each with a red bullet, and a red footer band. The words are our own and generic. Its origin is its
# middle, its back on the wall (y 0). No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("rules_sign")
panel_m = comp.mat("pool_sign_panel", (0.93, 0.93, 0.91), rough=0.4)
navy = comp.mat("pool_sign_navy", (0.03, 0.12, 0.36), rough=0.45)
red = comp.mat("pool_sign_red", (0.8, 0.07, 0.05), rough=0.45)
whitei = comp.mat("pool_sign_white_ink", (0.96, 0.96, 0.94), rough=0.5)
st = steel("pool_steel", 0.25)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
W, H, Y = 0.6, 0.86, -0.016
p = M("rules_sign_panel", comp.box((W, 0.004, H), at=(0, Y, 0)), panel_m)
comp.bevel(p, 0.0015, 1)
M("rules_sign_header", comp.box((W - 0.03, 0.001, 0.13), at=(0, Y - 0.0025, H / 2 - 0.085)), navy)
M("rules_sign_footer", comp.box((W - 0.03, 0.001, 0.075), at=(0, Y - 0.0025, -H / 2 + 0.055)), red)
M("rules_sign_title", comp.merge(xf(comp.text("POOL RULES", 0.066, depth=0.001), T(0, Y - 0.0035, H / 2 - 0.085)), xf(comp.text("NO LIFEGUARD ON DUTY", 0.03, depth=0.001), T(0, Y - 0.0035, -H / 2 + 0.055))), whitei)
RULES = ["SHOWER BEFORE YOU SWIM", "WALK, DO NOT RUN", "NO DIVING AT THE SHALLOW END", "NO GLASS ON THE POOL DECK", "CHILDREN UNDER 8 WITH AN ADULT", "LONG HAIR TIED BACK"]
lines, dots = [], []
for i, r in enumerate(RULES):
    z = H / 2 - 0.23 - i * 0.085
    lines.append(xf(comp.text(r, 0.027, depth=0.001, align="LEFT"), T(-W / 2 + 0.085, Y - 0.003, z)))
    dots.append(comp.cyl(0.012, 0.001, at=(-W / 2 + 0.05, Y - 0.002, z), seg=16, axis="Y"))
    lines.append(comp.box((W - 0.09, 0.0006, 0.0015), at=(0, Y - 0.0025, z - 0.04)))
M("rules_sign_rules", comp.merge(*lines), navy)
M("rules_sign_bullets", comp.merge(*[xf(d, T(0, -0.002, 0)) for d in dots]), red)
M("rules_sign_screws", comp.merge(*[comp.merge(comp.cyl(0.006, 0.02, at=(sx * (W / 2 - 0.025), -0.02, sz * (H / 2 - 0.025)), seg=10, axis="Y"), comp.cyl(0.011, 0.004, at=(sx * (W / 2 - 0.025), -0.023, sz * (H / 2 - 0.025)), seg=12, axis="Y")) for sx in (-1, 1) for sz in (-1, 1)]), st)
done(col, root, "rules_sign", source="own geometry and wording (a generic pool rules sign); letters in Blender's built-in font (Bfont, GPL font exception: output is free)")
