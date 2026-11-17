# The storm at sea (the director, 11-11: "this is not relistic enoguh water we need hype rrealism and dynamic lighting ... the
# scene can cut from day break to night time storm and thunder and watch the waves ramp up in realtime or cut on the
# lighting flash to a bigger storm and then a wide shot of the ship doing up a huge wave. soend lots of time on this").
# Blender's ocean modifier (Tessendorf's FFT spectrum) on our own grid, dense round the ship and coarse out to 130 m,
# baked a mesh a frame for raea's <MeshSequence>, with the ship's ride read off the same surface:
#   ramp   93 frames: a calm sea at daybreak for 37 frames, then the sea builds to a gale as the storm's slider is dragged
#   wave   37 frames: the gale at its height, and one great wave coming on, which the ship climbs
# Each vertex carries its colour: the water's body, and white where a crest is breaking (foam: where the surface is both
# high for the sea state and steep). Writes OUT.raw.rseq (bun tools/rseq-zstd.ts packs it) and OUT.ship.json.
#   raea blender run blender/storm.py media/ocean/storm-ramp ramp
import bpy, sys, json, math, struct
import numpy as np
args = [a for a in sys.argv if not a.endswith(".py")]
out, mode = args[-2], args[-1]
ROCK = mode.startswith("rock")
if ROCK: mode = mode[5:]
FPS, N, R, A = 30, 300, 130.0, 0.16
# The lens of each shot (the scene reads it back from OUT.ship.json, so the two can't drift apart): where it starts, how
# it travels (m/s), what it looks at, its field of view. The sea is drawn after everything behind it without writing
# depth, so each frame's triangles are put in order from the far side of the lens to the near.
#   ramp: low off her port bow, a little ahead of her, so she comes on toward us as the sea gets up
#   wave: low off her port quarter, astern, looking forward past her at the wave she is climbing. (the director, 11-11: "the
#         problem is also the camera shot and maybe the speed of the wave dfeeling too fast. its confusing perspective":
#         it was a wide view from abeam, the wave crossing behind her at 20 m/s.)
CAM = {"ramp": {"eye": [-30.0, 4.2, 27.0], "vel": [0.9, 0.1, -0.5], "look": [0.0, 7.5, 0.0], "fov": 36},
       "wave": {"eye": [-27.0, 2.3, 9.5], "vel": [1.2, 0.15, -0.3], "look": [16.0, 13.0, 0.0], "fov": 47}}[mode]
if ROCK:
    # ramp: as the reference frames it: from the water, the rock in the middle of the frame with the man small on its top
    # against the sky, the sea across the lower third. wave: nearer and lower, off its windward shoulder, looking up.
    # (the rock is Poly Haven's scanned "mountainside", 10.5 m out of the water: blender/crags.py crag-a)
    # (one shot, one move: a slow push in toward the rock through the whole storm)
    CAM = {"ramp": {"eye": [3.0, 2.0, 38.0], "vel": [-0.35, 0.05, -3.3], "look": [0.0, 5.8, 0.0], "fov": 34},
           "wave": {"eye": [15.0, 1.6, 21.0], "vel": [-0.6, 0.06, -0.7], "look": [-0.5, 7.2, 0.0], "fov": 38}}[mode]
