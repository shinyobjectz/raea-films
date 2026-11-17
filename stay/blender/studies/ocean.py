# The open sea as a baked mesh a frame, for raea's <MeshSequence>: Blender's ocean modifier (Tessendorf's FFT spectrum)
# displacing our own grid, dense under the boat (10 cm) and coarse out to 300 m. Three tiles are summed, as a real sea
# is: the swell (JONSWAP for a storm), the chop on it, and the ripples on that. Their choppiness pulls the crests sharp.
# Foam is computed where the surface folds (the Jacobian of the horizontal pull), broken into streaks down the wind,
# and lingers after the crest has passed; it is each vertex's colour (deep water to white). Spray is thrown off the
# breaking crests and off the bow when it drops, as a second sequence of small droplets on ballistic paths.
# The boat steams into it: the grid rides with the hull, which pushes the water down under itself, piles a bow wave,
# trails a Kelvin wedge (19.47 degrees) and a propeller wash, and wears a band of foam. Its ride is read off the same
# waves: nine points under the hull, through a damped spring for heave, pitch and roll.
#   raea blender run blender/studies/ocean.py media/ocean/storm.raw.rseq storm 120
#   bun tools/rseq-zstd.ts media/ocean/storm.raw.rseq media/ocean/storm.rseq   (and the same for storm-spray)
# Writes OUT, OUT's -spray twin (both codec raw) and NAME.boat.json: per frame the boat's y, pitch and roll (raea's
# frame, radians).
import bpy, sys, json, math, struct
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
out, state, frames = argv[0], argv[1], int(argv[2])
FPS = 30
# An optional speed ramp, "ramp:U0,U1,S": the sea runs at its own speed until U0 seconds of screen time, eases to S of
# it by U1, and stays there (the director, 11-11: "make sure the ocean goes normal speed to slow motion the ship goin up a
# wave. with splash"). Every frame is baked at its own moment, so the slow part is smooth, not held frames.
RAMP = next((a for a in argv[3:] if a.startswith("ramp:")), None)
def _speed(u):
    if not RAMP:
        return 1.0
    u0, u1, slow = (float(x) for x in RAMP[5:].split(","))
    k = min(1.0, max(0.0, (u - u0) / (u1 - u0)))
    return 1.0 + (slow - 1.0) * (k * k * (3 - 2 * k))
DT = [_speed(f / FPS) / FPS for f in range(frames)]          # seconds of sea time each frame takes
TAU = [sum(DT[:f]) for f in range(frames)]                   # the sea's time at each frame
STATES = {
    # wave_scale is the sea's height, choppiness the crests' sharpness, wind m/s, foam how readily it breaks white
    "calm": dict(spectrum="PIERSON_MOSKOWITZ", wave_scale=0.5, choppiness=0.8, wind=7.0, foam=-0.2, speed=1.0, spray=0, knots=2.5),
    "swell": dict(spectrum="PIERSON_MOSKOWITZ", wave_scale=1.3, choppiness=1.2, wind=13.0, foam=0.1, speed=1.0, spray=20, knots=5.0),
    "storm": dict(spectrum="JONSWAP", wave_scale=2.6, choppiness=1.75, wind=24.0, foam=0.35, speed=1.15, spray=110, knots=6.0),
}
S = STATES[state]
N, R, A = 340, 300.0, 0.055   # verts a side, half-extent in metres, how much of the spacing is uniform (the rest cubic)
WIND = math.radians(20)
U = S["knots"] * 0.5144          # the boat's way through the water, m/s, heading -y (raea +z)
G = 9.81
rng = np.random.default_rng(11)

bpy.ops.wm.read_factory_settings(use_empty=True)
u = np.linspace(-1.0, 1.0, N)
axis = R * (A * u + (1 - A) * u ** 3)
X, Y = np.meshgrid(axis, axis, indexing="xy")
verts = np.stack([X.ravel(), Y.ravel(), np.zeros(N * N)], axis=1)
i, j = np.meshgrid(np.arange(N - 1), np.arange(N - 1), indexing="xy")
a = (j * N + i).ravel(); b = a + 1; c = a + N + 1; d = a + N
faces = np.stack([a, b, c, d], axis=1)
me = bpy.data.meshes.new("sea")
me.from_pydata(verts.tolist(), [], faces.tolist())
me.update()
ob = bpy.data.objects.new("sea", me)
bpy.context.scene.collection.objects.link(ob)

