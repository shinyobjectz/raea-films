# road/windscreen: the car's front from the driver's seat, where the road's shot begins (rain on the windscreen, the
# wipers clearing it onto the road): the same bonnet, screen and wipers as road/car, on the same surface, with what
# the car leaves out: clear glass, the A-pillars, the header with its visors and mirror, a stub of headlining, the
# dashboard with its binnacle, vents and demister slots, the steering wheel on its column, and the rain itself on
# the glass, 5,000 beads and 300 runs. It stands at the car's own origin (swap it for the car while the camera is
# inside). Rig: "wipers" sweeps both blades up and over, and the rain goes from the glass as each blade passes it
# (the swept sectors are clear at the end; the corners and the strip between keep their beads); "run" slides the
# rain 7 cm up the glass (the wind over a moving car's screen).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, B, CL

col, root = comp.fresh("windscreen")
M = _lib.meshers(col, root)
paint = comp.mat("windscreen_paint", (0.125, 0.02, 0.018), rough=0.28)
trim = comp.mat("windscreen_trim", (0.03, 0.03, 0.033), rough=0.7)
dash_m = comp.mat("windscreen_dash", (0.045, 0.045, 0.05), rough=0.75)
cloth = comp.mat("windscreen_headlining", (0.32, 0.31, 0.29), rough=0.95)
glass = comp.mat("windscreen_glass", (0.55, 0.7, 0.68), rough=0.03, alpha=0.1)
rain = comp.mat("windscreen_rain", (0.8, 0.85, 0.92), rough=0.05, alpha=0.4, emit=(0.6, 0.66, 0.75), strength=0.15)
mirror_m = comp.mat("windscreen_mirror", (0.5, 0.55, 0.6), rough=0.03, metal=0.9)
dial = comp.mat("windscreen_dials", (0.9, 0.5, 0.15), rough=0.4, emit=(1.0, 0.55, 0.15), strength=1.2)
rubber = comp.mat("windscreen_rubber", (0.008, 0.008, 0.008), rough=0.85)

# the bonnet and wings ahead of the screen, and the cowl
hood = M("windscreen_bonnet", _lib.car_body(0.95, CL), paint, smooth=True)
M("windscreen_cowl", _lib.top_patch(0.925, 0.975, 0.03, 0.003, nl=2, na=12), trim)
# the glass in its rubber
M("windscreen_glass", _lib.top_patch(0.275, 0.915, 0.04, 0.0, nl=14, na=24), glass, smooth=True)
rb = []
for l0, l1 in ((0.25, 0.277), (0.913, 0.94)):
    rb.append(_lib.top_patch(l0, l1, 0.02, 0.001, nl=1, na=24))
M("windscreen_rubber", comp.merge(*rb), rubber)
# the A-pillars and the header
for s, side in ((-1, "r"), (1, "l")):
    pts = [tuple(B(l, s * (_lib.car_at(l)[5] - 0.005), _lib.top_z(l, _lib.car_at(l)[5]) - 0.012)) for l in [0.95 - 0.72 * i / 10 for i in range(11)]]
    M(f"windscreen_pillar_{side}", comp.tube(pts, 0.036, res=4, sides=3), trim, smooth=True)
hw = _lib.car_at(0.24)[5]
M("windscreen_header", comp.tube([tuple(B(0.235, a, _lib.top_z(0.235, a) - 0.022)) for a in [hw * (2 * i / 8 - 1) for i in range(9)]], 0.04, res=4, sides=3), trim, smooth=True)
M("windscreen_headlining", _lib.top_patch(-0.15, 0.24, 0.0, -0.012, nl=4, na=16), cloth, smooth=True)
vis = []
for a in (-0.36, 0.36):
    v = comp.box((0.34, 0.16, 0.014))
    xf(v, R(12, "X")); xf(v, T(*B(0.12, a, _lib.top_z(0.12, a) - 0.055)))
    vis.append(v)
vo = M("windscreen_visors", comp.merge(*vis), cloth)
comp.bevel(vo, 0.005, 2)
zc = _lib.top_z(0.3, 0) - 0.03
M("windscreen_mirror_stalk", comp.cyl(0.008, 0.07, at=tuple(B(0.3, 0, zc - 0.07)), seg=8), trim)
mh = M("windscreen_mirror_housing", comp.box((0.25, 0.03, 0.065), at=tuple(B(0.27, 0, zc - 0.095))), trim)
comp.bevel(mh, 0.01, 3)
M("windscreen_mirror", comp.box((0.23, 0.003, 0.05), at=tuple(B(0.254, 0, zc - 0.095))), mirror_m)

# the dashboard: a top that falls from the screen's foot to a rolled edge, the binnacle over the dials, vents
DZ = _lib.z_belt(0.93) - 0.025
db = bmesh.new()
rows = []
for i in range(13):
    l = 0.955 - 0.5 * i / 12
    w = _lib.car_at(l)[0] - 0.09
    t = i / 12
    z = DZ - 0.02 * t - 0.07 * max(0.0, (t - 0.8) / 0.2) ** 2
    rows.append([db.verts.new(B(l, w * (2 * j / 16 - 1), z)) for j in range(17)])
for i in range(12):
    for j in range(16):
        db.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
