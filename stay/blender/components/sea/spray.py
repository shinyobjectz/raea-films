# sea/spray: a burst of spray where a swell breaks on the rocks, modelled by hand: 700 droplets from pea to fist size
# thrown up in a fan 6 m wide and 4.5 m high, thicker and whiter at its root, and eleven torn sheets of white water
# under them (their own see-through material, spray_sheet). Its origin is the point on the water where the wave
# strikes; the fan goes up and a little back (+y), away from the camera. Rig: "burst" grows the whole burst out of
# that point, from a low knot of white water at rest to the full fan; "fall" then drops it 1.6 m and flattens it.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix
random.seed(5)
col, root = comp.fresh("spray")
M = _lib.maker(col, root)
drop_m = comp.mat("spray_drops", (0.93, 0.95, 0.96), rough=0.35, emit=(1.0, 0.86, 0.72), strength=900.0)
sheet_m = comp.mat("spray_sheet", (0.95, 0.97, 0.98), rough=0.6, alpha=0.4, emit=(1.0, 0.9, 0.8), strength=0.7)
fall = comp.pivot(col, root, "spray_fall", (0, 0, 0))
burst = comp.pivot(col, root, "spray_burst", (0, 0, 0), parent=fall)
drops = []
for i in range(700):
    # a fan: each droplet on its own throw, further ones smaller
    az = random.gauss(0, 0.55)
    el = random.uniform(0.5, 1.45)
    reach = random.random() ** 0.6
    d = (0.4 + 4.3 * reach)
    x = d * math.sin(az) * math.cos(el) * 1.5
    y = d * math.cos(az) * math.cos(el) * 0.45
    z = d * math.sin(el) * (1 - 0.18 * reach)
    r = random.uniform(0.008, 0.038) * (1.25 - 0.8 * reach) + 0.005
    s = _lib.ico(r, at=(x, y, z), sub=1, scale=(1, 1, random.uniform(1.0, 1.9)))
    drops.append(s)
for part in range(3):
    M(f"spray_drops_{part + 1}", comp.merge(*drops[part::3]), drop_m, parent=burst, smooth=True)
sheets = []
for i in range(11):
    az = -0.9 + 1.8 * i / 10 + random.uniform(-0.08, 0.08)
    h = random.uniform(1.3, 2.9)
    g = bmesh.new()
    bmesh.ops.create_grid(g, x_segments=8, y_segments=14, size=0.5)
    for v in g.verts:
        t = v.co.y + 0.5
        v.co.x *= (0.9 - 0.75 * t ** 1.5) * random.uniform(0.85, 1.15)
        v.co.z = 0.25 * math.sin(v.co.x * 5 + i) * t
    xf(g, S(0.9, h, 1))
    xf(g, T(0, h / 2, 0))
    xf(g, R(90 - random.uniform(5, 25), "X"))
    xf(g, R(-math.degrees(az) * 0.9, "Y"))
    xf(g, T(math.sin(az) * 0.9, random.uniform(0.0, 0.5), 0))
    _lib.lump(g, 0.2, 0.5, 4, seed=i)
    sheets.append(g)
so = M("spray_sheets", comp.merge(*sheets), sheet_m, parent=burst, smooth=True)
root_foam = _lib.lump(_lib.ico(0.9, at=(0, 0.2, 0.1), sub=3, scale=(2.2, 0.9, 0.5)), 0.3, 0.6, 4)
M("spray_root", root_foam, drop_m, parent=burst, smooth=True)
_lib.channel("burst", [(burst, "scale", 0, 0.3, 1.0), (burst, "scale", 1, 0.3, 1.0), (burst, "scale", 2, 0.08, 1.0)])
_lib.channel("fall", [(fall, "location", 2, 0.0, -1.6), (fall, "scale", 2, 1.0, 0.55), (fall, "scale", 0, 1.0, 1.25)])
comp.export(col, root, "sea", "spray", made="blender/components/sea/spray.py", source="own geometry", license="ours", credit="",
            rig={"burst": "the burst grows out of the strike point: from a knot of white water 0.4 m high at rest to the full fan, 6 m wide and 4.5 m high",
                 "fall": "the fan drops 1.6 m, flattens and spreads (run it after burst)"},
            notes="spray_sheet is blended (drawn raster-lit after Solari's pass); spray_drops is traced.")