def tile(name, spectrum, res, size, scale, chop, wind, align, turn, seed):
    m = ob.modifiers.new(name, "OCEAN")
    m.geometry_mode = "DISPLACE"
    m.spectrum = spectrum
    m.resolution = res
    m.spatial_size = size
    m.wave_scale = scale
    m.wave_scale_min = 0.0
    m.choppiness = chop
    m.wind_velocity = wind
    m.wave_alignment = align
    m.wave_direction = WIND + math.radians(turn)
    m.damping = 0.4
    m.depth = 400
    m.random_seed = seed
    return m
TILES = [
    (tile("swell", S["spectrum"], 15, 140, S["wave_scale"], S["choppiness"], S["wind"], 0.35, 0, 7), 1.0),
    (tile("chop", "PHILLIPS", 16, 31, S["wave_scale"] * 0.5, 1.0, S["wind"] * 0.5, 0.2, 35, 3), 1.6),
    (tile("ripple", "PHILLIPS", 14, 11, S["wave_scale"] * 0.2, 0.8, S["wind"] * 0.3, 0.0, -50, 5), 2.4),
]

tri = np.concatenate([faces[:, [0, 1, 2]], faces[:, [0, 2, 3]]]).astype(np.uint32)
DEEP = np.array([0.016, 0.085, 0.105])    # the water's own colour, sRGB
WHITE = np.array([0.94, 0.96, 0.96])
# foam breaks into streaks down the wind: a fixed noise, long along the wind and short across it
along = X * math.cos(WIND) + Y * math.sin(WIND); across = -X * math.sin(WIND) + Y * math.cos(WIND)
streak = (0.5 + 0.25 * np.sin(across * 2.1 + 1.7 * np.sin(along * 0.11)) + 0.25 * np.sin(across * 5.3 + along * 0.4 + 2.0 * np.sin(across * 0.7))).ravel().astype(np.float32)

def frame_mesh(f):
    for m, rate in TILES:
        m.time = TAU[f] * S["speed"] * rate
    # the grid rides with the boat: sample the sea where the boat is now, then bring it back to the boat's frame
    off = np.array([0.0, -U * TAU[f], 0.0], dtype=np.float32)
    me.vertices.foreach_set("co", (verts + off).astype(np.float32).ravel())
    me.update()
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    ev = ob.evaluated_get(dg)
    em = ev.to_mesh()
    n = len(em.vertices)
    pos = np.empty(n * 3, dtype=np.float32); em.vertices.foreach_get("co", pos); pos = pos.reshape(-1, 3) - off
    nrm = np.empty(n * 3, dtype=np.float32); em.vertices.foreach_get("normal", nrm); nrm = nrm.reshape(-1, 3)
    ev.to_mesh_clear()
    px, py = pos[:, 0].reshape(N, N), pos[:, 1].reshape(N, N)
    dxdx = np.gradient(px, axis, axis=1); dxdy = np.gradient(px, axis, axis=0)
    dydx = np.gradient(py, axis, axis=1); dydy = np.gradient(py, axis, axis=0)
    jac = (dxdx * dydy - dxdy * dydx).ravel()
    # the fold: foam = saturate((threshold - J) / 0.4), as the FFT oceans do (Tessendorf; GodotOceanWaves, Crest)
    fold = np.clip((S["foam"] + 0.12 - jac) / 0.35, 0, 1).astype(np.float32)
    return pos, nrm, fold

def pack(p, q, rgb, idx):
    lo, hi = p.min(axis=0), p.max(axis=0)
    span = np.where(hi - lo > 1e-9, hi - lo, 1.0)
    pq = np.round((p - lo) / span * 65535).astype("<u2")
    nq = np.round(np.clip(q, -1, 1) * 32767).astype("<i2")
    rgba = np.concatenate([np.round(np.clip(rgb, 0, 1) * 255), np.full((len(p), 1), 255)], axis=1).astype(np.uint8)
    return struct.pack("<II3f3f", len(p), len(idx), *lo.astype(float), *hi.astype(float)) + pq.tobytes() + nq.tobytes() + rgba.tobytes() + idx.astype("<u4").tobytes()

# Blender (x, y, z up) to raea (x, y up, z toward the viewer): (x, z, -y)
def R3(v):
    return np.stack([v[:, 0], v[:, 2], -v[:, 1]], axis=1)

