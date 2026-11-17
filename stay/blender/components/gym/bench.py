# gym/bench: a Swedish gym bench, 3 m, modelled by hand: a varnished beech top with rounded edges, three leg frames with
# rubber feet, the balance rail underneath along its length, and a steel hook at one end for hanging it on wall bars.
# 0.32 m tall. Rig: "tip" turns it over onto its top about its long axis (rail up, for balancing), half a turn.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rbox, T, R, S, xf

col, root = comp.fresh("bench")
M = _lib.maker(col, root)
wood = comp.ph_texture("bench_wood", "plank_flooring_02", tile=1.98, res="1k")
rubber = comp.mat("bench_feet", (0.02, 0.02, 0.02), rough=0.8)
steel = comp.mat("bench_hook", (0.5, 0.5, 0.52), rough=0.4, metal=1.0)
L = 3.0
tip = comp.pivot(col, root, "bench_tip", (0, 0, 0.16))
parts = [rbox((L, 0.24, 0.035), at=(0, 0, 0.3025), r=0.01, seg=3), rbox((L - 0.3, 0.1, 0.045), at=(0, 0, 0.09), r=0.008, seg=2)]
for x in (-L / 2 + 0.2, 0, L / 2 - 0.2):
    parts.append(rbox((0.045, 0.3, 0.045), at=(x, 0, 0.035), r=0.006, seg=2))
    for sy in (-1, 1):
        leg = comp.taper((x - 0.0, sy * 0.13, 0.285), (x - 0.0, sy * 0.08, 0.285), 0.045, 0.045, 0.27, 0.23)
        parts.append(leg)
o = M("bench_wood", comp.merge(*parts), wood, parent=tip, smooth=False)
comp.uv_box(o, 1.0)
M("bench_feet", comp.merge(*[rbox((0.05, 0.05, 0.012), at=(x, sy * 0.125, 0.006), r=0.003, seg=1) for x in (-L / 2 + 0.2, 0, L / 2 - 0.2) for sy in (-1, 1)]), rubber, parent=tip, smooth=False)
M("bench_hook", comp.merge(comp.box((0.006, 0.08, 0.05), at=(L / 2 + 0.003, 0, 0.29)), comp.box((0.04, 0.08, 0.006), at=(L / 2 + 0.02, 0, 0.268)), comp.box((0.006, 0.08, 0.03), at=(L / 2 + 0.04, 0, 0.28))), steel, parent=tip, smooth=False)
comp.channel("tip", [(tip, "rotation_euler", 0, 0, math.pi)])
comp.export(col, root, "gym", "bench", made="blender/components/gym/bench.py",
            source="own geometry (a generic Swedish gym bench); wood: https://polyhaven.com/a/plank_flooring_02", license="ours; texture CC0", credit="Poly Haven (plank_flooring_02)",
            rig={"tip": "the bench turns over about its long axis, half a turn, onto its top with the balance rail up"})
