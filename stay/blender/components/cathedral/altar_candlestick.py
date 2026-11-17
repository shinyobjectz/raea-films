# cathedral/altar-candlestick: a tall brass altar candlestick (Poly Haven's brass_candleholders, the 0.83 m one, CC0)
# with a wax candle, its wick and its flame, 1.3 m to the flame's tip. The flame is its own material
# (candlestick_flame). Rig: "flicker" leans the flame 16 degrees and draws it out by a third, about the wick's tip.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root, parts, credit = comp.ph_component("cathedral", "altar_candlestick", "brass_candleholders", res="1k", keep=lambda n: n.startswith("brass_candleholder_03"))
lo, hi = comp.box_of(list(parts.values()))
TOP = hi.z - 0.06
M = lambda n, bm, m, parent=None, smooth=True: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
CH = 0.42
wax = L.lathe([(0.027, TOP), (0.027, TOP + CH - 0.012), (0.024, TOP + CH), (0.012, TOP + CH - 0.006), (0.0, TOP + CH - 0.008)], seg=20)
drips = [xf(L.ball(0.008, squash=(1, 1, 2.6)), T(0.027 * math.cos(a), 0.027 * math.sin(a), TOP + CH - z)) for a, z in ((0.4, 0.05), (2.3, 0.09), (4.4, 0.035), (5.2, 0.12))]
M("altar_candlestick_candle", comp.merge(wax, *drips), L.wax_mat())
M("altar_candlestick_wick", comp.cyl(0.0015, 0.016, at=(0, 0, TOP + CH - 0.008), seg=6), comp.mat("cathedral_wick", (0.02, 0.02, 0.02), rough=0.9))
fp = comp.pivot(col, root, "altar_candlestick_flame", (0, 0, TOP + CH + 0.004))
M("altar_candlestick_flame_mesh", L.flame(0.055, at=(0, 0, TOP + CH + 0.004)), L.flame_mat("candlestick_flame"), parent=fp)
L.channel("flicker", [(fp, "rotation_euler", 0, 0, math.radians(16)), (fp, "scale", 2, 1.0, 1.33)])
comp.export(col, root, "cathedral", "altar_candlestick", made="blender/components/cathedral/altar_candlestick.py",
            source="https://polyhaven.com/a/brass_candleholders (the tall one), with our own candle and flame", license="CC0; candle ours", credit=credit,
            rig={"flicker": "the flame (altar_candlestick_flame) leans 16 degrees and stretches by a third about the wick's tip",
                 "glow": "in the scene: the material candlestick_flame's glow and a small warm light at the flame"})
