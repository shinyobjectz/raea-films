# The man on the rock (the director, 11-11, with a reference picture: a lone figure standing on a great leaning rock in a
# breaking sea, surf bursting white round its foot, a pale gold break in heavy cloud behind): "what if instea dof even
# the boat we try to do something liek this", and "work on the man on rock look with long coat simulation".
#   media/models/sea/crag.glb     the rock: a leaning wedge 21 m out of the water, faceted, a flat place on its top
#   media/ocean/figure.rseq       one of raea's people (projects/psx pavel) standing there, arms down, in a long coat
#                                 that is a cloth simulation in a gale: 150 frames, a mesh a frame (body and coat)
# Prints "top X Y Z": where his feet are, in the crag's own space (raea's axes).
#   raea blender run blender/rock.py
import bpy, bmesh, sys, os, json, math, struct
import numpy as np
from mathutils import Vector, Matrix, noise
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp
HERE = os.path.dirname(os.path.abspath(__file__)); PROJ = os.path.join(HERE, "..")
FRAMES, PRE, FPS = 150, 40, 30

# ---------------------------------------------------------------- the man and his coat
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.expanduser("$PROJECTS/psx/people/pavel/body.glb"))
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
body = [o for o in bpy.data.objects if o.type == "MESH"]
scene = bpy.context.scene; scene.frame_start = 1; scene.frame_end = PRE + FRAMES
def hand_z(side):
    bpy.context.view_layer.update()
    return (arm.matrix_world @ arm.pose.bones[f"hand_{side}"].head).z
# (his arms stay as the body rests, held out, and are left off below: see there)
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
# the body as one posed mesh (the cloth collides with it)
pts, tris, cols = [], [], []
for o in body:
    # (the import brings a 2 m sphere with it, the shape it draws bones with: it stood under him like a hill)
    if not o.data.materials: print("left out", o.name, flush=True); continue          # (the importer's bone-shape sphere)
    ev = o.evaluated_get(dg); me = ev.to_mesh(); me.calc_loop_triangles()
    base = len(pts)
    mats = [m.name.lower() if m else "" for m in o.data.materials]
    for v in me.vertices: pts.append(ev.matrix_world @ v.co)
    for t in me.loop_triangles: tris.append([base + i for i in t.vertices])
    ev.to_mesh_clear()
P0 = np.array([[p.x, p.y, p.z] for p in pts], dtype=np.float32)
# (his arms would not be brought down from the body's rest, where they are held out: under a coat they made a bell of
# him. They are left off: the coat's own shoulders are what is seen, and at this distance he reads as a man in a coat.)
keepv = ~((np.abs(P0[:, 0]) > 0.21) & (P0[:, 2] > 0.5 * float(P0[:, 2].max())) & (P0[:, 2] < 0.9 * float(P0[:, 2].max())))
remap = -np.ones(len(P0), dtype=np.int64); remap[keepv] = np.arange(int(keepv.sum()))
tris = [[int(remap[i]) for i in t] for t in tris if all(keepv[i] for i in t)]
P0 = P0[keepv]
height = float(P0[:, 2].max())
print("body", len(P0), "verts, height", round(height, 3), "hands at", round(hand_z("l"), 2), flush=True)
bm = bmesh.new()
bv = [bm.verts.new(Vector(p)) for p in P0.tolist()]
for t in tris:
    try: bm.faces.new([bv[i] for i in t])
    except ValueError: pass
me = bpy.data.meshes.new("man"); bm.to_mesh(me); bm.free()
man = bpy.data.objects.new("man", me); scene.collection.objects.link(man)
for o in body + [arm]: bpy.data.objects.remove(o, do_unlink=True)
man.modifiers.new("col", "COLLISION"); man.collision.thickness_outer = 0.012; man.collision.cloth_friction = 12
# the coat: a long one, to the shin, lofted round him ring by ring (elliptical: wider than deep), open down the front
# from the waist so its skirts can part and fly. The top rings (collar and shoulders) are pinned to him.
SH = 0.86 * height                                           # the shoulders' height
rings, SEG = [], 40
levels = [(SH + 0.085, 0.08, 0.085), (SH + 0.03, 0.14, 0.115), (SH - 0.03, 0.2, 0.13), (SH - 0.14, 0.215, 0.145)]
z = SH - 0.24
while z > 0.2 * height:
    k = (SH - z) / (SH - 0.2 * height)
    levels.append((z, 0.21 + 0.06 * k, 0.15 + 0.09 * k)); z -= 0.06
bm = bmesh.new()
for (z, rx, ry) in levels:
    ring = []
    for i in range(SEG + 1):
        a = -math.pi * 0.86 + (2 * math.pi * 0.86) * i / SEG       # open down the front: a closed tube filled with the wind and blew up into a ball          # a slit at the front (-y is his front in Blender after import? found below)
        ring.append(bm.verts.new(Vector((rx * math.sin(a), -ry * math.cos(a), z))))
    rings.append(ring)
for r in range(len(rings) - 1):
    for i in range(SEG):
        bm.faces.new([rings[r][i], rings[r][i + 1], rings[r + 1][i + 1], rings[r + 1][i]])