do = M("windscreen_dash", db, dash_m, smooth=True)
comp.solidify(do, 0.03, -1)
M("windscreen_dash_face", comp.box((1.46, 0.03, 0.24), at=tuple(B(0.45, 0, DZ - 0.19))), dash_m)
bn = bmesh.new()
bmesh.ops.create_uvsphere(bn, u_segments=20, v_segments=10, radius=1.0)
bmesh.ops.bisect_plane(bn, geom=bn.verts[:] + bn.edges[:] + bn.faces[:], plane_co=(0, 0, 0), plane_no=(0, 0, -1), clear_outer=True)
xf(bn, S(0.2, 0.15, 0.075)); xf(bn, T(*B(0.56, 0.37, DZ - 0.022)))
M("windscreen_binnacle", bn, dash_m, smooth=True)
M("windscreen_dials", comp.merge(*[xf(comp.cyl(0.045, 0.004, seg=24, axis="Y"), T(*B(0.455, 0.37 + da, DZ - 0.005))) for da in (-0.075, 0.075)]), dial)
sl = [comp.box((0.3, 0.012, 0.004), at=tuple(B(0.9, a, DZ - 0.0005))) for a in (-0.4, 0.0, 0.4)]
sl += [comp.box((0.16, 0.006, 0.06), at=tuple(B(0.435, a, DZ - 0.13))) for a in (-0.62, -0.1, 0.1, 0.66)]
M("windscreen_vents", comp.merge(*sl), trim)
# the steering wheel: a rim, three spokes and a boss, tilted on its column
sw = bmesh.new()
bmesh.ops.create_circle(sw, segments=12, radius=0.016)
xf(sw, R(90, "X")); xf(sw, T(0.185, 0, 0))
bmesh.ops.spin(sw, geom=sw.verts[:] + sw.edges[:], cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=40, use_duplicate=False)
bmesh.ops.remove_doubles(sw, verts=sw.verts, dist=1e-5)
parts = [sw, comp.cyl(0.055, 0.05, at=(0, 0, -0.045), seg=20)]
for ang in (90, 210, 330):
    parts.append(xf(comp.box((0.17, 0.03, 0.014), at=(0.1, 0, -0.012)), R(ang, "Z")))
parts.append(comp.cyl(0.024, 0.3, at=(0, 0, -0.33), seg=12))
wheel = comp.merge(*parts)
xf(wheel, R(-64, "X")); xf(wheel, T(*B(0.3, 0.37, DZ - 0.08)))
M("windscreen_steering_wheel", wheel, trim, smooth=True)

# the wipers
keys = _lib.wipers(col, root, "windscreen")

# the rain on the glass: beads and runs, sorted by the moment a blade reaches them
rnd = random.Random(61)
frames = {}
def add(group, p, kind):
    bm = frames.setdefault(group, bmesh.new())
    if kind == "bead":
        r = rnd.uniform(0.0009, 0.0026)
        c = bm.verts.new(p + _lib.GLASS_N * r * 0.45)
        ring = [bm.verts.new(p + Vector((1, 0, 0)) * (r * math.cos(a)) + _lib.GLASS_UP * (r * 1.2 * math.sin(a))) for a in [2 * math.pi * i / 8 for i in range(8)]]
        for i in range(8):
            bm.faces.new((c, ring[i], ring[(i + 1) % 8]))
    else:
        ln, w = rnd.uniform(0.03, 0.13), rnd.uniform(0.0005, 0.001)
        wob = rnd.uniform(-0.2, 0.2)
        prev = None
        for i in range(5):
            q = p + _lib.GLASS_UP * (ln * i / 4) + Vector((1, 0, 0)) * (wob * ln * math.sin(i * 1.3)) + _lib.GLASS_N * 0.0005
            cur = (bm.verts.new(q - Vector((w * (1 - 0.15 * i), 0, 0))), bm.verts.new(q + Vector((w * (1 - 0.15 * i), 0, 0))))
            if prev:
                bm.faces.new((prev[0], prev[1], cur[1], cur[0]))
            prev = cur
inv = [(_lib.glass_frame(a, lift=0.0).inverted(), arm, blade, sweep) for nm, a, arm, blade, sweep in _lib.WIPERS]
for i in range(5300):
    l = rnd.uniform(0.285, 0.905)
    wr = _lib.car_at(l)[5] - 0.05
    a = rnd.uniform(-wr, wr)
    p = B(l, a, _lib.top_z(l, a)) + _lib.GLASS_N * 0.0008
    when = None
    for m, arm, blade, sweep in inv:
        q = m @ p
        r, ang = math.hypot(q.x, q.y), math.degrees(math.atan2(q.y, q.x))
        if arm - blade / 2 <= r <= arm + blade / 2 and 180 + sweep <= ang <= 180:
            f = max(1, math.ceil((180 - ang) / -sweep * comp.FPS))
            when = f if when is None else min(when, f)
    add(when, p, "bead" if i < 5000 else "run")
steps = []
runs = []
for group, bm in sorted(frames.items(), key=lambda kv: -1 if kv[0] is None else kv[0]):
    o = M("windscreen_rain_kept" if group is None else f"windscreen_rain_{group:02d}", bm, rain, smooth=True)
    runs.append(o)
    if group is not None:
        steps += [(o, "scale", k, 1.0, 0.001, group) for k in range(3)]
_lib.channel("wipers", keys, steps)
_lib.channel("run", [(o, "location", k, 0.0, _lib.GLASS_UP[k] * 0.07) for o in runs for k in (1, 2)])
_lib.done(col, root, "windscreen", source="own geometry (road/car's bonnet, screen and wipers, and its cabin's front)", license="ours", credit="",
          rig={"wipers": "both blades sweep up the screen and over toward the car's left (from inside: right to left), the driver's 93 degrees; the rain in each blade's path goes as the blade reaches it, so at the clip's end two sectors are clear",
               "run": "every bead and run slides 7 cm up the glass",
               "rain": "in the scene: windscreen_rain's alpha (how wet the glass is), windscreen_glass's alpha"},
          notes="At road/car's origin and facing the same way; the driver's eye is about (x 0.37, y 1.14, z 0.05) in raea's frame. The rain is in 31 parts by the frame a blade reaches it (windscreen_rain_01..30, windscreen_rain_kept).")