def write(path, blobs):
    head = {"fps": FPS, "frames": len(blobs), "codec": "raw", "attrs": ["position", "normal", "color"], "texture": None, "index": []}
    for _ in range(3):
        hj = json.dumps(head).encode()
        off = 12 + len(hj)
        head["index"] = []
        for bl in blobs:
            head["index"].append([off, len(bl)]); off += len(bl)
    hj = json.dumps(head).encode()
    assert head["index"][0][0] == 12 + len(hj), "header length didn't settle"
    with open(path, "wb") as fh:
        fh.write(b"RSEQ" + struct.pack("<II", 1, len(hj)) + hj)
        for bl in blobs:
            fh.write(bl)

# ---- the hull in the water (the boat's frame: bow at y -4.5, stern at +4.5, 1.65 m half beam) ----------------------
XF, YF = X.ravel().astype(np.float32), Y.ravel().astype(np.float32)
rr = (np.abs(XF) / 1.65) ** 2.5 + (np.abs(YF) / 4.55) ** 2.5
rad = rr ** (1 / 2.5)                                   # 1 on the waterline, under 1 inside the hull
inside = np.clip((0.93 - rad) / 0.2, 0, 1)             # the water is pushed down under the hull, so no crest comes through the deck
sb = YF + 4.5                                           # metres behind the bow
ss = YF - 4.5                                           # metres behind the stern
bowness = np.clip(1 - sb / 9.0, 0, 1)
ridge = 0.9 + 0.354 * np.maximum(sb, 0)                 # the Kelvin wedge's arm: tan 19.47 degrees = 0.354
LAM = max(0.62, 2 * math.pi * U * U / G)                # the transverse waves' length, 2 pi U^2 / g
arm = np.exp(-((np.abs(XF) - ridge) / (0.35 + 0.02 * np.maximum(sb, 0))) ** 2) * (sb > 0)
wake_h = (0.05 * U) * arm * np.exp(-np.maximum(sb, 0) / 28) * (0.6 + 0.4 * np.cos(sb * 2 * math.pi / LAM))
wake_h += (0.1 * U) * np.exp(-((YF + 4.3) / 1.2) ** 2) * np.exp(-((np.abs(XF) - 0.9) / 0.8) ** 2)       # the bow wave piled either side of the stem
wake_h -= 0.06 * U * np.exp(-((np.abs(XF) - 2.2) / 0.9) ** 2) * ((YF > -3) & (YF < 4))                    # the shallow trough alongside
wake_h = wake_h.astype(np.float32)
band = np.exp(-(np.maximum(rad - 1, 0) * 1.65 / (0.45 + 0.5 * bowness)) ** 2) * (rad > 0.9)               # foam hugging the hull, wider at the bow
wash = np.exp(-(XF / (1.1 + 0.05 * np.maximum(ss, 0))) ** 2) * np.exp(-np.maximum(ss, 0) / 22) * (ss > -0.5)  # the propeller's wash
arms_f = arm * np.exp(-np.maximum(sb, 0) / 9)
wake_foam = np.clip(0.9 * band * (0.5 + 0.5 * bowness) + 0.95 * wash + 0.8 * arms_f, 0, 1).astype(np.float32) * min(1.0, U / 2.5)

gap = np.gradient(axis)
SPACE = np.maximum.outer(gap, gap).ravel().astype(np.float32)        # metres between verts here
FINE = np.clip(1.5 - SPACE / 0.22, 0, 1)        # the small lace: where verts are under ~0.2 m apart
MID = np.clip(1.5 - SPACE / 0.9, 0, 1)          # the big lace: out to ~1 m apart; past that foam is its smooth amount

def worley(x, y, cell):
    # distance to the nearest of a jittered lattice's points, 0..1: thresholded by the foam it gives lace, not blobs
    gx, gy = x / cell, y / cell
    ix, iy = np.floor(gx), np.floor(gy)
    best = np.full(x.shape, 9.0, dtype=np.float32)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            cx, cy = ix + dx, iy + dy
            h = np.sin(cx * 127.1 + cy * 311.7) * 43758.5453
            jx = h - np.floor(h)
            h2 = np.sin(cx * 269.5 + cy * 183.3) * 43758.5453
            jy = h2 - np.floor(h2)
            best = np.minimum(best, (gx - cx - jx) ** 2 + (gy - cy - jy) ** 2)
    return np.clip(np.sqrt(best), 0, 1)

