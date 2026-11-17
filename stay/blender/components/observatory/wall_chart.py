# observatory/wall-chart: a framed chart of the northern sky on the wall, modelled by hand: our own painted polar star
# chart (hour lines, declination circles, the ecliptic, four hundred stars and their figures) 1 m square behind
# glass, in an oak frame with a brass title plate, hung from two brass mirror plates. Its back at y 0, the origin
# its middle. Rig: "tilt" knocks it 6 degrees crooked about its top fixing; "level" is rest.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from _lib import rbox, T, R, S, xf

col, root = comp.fresh("wall_chart")
M = _lib.maker(col, root)
chart = _lib.image_mat("wall_chart_sheet", _lib.paint("wall_chart", 1024, 1024, _lib.star_chart(polar=True, seed=21)), rough=0.6)
oak = comp.ph_texture("wall_chart_frame", "oak_veneer_01", tile=1.0, res="1k", tint=(0.55, 0.42, 0.32))
brass = comp.mat("wall_chart_brass", (0.78, 0.58, 0.22), rough=0.25, metal=1.0)
ink = comp.mat("wall_chart_ink", (0.06, 0.05, 0.05), rough=0.6)
W = 1.0
piv = comp.pivot(col, root, "wall_chart_hang", (0, -0.02, W / 2 + 0.05))
s = M("wall_chart_sheet", comp.box((W, 0.004, W), at=(0, -0.022, 0)), chart, parent=piv, smooth=False)
_lib.uv_planar(s, (-W / 2, -W / 2), (W / 2, W / 2), axes=(0, 2))
fr = [comp.box((W + 0.14, 0.045, 0.07), at=(0, -0.0225, sz * (W / 2 + 0.035))) for sz in (-1, 1)] + [comp.box((0.07, 0.045, W), at=(sx * (W / 2 + 0.035), -0.0225, 0)) for sx in (-1, 1)]
fr += [comp.box((W + 0.05, 0.012, 0.02), at=(0, -0.05, sz * (W / 2 + 0.005))) for sz in (-1, 1)] + [comp.box((0.02, 0.012, W + 0.05), at=(sx * (W / 2 + 0.005), -0.05, 0)) for sx in (-1, 1)]
f = M("wall_chart_frame", comp.merge(*fr), oak, parent=piv, smooth=False)
comp.bevel(f, 0.004, 2)
comp.uv_box(f, 1.0)
M("wall_chart_plate", comp.merge(rbox((0.22, 0.003, 0.035), at=(0, -0.046, -W / 2 - 0.036), r=0.001, seg=1), *[rbox((0.03, 0.003, 0.05), at=(sx * 0.3, -0.002, W / 2 + 0.08), r=0.001, seg=1) for sx in (-1, 1)]), brass, parent=piv, smooth=False)
M("wall_chart_title", xf(comp.text("THE NORTHERN SKY", 0.014, depth=0.001), T(0, -0.048, -W / 2 - 0.036)), ink, parent=piv, smooth=False)
_lib.channel("tilt", [(piv, "rotation_euler", 1, 0, math.radians(6))])
comp.export(col, root, "observatory", "wall_chart", made="blender/components/observatory/wall_chart.py", source="own geometry and our own painted chart; Poly Haven texture oak_veneer_01", license="ours (texture CC0)", credit="Poly Haven (texture)",
            rig={"tilt": "the frame hangs 6 degrees crooked about its top fixing"}, notes="origin: its middle; its back at y 0")
