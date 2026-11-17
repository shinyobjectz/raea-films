# vinyl/headphones: the listening station's headphones on their wall hook, modelled by hand: a steel hook plate and
# peg screwed to the wall (its back at y 0, the peg at the origin), closed-back over-ear headphones hung on it by the
# headband (twin steel bands, a leather strap under them, sliders, yokes, two cups with padded cushions and grilles),
# and a coiled cable down from the left cup to a jack. Rig: "swing" swings the headphones and cable 14 degrees about
# the peg (just hung up); "lift" lifts them 12 cm up and 10 cm out off the hook.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("headphones")
steel = comp.mat("headphones_steel", (0.8, 0.8, 0.82), rough=0.2, metal=1.0)
black = comp.mat("headphones_black", (0.025, 0.025, 0.028), rough=0.5)
leather = comp.mat("headphones_leather", (0.07, 0.05, 0.04), rough=0.6)
cush = comp.mat("headphones_cushion", (0.04, 0.04, 0.045), rough=0.8)
hookm = comp.mat("headphones_hook", (0.15, 0.15, 0.16), rough=0.4, metal=1.0)
PY = -0.07                                  # how far out on the peg they hang
hk = M("headphones_hook", comp.merge(comp.box((0.06, 0.004, 0.11), at=(0, -0.002, -0.01)), comp.cyl(0.0075, 0.1, at=(0, -0.1, 0), seg=16, axis="Y"), comp.cyl(0.012, 0.006, at=(0, -0.106, 0), seg=16, axis="Y"),
                                   comp.cyl(0.005, 0.003, at=(0.018, -0.007, 0.03), seg=10, axis="Y"), comp.cyl(0.005, 0.003, at=(-0.018, -0.007, -0.05), seg=10, axis="Y")), hookm)
comp.bevel(hk, 0.001, 2)
sw = comp.pivot(col, root, "headphones_swing", (0, PY, 0))
RB = 0.092
CZ = -0.0075 - RB - 0.003                   # the band's centre: its top rests on the peg
def arc(r, a0, a1, n, y):
    return [(r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), y, CZ + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
bands = comp.merge(comp.tube(arc(RB + 0.003, -8, 188, 28, PY - 0.009), 0.0022, sides=3), comp.tube(arc(RB + 0.003, -8, 188, 28, PY + 0.009), 0.0022, sides=3))
shade(M("headphones_bands", bands, steel, parent=sw))
strap = bmesh.new()
pts = arc(RB - 0.006, 20, 160, 20, 0)
prev = None
for x, _, z in pts:
    a, b = strap.verts.new((x, PY - 0.016, z)), strap.verts.new((x, PY + 0.016, z))
    if prev:
        strap.faces.new((prev[0], prev[1], b, a))
    prev = (a, b)
so = M("headphones_strap", strap, leather, parent=sw, smooth=True)
comp.solidify(so, 0.004)
for i, sx in enumerate((1, -1)):
    ex, ez = sx * (RB + 0.003) * math.cos(math.radians(8)), CZ - (RB + 0.003) * math.sin(math.radians(8))
    cz = ez - 0.03
    sl = M(f"headphones_slider_{i + 1}", comp.box((0.012, 0.03, 0.03), at=(ex, PY, ez + 0.012)), black, parent=sw)
    comp.bevel(sl, 0.003, 2)
    yoke = comp.merge(comp.tube([(ex, PY, ez), (ex + sx * 0.012, PY - 0.03, ez - 0.004), (ex + sx * 0.012, PY - 0.045, cz)], 0.003, sides=3),
                      comp.tube([(ex, PY, ez), (ex + sx * 0.012, PY + 0.03, ez - 0.004), (ex + sx * 0.012, PY + 0.045, cz)], 0.003, sides=3))
    shade(M(f"headphones_yoke_{i + 1}", yoke, steel, parent=sw))
    cup = turn([(0, 0.034), (0.03, 0.034), (0.043, 0.027), (0.047, 0.014), (0.047, 0.0), (0, 0.0)], seg=40)
    grille = comp.merge(*[comp.cyl(0.03 - k * 0.008, 0.0012, at=(0, 0, 0.034 + k * 0.0006), seg=32) for k in range(3)])
    cushion = torus(0.034, 0.013, 36, 12, at=(0, 0, -0.008))
    for bm in (cup, grille, cushion):
        xf(bm, T(ex - sx * 0.012, PY, cz) @ R(90 * sx, "Y"))
    shade(M(f"headphones_cup_{i + 1}", cup, black, parent=sw))
    shade(M(f"headphones_grille_{i + 1}", grille, steel, parent=sw), 20)
    shade(M(f"headphones_cushion_{i + 1}", cushion, cush, parent=sw), 80)
    if sx == -1:
        pts = [(ex, PY, cz - 0.045), (ex, PY, cz - 0.09)]
        for k in range(1, 15 * 8):
            a = k * math.pi / 4
            pts.append((ex + 0.007 * math.cos(a), PY + 0.007 * math.sin(a), cz - 0.09 - k * 0.0028))
        zc = cz - 0.09 - 15 * 8 * 0.0028
        pts += [(ex, PY, zc - 0.02), (ex + 0.01, PY, zc - 0.08), (ex + 0.02, PY, zc - 0.14)]
        shade(M("headphones_cable", comp.tube(pts, 0.0022, res=4, sides=2), black, parent=sw), 80)
        shade(M("headphones_jack", comp.merge(comp.cyl(0.005, 0.03, at=(ex + 0.02, PY, zc - 0.17), seg=12), comp.cyl(0.003, 0.02, at=(ex + 0.02, PY, zc - 0.19), seg=10)), steel, parent=sw))
channel("swing", [(sw, "rotation_euler", 1, 0, math.radians(14))])
channel("lift", [(sw, "location", 2, sw.location.z, sw.location.z + 0.12), (sw, "location", 1, sw.location.y, sw.location.y - 0.1)])
done(col, root, "headphones", "own geometry (generic closed-back headphones on a wall hook)",
     rig={"swing": "the headphones and cable 14 degrees to the side about the peg", "lift": "the headphones up 12 cm and out 10 cm, off the hook"})
