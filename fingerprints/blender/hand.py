# The hand, as one .glb: the scan's SubD level 1 base (4.6k quads, UV'd, true scale: a 64 cm hand and forearm),
# subdivided twice (Catmull-Clark, UVs smoothed) so the silhouette holds in a macro shot; the scan's 8K maps carry the
# skin (tools/handmaps.sh converts them; the film's material puts them on). Mesh only: no material, no textures.
# Also prints where the thumb's pad is (the fingertip of the thumb, in glTF's Y-up metres) for the film's traces.
# Run: blender -b --factory-startup --python blender/hand.py -- IN.OBJ OUT.glb
import bpy, sys, json, mathutils

src, out = sys.argv[sys.argv.index("--") + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=src)
o = [x for x in bpy.data.objects if x.type == "MESH"][0]
o.name = "hand"
o.data.name = "hand"
for p in o.data.polygons:
    p.use_smooth = True
m = o.modifiers.new("subd", "SUBSURF")
m.levels = 2
m.render_levels = 2
m.uv_smooth = "PRESERVE_CORNERS"
bpy.context.view_layer.objects.active = o
bpy.ops.object.modifier_apply(modifier="subd")
o.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)  # the OBJ import leaves a 90 degree turn on the object
o.data.materials.clear()

# landmarks in Blender's Z-up frame, then as glTF (x, z, -y)
vs = [o.matrix_world @ v.co for v in o.data.vertices]
lo = min(vs, key=lambda v: v.y)
hi = max(vs, key=lambda v: v.y)
print("ENDS", "min-y", [round(c, 4) for c in lo], "max-y", [round(c, 4) for c in hi])
xs = sorted(vs, key=lambda v: v.x)
print("X-EXTREMES", [round(c, 4) for c in xs[0]], [round(c, 4) for c in xs[-1]])
print("COUNTS", len(o.data.vertices), "verts", len(o.data.polygons), "quads")

bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=False, export_materials="NONE", export_yup=True, export_texcoords=True, export_normals=True, export_tangents=True, export_apply=True)
json.dump({"source": "White Male 60's Hand (scan), purchased by the director; not for redistribution", "steps": ["blender/hand.py: SubD L1 + Catmull-Clark x2, mesh only"]}, open(out + ".json", "w"), indent=1)
print("WROTE", out)
