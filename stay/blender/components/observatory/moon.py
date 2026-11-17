# observatory/moon: the moon the cut lands on, modelled by hand: a 1 m sphere wearing our own painted map of the near
# side (the maria where they are: Imbrium, Serenitatis, Tranquillitatis, Crisium, Fecunditatis, Nectaris, Procellarum,
# Nubium, Humorum, Frigoris; Tycho, Copernicus and Kepler with their rays, Aristarchus, Plato, Grimaldi; three
# thousand smaller craters), glowing by its own picture (moon_surface), a night-side shell that swings round it for
# the phase, and a soft halo behind it (moon_halo). It hangs centred on the origin, its near side toward -y; set it
# far off and scale it (1 m across at 110 m is the real moon's half degree).
# Rig: "phase" swings the night side round from full to a crescent (118 degrees); "rise" lifts it 1 m (its own
# width); "halo" swells the halo by half; "glow" is the scene's (moon_surface, moon_halo).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
import numpy as np
from _lib import T, R, S, xf, Vector

col, root = comp.fresh("moon")
M = _lib.maker(col, root)
D2R = math.pi / 180


def moon_map(u, v):
    h, w = u.shape
    rng = np.random.default_rng(1969)
    lon, lat = 2 * np.pi * (u - 0.5), np.pi * (v - 0.5)
    X, Y, Z = np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)

    def at(l, b):                                   # a unit vector for a selenographic longitude (east +) and latitude
        l, b = l * D2R, b * D2R
        return np.sin(l) * np.cos(b), -np.cos(l) * np.cos(b), np.sin(b)

    def dist(l, b):
        x, y, z = at(l, b)
        return np.arccos(np.clip(X * x + Y * y + Z * z, -1, 1)) / D2R

    def noise(scale, seed, waves=18):               # smooth noise on the sphere: a sum of random plane waves near one scale
        r = np.random.default_rng(seed)
        n = np.zeros_like(X)
        for _ in range(waves):
            k = r.normal(0, 1, 3)
            k = k / np.linalg.norm(k) * scale * r.uniform(0.6, 1.4)
            n += np.sin(X * k[0] + Y * k[1] + Z * k[2] + r.uniform(0, 6.28))
        return n / math.sqrt(waves / 2)

    octs = [noise(s, i + 1) for i, s in enumerate((3, 7, 15, 31, 63, 120))]
    fbm = lambda lo_, amp=0.5: sum(o * amp ** j for j, o in enumerate(octs[lo_:]))
    # the highlands: bright, mottled, brighter still to the south
    alb = 0.66 + 0.05 * fbm(1) + 0.035 * octs[4] + 0.03 * octs[5] - 0.05 * Z
    # the maria: a field of soft blobs that run into each other, its shore broken by the noise at every scale
    maria = [(-16, 33, 17, 1.0), (18, 27, 10.5, 1.0), (30, 9, 12, 1.0), (59, 17, 7.5, 1.05), (51, -6, 9, 0.9), (35, -15, 6, 0.9), (-55, 22, 17, 0.9), (-48, 4, 15, 0.9), (-62, -4, 9, 0.6), (-17, -21, 11, 0.85),
             (-39, -24, 6.5, 0.95), (4, 13, 4, 0.7), (-23, -9, 7, 0.75), (-31, 8, 9, 0.7), (-3, 57, 5, 0.7), (-22, 56, 5.5, 0.7), (16, 55, 5.5, 0.7), (33, 53, 4.5, 0.55), (87, -3, 6, 0.7), (-68, -5, 2.6, 1.1), (-9, 51.5, 1.5, 1.1),
             (-38, 44, 6, 0.6), (22, 17, 4, 0.5), (41, 2, 5, 0.5), (-8, -10, 4, 0.5)]
    field = np.zeros_like(X)
    for l, b, r, s in maria:
        field += s * np.exp(-(dist(l, b) / r) ** 2 * 1.1)
    shore = field + 0.16 * octs[2] + 0.11 * octs[3] + 0.07 * octs[4] + 0.05 * octs[5] + 0.1 * octs[1]
    sea = np.clip((shore - 0.42) / 0.16, 0, 1)
    sea = sea * sea * (3 - 2 * sea)
    mare = 0.36 + 0.03 * fbm(2) + 0.025 * octs[5] - 0.04 * np.clip(field - 0.8, 0, 1)
    alb = alb * (1 - sea) + mare * sea
    # the rayed craters: fine rays of many widths, fading with distance
    for l, b, r, reach, k in ((-11.2, -43.3, 1.1, 34, 0.2), (-20, 9.6, 1.2, 9, 0.14), (-38, 8.1, 0.5, 5, 0.12), (-47.5, 23.7, 0.5, 2.5, 0.2), (-61, -9, 0.3, 3, 0.1), (26, -11, 0.3, 3, 0.08), (47, 32, 0.4, 5, 0.1)):
        x, y, z = at(l, b)
        d = dist(l, b)
        # a bearing about the crater: from the tangent axes at it
        ex = np.array([-y, x, 0.0]) / (math.hypot(x, y) + 1e-9)
        ey = np.cross([x, y, z], ex)
        a = np.arctan2(X * ey[0] + Y * ey[1] + Z * ey[2], X * ex[0] + Y * ex[1] + Z * ex[2])
        rr = np.random.default_rng(int(abs(l * 7 + b * 13)))
        rays = sum(np.clip(np.cos((a - rr.uniform(0, 6.28)) * 1.0), 0, 1) ** rr.uniform(120, 900) * rr.uniform(0.4, 1.0) for _ in range(16))
        rays += 0.25 * np.clip(octs[3] * 0.5 + 0.5, 0, 1)
        alb += k * np.clip(rays, 0, 1.4) * np.exp(-d / (reach * 0.5)) * (d > r * 0.9)
        alb += 0.16 * np.exp(-((d - r) / (0.3 * r + 0.05)) ** 2) + 0.1 * np.exp(-(d / (r * 3.0)) ** 2)
    # the small craters: a soft bright rim round a floor a shade darker, by angular distance in a window of the map
    n = 2600
    cl, cb = rng.uniform(-180, 180, n), np.degrees(np.arcsin(rng.uniform(-1, 1, n)))
    cr = 0.14 + 1.9 * rng.random(n) ** 6
    for i in range(n):
        vy = int((cb[i] / 180 + 0.5) * h)
        span = cr[i] * 2.4 + 0.3
        dy = int(span / 180 * h) + 2
        dx = min(int(span / 360 * w / max(math.cos(cb[i] * D2R), 0.1)) + 2, w // 2)
        y0, y1 = max(vy - dy, 0), min(vy + dy, h)
        ux = int(((cl[i] - 90) / 360 + 0.5) % 1 * w)
        cols = np.arange(ux - dx, ux + dx) % w
        x, y, z = at(cl[i], cb[i])
        d = np.arccos(np.clip(X[y0:y1][:, cols] * x + Y[y0:y1][:, cols] * y + Z[y0:y1][:, cols] * z, -1, 1)) / D2R
        r = cr[i]
        k = rng.uniform(0.3, 1.0)
        sub = alb[y0:y1][:, cols]
        sub += k * (0.055 * np.exp(-((d - r) / (0.28 * r + 0.04)) ** 2) - 0.03 * np.exp(-(d / (0.7 * r)) ** 2))
        if rng.random() < 0.06:                     # a young one: a small bright splash
            sub += 0.12 * np.exp(-(d / (r * 1.6 + 0.2)) ** 2)
        alb[np.ix_(np.arange(y0, y1), cols)] = sub
    alb = np.clip(alb, 0.05, 1.0)
    return np.stack([alb * 1.0, alb * 0.98, alb * 0.93], axis=-1)


def halo_map(u, v):
    d = np.hypot(u - 0.5, v - 0.5) * 2
    a = np.clip(1 - d, 0, 1) ** 2.4 * 0.5 * (d > 0.0)
    return np.stack([np.ones_like(u) * 0.8, np.ones_like(u) * 0.86, np.ones_like(u), a], axis=-1)


surface = _lib.image_mat("moon_surface", _lib.paint("moon_surface", 2048, 1024, moon_map), rough=1.0, emit=4200.0)
night = comp.mat("moon_night", (0.004, 0.005, 0.008), rough=1.0)
halo_m = _lib.alpha_image_mat("moon_halo", _lib.paint("moon_halo", 256, 256, halo_map), rough=1.0, emit=6.0)
rise = comp.pivot(col, root, "moon_rise", (0, 0, 0))
bm = _lib.sphere_uv(0.5, seg=96, rings=48)
M("moon_surface", bm, surface, parent=rise)
phase = comp.pivot(col, root, "moon_phase", (0, 0, 0), parent=rise)
sh = bmesh.new()
bmesh.ops.create_uvsphere(sh, u_segments=64, v_segments=32, radius=0.503)
bmesh.ops.bisect_plane(sh, geom=sh.verts[:] + sh.edges[:] + sh.faces[:], plane_co=(0, 0, 0), plane_no=(0, 1, 0), clear_inner=True)
M("moon_night", sh, night, parent=phase)
hp = comp.pivot(col, root, "moon_halo", (0, 0.02, 0), parent=rise)
hb = comp.grid(3.4, 3.4, 1, 1)
xf(hb, T(0, 0.02, 0))
h = M("moon_halo_mesh", hb, halo_m, parent=hp, smooth=False)
_lib.uv_planar(h, (-1.7, -1.7), (1.7, 1.7), axes=(0, 2))
_lib.channel("phase", [(phase, "rotation_euler", 2, 0, math.radians(118))])
_lib.channel("rise", [(rise, "location", 2, 0, 1.0)])
_lib.channel("halo", [(hp, "scale", 0, 1.0, 1.5), (hp, "scale", 2, 1.0, 1.5)])
comp.export(col, root, "observatory", "moon", made="blender/components/observatory/moon.py", source="own geometry and our own painted map of the near side", license="ours", credit="",
            rig={"phase": "the night side swings round from full to a crescent (118 degrees about the moon's upright axis)", "rise": "the moon lifts its own width (1 m before the scene's scale)",
                 "halo": "the halo swells by half", "glow": "in the scene: the materials moon_surface (the disc's brightness) and moon_halo"},
            notes="origin: its centre; 1 m across, the near side toward the camera (-y). 1 m at 110 m is the real moon's half degree; a shot scales it up")
