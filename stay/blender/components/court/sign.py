# court/sign: the court's rules board, modelled by hand: a 60 x 80 cm aluminium sheet with rounded corners, a green
# band and raised white lettering (our own words), four fixing holes, two of them wired to the fence. The origin is
# the middle of its top edge, where the wires hold it; its back at y 0.
# Rig: "swing" swings it 16 degrees out from the fence about its top edge (the wind).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import rbox, torus, T, R, S, xf

col, root = comp.fresh("sign")
M = _lib.maker(col, root)
plate = comp.mat("sign_plate", (0.86, 0.86, 0.82), rough=0.35, metal=0.3)
green = comp.mat("sign_band", (0.03, 0.22, 0.12), rough=0.4)
ink = comp.mat("sign_ink", (0.04, 0.05, 0.05), rough=0.5)
white = comp.mat("sign_white", (0.9, 0.9, 0.86), rough=0.4)
wire = comp.mat("sign_wire", (0.6, 0.62, 0.64), rough=0.3, metal=1.0)
W, H = 0.6, 0.8
hinge = comp.pivot(col, root, "sign_hinge", (0, 0, 0))
M("sign_plate", rbox((W, 0.003, H), at=(0, -0.012, -H / 2 - 0.01), r=0.0012, seg=1), plate, parent=hinge, smooth=False)
M("sign_band", comp.box((W - 0.03, 0.001, 0.17), at=(0, -0.014, -0.125)), green, parent=hinge, smooth=False)
M("sign_title", xf(comp.text("COURT RULES", 0.062, depth=0.002), T(0, -0.0155, -0.125)), white, parent=hinge, smooth=False)
lines = ["NO GLASS ON COURT", "NO BIKES OR BOARDS", "WINNERS STAY ON", "LIGHT OFF AT 10 PM", "PLAY AT OWN RISK"]
M("sign_text", comp.merge(*[xf(comp.text(s, 0.04, depth=0.0015), T(0, -0.0145, -0.3 - i * 0.095)) for i, s in enumerate(lines)]), ink, parent=hinge, smooth=False)
M("sign_rule", comp.merge(*[comp.box((W - 0.08, 0.001, 0.003), at=(0, -0.014, -0.255 - i * 0.095)) for i in range(6)]), ink, parent=hinge, smooth=False)
ties = [torus(0.014, 0.0015, seg=12, sides=4, at=(sx * (W / 2 - 0.035), -0.006, -0.012), axis="X") for sx in (-1, 1)]
M("sign_wires", comp.merge(*ties), wire, parent=hinge)
M("sign_holes", comp.merge(*[comp.cyl(0.006, 0.0012, at=(sx * (W / 2 - 0.035), -0.0145, z), seg=10, axis="Y") for sx in (-1, 1) for z in (-0.035, -H + 0.015)]), ink, parent=hinge, smooth=False)
_lib.channel("swing", [(hinge, "rotation_euler", 0, 0, math.radians(-16))])
comp.export(col, root, "court", "sign", made="blender/components/court/sign.py", source="own geometry and our own words", license="ours", credit="",
            rig={"swing": "the board swings 16 degrees out from the fence about its top edge"}, notes="origin: the middle of its top edge; its back at y 0 (set it 2 cm off the fence)")
