# nave/candle-stand: a wrought-iron pricket standing on the floor, for the open nave between the front pews and the screen:
# three legs splayed from a hub, each ending in a curl; a shaft with two turned knops; an iron pan with a turned-up rim;
# an ivory pillar candle. Its wick is at the pew candles' height (nave/pew-candle), so the rows run level to the door.
# The flame is the scene's (v3/nave.tsx), at the wick in the notes. Origin: the floor under the shaft.
import os, sys, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _plan as P
from _plan import comp, bpy, bmesh, T, R, S, xf, CL, Vector

col, root = comp.fresh("nave_candle_stand")
IRON = comp.mat("nave_holder_iron", (0.03, 0.029, 0.028), rough=0.6, metal=0.7)
WAX = P.wax()
WICK = comp.mat("nave_wick", (0.02, 0.018, 0.016), rough=0.9)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)

PAN, CANDLE_H = 1.26, 0.19
iron = []
# the legs: down and out from the hub, a curl at each foot
for k in range(3):
    a = 2 * math.pi * k / 3 + math.pi / 2
    d = Vector((math.cos(a), math.sin(a), 0))
    pts = [Vector((0, 0, 0.26)), d * 0.06 + Vector((0, 0, 0.2)), d * 0.13 + Vector((0, 0, 0.09)), d * 0.19 + Vector((0, 0, 0.025))]
    for i in range(1, 12):
        b = i * 0.5
        rr = 0.03 * (1 - b / 7)
        pts.append(d * (0.19 + rr * math.sin(b)) + Vector((0, 0, 0.025 + 0.03 - rr * math.cos(b))))
    iron.append(comp.tube([tuple(p) for p in pts], 0.009, res=5, sides=2))
    iron.append(xf(CL.lathe([(0.0, 0.0), (0.018, 0.0), (0.014, 0.008), (0.0, 0.01)], seg=10), T(*(d * 0.19))))
# the hub, the shaft and its knops
iron.append(xf(CL.lathe([(0.0, 0.18), (0.028, 0.18), (0.034, 0.22), (0.024, 0.27), (0.0, 0.28)], seg=16), T(0, 0, 0)))
iron.append(comp.cyl(0.011, PAN - 0.27, at=(0, 0, 0.27), seg=12))
for z in (0.62, 1.02):
    iron.append(xf(CL.lathe([(0.0, 0.0), (0.016, 0.0), (0.03, 0.025), (0.016, 0.05), (0.0, 0.05)], seg=16), T(0, 0, z)))
# the pan and the cup
iron.append(xf(CL.lathe([(0.0, 0.0), (0.014, 0.0), (0.055, 0.01), (0.068, 0.022), (0.07, 0.03), (0.063, 0.026), (0.0, 0.02)], seg=24), T(0, 0, PAN - 0.024)))
iron.append(comp.cyl(0.042, 0.03, at=(0, 0, PAN - 0.004), seg=20))
M("candle_stand_iron", comp.merge(*iron), IRON, smooth=True)

wax = [xf(CL.lathe([(0.0, 0.0), (0.036, 0.0), (0.0365, CANDLE_H), (0.034, CANDLE_H + 0.008), (0.025, CANDLE_H + 0.001), (0.0, CANDLE_H - 0.005)], seg=24), T(0, 0, PAN))]
for a, l in ((1.1, 0.08), (3.7, 0.05), (5.2, 0.035)):
    wax.append(comp.cyl(0.007, l, at=(0.035 * math.cos(a), 0.035 * math.sin(a), PAN + CANDLE_H - l + 0.004), r2=0.0048, seg=8))
M("candle_stand_wax", comp.merge(*wax), WAX, smooth=True)
M("candle_stand_wick", comp.cyl(0.0017, 0.016, at=(0, 0, PAN + CANDLE_H - 0.006), seg=6), WICK)

comp.export(col, root, "nave", "candle_stand", made="blender/components/nave/candle_stand.py", source="own geometry", license="ours", credit="",
            notes=json.dumps({"origin": "the floor under the shaft", "wick": [0, 0, round(PAN + CANDLE_H + 0.01, 4)]}))
