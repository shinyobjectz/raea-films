# The sea, simulated: a real liquid (Blender's Mantaflow, FLIP) in a tank 48 x 20 m with 5 m of water, a swell raised
# at one end and sent down it, and the boat driven into the swell as a solid the water has to go round and over. The
# water's surface is meshed each frame and its spray, foam and bubbles come from the same simulation.
# the director, 11-11: "no speed ramp actually simulate a solid scene right now it doesnt look atll that promising, do a real
# simulation". (blender/studies/ocean.py is the displaced-surface sea this replaces for the film's last shot.)
#   raea blender run blender/studies/flip.py OUT.raw.rseq RES FRAMES   (RES 48 a quick look, 160+ the shot)
# Writes OUT (the water, a mesh a frame), OUT's -spray twin (droplets as small triangles) and OUT's .boat.json (the
# boat's place and pitch a frame, raea's frame), all in metres with the tank's middle at the origin and still water at y 0.
import bpy, sys, os, json, math, struct
import numpy as np
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1:]
out, RES, FRAMES = os.path.abspath(argv[0]), int(argv[1]), int(argv[2])
# Two passes, so the boat rides the water that is really there: "measure" runs the sea with no boat and writes how
# high the surface stands under where the boat will be (OUT's .sea.json); the second run reads that and floats the
# hull on it (heave and pitch through a damped spring), and the water then has to go round the hull.
MEASURE = "measure" in argv[3:]
RIDE = out.replace(".raw.rseq", ".sea.json")
SPEED, X0 = 4.3, -15.0                                   # the boat's way, m/s toward +x, and where it starts
FPS = 30
LX, LY, LZ, DEPTH = 48.0, 20.0, 14.0, 5.0
HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(PROJECT, "blender", "cache", f"flip-{RES}{'-measure' if MEASURE else ''}")

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, FRAMES
sc.gravity = (0, 0, -9.81)

def cube(name, size, at):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return o

# the tank
dom = cube("tank", (LX, LY, LZ), (0, 0, LZ / 2))
m = dom.modifiers.new("fluid", "FLUID")
m.fluid_type = "DOMAIN"
d = m.domain_settings
d.domain_type = "LIQUID"
d.resolution_max = RES
d.use_adaptive_timesteps = True
d.cfl_condition = 4.0
d.timesteps_max, d.timesteps_min = 6, 1
d.use_mesh = True
d.mesh_scale = 2
d.mesh_generator = "IMPROVED"
# a smoother, less blobby surface: the particles' spheres drawn wider and the mesh smoothed both ways
d.mesh_particle_radius = 2.6
d.mesh_smoothen_pos, d.mesh_smoothen_neg = 2, 2
d.mesh_concave_upper, d.mesh_concave_lower = 3.5, 0.4
d.use_spray_particles = True
d.use_foam_particles = True
d.use_bubble_particles = False
d.sndparticle_combined_export = "SPRAY_FOAM"
d.sndparticle_potential_min_wavecrest, d.sndparticle_potential_max_wavecrest = 1.2, 4.0
d.sndparticle_potential_min_trappedair, d.sndparticle_potential_max_trappedair = 4.0, 20.0
d.sndparticle_sampling_wavecrest, d.sndparticle_sampling_trappedair = 180, 60
d.sndparticle_life_min, d.sndparticle_life_max = 0.6, 2.2
d.use_collision_border_front = d.use_collision_border_back = d.use_collision_border_left = d.use_collision_border_right = d.use_collision_border_bottom = True
d.cache_type = "ALL"
d.cache_directory = CACHE
d.cache_frame_start, d.cache_frame_end = 1, FRAMES
d.cache_data_format = "OPENVDB"

def flow(name, o, vel=None):
    fm = o.modifiers.new("fluid", "FLUID")
    fm.fluid_type = "FLOW"
    f = fm.flow_settings
    f.flow_type = "LIQUID"
    f.flow_behavior = "GEOMETRY"
    if vel:
        f.use_initial_velocity = True
        f.velocity_coord = vel
    o.display_type = "WIRE"
    return o

