# cathedral/aisle-runner: the carpet down the centre aisle, 1.1 x 14 m and 8 mm thick, modelled by hand: red velvet
# pile (Poly Haven's velour_velvet, CC0) between two gold borders with a darker line inside each, bound ends with a
# fringe. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp
from comp import T, R, S, xf
col, root = comp.fresh("aisle_runner")
W, D, TH = 1.1, 14.0, 0.008
c = comp.mesh(col, root, "aisle_runner_pile", comp.box((W, D, TH), at=(0, 0, TH / 2)), L.velvet(tint=(0.5, 0.04, 0.05)))
L.finish(c, 1.0)
gold = comp.mat("aisle_runner_gold", (0.7, 0.5, 0.15), rough=0.7)
dark = comp.mat("aisle_runner_line", (0.12, 0.01, 0.02), rough=0.8)
comp.mesh(col, root, "aisle_runner_borders", comp.merge(*[comp.box((0.09, D, 0.002), at=(s * (W / 2 - 0.045), 0, TH + 0.0005)) for s in (-1, 1)] + [comp.box((W, 0.05, 0.002), at=(0, s * (D / 2 - 0.025), TH + 0.0006)) for s in (-1, 1)]), gold)
comp.mesh(col, root, "aisle_runner_lines", comp.merge(*[comp.box((0.02, D - 0.3, 0.002), at=(s * (W / 2 - 0.16), 0, TH + 0.0005)) for s in (-1, 1)]), dark)
comp.mesh(col, root, "aisle_runner_fringe", comp.merge(*[comp.box((0.008, 0.06, 0.003), at=(-W / 2 + 0.01 + i * 0.0148, s * (D / 2 + 0.03), 0.002)) for s in (-1, 1) for i in range(74)]), gold)
comp.export(col, root, "cathedral", "aisle_runner", made="blender/components/cathedral/aisle_runner.py", source="own geometry; pile: https://polyhaven.com/a/velour_velvet", license="ours; texture CC0", credit="Poly Haven (velour_velvet)")
