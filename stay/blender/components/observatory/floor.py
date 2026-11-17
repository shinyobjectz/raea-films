# observatory/floor: the observing floor, modelled by hand: a 9.7 m disc of varnished boards (Poly Haven
# wood_floor_deck), a brass meridian strip inlaid north to south through the pier's foot, and a trapdoor with its
# frame and ring pull. The origin is its middle; its top is z 0.
# Rig: "hatch" lifts the trapdoor 70 degrees on its hinges.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import torus, T, R, S, xf, RD

col, root = comp.fresh("floor")
M = _lib.maker(col, root)
boards = comp.ph_texture("floor_boards", "wood_floor_deck", tile=1.8, res="2k", tint=(0.8, 0.72, 0.66))
brass = comp.mat("floor_brass", (0.72, 0.55, 0.22), rough=0.3, metal=1.0)
dark = comp.mat("floor_hatch_gap", (0.02, 0.02, 0.02), rough=0.9)
f = M("floor_boards", comp.cyl(RD + 0.36, 0.06, at=(0, 0, -0.06), seg=96), boards, smooth=False)
comp.uv_box(f, 1.0)
M("floor_meridian", comp.box((0.03, 2 * RD - 0.1, 0.003), at=(0, 0, 0.0005)), brass, smooth=False)
HX, HY, HS = 2.6, -1.6, 0.8
M("floor_hatch_frame", comp.merge(comp.box((HS + 0.08, 0.04, 0.004), at=(HX, HY - HS / 2 - 0.02, 0.001)), comp.box((HS + 0.08, 0.04, 0.004), at=(HX, HY + HS / 2 + 0.02, 0.001)),
                                  comp.box((0.04, HS, 0.004), at=(HX - HS / 2 - 0.02, HY, 0.001)), comp.box((0.04, HS, 0.004), at=(HX + HS / 2 + 0.02, HY, 0.001))), brass, smooth=False)
M("floor_hatch_gap", comp.box((HS, HS, 0.002), at=(HX, HY, 0.0005)), dark, smooth=False)
hinge = comp.pivot(col, root, "floor_hatch", (HX, HY + HS / 2, 0.012))
lid = M("floor_hatch_lid", comp.box((HS - 0.01, HS - 0.01, 0.022), at=(HX, HY, 0.013)), boards, parent=hinge, smooth=False)
comp.uv_box(lid, 1.0)
M("floor_hatch_ring", xf(torus(0.04, 0.005, seg=20, sides=6), T(HX, HY - HS / 2 + 0.1, 0.027)), brass, parent=hinge)
_lib.channel("hatch", [(hinge, "rotation_euler", 0, 0, math.radians(-70))])
comp.export(col, root, "observatory", "floor", made="blender/components/observatory/floor.py", source="own geometry; Poly Haven texture wood_floor_deck", license="CC0", credit="Poly Haven",
            rig={"hatch": "the trapdoor lifts 70 degrees on its hinges"}, notes="origin: the room's middle; the boards' top is z 0")
