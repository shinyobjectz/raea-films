# subway/track-wall: 10 m of the wall across the track from the platform, 4.5 m from the bed to the ceiling, modelled
# by hand: the same white tile, base course, green band and STAY ST tablets as the platform's wall, and along its foot
# the tunnel's services: four cables on steel hangers, a conduit with junction boxes, and a refuge niche marker.
# A wall item: back at y 0, face toward -y, standing on the track bed. A shell part.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, slab, bolt, CEIL

col, root = comp.fresh("track_wall")
W, H = 10.0, CEIL
TH = _lib.tiled_wall(col, root, "track_wall", W, H, tablets=2)
cable = comp.mat("track_wall_cable", (0.02, 0.02, 0.022), rough=0.6)
steel = comp.mat("track_wall_steel", (0.3, 0.3, 0.31), rough=0.5, metal=0.9)
red = comp.mat("track_wall_marker", (0.6, 0.05, 0.04), rough=0.5)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
cs = []
for k, z in enumerate((0.75, 0.87, 0.99, 1.11)):
    pts = [(-W / 2 + i * W / 20, -TH - 0.07 - 0.004 * (k % 2), z - 0.025 * math.sin(math.pi * ((i * W / 20) % 2.5) / 2.5)) for i in range(21)]
    cs.append(comp.tube(pts, 0.022 - 0.003 * k, res=3, sides=2))
M("track_wall_cables", comp.merge(*cs), cable, smooth=True)
hang = []
for i in range(5):
    x = -W / 2 + i * 2.5 + 0.02 if i < 4 else W / 2 - 0.02
    hang.append(slab(x - 0.02, x + 0.02, -TH - 0.012, -TH, 0.65, 1.22))
    hang += [slab(x - 0.015, x + 0.015, -TH - 0.11, -TH, z - 0.035, z - 0.027) for z in (0.75, 0.87, 0.99, 1.11)]
M("track_wall_hangers", comp.merge(*hang), steel)
M("track_wall_conduit", comp.merge(comp.cyl(0.018, W, at=(-W / 2, -TH - 0.03, 1.6), seg=10, axis="X"), *[comp.box((0.14, 0.06, 0.14), at=(x, -TH - 0.03, 1.6)) for x in (-3.0, 1.5)]), steel)
M("track_wall_marker", comp.merge(slab(2.6, 2.9, -TH - 0.004, -TH, 1.9, 2.2), slab(2.72, 2.78, -TH - 0.006, -TH, 1.95, 2.15)), red)
comp.export(col, root, "subway", "track_wall", made="blender/components/subway/track_wall.py", source="own geometry; tile https://polyhaven.com/a/long_white_tiles; letters in Blender's built-in font", license="ours; texture CC0", credit="texture: Poly Haven",
            notes="Shell part, 10 m wide and 4.5 m high: stands on the track bed 2.2 m left of the track's centre, turned to face the track.")