# "rock-ramp" and "rock-wave" are the same two shots with the crag (blender/rock.py) standing in the sea in place of
# the ship: the surf piles up and bursts on its windward side (+x), and streams white round it and away down wind.
FRAMES = 93 if mode == "ramp" else 38
SHIP_L, SHIP_W = 20.0, 5.0                     # the hull on the water: its length along x, its beam
bpy.ops.wm.read_factory_settings(use_empty=True)
u = np.linspace(-1.0, 1.0, N)
axis = R * (A * u + (1 - A) * u ** 3)
X, Y = np.meshgrid(axis, axis, indexing="xy")
verts = np.stack([X.ravel(), Y.ravel(), np.zeros(N * N)], axis=1)
i, j = np.meshgrid(np.arange(N - 1), np.arange(N - 1), indexing="xy")
a = (j * N + i).ravel(); b = a + 1; c = a + N + 1; d = a + N
faces = np.stack([a, b, c, d], axis=1)
me = bpy.data.meshes.new("sea"); me.from_pydata(verts.tolist(), [], faces.tolist()); me.update()
ob = bpy.data.objects.new("sea", me); bpy.context.scene.collection.objects.link(ob)
def tile(name, res, size, chop, wind, turn, seed):
    m = ob.modifiers.new(name, "OCEAN")
    m.geometry_mode = "DISPLACE"; m.spectrum = "PHILLIPS"; m.resolution = res; m.spatial_size = size
    m.wave_scale = 1.0; m.wave_scale_min = 0.0; m.choppiness = chop; m.wind_velocity = wind
    m.wave_alignment = 0.6; m.wave_direction = math.pi + math.radians(turn); m.damping = 0.3; m.depth = 200; m.random_seed = seed
    return m
# a long swell running at the ship's bow, a sea on top of it, and chop on that
SWELL, SEA, CHOP = tile("swell", 13, 150, 0.9, 16.0, 0, 5), tile("sea", 13, 55, 1.1, 12.0, 25, 9), tile("chop", 13, 18, 0.9, 7.0, -30, 2)
# The modifier's own foam (Tessendorf's: where the surface folds over on itself, the Jacobian of its sideways
# displacement going negative), in place of a guess from height and steepness, which whitened every crest alike.
for m, nm in ((SWELL, "foam_swell"), (SEA, "foam_sea")):
    m.use_foam = True; m.foam_layer_name = nm; m.foam_coverage = 0.0
def layer(em, name, n):
    """a corner colour layer of the evaluated mesh as a value a vertex (its greatest corner)"""
    a = em.attributes.get(name)
    if a is None: return np.zeros(n, np.float32)
    c = np.empty(len(a.data) * 4, np.float32); a.data.foreach_get("color", c); c = c.reshape(-1, 4)[:, 0]
    if a.domain == "POINT": return c
    li = np.empty(len(em.loops), np.int32); em.loops.foreach_get("vertex_index", li)
    out = np.zeros(n, np.float32); np.maximum.at(out, li, c); return out
tri = np.concatenate([faces[:, [0, 1, 2]], faces[:, [0, 2, 3]]]).astype(np.uint32)
ease = lambda k: k * k * (3 - 2 * k)
def state(f):
    """the sea at frame f: (swell, sea, chop scales), the water's body colour"""
    if mode == "ramp":
        k = ease(min(1.0, max(0.0, (f - 9) / 37.0))) if ROCK else ease(min(1.0, max(0.0, (f - 37) / 50.0)))      # the slider's drag
        return (0.35 + 2.4 * k, 0.12 + 1.5 * k, 0.05 + 0.5 * k), k
    return (3.2, 1.9, 0.6), 1.0
def pack(p, q, rgb, idx):
    lo, hi = p.min(axis=0), p.max(axis=0)
    span = np.where(hi - lo > 1e-9, hi - lo, 1.0)
    pq = np.round((p - lo) / span * 65535).astype("<u2")
    nq = np.round(np.clip(q, -1, 1) * 32767).astype("<i2")
    rgba = np.concatenate([np.round(np.clip(rgb, 0, 1) * 255), np.full((len(p), 1), 255)], axis=1).astype(np.uint8)
    return struct.pack("<II3f3f", len(p), len(idx), *lo.astype(float), *hi.astype(float)) + pq.tobytes() + nq.tobytes() + rgba.tobytes() + idx.astype("<u4").tobytes()
def R3(v):
    return np.stack([v[:, 0], v[:, 2], -v[:, 1]], axis=1)