# a droplet: an octahedron
OV = np.array([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], dtype=np.float32)
OT = np.array([[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]], dtype=np.uint32)
P = {"p": np.zeros((0, 3), np.float32), "v": np.zeros((0, 3), np.float32), "age": np.zeros(0, np.float32), "life": np.zeros(0, np.float32), "size": np.zeros(0, np.float32)}
def emit(at, vel, life, size):
    P["p"] = np.concatenate([P["p"], at.astype(np.float32)]); P["v"] = np.concatenate([P["v"], vel.astype(np.float32)])
    P["age"] = np.concatenate([P["age"], np.zeros(len(at), np.float32)]); P["life"] = np.concatenate([P["life"], life.astype(np.float32)]); P["size"] = np.concatenate([P["size"], size.astype(np.float32)])
def spray_blob():
    k = np.clip(1 - P["age"] / np.maximum(P["life"], 1e-3), 0, 1)
    s = (P["size"] * (0.4 + 0.6 * k))[:, None, None]
    v = (P["p"][:, None, :] + OV[None] * s).reshape(-1, 3)
    n = np.tile(OV, (len(P["p"]), 1))
    idx = (OT[None] + (np.arange(len(P["p"]), dtype=np.uint32) * 6)[:, None, None]).reshape(-1, 3)
    # one hidden droplet far under the sea, so a frame with no spray still has a mesh
    v = np.concatenate([v, OV * 0.01 + np.array([0, 0, -50], np.float32)]); n = np.concatenate([n, OV])
    idx = np.concatenate([idx, OT + len(P["p"]) * 6])
    return pack(R3(v), R3(n), np.tile(WHITE, (len(v), 1)), idx)

def at(x, y):
    ix = int(np.argmin(np.abs(axis - x))); iy = int(np.argmin(np.abs(axis - y)))
    return iy * N + ix
