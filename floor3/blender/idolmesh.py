# A soft prop from Idol: the vertex-coloured mesh tools/idol.sh carved from Idol's splat, made a game asset. Stood up
# at its real height on its base (origin at its bottom centre, front toward raea +z), brought under a triangle budget,
# given UVs, and its colours baked into a texture (raea's path tracer reads textures, not vertex colours).
#   raea blender run blender/idolmesh.py RAW.glb NAME --h METRES [--faces 12000] [--turn DEG] [--rough 0.85] [--res 1024]
#       [--made TEXT]
# Writes assets/models/f3/NAME.glb and its sidecar.
import bpy, bmesh, sys, os, json, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp as C
from mathutils import Vector, Matrix

a = sys.argv[sys.argv.index("--") + 1:]
src, name = a[0], a[1]
opt = lambda k, d: type(d)(a[a.index(k) + 1]) if k in a else d
H, FACES, TURN, ROUGH, RES = opt("--h", 1.0), opt("--faces", 12000), opt("--turn", 0.0), opt("--rough", 0.85), opt("--res", 1024)
MADE = opt("--made", "an image we drew, made 3D by Idol (local, 8-bit MLX) and carved to a mesh")

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=src)
objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
if len(objs) != 1:
    C.fail(f"{src} holds {len(objs)} meshes, expected one")
o = objs[0]
bpy.context.view_layer.objects.active = o
o.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# stand it up: real height, bottom centre at the origin, turned about the vertical
me = o.data
lo = Vector([min(v.co[i] for v in me.vertices) for i in range(3)])
hi = Vector([max(v.co[i] for v in me.vertices) for i in range(3)])
k = H / (hi.z - lo.z)
cen = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
me.transform(Matrix.Rotation(math.radians(TURN), 4, "Z") @ Matrix.Scale(k, 4) @ Matrix.Translation(-cen))

# under budget, keeping the colours
tris = sum(len(p.vertices) - 2 for p in me.polygons)
if tris > FACES:
    d = o.modifiers.new("dec", "DECIMATE")
    d.ratio = FACES / tris
    bpy.ops.object.modifier_apply(modifier="dec")
for p in me.polygons:
    p.use_smooth = True

# UVs, and the colour attribute baked to an image through an emission pass
uv = me.uv_layers.new(name="UVMap")
me.uv_layers.active = uv
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004)
bpy.ops.object.mode_set(mode="OBJECT")
attr = me.color_attributes[0].name if me.color_attributes else None
if attr is None:
    C.fail("the mesh has no colours to bake")
img = bpy.data.images.new(name + "_colour", RES, RES)
m = bpy.data.materials.new(name)
m.use_nodes = True
nt = m.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
out = nt.nodes.new("ShaderNodeOutputMaterial")
ca = nt.nodes.new("ShaderNodeVertexColor")
ca.layer_name = attr
em = nt.nodes.new("ShaderNodeEmission")
nt.links.new(ca.outputs["Color"], em.inputs["Color"])
nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
tex = nt.nodes.new("ShaderNodeTexImage")
tex.image = img
nt.nodes.active = tex
me.materials.clear()
me.materials.append(m)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = 1
sc.render.bake.margin = 6
bpy.ops.object.bake(type="EMIT")
img.filepath_raw = os.path.join(C.PROJECT, "blender", "src", "idol", name + "_colour.png")
os.makedirs(os.path.dirname(img.filepath_raw), exist_ok=True)
img.file_format = "PNG"
img.save()

# the game material: the baked colour, cloth-rough
for n in list(nt.nodes):
    nt.nodes.remove(n)
out = nt.nodes.new("ShaderNodeOutputMaterial")
b = nt.nodes.new("ShaderNodeBsdfPrincipled")
b.inputs["Roughness"].default_value = ROUGH
tex = nt.nodes.new("ShaderNodeTexImage")
tex.image = img
nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
nt.links.new(b.outputs["BSDF"], out.inputs["Surface"])
me.color_attributes.remove(me.color_attributes[0])

col, root = C.fresh(name)
C.link(col, root, o, name=name + "_body")
C.export(col, root, "f3", name, "blender/idolmesh.py", MADE, "ours", "")
