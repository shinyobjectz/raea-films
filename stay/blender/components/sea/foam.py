# sea/foam: the white water that lies round the rocks after a swell has broken on them, modelled by hand: a lace of
# foam 15 m across with a clear middle where the reef stands, torn into holes and streaks by noise, lying 2 to 7 cm proud
# of the surface, and heaps of bubbles close in. Its origin is the still-water level at the reef's middle.
# Rig: "wash" spreads the lace outward by a quarter and thins it (the wash running off); "rise" lifts it 0.35 m.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix
col, root = comp.fresh("foam")
M = _lib.maker(col, root)
lace_m = comp.mat("foam_lace", (0.9, 0.92, 0.92), rough=0.75)
suds_m = comp.mat("foam_suds", (0.95, 0.96, 0.95), rough=0.85)
rise = comp.pivot(col, root, "foam_rise", (0, 0, 0))
wash = comp.pivot(col, root, "foam_wash", (0, 0, 0), parent=rise)
N = 200
g = bmesh.new()
bmesh.ops.create_grid(g, x_segments=N, y_segments=N, size=7.6)
def inside(c):
    """how far inside the foam a point is (over 0 is foam): dense near the rocks, thinning to streaks at the edge,
    the streaks running round the reef; the noise is kept coarser than the mesh so the outline comes out smooth"""
    r = math.hypot(c.x, c.y * 1.25)
    a = math.atan2(c.y, c.x)
    edge = max(0.0, min(1.0, (r - 2.6) / 1.0)) * max(0.0, min(1.0, (7.4 - r) / 3.5))
    n = _lib.fbm((r * 0.9, a * 2.2, 0.0), 2, 1.1) * 0.62 + _lib.fbm((c.x, c.y, 3.0), 2, 0.75) * 0.55
    return n - (0.42 - 0.62 * edge) if edge > 0 else -1.0
val = {v: inside(v.co) for v in g.verts}
bmesh.ops.delete(g, geom=[f for f in g.faces if all(val[v] <= 0 for v in f.verts)], context="FACES")
# the outline: a kept face's outside corners slide along their edges to where the foam ends, so no edge is a stair
moves = {}
for v in g.verts:
    if val[v] > 0:
        continue
    pts = [v.co + (e.other_vert(v).co - v.co) * (val[v] / (val[v] - val[e.other_vert(v)])) for e in v.link_edges if val[e.other_vert(v)] > 0]
    if pts:
        moves[v] = sum(pts, Vector()) / len(pts)
for v, p in moves.items():
    v.co = p
for v in g.verts:                                  # froth: thicker in the dense parts, never flat
    v.co.z = 0.02 + 0.035 * (0.5 + _lib.fbm((v.co.x, v.co.y, 5.0), 3, 0.3))
bmesh.ops.triangulate(g, faces=g.faces)
lo = M("foam_lace", g, lace_m, parent=wash, smooth=True)
# suds: heaps of bubbles where the lace is thickest, close in to the rocks
suds = []
random.seed(9)
for i in range(46):
    a = random.uniform(0, 2 * math.pi)
    r = random.uniform(2.7, 4.4)
    cx, cy = r * math.cos(a), r * math.sin(a) / 1.25
    for k in range(9):
        rr = random.uniform(0.03, 0.09)
        suds.append(_lib.ico(rr, at=(cx + random.gauss(0, 0.16), cy + random.gauss(0, 0.16), 0.05 + rr * 0.3), sub=1, scale=(1, 1, 0.7)))
M("foam_suds", comp.merge(*suds), suds_m, parent=wash, smooth=True)
_lib.channel("wash", [(wash, "scale", 0, 1.0, 1.25), (wash, "scale", 1, 1.0, 1.25), (wash, "scale", 2, 1.0, 0.4)])
_lib.channel("rise", [(rise, "location", 2, 0.0, 0.35)])
comp.export(col, root, "sea", "foam", made="blender/components/sea/foam.py", source="own geometry", license="ours", credit="",
            rig={"wash": "the lace spreads a quarter wider and thins to under half its thickness", "rise": "it lifts 0.35 m with the swell"})
