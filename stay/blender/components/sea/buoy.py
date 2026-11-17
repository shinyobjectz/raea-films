# sea/buoy: a lateral channel marker, a steel can buoy 3 m across with a lattice tower and a lantern, 5.6 m out of the
# water (Poly Haven's lateral_sea_marker, CC0, by Kuutti Siitonen), with a lantern lens of our own on its top that the
# scene lights (the material buoy_light). Its origin is its waterline. Rig: "bob" lifts it 0.45 m on a swell;
# "lean" heels it 11 degrees about the waterline (the swell passing under it); "turn" swings it once round its chain.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

col, root = comp.fresh("buoy")
parts, credit = _lib.bring(col, root, "lateral_sea_marker", "buoy", res="2k")
body = parts["body"]
M = _lib.maker(col, root)
lo, hi = comp.box_of(body)
heave = comp.pivot(col, root, "buoy_bob", (0, 0, 0))
lean = comp.pivot(col, root, "buoy_lean", (0, 0, 0), parent=heave)
spin = comp.pivot(col, root, "buoy_turn", (0, 0, 0), parent=lean)
comp.link(col, root, body, parent=spin)
light = comp.mat("buoy_light", (0.9, 0.1, 0.05), rough=0.2, emit=(1.0, 0.08, 0.03), strength=9000.0)
M("buoy_lantern", _lib.turn([(0.0, 0.0), (0.07, 0.0), (0.075, 0.03), (0.075, 0.13), (0.05, 0.17), (0.0, 0.18)], z0=hi.z - 0.02, seg=20), light, parent=spin, smooth=True)
# the mooring chain down from under the can into the deep
chain = comp.mat("buoy_chain", (0.12, 0.09, 0.07), rough=0.8, metal=0.6)
links = []
for i in range(14):
    # a link is a long loop, each turned a quarter from the last
    lk = comp.tube([(0.07 * math.cos(a), 0, 0.11 * math.sin(a)) for a in [k * math.pi / 5 for k in range(11)]], 0.018, res=3, sides=2)
    xf(lk, R(90 * (i % 2), "Z"))
    xf(lk, T(0, 0, lo.z - 0.1 - i * 0.17))
    links.append(lk)
M("buoy_chain", comp.merge(*links), chain, parent=heave, smooth=True)
_lib.channel("bob", [(heave, "location", 2, 0.0, 0.45)])
_lib.channel("lean", [(lean, "rotation_euler", 1, 0.0, math.radians(11))])
_lib.channel("turn", [(spin, "rotation_euler", 2, 0.0, 2 * math.pi)])
comp.export(col, root, "sea", "buoy", made="blender/components/sea/buoy.py", source="https://polyhaven.com/a/lateral_sea_marker; lantern lens and chain our own", license="CC0; ours", credit=credit,
            rig={"bob": "the whole buoy rises 0.45 m", "lean": "it heels 11 degrees to its right about its waterline", "turn": "it swings one whole turn about its mooring",
                 "light": "in the scene: the material buoy_light (the lantern's flash), a key per state"})