def write(path, blobs):
    head = {"fps": FPS, "frames": len(blobs), "codec": "raw", "attrs": ["position", "normal", "color"], "texture": None, "index": []}
    for _ in range(3):
        hj = json.dumps(head).encode(); off = 12 + len(hj); head["index"] = []
        for bl in blobs:
            head["index"].append([off, len(bl)]); off += len(bl)
    hj = json.dumps(head).encode()
    with open(path, "wb") as fh:
        fh.write(b"RSEQ" + struct.pack("<II", 1, len(hj)) + hj)
        for bl in blobs:
            fh.write(bl)
def at(z2, x, y):
    """the surface's height at (x, y), by the grid's own node nearest it (the chop's sideways push is small beside the hull)"""
    ix = int(np.argmin(np.abs(axis - x))); iy = int(np.argmin(np.abs(axis - y)))
    return float(z2[iy, ix])
blobs, sblobs, ride = [], [], {"frames": FRAMES, "y": [], "pitch": [], "roll": [], "cam": CAM}
sp_p = np.zeros((0, 3), np.float32); sp_v = np.zeros((0, 3), np.float32); sp_a = np.zeros(0, np.float32); sp_s = np.zeros(0, np.float32)
rng = np.random.default_rng(3)
grit = rng.random(N * N).astype(np.float32)
for f in range(FRAMES):
    (s1, s2, s3), k = state(f)
    SWELL.wave_scale, SEA.wave_scale, CHOP.wave_scale = s1, s2, s3
    SWELL.foam_coverage, SEA.foam_coverage = -0.25 + 0.55 * k, -0.15 + 0.6 * k        # (how readily it whitens: more as the sea gets up)
    for m, rate in ((SWELL, 1.0), (SEA, 1.15), (CHOP, 1.4)):
        m.time = (f + (200 if mode == "wave" else 0)) / FPS * rate * (0.7 if mode == "wave" else 1.0)   # (the gale is watched a little slow)
    dg = bpy.context.evaluated_depsgraph_get(); dg.update()
    ev = ob.evaluated_get(dg); em = ev.to_mesh(); n = len(em.vertices)
    pos = np.empty(n * 3, dtype=np.float32); em.vertices.foreach_get("co", pos); pos = pos.reshape(-1, 3)
    bfoam = np.clip(layer(em, "foam_swell", n) + layer(em, "foam_sea", n), 0, 1)
    ev.to_mesh_clear()
    ridge = np.zeros(len(pos), dtype=np.float32); dx = np.zeros(len(pos), dtype=np.float32)
    if mode == "wave" or ROCK:
        # the great wave: a ridge 12 m high across her course, already on her bow as the shot opens and coming on at
        # 7 m/s (a big sea's own pace, and slow enough to watch), long on its back and steep on its face
        cx = (26.0 - 9.0 * max(0.0, f - 44) / FPS) if ROCK else (25.0 - 7.0 * f / FPS)      # (on the rock: it comes in from frame 44 and strikes near frame 78)     # (on the rock, it strikes the windward side half way through)
        dx = pos[:, 0] - cx
        HT = (4.6 * min(1.0, max(0.0, (f - 40) / 22.0))) if ROCK else 15.0
        HT = max(HT, 0.01)
        ridge = HT * np.exp(-(dx / np.where(dx < 0, 11.0, 26.0)) ** 2) * (0.78 + 0.22 * np.cos(pos[:, 1] / 44.0))
        pos[:, 2] += ridge
        # the crest: it leans out over its own face, and its lip pitches forward and starts to fall (a plunging
        # breaker), further along as the shot goes on
        r = ridge / HT
        grow = 0.55 + 0.45 * f / FRAMES
        lean = np.clip((r - 0.55) / 0.45, 0, 1)
        lip = np.clip((r - 0.86) / 0.14, 0, 1)
        # (it leans, steepening its face to near upright, but is not pitched right over: an overhanging lip showed its dark
        # underside as a ragged band across the frame, and read as a hedge, not water. Its breaking is its white water.)
        pos[:, 0] -= 2.4 * lean ** 1.5 * grow
        del lip
    # normals from the displaced grid itself
    P = pos.reshape(N, N, 3)
    dxv = np.gradient(P, axis=1); dyv = np.gradient(P, axis=0)
    nr = np.cross(dxv, dyv); nr /= np.maximum(np.linalg.norm(nr, axis=2, keepdims=True), 1e-9)
    nrm = nr.reshape(-1, 3).astype(np.float32)
    # the colour: the body of the water (the green-grey of a northern sea by day, near black in the gale), and foam
    z = pos[:, 2]; hi = max(0.6, float(np.percentile(z, 99.5)))
    high = np.clip((z - 0.3 * hi) / (0.7 * hi), 0, 1)
    steep = np.clip((0.992 - nrm[:, 2]) / 0.09, 0, 1)
    foam = np.clip(bfoam * 1.25 + (grit - 0.5) * 0.2 * bfoam, 0, 1)
    # form (the director, 11-11: "it needs ot have form and breakign current and things"):
    #  - streaks: the foam a broken crest leaves is drawn out down wind in long ragged lines
    sx, sy = pos[:, 0], pos[:, 1]
    streak = (np.sin(sy * 0.9 + 3.0 * np.sin(sx * 0.07) + grit * 1.5) * 0.5 + 0.5) ** 6 * (0.5 + 0.5 * np.sin(sx * 0.21 + sy * 0.05))
    foam = np.clip(foam + 0.55 * k * streak * np.clip(high * 1.6, 0, 1), 0, 1)
    #  - the hull: white water where she meets the sea, thrown wider at her bow, and a wake drawn out astern
    hull = np.exp(-((np.maximum(0, np.sqrt((sx / (SHIP_L / 2 + 0.6)) ** 2 + (sy / (SHIP_W / 2 + 0.5)) ** 2) - 1.0)) / 0.22) ** 2)
    bowsplash = np.exp(-(((sx - SHIP_L / 2 - 1.0) / 2.6) ** 2 + (sy / 3.4) ** 2)) * (0.3 + 0.9 * k)
    wake = np.exp(-(sy / (1.6 + 0.12 * np.maximum(0, -sx - SHIP_L / 2))) ** 2) * np.clip((-sx - SHIP_L / 2 + 2) / 4, 0, 1) * np.exp(-np.maximum(0, -sx - SHIP_L / 2) / 26.0) * (0.55 + 0.45 * grit)
    if ROCK:
        # the rock: white water all round its foot, piled and thrown on the windward side, drawn out in long streaks to leeward
        rr = np.sqrt((sx / 5.6) ** 2 + (sy / 3.2) ** 2)
        hull = np.exp(-((np.maximum(0, rr - 1.0) * 4.5) / 1.6) ** 2) * (0.5 + 0.5 * k)
        bowsplash = np.exp(-(((sx - 6.3) / 2.6) ** 2 + (sy / 3.6) ** 2)) * (0.4 + 1.2 * k)
        lee = np.clip((-sx - 4.0) / 3.0, 0, 1) * np.exp(-np.maximum(0, -sx - 4.0) / 28.0)
        wake = lee * np.exp(-(sy / (3.4 + 0.2 * np.maximum(0, -sx))) ** 2) * (0.35 + 0.65 * (np.sin(sy * 0.8 + 2.0 * np.sin(sx * 0.11) + grit) * 0.5 + 0.5) ** 2) * (0.4 + 0.6 * k)
    foam = np.clip(foam + 0.85 * hull * (0.45 + 0.55 * grit) + bowsplash * (0.5 + 0.5 * grit) + 0.7 * wake, 0, 1)
    if mode == "wave" or ROCK:
        #  - the great wave breaking: its crest white and falling, the water it has thrown streaming down its face
        # (the director, 11-11: "the crest also needed work ... it was confusing becuase it was ust pure white". The crest is not
        # a white cap: a narrow line of breaking water along the very top, broken along its length, and from it long
        # streaks of foam drawn down the face, thinning as they go, with dark water between them. The mark is kept
        # under full white nearly everywhere so the surface's own shading and the foam's holes show through it.)
        along = 0.5 + 0.5 * np.sin(sy * 0.23 + 2.0 * np.sin(sy * 0.05)) * np.sin(sy * 0.71 + 1.3)
        top = np.clip((ridge - 0.86 * HT) / (0.1 * HT), 0, 1) * (0.35 + 0.65 * along)
        r01 = np.clip(ridge / HT, 0, 1)
        runs = (np.sin(sy * 2.3 + 2.5 * np.sin(sy * 0.31) + grit * 1.2) * 0.5 + 0.5) ** 4
        face = np.where(dx < 0, 1.0, 0.25) * runs * np.clip((r01 - 0.25) / 0.6, 0, 1) ** 1.5 * (0.4 + 0.6 * along)
        foam = np.clip(foam * 0.6 + 0.8 * top + 0.6 * face, 0, 0.93)
    body = np.array([0.055, 0.115, 0.125]) * (1 - 0.72 * k) + np.array([0.012, 0.02, 0.028]) * k
    # thin water at a steep crest lets the light through it: greener and paler there
    thin = np.clip(high * steep * 1.4, 0, 1)[:, None] * (0.35 + 0.65 * (1 - k))
    bodyv = body[None, :] * (1 - thin) + np.array([0.06, 0.2, 0.19])[None, :] * thin
    rgb = bodyv * (1 - foam[:, None]) + np.array([0.9, 0.93, 0.95])[None, :] * foam[:, None]
    # in order for the lens: the far triangles first
    eye = np.array(CAM["eye"]) + np.array(CAM["vel"]) * (f / FPS)
    eyeb = np.array([eye[0], -eye[2], eye[1]], dtype=np.float32)            # raea (x, y, z) is Blender (x, -z, y)
    cen = pos[tri].mean(axis=1)
    order = np.argsort(-np.sum((cen - eyeb) ** 2, axis=1))
    blobs.append(pack(R3(pos), R3(nrm), rgb, tri[order]))
    # ---- spray: white water thrown off the surface. Each drop is born where a crest is breaking (and at her bow, and
    # all along the great wave's lip), is thrown up and down wind, falls, and is gone when it meets the sea again.
    born = int((40 + 900 * k) * (2.2 if mode == "wave" else 1.0) * (6.0 if ROCK else 1.0))
    w = foam * steep + (9.0 if ROCK else 2.5) * bowsplash * k
    if mode == "wave":
        w = w + 4.0 * top + 1.5 * face
    w = np.where(np.abs(sx) < 60, w, 0) * np.where(np.abs(sy) < (12 if ROCK else 45), 1, 0)     # (round the rock only: drops born near the lens were great flat shards)
    if w.sum() > 1e-6:
        pick = rng.choice(len(pos), size=born, p=w / w.sum())
        p0 = pos[pick] + rng.normal(0, 0.12, (born, 3)).astype(np.float32)
        v0 = np.stack([rng.normal(-5.0 if mode == "wave" else -2.5, 2.0, born), rng.normal(0, 1.6, born), np.abs(rng.normal(3.2, 1.8, born))], axis=1).astype(np.float32) * (0.5 + 0.5 * k)
        if ROCK:
            # water that meets the rock goes up it: drops born on its windward foot are flung high, and higher the
            # higher the sea stands there at this moment
            at_rock = bowsplash[pick] > 0.25
            surge = 1.0 + max(0.0, float(P[N // 2, int(np.argmin(np.abs(axis - 7.0))), 2])) * 0.9
            v0[at_rock, 2] = np.abs(rng.normal(5.0, 2.6, int(at_rock.sum()))) * surge * (0.4 + 0.6 * k)
            v0[at_rock, 0] = rng.normal(-3.0, 2.5, int(at_rock.sum()))
        sp_p = np.concatenate([sp_p, p0]); sp_v = np.concatenate([sp_v, v0]); sp_a = np.concatenate([sp_a, np.zeros(born, np.float32)])
        sp_s = np.concatenate([sp_s, rng.uniform(0.035, 0.11, born).astype(np.float32) * (0.45 if ROCK else 1.0)])
    dt = (0.7 if mode == "wave" else 1.0) / FPS
    sp_v[:, 2] -= 9.8 * dt; sp_v[:, 0] += (-7.0 - sp_v[:, 0]) * 0.6 * dt       # gravity, and the wind takes them
    sp_p += sp_v * dt; sp_a += dt
    ix = np.clip(np.searchsorted(axis, sp_p[:, 0]), 0, N - 1); iy = np.clip(np.searchsorted(axis, sp_p[:, 1]), 0, N - 1)
    alive = (sp_a < (2.6 if ROCK else 1.6)) & (sp_p[:, 2] > P[iy, ix, 2] - 0.15)
    sp_p, sp_v, sp_a, sp_s = sp_p[alive], sp_v[alive], sp_a[alive], sp_s[alive]
    # a drop is drawn as a small upright diamond turned to the lens, drawn out along the way it is going
    n_s = len(sp_p)
    if n_s:
        to = eyeb[None, :] - sp_p; to /= np.maximum(np.linalg.norm(to, axis=1, keepdims=True), 1e-6)
        side = np.cross(to, np.array([0, 0, 1.0], dtype=np.float32)); side /= np.maximum(np.linalg.norm(side, axis=1, keepdims=True), 1e-6)
        along = sp_v / np.maximum(np.linalg.norm(sp_v, axis=1, keepdims=True), 1e-6)
        ssz = (sp_s * (1.0 + 0.5 * sp_a))[:, None]
        q = np.stack([sp_p - side * ssz, sp_p - along * ssz * 2.6, sp_p + side * ssz, sp_p + along * ssz * 1.2], axis=1).reshape(-1, 3)
        qi = (np.arange(n_s)[:, None] * 4 + np.array([[0, 1, 2, 0, 2, 3]])).reshape(-1, 3).astype(np.uint32)
        fade = np.clip(1.0 - sp_a / 1.6, 0.15, 1.0)
        qc = np.repeat((0.78 + 0.2 * fade)[:, None] * np.array([[0.93, 0.96, 0.98]]), 4, axis=0)
        qn = np.repeat(to, 4, axis=0)
        sblobs.append(pack(R3(q.astype(np.float32)), R3(qn.astype(np.float32)), qc, qi))
    else:
        z3 = np.zeros((3, 3), dtype=np.float32)
        sblobs.append(pack(z3, z3 + np.array([0, 1, 0]), np.ones((3, 3)), np.array([[0, 1, 2]], dtype=np.uint32)))
    # the ship's ride: its height amidships, and the slopes fore and aft and beam to beam
    Z2 = P[:, :, 2]
    bow, stern, port, stbd = at(Z2, SHIP_L / 2, 0), at(Z2, -SHIP_L / 2, 0), at(Z2, 0, SHIP_W / 2), at(Z2, 0, -SHIP_W / 2)
    ride["y"].append((bow + stern + port + stbd) / 4 * 0.9)
    ride["pitch"].append(math.atan2(bow - stern, SHIP_L) * 0.85)
    ride["roll"].append(math.atan2(port - stbd, SHIP_W) * 0.5)
    if f % 20 == 0:
        print("frame", f, "sea", round(float(z.min()), 2), round(float(z.max()), 2), "foam", round(float(foam.mean()), 3), flush=True)
# a hull has weight: its ride is the surface's, smoothed over a third of a second
write(out + "-spray.raw.rseq", sblobs)
for key in ("y", "pitch", "roll"):
    v = np.array(ride[key]); kk = np.ones(9) / 9; ride[key] = np.convolve(np.pad(v, 4, mode="edge"), kk, mode="valid").round(4).tolist()
write(out + ".raw.rseq", blobs)
json.dump(ride, open(out + ".ship.json", "w"))
print(f"wrote {out}.raw.rseq: {FRAMES} frames, {N * N} verts")
