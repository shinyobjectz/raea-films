# road/spray: the water a wheel throws out of a puddle, about its contact patch at the origin (the car runs toward
# -y): two wings of sheet and droplets thrown out to either side, low and fast, a rooster tail up and back behind the
# tyre, 1,500 droplets as slivers stretched along their flight (3-9 mm wide, never round: round reads as rice), and
# soft mist sprites low in it. Rig: "burst" grows the whole throw from nothing out of the contact patch and flings
# the droplets along their arcs; "fall" then drops it back into the road.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

import numpy as np
col, root = comp.fresh("spray")
M = _lib.meshers(col, root)
drop = comp.mat("spray_drops", (0.78, 0.83, 0.9), rough=0.15, alpha=0.6, emit=(0.7, 0.75, 0.85), strength=0.3)
sheet_m = comp.mat("spray_sheet", (0.62, 0.68, 0.76), rough=0.1, alpha=0.1)
mist_tex = _lib.picture(os.path.join(comp.CACHE, "own", "road", "mist2.png"), 128, 128,
                        lambda u, v: (0.8, 0.84, 0.9, np.clip(1 - np.hypot(u - 0.5, v - 0.5) * 2, 0, 1) ** 2 * 0.11))
mist = _lib.pic_mat("spray_mist", mist_tex, mode="BLEND", rough=0.9)
rnd = random.Random(21)
burst = comp.pivot(col, root, "spray_burst", (0, 0, 0))
G = 9.81

def arc(v0, t):
    return Vector((v0.x * t, v0.y * t, max(0.0, v0.z * t - 0.5 * G * t * t)))

db = bmesh.new()
for i in range(1500):
    kind = rnd.random()
    if kind < 0.72:      # the wings: out to a side, a little back, low
        s = rnd.choice((-1, 1))
        v0 = Vector((s * rnd.uniform(2.5, 7.5), rnd.uniform(-0.8, 3.0), rnd.uniform(0.8, 4.2)))
    else:                # the rooster tail: up and back
        v0 = Vector((rnd.uniform(-0.8, 0.8), rnd.uniform(2.0, 6.0), rnd.uniform(1.5, 5.0)))
    t = rnd.uniform(0.05, 0.42)
    p = arc(v0, t)
    vel = Vector((v0.x, v0.y, v0.z - G * t))
    ln = min(0.22, vel.length / 60.0 * rnd.uniform(0.8, 1.6))
    d = vel.normalized()
    hw = rnd.uniform(0.0015, 0.0045)
    for ax in (Vector((0, 0, 1)), Vector((1, 0, 0))):
        side = d.cross(ax)
        if side.length < 1e-3:
            continue
        side = side.normalized() * hw
        db.faces.new([db.verts.new(q) for q in (p - side, p + side, p + d * ln + side * 0.4, p + d * ln - side * 0.4)])
M("spray_droplets", db, drop, parent=burst)
# the sheets: a thin curved skin of water leaving the tyre to each side
for s, side in ((-1, "l"), (1, "r")):
    sb = bmesh.new()
    nu, nv = 28, 16
    grid = []
    for j in range(nv + 1):
        row = []
        for i in range(nu + 1):
            u, v = i / nu, j / nv
            out = 0.12 + 1.5 * u * (0.85 + 0.15 * math.sin(5 * v + 2 * s))
            back = -0.25 + 0.9 * v + 0.5 * u * v
            up = (0.62 * u - 0.5 * u * u) * (1.2 - 0.5 * v) * 1.5 + 0.02
            wob = 0.02 * u * math.sin(6 * v + 3 * u)
            row.append(sb.verts.new((s * out, back, up + wob)))
        grid.append(row)
    for j in range(nv):
        for i in range(nu):
            sb.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    M(f"spray_sheet_{side}", sb, sheet_m, parent=burst, smooth=True)
# mist: soft sprites on crossed cards, low and behind
mb = bmesh.new()
uv = mb.loops.layers.uv.verify()
for i in range(110):
    c = Vector((rnd.uniform(-1.7, 1.7), rnd.uniform(-0.2, 2.8), rnd.uniform(0.1, 0.6)))
    r = rnd.uniform(0.18, 0.42)
    a0 = rnd.uniform(0, math.pi)
    for a in (a0, a0 + math.pi / 2):
        sx = Vector((math.cos(a), math.sin(a), 0)) * r
        sz = Vector((0, 0, r * 0.7))
        _lib.quad(c - sx - sz, c + sx - sz, c + sx + sz, c - sx + sz, ((0, 0), (1, 0), (1, 1), (0, 1)), mb, uv)
M("spray_mist", mb, mist, parent=burst)
# "fall" first, so the pose left at rest is the burst's start (nothing), and every clip keys all of the scale
_lib.channel("fall", [(burst, "location", 2, 0.0, -1.5), (burst, "scale", 0, 1.0, 1.3), (burst, "scale", 1, 1.0, 1.3), (burst, "scale", 2, 1.0, 1.0)])
_lib.channel("burst", [(burst, "scale", 0, 0.02, 1.0), (burst, "scale", 1, 0.02, 1.0), (burst, "scale", 2, 0.02, 1.0), (burst, "location", 2, 0.0, 0.0)])
_lib.done(col, root, "spray", source="own geometry and pictures", license="ours", credit="",
          rig={"burst": "the whole throw grows from the contact patch to its full reach (3.3 m wide, 1 m high)",
               "fall": "after the burst: the whole throw drops 1.5 m, through the road and out of sight, spreading a third wider as it goes"},
          notes="Its origin is the tyre's contact patch; the car's nose is toward raea +z, the tail of the spray toward -z. One under each front wheel as it enters the puddle.")
