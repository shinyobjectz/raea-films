# lighthouse/cliff: the headland the light stands on, modelled by hand as one piece of ground 140 by 105 m: a grassed
# plateau 20 m above the sea, level for 40 m round the tower, a ragged promontory edge toward the camera, stepped rock
# faces with ledges and gullies falling to a skirt of wave-cut rock that runs under the sea (sea level is z 0, the
# floor). Rock and turf from Poly Haven texture sets. Its origin is at sea level under the tower's foot: the tower
# stands on it at 20 m.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, fbm
from mathutils import Vector

col, root = comp.fresh("cliff")
grass = comp.ph_texture("cliff_turf", "leafy_grass", tile=3.0, res="1k", tint=(0.55, 0.9, 0.45))
rock = comp.ph_texture("cliff_rock", "cliff_side", tile=9.0)
wet = comp.ph_texture("cliff_tide_rock", "seaside_rock", tile=5.0, res="1k", tint=(0.2, 0.2, 0.2))
M = _lib.maker(col, root)
TOP = 20.0


def edge(x):
    return -16.0 + 0.02 * x * x


def inside(x, y):
    """Metres inside the plateau's edge (negative outside), the edge made ragged."""
    s = (y - edge(x)) / math.sqrt(1 + (0.04 * x) ** 2)
    return s + 4.0 * fbm(x, y, scale=16, octaves=3, seed=3.1) + 1.3 * fbm(x, y, scale=4.5, octaves=2, seed=9.4)


def ground(x, y):
    s = inside(x, y)
    far = math.hypot(x, y)
    if s >= 0:
        roll = 1.3 * fbm(x, y, scale=26, octaves=3, seed=5.0) * max(0.0, min(1.0, (far - 42) / 15))
        lip = -0.5 * math.exp(-s / 1.5)                      # the turf rounds over at the edge
        return 0, 0, TOP + roll + lip
    t = min(1.0, -s / 8.0)
    z = TOP * (1 - t ** 0.55)
    z = min(TOP - 0.3, 0.45 * z + 0.55 * (round(z / 3.6) * 3.6))   # strata: ledges every few metres
    z += 0.9 * fbm(x, y, z, scale=5, octaves=3, seed=1.7)
    if t >= 1.0:
        out = -s - 8.0                                        # the wave-cut skirt
        z = 1.9 * math.exp(-out / 5.0) * (0.35 + 0.9 * fbm(x, y, scale=5, octaves=3, seed=7.7)) - 2.5 * (1 - math.exp(-out / 6.0))
    k = 1.6 * (1 - abs(2 * t - 1)) if t < 1 else 0.3
    return k * fbm(y, z, x, scale=4, octaves=3, seed=2.2), k * fbm(z, x, y, scale=4, octaves=3, seed=6.6), z


c = M("cliff_ground", _lib.field(140, 105, 190, 142, ground, at=(0, 7.5)), [grass, rock, wet], smooth=True)
_lib.paint_by(c, lambda n, p: 0 if (n.z > 0.8 and p.z > TOP - 1.2) else (2 if p.z < 0.9 else 1))
comp.uv_box(c, 1.0)
comp.export(col, root, "lighthouse", "cliff", made="blender/components/lighthouse/cliff.py",
            source="own geometry (a height field: a promontory with stepped faces); textures: https://polyhaven.com/a/leafy_grass, https://polyhaven.com/a/cliff_side, https://polyhaven.com/a/seaside_rock",
            license="ours; textures CC0", credit="Poly Haven (leafy_grass, cliff_side, seaside_rock)",
            notes="origin: sea level under the tower's foot; the plateau is 20 m up and level within 40 m of the origin; the promontory's point faces -y (the camera), its edge about 16 m in front of the tower")
