# koi/stepping-stones: a path of nine flat stepping stones (tobi-ishi), modelled by hand: irregular worn slabs 0.45
# to 0.65 m across and a hand high, laid a stride apart in a wandering line 3.4 m long from the gravel court to the
# pond's edge (toward +y), each a little turned, lichened (Poly Haven's lichen_rock, CC0). No rig.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("stepping_stones")
rng = random.Random(17)
rock = comp.ph_texture("stepping_stone", "lichen_rock", tile=1.1, res="1k", tint=(0.8, 0.8, 0.78))
slabs = []
for i in range(9):
    y = -1.7 + i * 0.42
    x = 0.28 * math.sin(i * 0.9) + rng.uniform(-0.05, 0.05)
    w = rng.uniform(0.45, 0.65)
    s = stone(rng, (w, w * rng.uniform(0.7, 0.9), 0.3), sub=3, rough=0.16, flat=0.3)
    top = 0.07 + rng.uniform(0, 0.02)
    for v in s.verts:
        v.co.z = min(v.co.z, top + 0.01 * noise.noise(v.co * 6))
    xf(s, T(x, y, -0.03))
    slabs.append(s)
o = M("stepping_stones_slabs", comp.merge(*slabs), rock, smooth=True)
shade(o, 50)
comp.uv_box(o, 1.0)
done(col, root, "stepping_stones", "own geometry; https://polyhaven.com/a/lichen_rock (CC0)", license="CC0", credit="Poly Haven (texture)")
