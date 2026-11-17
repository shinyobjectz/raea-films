# koi/lily-pads: a raft of water lilies, modelled by hand: eleven notched pads 0.16 to 0.34 m across with upturned
# rims and raised veins, two open flowers (three rings of pointed petals round a yellow heart) and a bud, floating
# with the water's level at z 0 (stand it at the pond's water). Rig: "bob" rocks every pad and flower a few degrees
# and lifts it up to 1.5 cm, each its own way, as the ripples pass under.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("lily_pads")
rng = random.Random(19)
pad_m = comp.mat("lily_pad", srgb((0.22, 0.44, 0.17)), rough=0.35)
vein_m = comp.mat("lily_pad_vein", srgb((0.36, 0.56, 0.24)), rough=0.4)
petal_m = comp.mat("lily_petal", srgb((0.97, 0.8, 0.86)), rough=0.5)
heart_m = comp.mat("lily_heart", srgb((0.95, 0.75, 0.12)), rough=0.5)
keys = []
def pad(r, yaw):
    bm = bmesh.new()
    c = bm.verts.new((0, 0, 0.002))
    N = 28
    rim = []
    for i in range(N + 1):
        a = math.radians(8 + i * (344 / N))
        rr = r * (1 + 0.04 * math.sin(a * 5))
        rim.append((bm.verts.new((rr * 0.6 * math.cos(a), rr * 0.6 * math.sin(a), 0.001)), bm.verts.new((rr * math.cos(a), rr * math.sin(a), 0.006))))
    for i in range(N):
        bm.faces.new((c, rim[i][0], rim[i + 1][0]))
        bm.faces.new((rim[i][0], rim[i][1], rim[i + 1][1], rim[i + 1][0]))
    veins = comp.merge(*[xf(comp.box((r * 0.9, 0.004, 0.0012), at=(r * 0.47, 0, 0.004)), R(8 + k * 344 / 9 + 19, "Z")) for k in range(9)])
    return xf(bm, R(yaw, "Z")), xf(veins, R(yaw, "Z"))
spots = [(0, 0, 0.17), (0.3, 0.12, 0.13), (-0.26, 0.2, 0.15), (0.1, -0.3, 0.12), (-0.2, -0.22, 0.1), (0.48, -0.16, 0.11), (-0.5, -0.05, 0.12), (0.22, 0.42, 0.1), (-0.1, 0.5, 0.13), (0.6, 0.25, 0.08), (-0.45, 0.45, 0.09)]
for i, (x, y, r) in enumerate(spots):
    pv = comp.pivot(col, root, f"lily_pads_pad_{i + 1}", (x, y, 0))
    b, v = pad(r, rng.uniform(0, 360))
    M(f"lily_pads_pad_{i + 1}_leaf", xf(b, T(x, y, 0)), pad_m, parent=pv, smooth=True)
    M(f"lily_pads_pad_{i + 1}_veins", xf(v, T(x, y, 0)), vein_m, parent=pv)
    keys += [(pv, "rotation_euler", 0, 0, math.radians(rng.uniform(-5, 5))), (pv, "rotation_euler", 1, 0, math.radians(rng.uniform(-5, 5))), (pv, "location", 2, 0, rng.uniform(0.004, 0.015))]
def petal(l, w):
    bm = bmesh.new()
    pts = [(0, 0, 0), (w / 2, l * 0.45, 0.012), (0, l, 0.03), (-w / 2, l * 0.45, 0.012), (0, l * 0.5, 0.0)]
    vs = [bm.verts.new(p) for p in pts]
    for a, b_ in ((0, 1), (1, 2), (2, 3), (3, 0)):
        bm.faces.new((vs[4], vs[a], vs[b_]))
    return bm
for i, (x, y, sc) in enumerate(((0.14, 0.06, 1.0), (-0.34, 0.3, 0.8))):
    pv = comp.pivot(col, root, f"lily_pads_flower_{i + 1}", (x, y, 0))
    ps = []
    for ring, (n, tilt, l) in enumerate(((9, 18, 0.075), (8, 45, 0.065), (6, 68, 0.05))):
        for k in range(n):
            ps.append(xf(petal(l * sc, 0.03 * sc), T(x, y, 0.012) @ R(k * 360 / n + ring * 20, "Z") @ R(tilt, "X")))
    M(f"lily_pads_flower_{i + 1}_petals", comp.merge(*ps), petal_m, parent=pv, smooth=True)
    M(f"lily_pads_flower_{i + 1}_heart", sphere(0.014 * sc, at=(x, y, 0.022), u=12, v=8, scale=(1, 1, 0.8)), heart_m, parent=pv, smooth=True)
    keys += [(pv, "rotation_euler", 0, 0, math.radians(rng.uniform(-6, 6))), (pv, "location", 2, 0, rng.uniform(0.006, 0.015))]
M("lily_pads_bud", comp.merge(sphere(0.02, at=(0.42, 0.3, 0.05), u=12, v=10, scale=(0.8, 0.8, 1.6)), comp.cyl(0.004, 0.06, at=(0.42, 0.3, -0.01), seg=8)), petal_m, smooth=True)
channel("bob", keys)
done(col, root, "lily_pads", "own geometry (water lilies)", rig={"bob": "every pad and flower rocks up to 5 degrees and lifts up to 1.5 cm, each its own way"})
