# The harbour's water as a baked mesh a frame, for raea's <MeshSequence>: Blender's ocean modifier (Tessendorf's FFT
# spectrum) at the scale of a sheltered harbour on a still evening: a low swell, small chop on it, ripples on that.
# Our own grid, dense round the pier (7 cm) and coarse out to 70 m, centred where the harbour shot looks.
#   raea blender run blender/studies/harbour-water.py media/ocean/harbour.raw.rseq 170
#   bun tools/rseq-zstd.ts media/ocean/harbour.raw.rseq media/ocean/harbour.rseq
import bpy, sys, json, math, struct
import numpy as np
argv = sys.argv[sys.argv.index("--") + 1:]
out, frames = argv[0], int(argv[1])
FPS, N, R, A = 30, 200, 70.0, 0.1
CX, CY = -2.0, 6.0                      # the grid's middle in Blender (raea x -2, z -6)
WIND = math.radians(35)
bpy.ops.wm.read_factory_settings(use_empty=True)
u = np.linspace(-1.0, 1.0, N)
axis = R * (A * u + (1 - A) * u ** 3)
X, Y = np.meshgrid(axis, axis, indexing="xy")
verts = np.stack([X.ravel(), Y.ravel(), np.zeros(N * N)], axis=1)
i, j = np.meshgrid(np.arange(N - 1), np.arange(N - 1), indexing="xy")
a = (j * N + i).ravel(); b = a + 1; c = a + N + 1; d = a + N
faces = np.stack([a, b, c, d], axis=1)
me = bpy.data.meshes.new("water"); me.from_pydata(verts.tolist(), [], faces.tolist()); me.update()
ob = bpy.data.objects.new("water", me); bpy.context.scene.collection.objects.link(ob)
def tile(name, res, size, scale, chop, wind, turn, seed):
    m = ob.modifiers.new(name, "OCEAN")
    m.geometry_mode = "DISPLACE"; m.spectrum = "PHILLIPS"; m.resolution = res; m.spatial_size = size
    m.wave_scale = scale; m.wave_scale_min = 0.0; m.choppiness = chop; m.wind_velocity = wind
    m.wave_alignment = 0.1; m.wave_direction = WIND + math.radians(turn); m.damping = 0.5; m.depth = 6; m.random_seed = seed
    return m
# (first bake: swell 0.11, chop 0.05; it read as blotchy puddles, too big a sea for a sheltered harbour)
# (third bake: a long low undulation only. From the pier the water is seen at 5 to 10 degrees; a slope steeper than half
# that turns the mirror reflection down into the water, which the renderer (two bounces) returns dark, so any chop or
# ripple drew dark blotches whatever its height. The undulation keeps every slope under about 1.5 degrees.)
TILES = [(tile("swell", 13, 60, 0.03, 0.2, 3.0, 0, 7), 1.0), (tile("chop", 13, 24, 0.006, 0.2, 2.0, 40, 3), 1.2)]
tri = np.concatenate([faces[:, [0, 1, 2]], faces[:, [0, 2, 3]]]).astype(np.uint32)
# the water's body colour, near the evening sky's: a reflected ray that skims into the next wave returns this, and a
# dark body made black blotches of every trough
DEEP = np.array([0.42, 0.36, 0.37])
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
    assert head["index"][0][0] == 12 + len(hj), "header length didn't settle"
    with open(path, "wb") as fh:
        fh.write(b"RSEQ" + struct.pack("<II", 1, len(hj)) + hj)
        for bl in blobs:
            fh.write(bl)
blobs = []
rgb = np.tile(DEEP, (N * N, 1))
# raea's winding: the Blender quad (a, b, c, d) seen from +z is counter-clockwise; after (x, z, -y) it stays facing up
for f in range(frames):
    for m, rate in TILES:
        m.time = f / FPS * rate
    dg = bpy.context.evaluated_depsgraph_get(); dg.update()
    ev = ob.evaluated_get(dg); em = ev.to_mesh(); n = len(em.vertices)
    pos = np.empty(n * 3, dtype=np.float32); em.vertices.foreach_get("co", pos); pos = pos.reshape(-1, 3)
    nrm = np.empty(n * 3, dtype=np.float32); em.vertices.foreach_get("normal", nrm); nrm = nrm.reshape(-1, 3)
    ev.to_mesh_clear()
    pos = pos + np.array([CX, CY, 0.0], dtype=np.float32)
    blobs.append(pack(R3(pos), R3(nrm), rgb, tri))
    if f % 40 == 0:
        print("frame", f, "height", float(pos[:, 2].min()), float(pos[:, 2].max()), flush=True)
write(out, blobs)
print(f"wrote {out}: {frames} frames, {N * N} verts, {len(tri)} tris a frame")
