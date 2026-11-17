# blender/ruins_build.py: the swamp's ancient ruins, ours: weathered pale stone with moss on what faces the sky and
# dirt where it meets the ground. Each piece is blocked out in boxes and cylinders, broken with cuts, remeshed, eroded
# with noise and smoothed, then coloured per vertex. The film draws them as stickers (the goose's line and halo).
#   ruin-stone-K.glb  standing stones (a ring around the dance floor), some broken, one fallen
#   ruin-trilithon.glb two uprights and a lintel, a corner gone
#   ruin-column-K.glb fluted columns, whole and broken; ruin-drum.glb a fallen drum
#   ruin-arch.glb     an arch on two piers, its right side fallen, the blocks lying where they fell
#   ruin-statue.glb   the goose itself in stone on a plinth, worn smooth: the swamp's old mayor
# usage: raea blender run blender/ruins_build.py OUT_DIR GOOSE.glb
import bpy, bmesh, sys, math, random
from mathutils import Vector, Matrix, noise
out, goosep = sys.argv[-2:]
def lin(h): c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]; return [((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c]
STONE, STONE2, MOSS, MOSS2, DIRT = lin("#e2d7bd"), lin("#c4b89c"), lin("#8ab64e"), lin("#64923c"), lin("#8f7858")
def reset(): bpy.ops.wm.read_factory_settings(use_empty=True)
def box(size, at=(0, 0, 0), rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at, rotation=rot); o = bpy.context.object; o.scale = size; bpy.ops.object.transform_apply(scale=True, rotation=True, location=True); return o
def cyl(r, h, at=(0, 0, 0), n=32, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=h, location=at, rotation=rot); o = bpy.context.object; bpy.ops.object.transform_apply(rotation=True, location=True); return o
def join(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); return objs[0]
def cut(o, at, rot, size=(6, 6, 6)):
    c = box(size, at, rot); m = o.modifiers.new("cut", "BOOLEAN"); m.object = c; m.operation = "DIFFERENCE"
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier="cut"); bpy.data.objects.remove(c)
def weather(o, voxel=0.045, erode=0.07, seed=0):
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    m = o.modifiers.new("remesh", "REMESH"); m.mode = "VOXEL"; m.voxel_size = voxel; bpy.ops.object.modifier_apply(modifier="remesh")
    tex = bpy.data.textures.new(f"n{seed}", "CLOUDS"); tex.noise_scale = 0.35; tex.noise_depth = 3
    d = o.modifiers.new("erode", "DISPLACE"); d.texture = tex; d.strength = erode; d.mid_level = 0.6; d.texture_coords = "GLOBAL"; bpy.ops.object.modifier_apply(modifier="erode")
    s = o.modifiers.new("smooth", "SMOOTH"); s.factor = 0.6; s.iterations = 3; bpy.ops.object.modifier_apply(modifier="smooth")
    dc = o.modifiers.new("dec", "DECIMATE"); dc.ratio = 0.35; bpy.ops.object.modifier_apply(modifier="dec")
    me = o.data; me.update(); ca = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, v in enumerate(me.vertices):
        n = v.normal; p = v.co; k = noise.noise(p * 1.7 + Vector((seed, 0, 0))); k2 = noise.noise(p * 5.3)
        c = [STONE[j] * (1 - 0.5 * (0.5 + 0.5 * k2)) + STONE2[j] * 0.5 * (0.5 + 0.5 * k2) for j in range(3)]
        moss = max(0.0, n.z - 0.35) * 2.2 + max(0.0, 0.6 - p.z) * 1.4 * (0.5 + k)   # tops, and creeping up from the ground
        moss = min(1.0, max(0.0, moss * (0.55 + 0.9 * k)))
        if moss > 0.45: c = [MOSS[j] * (1 - 0.5 * (0.5 + 0.5 * k2)) + MOSS2[j] * 0.5 * (0.5 + 0.5 * k2) for j in range(3)]
        if p.z < 0.12: c = [c[j] * 0.4 + DIRT[j] * 0.6 for j in range(3)]
        ca.data[i].color = (*c, 1)
    me.color_attributes.active_color = ca
    for poly in me.polygons: poly.use_smooth = True
    mat = bpy.data.materials.get("stone") or bpy.data.materials.new("stone")
    if not mat.use_nodes:
        mat.use_nodes = True; nt = mat.node_tree; bs = next(x for x in nt.nodes if x.type == "BSDF_PRINCIPLED"); bs.inputs["Roughness"].default_value = 1
        if "Specular IOR Level" in bs.inputs: bs.inputs["Specular IOR Level"].default_value = 0
        vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Col"; nt.links.new(vc.outputs["Color"], bs.inputs["Base Color"])
    me.materials.clear(); me.materials.append(mat); return o
def export(name, o):
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=f"{out}/{name}.glb", export_format="GLB", export_yup=True, use_selection=True, export_vertex_color="ACTIVE", export_normals=True)
    print(name, len(o.data.vertices), "verts")
def taper(o, k):
    for v in o.data.vertices:
        if v.co.z > 0: f = 1 - k * v.co.z / max(0.01, max(w.co.z for w in o.data.vertices)); v.co.x *= f; v.co.y *= f

