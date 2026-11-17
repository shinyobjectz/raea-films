# lighthouse/gallery: the gallery's iron railing round the lantern, modelled by hand: twenty-four cast stanchions with
# flanged, bolted feet and ball heads, a round handrail and two lower rails through them, a toe plate, and a drip of
# four scupper spouts. 6.3 m across, 1.1 m high; its origin is the tower's deck top on the tower's axis (18 m up).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe, ring, sphere

col, root = comp.fresh("gallery")
iron = comp.mat("gallery_iron", (0.012, 0.012, 0.014), rough=0.45, metal=0.7)
steel = comp.mat("gallery_bolts", (0.4, 0.4, 0.42), rough=0.4, metal=1.0)
M = _lib.maker(col, root)
RR, N = 3.14, 24


def torus(R0, r, z, seg=96, sec=10):
    return lathe([(R0 + r * math.cos(2 * math.pi * i / sec), z + r * math.sin(2 * math.pi * i / sec)) for i in range(sec + 1)], seg=seg)


post = lathe([(0.0, 0.0), (0.075, 0.0), (0.075, 0.018), (0.035, 0.03), (0.026, 0.1), (0.022, 0.3), (0.03, 0.33), (0.03, 0.37), (0.022, 0.4), (0.02, 0.68), (0.03, 0.71), (0.03, 0.75), (0.02, 0.78),
              (0.02, 1.02), (0.034, 1.05), (0.045, 1.09), (0.034, 1.135), (0.0, 1.15)], seg=14)
posts, bolts = [], []
for k in range(N):
    a = k * 360 / N
    p = post.copy()
    xf(p, T(RR, 0, 0)); xf(p, R(a, "Z"))
    posts.append(p)
    for j in range(4):
        b = comp.cyl(0.011, 0.012, at=(0.052, 0, 0.018), seg=6)
        xf(b, R(45 + j * 90, "Z")); xf(b, T(RR, 0, 0)); xf(b, R(a, "Z"))
        bolts.append(b)
post.free()
M("gallery_stanchions", comp.merge(*posts), iron, smooth=True)
M("gallery_bolts", comp.merge(*bolts), steel)
M("gallery_handrail", torus(RR, 0.03, 1.09), iron, smooth=True)
M("gallery_rails", comp.merge(torus(RR, 0.016, 0.73), torus(RR, 0.016, 0.35)), iron, smooth=True)
M("gallery_toe_plate", ring(RR - 0.006, RR + 0.006, 0.02, 0.14, seg=96), iron)
spouts = [xf(comp.merge(comp.cyl(0.035, 0.3, at=(3.2, 0, -0.07), seg=10, axis="X"), comp.box((0.12, 0.12, 0.02), at=(3.26, 0, -0.07))), R(45 + k * 90, "Z")) for k in range(4)]
M("gallery_scuppers", comp.merge(*spouts), iron)
comp.export(col, root, "lighthouse", "gallery", made="blender/components/lighthouse/gallery.py", source="own geometry (a generic cast-iron lighthouse gallery railing)", license="ours", credit="",
            notes="origin: the deck top on the tower's axis, 18 m up")
