# road/puddles: the four puddles that stand in road/road's dips, each an irregular sheet of dark water lying in its dip with a soft
# edge (a hard-edged glossy disc reads as a hole in raea's traced light), and three rain rings on each. Rig: "open"
# spreads every puddle from nothing to its full size about its own middle (the soak); "rings" runs the rain rings
# out from their drops and loops.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

from mathutils import noise
import numpy as np
col, root = comp.fresh("puddles")
M = _lib.meshers(col, root)
tex = _lib.picture(os.path.join(comp.CACHE, "own", "road", "puddle2.png"), 256, 256,
                   lambda u, v: (0.07, 0.09, 0.12, np.clip((1.0 - np.hypot(u - 0.5, v - 0.5) * 2) / 0.22, 0, 1) ** 1.5 * 0.94))
ring_tex = _lib.picture(os.path.join(comp.CACHE, "own", "road", "ring2.png"), 256, 256,
                        lambda u, v: (0.7, 0.76, 0.84, np.exp(-((np.hypot(u - 0.5, v - 0.5) * 2 - 0.82) / 0.07) ** 2) * 0.55))
water = _lib.pic_mat("puddle_water", tex, mode="BLEND", rough=0.03)
ring_m = _lib.pic_mat("puddle_ring", ring_tex, mode="BLEND", rough=0.1)
rnd = random.Random(9)
opens, ring_keys = [], []
for k, (px, py, hx, hy) in enumerate(_lib.DIPS):
    z = _lib.road_z(px, py) + 0.014
    p = comp.pivot(col, root, f"puddle_{k + 1}", (px, py, z))
    bm = bmesh.new()
    uv = bm.loops.layers.uv.verify()
    n, nr = 48, 6
    lift = lambda x, y: _lib.road_z(x, y) + 0.014
    rings = []
    for j in range(1, nr + 1):
        row = []
        for i in range(n):
            a = 2 * math.pi * i / n
            r = (1.0 + 0.16 * noise.noise(Vector((math.cos(a) * 1.3 + k * 7, math.sin(a) * 1.3, 0.5))) + 0.06 * math.sin(3 * a + k)) * j / nr
            x, y = px + hx * r * math.cos(a), py + hy * r * math.sin(a)
            row.append((bm.verts.new((x, y, lift(x, y))), (0.5 + 0.5 * j / nr * math.cos(a), 0.5 + 0.5 * j / nr * math.sin(a))))
        rings.append(row)
    c = bm.verts.new((px, py, lift(px, py)))
    for i in range(n):
        f = bm.faces.new((c, rings[0][i][0], rings[0][(i + 1) % n][0]))
        for l, t in zip(f.loops, ((0.5, 0.5), rings[0][i][1], rings[0][(i + 1) % n][1])):
            l[uv].uv = t
        for j in range(nr - 1):
            q = (rings[j][i], rings[j][(i + 1) % n], rings[j + 1][(i + 1) % n], rings[j + 1][i])
            f = bm.faces.new([v for v, t in q])
            for l, (v, t) in zip(f.loops, q):
                l[uv].uv = t
    _lib.recentre(M(f"puddle_{k + 1}_water", bm, water, parent=p), (px, py, z))
    opens += [(p, "scale", 0, 0.001, 1.0), (p, "scale", 1, 0.001, 1.0)]
    for j in range(3):
        rx, ry = px + hx * rnd.uniform(-0.45, 0.45), py + hy * rnd.uniform(-0.45, 0.45)
        z = _lib.road_z(rx, ry) + 0.018
        rp = comp.pivot(col, root, f"puddle_{k + 1}_ring_{j + 1}", (rx, ry, z + 0.002 + 0.001 * j), parent=p)
        rb = bmesh.new()
        ruv = rb.loops.layers.uv.verify()
        R0 = rnd.uniform(0.16, 0.3)
        f = rb.faces.new([rb.verts.new((rx + sx * R0, ry + sy * R0, z + 0.002 + 0.001 * j)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
        for l, t in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
            l[ruv].uv = t
        _lib.recentre(M(f"puddle_{k + 1}_ring_{j + 1}_mesh", rb, ring_m, parent=rp), (rx, ry, z + 0.3))
        s0 = 0.05 + 0.3 * j
        ring_keys += [(rp, "scale", 0, s0, s0 + 1.0), (rp, "scale", 1, s0, s0 + 1.0)]
_lib.channel("open", opens)
_lib.channel("rings", ring_keys)
_lib.done(col, root, "puddles", source="own geometry and pictures", license="ours", credit="",
          rig={"open": "every puddle spreads from nothing to its full size about its own middle (puddle_1 is the one the car comes through, at raea x -1.4, z 8 of the road section)",
               "rings": "three rain rings on each puddle run out from their drops; loops"},
          notes="At road/road's origin, 4 mm over its wet film. Soft-edged alpha-blended sheets, not glossy discs, and paler than the wet road (the sky in them): raea's traced light draws no mirror reflections.")