# standing stones: a slab tapering up, its top split off on some
for k, (w, h, d, broke) in enumerate([(1.0, 2.8, 0.6, None), (0.9, 2.3, 0.55, (0.62, 0.5)), (1.15, 3.1, 0.7, None), (0.8, 1.7, 0.5, (0.5, -0.6))]):
    reset(); rng = random.Random(k); o = box((w, d, h + 0.3), (0, 0, (h + 0.3) / 2 - 0.3)); taper(o, 0.28)
    for v in o.data.vertices: v.co.x += 0.06 * math.sin(v.co.z * 1.3 + k); v.co.y += 0.04 * math.cos(v.co.z * 1.7 + k)
    if broke: cut(o, (0, 0, h * broke[0] + 3), (broke[1], 0.2, 0))
    export(f"ruin-stone-{k}", weather(o, seed=k))
reset(); o = box((2.9, 1.0, 0.75), (0, 0, 0.3), (0, 0, 0.1)); cut(o, (1.9, 0, 3.3), (0.6, 0.3, 0)); export("ruin-stone-fallen", weather(o, seed=9))
# the trilithon
reset(); a = box((0.85, 0.65, 3.4), (-1.15, 0, 1.4)); b = box((0.85, 0.65, 3.3), (1.15, 0, 1.35)); taper(a, 0.08); taper(b, 0.08)
l = box((3.5, 0.75, 0.7), (0.05, 0, 3.42), (0, 0.04, 0.03)); o = join([a, b, l]); cut(o, (4.6, 0, 6.6), (0.7, 0, 0)); export("ruin-trilithon", weather(o, voxel=0.05, seed=4))
# columns: fluted shafts on a plinth, the capital on the whole one
def column(h, broke, seed):
    reset(); s = cyl(0.36, h, (0, 0, h / 2 + 0.25), 48)
    for v in s.data.vertices:
        ang = math.atan2(v.co.y, v.co.x); r = math.hypot(v.co.x, v.co.y); f = 1 - 0.07 * (0.5 + 0.5 * math.cos(16 * ang)) - 0.04 * v.co.z / h
        v.co.x, v.co.y = v.co.x * f, v.co.y * f
    parts = [s, box((1.0, 1.0, 0.3), (0, 0, 0.1)), cyl(0.45, 0.14, (0, 0, 0.32), 32)]
    if not broke: parts += [cyl(0.44, 0.18, (0, 0, h + 0.33), 32), box((1.05, 1.05, 0.24), (0, 0, h + 0.53))]
    o = join(parts)
    if broke: cut(o, (0, 0, h * broke + 3), (0.45, -0.3, 0))
    return weather(o, voxel=0.035, erode=0.05, seed=seed)
export("ruin-column-0", column(4.2, None, 11)); export("ruin-column-1", column(4.0, 0.62, 12)); export("ruin-column-2", column(3.6, 0.35, 13))
reset(); o = cyl(0.36, 1.1, (0, 0, 0.3), 48, (0, math.pi / 2, 0.3)); export("ruin-drum", weather(o, voxel=0.035, erode=0.05, seed=14))
# the arch: piers, then voussoirs round a half circle; its right shoulder has fallen
reset(); parts = [box((0.95, 0.95, 2.8), (-1.75, 0, 1.2)), box((0.95, 0.95, 2.8), (1.75, 0, 1.2))]
for i in range(11):
    a0 = math.pi * (i / 11); a1 = math.pi * ((i + 1) / 11); am = (a0 + a1) / 2
    if i in (1, 2): continue
    r0, r1 = 1.3, 2.2; c = Vector((math.cos(am) * (r0 + r1) / 2, 0, 2.6 + math.sin(am) * (r0 + r1) / 2))
    blk = box(((r1 - r0) * 0.98, 0.9, (r0 + r1) / 2 * (a1 - a0) * 0.95), tuple(c), (0, -(am - math.pi / 2) + math.pi / 2, 0)); parts.append(blk)
for k, (x, y, rz) in enumerate([(2.9, 0.8, 0.5), (2.2, -1.2, 1.4)]):
    parts.append(box((0.9, 0.8, 0.85), (x, y, 0.25), (0.2, 0.3, rz)))
o = join(parts); export("ruin-arch", weather(o, voxel=0.05, seed=21))
# the statue: the goose, at rest, in stone, six times its size, worn, on a chipped plinth
reset(); bpy.ops.import_scene.gltf(filepath=goosep)
for ob in list(bpy.data.objects):
    if ob.type == "ARMATURE": ob.animation_data_clear()
for ob in list(bpy.data.objects):
    if ob.type == "MESH":
        bpy.context.view_layer.objects.active = ob; ob.select_set(True)
        for m in list(ob.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
        ob.parent = None
mesh = next(ob for ob in bpy.data.objects if ob.type == "MESH")
for ob in list(bpy.data.objects):
    if ob is not mesh: bpy.data.objects.remove(ob)
bpy.context.view_layer.objects.active = mesh; mesh.select_set(True); mesh.matrix_world = Matrix.Scale(6, 4) @ mesh.matrix_world
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
mn = min(v.co.z for v in mesh.data.vertices); [setattr(v.co, "z", v.co.z - mn + 1.0) for v in mesh.data.vertices]
pl = box((2.6, 3.6, 1.1), (0, 0, 0.45)); cut(pl, (1.5, 2.0, 3.6), (0.5, 0.4, 0)); o = join([mesh, pl])
export("ruin-statue", weather(o, voxel=0.03, erode=0.05, seed=31))
