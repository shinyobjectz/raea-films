# pool/beach-ball: a 40 cm beach ball left in the water, modelled by hand: six gores, white between red, blue and
# yellow, white caps at its poles and a valve. Its origin is the water's surface under it; it floats 3 cm deep.
# Rig: "roll" turns it one whole turn about its middle (drifting down the lane); "bob" dips it 4 cm.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("beach_ball")
cols = [("white", (0.93, 0.93, 0.9)), ("red", (0.85, 0.08, 0.06)), ("blue", (0.05, 0.25, 0.8)), ("yellow", (0.97, 0.8, 0.06))]
mats = [comp.mat(f"pool_ball_{n}", c, rough=0.25) for n, c in cols]
RAD = 0.2
CZ = RAD - 0.03
bob = comp.pivot(col, root, "beach_ball_bob", (0, 0, 0))
p = comp.pivot(col, root, "beach_ball_roll", (0, 0, CZ), parent=bob)
bm = sphere(RAD, u=36, v=20)
xf(bm, R(90, "X"))            # its poles along y, so the gores show as it rolls
xf(bm, T(0, 0, CZ))
o = comp.mesh(col, root, "beach_ball_skin", bm, mats, parent=p, smooth=True)
def gore(c, n):
    if abs(c.y) > RAD * 0.93:
        return 0
    k = int(((math.atan2(c.z - CZ, c.x) + math.pi) / (2 * math.pi)) * 6) % 6
    return (1, 0, 2, 0, 3, 0)[k]
paint(o, gore)
comp.mesh(col, root, "beach_ball_valve", comp.cyl(0.008, 0.006, at=(0, -RAD - 0.004, CZ), seg=10, axis="Y"), mats[0], parent=p, smooth=True)
comp.channel("roll", [(p, "rotation_euler", 0, 0, 2 * math.pi)])
comp.channel("bob", [(bob, "location", 2, 0.0, -0.04)])
done(col, root, "beach_ball", source="own geometry (a generic six-gore beach ball)",
     rig={"roll": "one whole turn about its middle", "bob": "dips 4 cm into the water", "position": "the Model's own position on the water"},
     notes="origin: the water's surface under the ball")
