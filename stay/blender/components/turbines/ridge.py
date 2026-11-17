# turbines/ridge: the ridge the turbines stand along, modelled by hand as one piece of ground 480 by 240 m: a level
# crest 21 m wide, 30 m above the valley floor (z 0, the stand's floor), running along x from 150 m right of the origin
# to 330 m left of it, with shoulders that roll and gully as they fall away on both sides and a knoll at each end.
# Upland turf and outcrop from a Poly Haven aerial texture set. Its origin is the valley floor under the first
# turbine's foot: turbines, road and fence stand on it at 30 m.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, fbm

col, root = comp.fresh("ridge")
turf = comp.ph_texture("ridge_turf", "aerial_grass_rock", tile=36.0, tint=(0.8, 0.95, 0.7))
M = _lib.maker(col, root)
CREST, Y0, Y1 = 30.0, -11.0, 10.0
ss = lambda t: max(0.0, min(1.0, t)) ** 2 * (3 - 2 * max(0.0, min(1.0, t)))


def ground(x, y):
    d = (Y0 - y) if y < Y0 else ((y - Y1) if y > Y1 else 0.0)
    if d <= 0:
        return 0, 0, CREST
    fall = 95.0 * (1 + 0.25 * fbm(x, 0, scale=120, octaves=2, seed=2.0))
    z = CREST * (1 - ss(d / fall) ** 0.9)
    z += 4.0 * fbm(x, y, scale=45, octaves=3, seed=4.2) * min(1.0, d / 30)
    z -= 3.0 * max(0.0, fbm(x * 1.0, y * 0.25, scale=22, octaves=2, seed=8.8)) * min(1.0, d / 20) * (1 - min(1.0, d / 110))   # gullies down the fall line
    z += 0.5 * fbm(x, y, scale=7, octaves=2, seed=1.1) * min(1.0, d / 8)
    return 0, 0, max(-1.0, z)


r = M("ridge_ground", _lib.field(480, 240, 200, 100, ground, at=(-90, -10)), turf, smooth=True)
comp.uv_box(r, 1.0)
comp.export(col, root, "turbines", "ridge", made="blender/components/turbines/ridge.py", source="own geometry (a height field); texture: https://polyhaven.com/a/aerial_grass_rock",
            license="ours; texture CC0", credit="Poly Haven (aerial_grass_rock)",
            notes="origin: the valley floor under the first turbine's foot; the crest is level at 30 m from y -11 (front) to y +10 for the ridge's whole length, x -330 to +150; the turbines stand at y +3, the road runs at y -6")