# the still water, and at the far end (x from 8 to 22) a swell standing 3.2 m over it, already travelling toward -x
flow("water", cube("water", (LX - 0.4, LY - 0.4, DEPTH), (0, 0, DEPTH / 2)))
bpy.ops.mesh.primitive_grid_add(x_subdivisions=60, y_subdivisions=8, size=1, location=(15, 0, DEPTH))
sw = bpy.context.active_object
sw.name = "swell"
sw.scale = (14, LY - 0.6, 1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
for v in sw.data.vertices:
    k = (v.co.x + 7) / 14                                   # 0 at its near foot, 1 at its far one
    v.co.z = 3.2 * math.sin(math.pi * k) ** 1.5 * (0.85 + 0.15 * math.cos(v.co.y * 0.5))
sol = sw.modifiers.new("solid", "SOLIDIFY")
sol.thickness = 3.4
sol.offset = -1
bpy.context.view_layer.objects.active = sw
bpy.ops.object.modifier_apply(modifier="solid")
flow("swell", sw, vel=(-7.5, 0, 0))

# the boat, as a simple solid of its hull's size (9 m long, 3.4 m wide): the water needs a closed shape to push on.
# It heads +x into the swell, rises with it and pitches up, then drops through the crest.
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
hull = bpy.context.active_object
hull.name = "hull"
me = hull.data
for v in me.vertices:
    x, y, z = v.co.x, v.co.y, v.co.z
    X = x * 9.0
    taper = 1.0 - 0.9 * max(0.0, (X - 1.5) / 3.0) ** 1.6   # the bow comes to a stem
    v.co.x = X
    v.co.y = y * 3.2 * max(0.08, taper)
    v.co.z = (z * 2.2 if z < 0 else z * 6.4) + (0.5 if z < 0 and X > 2.5 else 0) * (X - 2.5) / 2.0   # the keel rises to the stem; above the water it stands as high as the cabin, so the sea breaks against the boat and not through its deck
sub = hull.modifiers.new("sub", "SUBSURF")
sub.levels = 2
bpy.context.view_layer.objects.active = hull
bpy.ops.object.modifier_apply(modifier="sub")
em = hull.modifiers.new("fluid", "FLUID")
em.fluid_type = "EFFECTOR"
e = em.effector_settings
e.effector_type = "COLLISION"
e.use_effector = True
e.surface_distance = 0.8
e.subframes = 2
if MEASURE:
    hull.modifiers.remove(em)
    hull.location = (0, 0, -40)
else:
    sea_h = json.load(open(RIDE))
    st, vel = [sea_h["mid"][0], 0.0], [0.0, 0.0]
    for f in range(FRAMES):
        target = [sea_h["mid"][f] - 0.45, math.atan2(sea_h["bow"][f] - sea_h["stern"][f], 7.0) * 0.9]
        for _ in range(4):
            for a_, (kk, cc) in enumerate(((9.0, 4.2), (7.0, 3.6))):       # heave, pitch: a heavy hull lags the sea
                vel[a_] += (kk * (target[a_] - st[a_]) - cc * vel[a_]) / (FPS * 4)
                st[a_] += vel[a_] / (FPS * 4)
        hull.location = (X0 + SPEED * f / FPS, 0, DEPTH + st[0] + 0.55)
        hull.rotation_euler = (0, -st[1], 0)
        hull.keyframe_insert("location", frame=1 + f)
        hull.keyframe_insert("rotation_euler", frame=1 + f)

bpy.context.view_layer.objects.active = dom
dom.select_set(True)
print(f"baking {FRAMES} frames at resolution {RES} into {CACHE}", flush=True)
bpy.ops.fluid.bake_all()
print("baked", flush=True)

def pack(p, q, rgb, idx):
    lo, hi = p.min(axis=0), p.max(axis=0)
    span = np.where(hi - lo > 1e-9, hi - lo, 1.0)
    pq = np.round((p - lo) / span * 65535).astype("<u2")
    nq = np.round(np.clip(q, -1, 1) * 32767).astype("<i2")
    rgba = np.concatenate([np.round(np.clip(rgb, 0, 1) * 255), np.full((len(p), 1), 255)], axis=1).astype(np.uint8)
    return struct.pack("<II3f3f", len(p), len(idx), *lo.astype(float), *hi.astype(float)) + pq.tobytes() + nq.tobytes() + rgba.tobytes() + idx.astype("<u4").tobytes()
R3 = lambda v: np.stack([v[:, 0], v[:, 2] - DEPTH, -v[:, 1]], axis=1)      # Blender to raea, still water at y 0
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

DEEP = np.array([0.016, 0.085, 0.105])
sea, spray, ride = [], [], {"x": [], "y": [], "pitch": []}
TRI = np.array([[0.0, 1.0, 0.0], [-0.87, -0.5, 0.0], [0.87, -0.5, 0.0]])
for f in range(1, FRAMES + 1):
    sc.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    ev = dom.evaluated_get(dg)
    em_ = ev.to_mesh()
    em_.calc_loop_triangles()
    n, nt = len(em_.vertices), len(em_.loop_triangles)
    if n == 0:
        pos = np.zeros((3, 3), dtype=np.float32); nrm = np.tile(np.array([[0, 0, 1.0]], dtype=np.float32), (3, 1)); tri = np.array([[0, 1, 2]], dtype=np.uint32)
    else:
        pos = np.empty(n * 3, dtype=np.float32); em_.vertices.foreach_get("co", pos); pos = pos.reshape(-1, 3)
        nrm = np.empty(n * 3, dtype=np.float32); em_.vertices.foreach_get("normal", nrm); nrm = nrm.reshape(-1, 3)
        tri = np.empty(nt * 3, dtype=np.int32); em_.loop_triangles.foreach_get("vertices", tri); tri = tri.reshape(-1, 3)
        pos = (np.array(dom.matrix_world) @ np.concatenate([pos, np.ones((n, 1), dtype=np.float32)], axis=1).T).T[:, :3]
    # the water's colour: deep, greener where it stands thin and high
    if MEASURE:
        # the surface's height (over still water) under the hull's middle, its bow and its stern
        bx = X0 + SPEED * (f - 1) / FPS
        def top(xc):
            m_ = (np.abs(pos[:, 0] - xc) < 1.0) & (np.abs(pos[:, 1]) < 1.4)
            return float(pos[m_, 2].max() - DEPTH) if m_.any() else 0.0
        ride.setdefault("mid", []).append(round(top(bx), 3)); ride.setdefault("bow", []).append(round(top(bx + 3.5), 3)); ride.setdefault("stern", []).append(round(top(bx - 3.5), 3))
    high = np.clip((pos[:, 2] - DEPTH - 0.6) / 2.5, 0, 1)[:, None]
    sea.append(pack(R3(pos), R3(nrm) + np.array([0, DEPTH, 0]) * 0 + 0, DEEP + high * np.array([0.02, 0.2, 0.17]), tri))
    ev.to_mesh_clear()
    # droplets and foam: the simulation's secondary particles, each a small triangle facing up-and-out
    pts = []
    for ps in ev.particle_systems:
        k = len(ps.particles)
        if k:
            loc = np.empty(k * 3, dtype=np.float32); ps.particles.foreach_get("location", loc)
            pts.append(loc.reshape(-1, 3))
    if pts:
        P = np.concatenate(pts)
        P = P[(np.abs(P[:, 0]) < LX / 2) & (np.abs(P[:, 1]) < LY / 2) & (P[:, 2] > 0.2)]
    else:
        P = np.zeros((0, 3), dtype=np.float32)
    if len(P) == 0:
        P = np.array([[0, 0, -50.0]], dtype=np.float32)
    rng = np.random.default_rng(f)
    # only what is in the air or on a crest is drawn (the rest is under the surface's own foam), and no more than 14,000
    P = P[P[:, 2] > DEPTH - 0.1]
    if len(P) > 70000:
        P = P[np.random.default_rng(7).permutation(len(P))[:70000]]
    if len(P) == 0:
        P = np.array([[0, 0, -50.0]], dtype=np.float32)
    size = rng.uniform(0.012, 0.04, (len(P), 1, 1))
    spin = rng.uniform(0, 6.28, len(P))
    c, s_ = np.cos(spin)[:, None], np.sin(spin)[:, None]
    tri3 = TRI[None] * size
    rot = np.stack([tri3[:, :, 0] * c - tri3[:, :, 1] * s_, tri3[:, :, 0] * s_ + tri3[:, :, 1] * c, tri3[:, :, 1] * 0.6], axis=2)
    V = (P[:, None, :] + rot).reshape(-1, 3)
    spray.append(pack(R3(V), np.tile(np.array([[0, 1.0, 0]]), (len(V), 1)), np.full((len(V), 3), 0.95), np.arange(len(V), dtype=np.uint32).reshape(-1, 3)))
    ride["x"].append(round(hull.matrix_world.translation.x, 3)); ride["y"].append(round(hull.matrix_world.translation.z - DEPTH, 3)); ride["pitch"].append(round(-hull.matrix_world.to_euler().y, 4))
    if f % 15 == 0:
        print(f"frame {f}: {n} verts, {nt} tris, {len(P)} droplets, boat x {ride['x'][-1]} y {ride['y'][-1]}", flush=True)

if MEASURE:
    json.dump({k_: ride[k_] for k_ in ("mid", "bow", "stern")}, open(RIDE, "w"))
    print("measured the sea under the boat's path:", RIDE)
    sys.exit(0)
write(out, sea)
write(out.replace(".raw.rseq", "-spray.raw.rseq"), spray)
json.dump({"fps": FPS, "frames": FRAMES, "res": RES, "tank": [LX, LY, LZ], "made": "blender/studies/flip.py", **{k_: ride[k_] for k_ in ("x", "y", "pitch")}}, open(out.replace(".raw.rseq", ".boat.json"), "w"))
print(f"wrote {out}: {FRAMES} frames")
