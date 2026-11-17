# kelp/sun: the sun seen through the surface, modelled and painted by hand: a white-hot disc 1.2 m across broken into
# three shards by the waves, a soft halo 6 m across round it, and a burst of sixteen thin rays. A ceiling piece: it
# hangs just under the surface, its origin at the disc's centre on the surface's level, facing down.
# Materials: sun_disc, sun_halo, sun_rays (all glow). Rig: "shimmer" turns the ray burst a sixteenth of a turn and
# swells it by a fifth while the shards slide apart 8 cm (the waves passing over the sun).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
import numpy as np
from comp import T, R, S, xf

col, root = comp.fresh("sun")
Z = -0.34            # under the troughs
disc_m = comp.mat("sun_disc", (1.0, 1.0, 0.95), rough=0.5, alpha=0.99, emit=(1.0, 0.99, 0.9), strength=2500.0)     # blended: only a blended glow reaches full white in raea
n = 256
yy, xx = np.mgrid[0:n, 0:n]
r = np.hypot(xx / n - 0.5, yy / n - 0.5) * 2
a = np.clip(np.exp(-(r / 0.26) ** 2) * 0.95 + 0.22 * np.exp(-(r / 0.62) ** 2) - 0.03, 0, 1) * (r < 1)
halo_png = L.save_png(os.path.join(L.TEX, "sun_halo.png"), np.dstack([np.ones((n, n)) * (0.8 + 0.2 * a), np.ones((n, n)) * (0.97 + 0.03 * a), np.ones((n, n)) * 0.9, a]))
halo_m = L.picture("sun_halo", halo_png, emit=42.0, rough=1.0, alpha=True)
def flat_disc(rad, z, seg=40):
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    c = bm.verts.new((0, 0, z))
    ring = [bm.verts.new((rad * math.cos(2 * math.pi * i / seg), rad * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)]
    for i in range(seg):
        f = bm.faces.new((c, ring[(i + 1) % seg], ring[i]))        # facing down
        for l in f.loops:
            l[uvl].uv = (0.5 + l.vert.co.x / rad / 2, 0.5 + l.vert.co.y / rad / 2)
    return bm
comp.mesh(col, root, "sun_halo", flat_disc(3.0, Z - 0.02), halo_m)
random.seed(3)
shards = []
for k, (dx, dy, sx, sy, rot) in enumerate(((0.0, 0.0, 1.0, 0.72, 10), (0.34, 0.2, 0.42, 0.24, 40), (-0.3, -0.24, 0.5, 0.2, -25))):
    p = comp.pivot(col, root, f"sun_shard_{k + 1}", (dx, dy, Z - 0.05 - k * 0.004))
    d = flat_disc(0.62, 0.0, seg=28)
    xf(d, S(sx, sy, 1))
    xf(d, R(rot, "Z"))
    xf(d, T(dx, dy, Z - 0.05 - k * 0.004))
    comp.mesh(col, root, f"sun_shard_{k + 1}_disc", d, disc_m, parent=p, smooth=True)
    shards.append((p, dx, dy))
rays_m = comp.mat("sun_rays", (1.0, 1.0, 0.9), rough=1.0, alpha=0.1, emit=(0.9, 1.0, 0.9), strength=10.0)
burst = comp.pivot(col, root, "sun_burst", (0, 0, Z - 0.03))
rb = bmesh.new()
for i in range(16):
    ang = 2 * math.pi * i / 16 + random.uniform(-0.08, 0.08)
    ln = random.uniform(1.6, 3.4)
    wd = random.uniform(0.05, 0.11)
    c, s = math.cos(ang), math.sin(ang)
    pts = [(0.3 * c - wd * s, 0.3 * s + wd * c), (0.3 * c + wd * s, 0.3 * s - wd * c), (ln * c, ln * s)]
    f = rb.faces.new([rb.verts.new((px, py, Z - 0.03)) for px, py in pts])
    if f.normal.z > 0:
        f.normal_flip()
comp.mesh(col, root, "sun_rays", rb, rays_m, parent=burst)
keys = [(burst, "rotation_euler", 2, 0.0, math.radians(22.5)), (burst, "scale", 0, 1.0, 1.2), (burst, "scale", 1, 1.0, 1.2)]
for p, dx, dy in shards[1:]:
    ln = math.hypot(dx, dy)
    keys += [(p, "location", 0, p.location.x, p.location.x + dx / ln * 0.08), (p, "location", 1, p.location.y, p.location.y + dy / ln * 0.08)]
L.channel("shimmer", keys)
comp.export(col, root, "kelp", "sun", made="blender/components/kelp/sun.py", source="own geometry and painting", license="ours", credit="",
            rig={"shimmer": "the ray burst (sun_burst) turns 22.5 degrees and swells by a fifth; the two small shards of the disc (sun_shard_2, sun_shard_3) slide 8 cm outward",
                 "glow": "in the scene: the glow of sun_disc, sun_halo and sun_rays (the match cut's circle is sun_disc)"},
            notes="Hang it at the surface's level; its disc is 0.39 m below its origin, under the wave troughs.")
