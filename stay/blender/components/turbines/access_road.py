# turbines/access-road: the service road along the crest and one turbine's crane pad, modelled by hand: 110 m of
# crowned gravel track 5 m wide with two worn wheel lines and soft verges, a spur to the tower, and a levelled 22 by
# 12 m hardstanding beside the foundation where the crane stood. Gravel from Poly Haven texture sets. Its origin is the
# foot of the turbine it serves; the track runs along x, 6 m in front of the tower, 55 m either way, so a copy at each
# turbine joins into one road.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, fbm

col, root = comp.fresh("access_road")
gravel = comp.ph_texture("road_gravel", "gravel_floor_02", tile=4.0, tint=(0.72, 0.69, 0.64))
worn = comp.ph_texture("road_wheel_lines", "gravel_floor_02", tile=4.0, tint=(0.42, 0.4, 0.37))
M = _lib.maker(col, root)
LEN, WID, YC = 110.0, 5.0, -6.0


def strip(x0, x1, y0, y1, nx, ny, crown=0.09, h=0.05):
    def f(x, y):
        t = (y - y0) / (y1 - y0) * 2 - 1
        edge = max(0.0, abs(t) - 0.8) / 0.2
        return 0.25 * fbm(x, y, scale=6, octaves=2, seed=2.0) * edge, 0, h + crown * (1 - t * t) - (h + 0.03) * edge ** 2
    return _lib.field(x1 - x0, y1 - y0, nx, ny, f, at=((x0 + x1) / 2, (y0 + y1) / 2))


t = M("access_road_track", strip(-LEN / 2, LEN / 2, YC - WID / 2 - 0.5, YC + WID / 2 + 0.5, 110, 12), [gravel, worn], smooth=True)
_lib.paint_by(t, lambda n, p: 1 if 0.75 < abs(p.y - YC) < 1.25 else 0)
comp.uv_box(t, 1.0)
sp = M("access_road_spur", strip(-2.6, 2.6, YC + WID / 2 - 0.3, -4.4, 6, 4, crown=0.03), gravel, smooth=True)
comp.uv_box(sp, 1.0)
pad = M("access_road_crane_pad", strip(7.0, 29.0, YC + WID / 2 - 0.3, 8.6, 22, 12, crown=0.02, h=0.07), gravel, smooth=True)
comp.uv_box(pad, 1.0)
comp.export(col, root, "turbines", "access_road", made="blender/components/turbines/access_road.py", source="own geometry; texture: https://polyhaven.com/a/gravel_floor_02",
            license="ours; texture CC0", credit="Poly Haven (gravel_floor_02)",
            notes="origin: the foot of the turbine it serves; the track's middle is 6 m in front (-y) of it, 110 m long along x; the crane pad lies to the tower's right")
