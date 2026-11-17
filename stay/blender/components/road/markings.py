# road/markings: the paint on one 40 m section of road, lying on its camber: a double yellow centre line (two 10 cm
# stripes 10 cm apart), a white fog line 25 cm in from each edge, the paint chipped and worn through in places, and
# raised reflective markers between the yellows every 12 m (amber lenses both ways: the dots a headlight picks out
# down to the vanishing point). No rig: the lenses' glow is the scene's (material marker_lens).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

col, root = comp.fresh("markings")
M = _lib.meshers(col, root)
W, L = _lib.ROAD_W, _lib.ROAD_L
rnd = random.Random(4)
yellow = comp.mat("markings_yellow", (0.78, 0.5, 0.03), rough=0.6)
white = comp.mat("markings_white", (0.8, 0.8, 0.76), rough=0.6)
housing = comp.mat("marker_housing", (0.75, 0.55, 0.05), rough=0.4)
lens = comp.mat("marker_lens", (0.9, 0.45, 0.05), rough=0.15, emit=(1.0, 0.5, 0.08), strength=1.5)

def stripe(x0, x1, wear):
    """A painted stripe as small cells on the road's surface, some chipped away, its edges a little ragged."""
    bm = bmesh.new()
    nx, ny = 4, int(L / 0.08)
    for j in range(ny):
        gone = rnd.random() < wear * 0.2      # a whole patch worn through
        for i in range(nx):
            if gone and rnd.random() < 0.8 or rnd.random() < wear * (0.5 if i in (0, nx - 1) else 0.12):
                continue
            xa, xb = x0 + (x1 - x0) * i / nx, x0 + (x1 - x0) * (i + 1) / nx
            ya, yb = -L / 2 + L * j / ny, -L / 2 + L * (j + 1) / ny
            if i == 0: xa += rnd.uniform(-0.006, 0.006)
            if i == nx - 1: xb += rnd.uniform(-0.006, 0.006)
            bm.faces.new([bm.verts.new((x, y, _lib.road_z(x, y) + 0.006)) for x, y in ((xa, ya), (xb, ya), (xb, yb), (xa, yb))])
    return bm

M("markings_centre_l", stripe(-0.15, -0.05, 0.16), yellow)
M("markings_centre_r", stripe(0.05, 0.15, 0.16), yellow)
M("markings_fog_l", stripe(-W / 2 + 0.25, -W / 2 + 0.35, 0.3), white)
M("markings_fog_r", stripe(W / 2 - 0.35, W / 2 - 0.25, 0.3), white)
# raised markers: a low chamfered tile with a lens on each sloped face
hb, lb = [], []
for k, y in enumerate((-18, -6, 6, 18)):
    z = _lib.road_z(0, y) + 0.005
    b = bmesh.new()
    vs = [b.verts.new(p) for p in ((-0.05, -0.05, 0), (0.05, -0.05, 0), (0.05, 0.05, 0), (-0.05, 0.05, 0), (-0.04, -0.018, 0.018), (0.04, -0.018, 0.018), (0.04, 0.018, 0.018), (-0.04, 0.018, 0.018))]
    for q in ((0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7)):
        b.faces.new([vs[i] for i in q])
    xf(b, T(0, y, z)); hb.append(b)
    for s in (-1, 1):
        l = comp.box((0.07, 0.002, 0.016))
        xf(l, R(-s * 60.6, "X")); xf(l, T(0, y + s * 0.035, z + 0.0095)); lb.append(l)
M("markings_markers", comp.merge(*hb), housing)
M("markings_marker_lenses", comp.merge(*lb), lens)
_lib.done(col, root, "markings", source="own geometry", license="ours", credit="",
          rig={"glow": "in the scene: the markers' lenses (marker_lens) light as the headlights reach them"},
          notes="Lies on road/road at the same origin.")
