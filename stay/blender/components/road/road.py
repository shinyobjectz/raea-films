# road/road: one 40 m section of a two-lane Pacific Northwest road, 7.2 m across: worn asphalt on a 2 % camber with
# wheel ruts and four shallow dips where the puddles stand (road/puddles lies in them), a ragged edge course either
# side, and a dark wet film that sits under the surface until the soak. Sections butt end to end. Rig: "wet" lifts
# the film through the asphalt (4 cm, to 3 mm over it), so the road goes from damp to a dark mirror; the scene can
# also turn the asphalt's own roughness down (its material is road_asphalt).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

from mathutils import noise
col, root = comp.fresh("road")
M = _lib.meshers(col, root)
W, L = _lib.ROAD_W, _lib.ROAD_L
asphalt = comp.ph_texture("road_asphalt", "asphalt_02", tile=3.0, res="2k", tint=(0.5, 0.5, 0.52))
edge_m = comp.ph_texture("road_edge", "asphalt_02", tile=2.0, res="2k", tint=(0.36, 0.35, 0.34))
wet_m = comp.mat("road_wet", (0.012, 0.014, 0.018), rough=0.05, alpha=0.78)

def fz(x, y):
    return _lib.road_z(x, y) + 0.0015 * noise.noise(Vector((x * 1.7, y * 1.7, 0.0)))

top = M("road_asphalt", _lib.sheet(48, 160, -W / 2, W / 2, -L / 2, L / 2, fz), asphalt, smooth=True)
_lib.uv_top(top, 1.0)
# the edge course: a strip either side that breaks up and falls away to the shoulder
for s, side in ((-1, "l"), (1, "r")):
    def ez(x, y, s=s):
        d = max(0.0, abs(x) - W / 2)
        return _lib.road_z(s * W / 2, y) - 0.03 - 0.55 * d ** 1.4 + 0.012 * noise.noise(Vector((x * 4, y * 4, 3.0)))
    x0, x1 = (W / 2 - 0.02, W / 2 + 0.38) if s > 0 else (-W / 2 - 0.38, -W / 2 + 0.02)
    bm = _lib.sheet(4, 160, x0, x1, -L / 2, L / 2, ez)
    for v in bm.verts:      # a ragged inner edge
        if abs(abs(v.co.x) - (W / 2 - 0.02)) < 1e-4:
            v.co.x += s * 0.03 * noise.noise(Vector((v.co.y * 2.5, s * 5.0, 0)))
            v.co.z = _lib.road_z(v.co.x, v.co.y) + 0.004
    e = M(f"road_edge_{side}", bm, edge_m, smooth=True)
    _lib.uv_top(e, 1.0)
# the slab's ends, so a section seen end on is not a sheet of paper
for y in (-L / 2, L / 2):
    comp.uv_box(M(f"road_end_{'near' if y < 0 else 'far'}", comp.box((W, 0.02, 0.3), at=(0, y - 0.01 * (1 if y < 0 else -1), -0.2)), edge_m), 1.0)
# the wet film
wp = comp.pivot(col, root, "road_wet_level", (0, 0, 0))
# in strips, with a slot left for each painted line (road/markings), so the paint stays bright when the road soaks
strips = [(-W / 2 + 0.05, -W / 2 + 0.235, 2), (-W / 2 + 0.365, -0.165, 22), (-0.035, 0.035, 1), (0.165, W / 2 - 0.365, 22), (W / 2 - 0.235, W / 2 - 0.05, 2)]
fb = comp.merge(*[_lib.sheet(n, 160, x0, x1, -L / 2, L / 2, lambda x, y: _lib.road_z(x, y) + 0.010) for x0, x1, n in strips])
# and a hole under each puddle: two blended sheets one over the other are drawn in either order
inside = lambda c: any(((c.x - px) / (hx * 0.55)) ** 2 + ((c.y - py) / (hy * 0.55)) ** 2 < 1 for px, py, hx, hy in _lib.DIPS)
bmesh.ops.delete(fb, geom=[f for f in fb.faces if inside(f.calc_center_median())], context="FACES")
film = M("road_wet", fb, wet_m, parent=wp, smooth=True)
wp.location.z = -0.05
_lib.channel("wet", [(wp, "location", 2, -0.05, 0.0)])
_lib.done(col, root, "road", source="own geometry; asphalt: https://polyhaven.com/a/asphalt_02", license="ours; texture CC0", credit="Poly Haven (asphalt_02)",
          rig={"wet": "the dark wet film (road_wet) rises 5 cm through the asphalt to lie 10 mm over it (raea does not draw a blended sheet closer than about 5 mm to the surface under it); it has a slot for each painted line and a hole under each puddle, so run the `open` of road/puddles with it",
               "roughness": "in the scene: road_asphalt's roughness (damp 0.6, soaked 0.1) and road_wet's alpha"},
          notes="Sections are 40 m and butt end to end along z. The dips are at (x, z) = (-1.4, 8), (1.2, 3), (-2.2, -3), (0.6, -11) in raea's frame; road/puddles has a puddle in each.")