# nine points under the hull (the centre twice), as ship sims sample it: bow three, stern three, the beams
PTS = {"c": [at(0, 0), at(0, 0)], "bow": [at(0, -3.9), at(-0.8, -3.0), at(0.8, -3.0)], "stern": [at(0, 3.9), at(-1.2, 3.2), at(1.2, 3.2)], "port": [at(-1.5, 0), at(-1.2, 3.2), at(-0.8, -3.0)], "star": [at(1.5, 0), at(1.2, 3.2), at(0.8, -3.0)]}
BOWTIP = at(0, -5.2)
near = np.flatnonzero((np.abs(XF) < 70) & (np.abs(YF) < 70))
ride = {"y": [], "pitch": [], "roll": []}
st = None
vel3 = [0.0, 0.0, 0.0]
SPRING = [(5.0, 3.2), (3.6, 2.6), (2.0, 1.7)]          # heave, pitch, roll: stiffness and damping (a heavy hull lags the sea)
sea_blobs, spray_blobs = [], []
linger = np.zeros(N * N, dtype=np.float32)
wind3 = np.array([math.cos(WIND), math.sin(WIND), 0.0])
# the water slides aft past the boat at U: last frame's foam moves +y by U/FPS (rows are y)
HS = S["wave_scale"]
for f in range(frames):
    dt, rel = DT[f], DT[f] * FPS                          # this frame's step of sea time, and as a share of a normal frame
    shift = np.interp(axis - U * dt, axis, np.arange(N))
    r0 = np.clip(np.floor(shift).astype(int), 0, N - 2); rf = (shift - r0).astype(np.float32)[:, None]
    pos, nrm, fold = frame_mesh(f)
    sea_z = pos[:, 2].copy()                              # the sea before the hull's own waves, for the ride
    pos[:, 2] += wake_h - 1.3 * inside
    lg = linger.reshape(N, N)
    lg = lg[r0] * (1 - rf) + lg[r0 + 1] * rf              # carried aft with the water
    # foam builds where the surface folds and where the hull churns it, and decays exponentially (about 3 s)
    linger = np.maximum(np.maximum(fold, wake_foam * (1 - inside)), lg.ravel() * math.exp(-dt / 3.0) - 0.003 * rel)
    m = np.clip(linger, 0, 1)
    wy = YF - U * TAU[f]                                 # the lace lies on the water, so it slides aft with it
    big = worley(XF, wy, 3.2)
    small = 0.6 * worley(XF + 3.1, wy + 1.7, 0.8) + 0.4 * worley(XF - 1.3, wy + 0.4, 0.3)
    lace = big * (1 - 0.55 * FINE) + small * 0.55 * FINE
    # the lattice thresholded by the amount of foam: thin foam is lace along the cells' edges, thick foam fills them
    laced = np.clip((lace * 0.9 + m * 0.25 - (1 - m)) / 0.25, 0, 1)
    foam = (laced * MID + np.clip(m * 1.4 - 0.55, 0, 1) * (1 - MID)) * (1 - inside)
    # light through the thin crests: the water goes green where it stands high
    sss = np.clip((sea_z - 0.35 * HS) / (0.9 * HS), 0, 1)[:, None]
    water = DEEP + sss * np.array([0.02, 0.2, 0.17])
    k = foam[:, None]
    sea_blobs.append(pack(R3(pos), R3(nrm), water * (1 - k) + WHITE * k, tri))
    z = sea_z
    mean = lambda key: float(np.mean(z[PTS[key]]))
    target = [float(np.mean(z[sum(PTS.values(), [])])) - 0.05, math.atan2(mean("bow") - mean("stern"), 7.0) * 0.85, math.atan2(mean("star") - mean("port"), 3.0) * 0.6]
    if st is None:
        st = list(target)
    for _ in range(4):
        for a_ in range(3):
            kk, cc = SPRING[a_]
            vel3[a_] += (kk * (target[a_] - st[a_]) - cc * vel3[a_]) * dt / 4
            st[a_] += vel3[a_] * dt / 4
    ride["y"].append(round(st[0], 4)); ride["pitch"].append(round(st[1], 5)); ride["roll"].append(round(st[2], 5))
    if S["spray"]:
        hot = near[fold[near] > 0.9]
        if len(hot):
            pick = rng.choice(hot, size=min(max(1, int(round(S["spray"] * rel))), len(hot)), replace=False)
            n = len(pick)
            vel = wind3 * rng.uniform(3, 8, (n, 1)) + np.array([0, 0, 1.0]) * rng.uniform(1.5, 5, (n, 1)) + rng.normal(0, 0.8, (n, 3))
            emit(pos[pick] + np.array([0, 0, 0.1]), vel, rng.uniform(0.7, 1.5, n), rng.uniform(0.01, 0.03, n))
        # the bow slams when the sea ahead stands above the stem: sheets of spray thrown out either side
        stem = st[0] + math.sin(st[1]) * 4.6 + 0.35
        slam = float(z[BOWTIP]) - stem
        if slam > 0.3:
            n = max(1, int(min(220, slam * 260) * rel))
            side = rng.choice([-1.0, 1.0], (n, 1))
            vel = np.concatenate([side * rng.uniform(2.0, 7.0, (n, 1)), rng.uniform(-2.0, 2.5, (n, 1)), rng.uniform(2.5, 7.5, (n, 1))], axis=1)
            start = np.array([0, -4.3, stem]) + np.concatenate([side * rng.uniform(0.2, 1.0, (n, 1)), rng.normal(0, 0.5, (n, 1)), rng.uniform(-0.2, 0.5, (n, 1))], axis=1)
            emit(start, vel, rng.uniform(0.6, 1.3, n), rng.uniform(0.012, 0.035, n))
    spray_blobs.append(spray_blob())
    P["v"][:, 2] -= G * dt; P["v"] *= 0.985 ** rel; P["p"] += P["v"] * dt; P["p"][:, 1] += U * dt; P["age"] += dt
    keep = P["age"] < P["life"]
    for key in P:
        P[key] = P[key][keep]
    if f % 30 == 0:
        print(f"frame {f}: sea {z.min():.2f}..{z.max():.2f} m, foam {foam.mean():.3f}, droplets {len(P['p'])}, boat y {st[0]:.2f} pitch {math.degrees(st[1]):.1f} roll {math.degrees(st[2]):.1f}", flush=True)

write(out, sea_blobs)
write(out.replace(".raw.rseq", "-spray.raw.rseq"), spray_blobs)
json.dump({"state": state, "fps": FPS, "frames": frames, "knots": S["knots"], "made": "blender/studies/ocean.py", **ride}, open(out.replace(".raw.rseq", "") + ".boat.json", "w"))
print(f"wrote {out}: {frames} frames, {N * N} verts, {len(tri)} tris a frame")
