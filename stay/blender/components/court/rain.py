# court/rain: rain in the floodlight, modelled by hand: 4 500 streaks (each two crossed slivers 35-70 cm long, the
# length a drop smears to in a frame) through a 16 x 12 m block of air 21 m tall, leaning 6 degrees with the wind.
# The origin is the block's middle on the ground. The streaks are their own material (rain_streaks).
# Rig: "fall" drops the block 7 m, one period of its pattern, so the clip loops with the air over the court always
# full; "gust" leans it 7 degrees more.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import T, R, S, xf, Vector

col, root = comp.fresh("rain")
M = _lib.maker(col, root)
m = comp.mat("rain_streaks", (0.85, 0.9, 1.0), rough=0.2, emit=(0.8, 0.88, 1.0), strength=70.0, alpha=0.22)
rnd = random.Random(11)
P, N, LEAN = 7.0, 1500, math.radians(6)
bm = bmesh.new()
for i in range(N):
    x, y, z0 = rnd.uniform(-8, 8), rnd.uniform(-6, 6), rnd.uniform(0, P)
    ln, w = rnd.uniform(0.35, 0.7), rnd.uniform(0.0022, 0.0045)
    for k in range(3):
        z = z0 + k * P
        dx = math.tan(LEAN)
        for ax, ay in ((w, 0), (0, w)):
            vs = [bm.verts.new((x - ax + z * dx, y - ay, z)), bm.verts.new((x + ax + z * dx, y + ay, z)),
                  bm.verts.new((x + ax + (z + ln) * dx, y + ay, z + ln)), bm.verts.new((x - ax + (z + ln) * dx, y - ay, z + ln))]
            bm.faces.new(vs)
gust = comp.pivot(col, root, "rain_gust", (0, 0, 0))
fall = comp.pivot(col, root, "rain_fall", (0, 0, 0), parent=gust)
M("rain_streaks", bm, m, parent=fall, smooth=False)
_lib.channel("fall", [(fall, "location", 2, 0, -P), (fall, "location", 0, 0, -P * math.tan(LEAN))])
_lib.channel("gust", [(gust, "rotation_euler", 1, 0, math.radians(7))])
comp.export(col, root, "court", "rain", made="blender/components/court/rain.py", source="own geometry", license="ours", credit="",
            rig={"fall": "the streaks fall 7 m along their lean, one period of the pattern: loop it (about 0.7 s a loop is rain's speed)", "gust": "the whole block leans 7 degrees more with the wind",
                 "glow": "in the scene: the material rain_streaks (how bright the streaks are in the light)"},
            notes="origin: the block's middle on the ground; the part of the block under the ground is hidden by the court")