bm.normal_update()
cme = bpy.data.meshes.new("coat"); bm.to_mesh(cme); bm.free()
coat = bpy.data.objects.new("coat", cme); scene.collection.objects.link(coat)
pin = coat.vertex_groups.new(name="pin")
pin.add([v.index for v in cme.vertices if v.co.z > SH - 0.2], 1.0, "REPLACE")
cl = coat.modifiers.new("cloth", "CLOTH"); cs = cl.settings
cs.quality = 12; cs.mass = 0.45; cs.air_damping = 1.0; cs.tension_stiffness = 22; cs.compression_stiffness = 22; cs.shear_stiffness = 6; cs.bending_stiffness = 0.9
cs.vertex_group_mass = "pin"; cl.collision_settings.use_collision = True; cl.collision_settings.distance_min = 0.012; cl.collision_settings.use_self_collision = False
cl.point_cache.frame_start = 1; cl.point_cache.frame_end = PRE + FRAMES
sol = coat.modifiers.new("thick", "SOLIDIFY"); sol.thickness = 0.012
# the gale: from his left and a little behind (it blows toward +x), gusting
bpy.ops.object.effector_add(type="WIND", location=(6, 1.5, 1.2)); wind = bpy.context.object      # (from his right as he faces the sea: it blows toward -x, the way the waves run)
wind.rotation_euler = (0, math.radians(-90), math.radians(12)); wind.field.strength = 4200; wind.field.noise = 3.0; wind.field.flow = 0.5
bpy.ops.object.effector_add(type="TURBULENCE", location=(0, 0, 1)); turb = bpy.context.object
turb.field.strength = 260; turb.field.size = 0.6; turb.field.flow = 0.4

def pack(p, q, rgb, idx):
    lo, hi = p.min(axis=0), p.max(axis=0); span = np.where(hi - lo > 1e-9, hi - lo, 1.0)
    pq = np.round((p - lo) / span * 65535).astype("<u2"); nq = np.round(np.clip(q, -1, 1) * 32767).astype("<i2")
    rgba = np.concatenate([np.round(np.clip(rgb, 0, 1) * 255), np.full((len(p), 1), 255)], axis=1).astype(np.uint8)
    return struct.pack("<II3f3f", len(p), len(idx), *lo.astype(float), *hi.astype(float)) + pq.tobytes() + nq.tobytes() + rgba.tobytes() + idx.astype("<u4").tobytes()
R3 = lambda v: np.stack([v[:, 0], v[:, 2], -v[:, 1]], axis=1)
def grab(o):
    dg = bpy.context.evaluated_depsgraph_get(); ev = o.evaluated_get(dg); m = ev.to_mesh(); m.calc_loop_triangles()
    n = len(m.vertices); p = np.empty(n * 3, np.float32); m.vertices.foreach_get("co", p); q = np.empty(n * 3, np.float32); m.vertices.foreach_get("normal", q)
    t = np.empty(len(m.loop_triangles) * 3, np.int32); m.loop_triangles.foreach_get("vertices", t)
    ev.to_mesh_clear()
    return p.reshape(-1, 3), q.reshape(-1, 3), t.reshape(-1, 3)
blobs = []
for f in range(1, PRE + FRAMES + 1):
    wind.field.strength = 4200 + 2000 * math.sin(f * 0.21) + 1200 * math.sin(f * 0.53 + 1.0)
    scene.frame_set(f)
    if f <= PRE: continue
    bp, bq, bt = grab(man); cp, cq, ct = grab(coat)
    # his colours: skin above the collar, dark hair on top of it, dark trousers and boots; the coat a charcoal wool
    bc = np.tile(np.array([[0.03, 0.03, 0.035]]), (len(bp), 1))
    head = bp[:, 2] > SH + 0.07; bc[head] = (0.5, 0.36, 0.29); bc[bp[:, 2] > 0.955 * height] = (0.04, 0.03, 0.025)
    cc = np.tile(np.array([[0.045, 0.045, 0.05]]), (len(cp), 1))
    p = np.concatenate([bp, cp]); q = np.concatenate([bq, cq]); rgb = np.concatenate([bc, cc]); idx = np.concatenate([bt, ct + len(bp)]).astype(np.uint32)
    blobs.append(pack(R3(p), R3(q), rgb, idx))
    if f % 30 == 0: print("frame", f - PRE, "coat spans x", round(float(cp[:, 0].min()), 2), round(float(cp[:, 0].max()), 2), flush=True)
head = {"fps": FPS, "frames": len(blobs), "codec": "raw", "attrs": ["position", "normal", "color"], "texture": None, "index": []}
for _ in range(3):
    hj = json.dumps(head).encode(); off = 12 + len(hj); head["index"] = []
    for bl in blobs: head["index"].append([off, len(bl)]); off += len(bl)
hj = json.dumps(head).encode()
out = os.path.join(PROJ, "media", "ocean", "figure.raw.rseq")
with open(out, "wb") as fh:
    fh.write(b"RSEQ" + struct.pack("<II", 1, len(hj)) + hj)
    for bl in blobs: fh.write(bl)
print("wrote", out, len(blobs), "frames", flush=True)
