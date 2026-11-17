# nave/pew-candle: a wrought-iron candle holder hooked over a pew's end, as churches dress the aisle: a flat bar down the
# end's face with a curl at its foot, a hook over its top, a post rising from it with a C-scroll under an iron pan, and an
# ivory pillar candle on the pan, burned a little, with a drip down its side. The flame is the scene's (v3/nave.tsx), at
# the wick in the notes.
# Its origin is on the floor at the pew end's face, the holder in front of it (toward -y); the scene turns it to face the
# aisle. Every candle's wick is at the same height as the stands' (nave/candle-stand), so the two rows of flames run level.
import os, sys, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _plan as P
from _plan import comp, bpy, bmesh, T, R, S, xf, CL, Vector

col, root = comp.fresh("nave_pew_candle")
IRON = comp.mat("nave_holder_iron", (0.03, 0.029, 0.028), rough=0.6, metal=0.7)
WAX = P.wax()
WICK = comp.mat("nave_wick", (0.02, 0.018, 0.016), rough=0.9)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)

PAN, CANDLE_H = 1.28, 0.17
Y = -0.012                                                   # the bar's middle, off the pew's face
iron = []
# the flat bar down the face, the hook over the top
iron.append(comp.box((0.03, 0.008, 0.42), at=(0, Y, 0.89)))
iron.append(xf(xf(comp.box((0.03, 0.06, 0.008)), T(0, 0.018, 0)), T(0, Y, 1.104)))
iron.append(comp.box((0.03, 0.008, 0.05), at=(0, Y + 0.048, 1.08)))
# a curl at its foot
iron.append(comp.tube([(0, Y, 0.69)] + [(0.035 * math.sin(a) * (1 - a / 9), Y - 0.035 + 0.035 * math.cos(a) * (1 - a / 9), 0.68 - 0.004 * a) for a in [i * 0.4 for i in range(13)]], 0.006, res=4, sides=2))
# the post, stood a little off the face, and its scroll under the pan
iron.append(comp.cyl(0.009, PAN - 1.06, at=(0, Y - 0.05, 1.06), seg=10))
iron.append(comp.box((0.03, 0.05, 0.03), at=(0, Y - 0.026, 1.075)))
cs = [(0, Y - 0.05, 1.14)] + [(0.0, Y - 0.05 - 0.045 * math.sin(a) * (1 - a / 10), 1.2 + 0.045 * math.cos(a + math.pi) * (1 - a / 10)) for a in [i * 0.45 for i in range(14)]]
iron.append(comp.tube(cs, 0.0055, res=4, sides=2))
iron.append(xf(CL.lathe([(0.0, 0.0), (0.016, 0.0), (0.02, 0.014), (0.012, 0.03), (0.0, 0.03)], seg=12), T(0, Y - 0.05, 1.13)))
# the pan, its rim turned up, and the cup the candle stands in
iron.append(xf(CL.lathe([(0.0, 0.0), (0.012, 0.0), (0.045, 0.008), (0.056, 0.018), (0.058, 0.026), (0.052, 0.022), (0.0, 0.016)], seg=24), T(0, Y - 0.05, PAN - 0.02)))
iron.append(comp.cyl(0.037, 0.03, at=(0, Y - 0.05, PAN - 0.004), seg=20))
M("pew_candle_iron", comp.merge(*iron), IRON, smooth=True)

# the candle, its top burned into a shallow bowl, a drip down its side
cx, cy, z0 = 0.0, Y - 0.05, PAN
wax = [xf(CL.lathe([(0.0, 0.0), (0.032, 0.0), (0.0325, CANDLE_H), (0.03, CANDLE_H + 0.007), (0.022, CANDLE_H + 0.001), (0.0, CANDLE_H - 0.005)], seg=24), T(cx, cy, z0))]
for a, l in ((0.6, 0.07), (2.9, 0.045)):
    wax.append(comp.cyl(0.0065, l, at=(cx + 0.031 * math.cos(a), cy + 0.031 * math.sin(a), z0 + CANDLE_H - l + 0.004), r2=0.0045, seg=8))
M("pew_candle_wax", comp.merge(*wax), WAX, smooth=True)
M("pew_candle_wick", comp.cyl(0.0017, 0.016, at=(cx, cy, z0 + CANDLE_H - 0.006), seg=6), WICK)

comp.export(col, root, "nave", "pew_candle", made="blender/components/nave/pew_candle.py", source="own geometry", license="ours", credit="",
            notes=json.dumps({"origin": "the floor at the pew end's face; the holder toward -y", "wick": [cx, round(cy, 4), round(z0 + CANDLE_H + 0.01, 4)]}))
