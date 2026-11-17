# Reads the goose as supplied: bones (heads in world space), actions, and a preview render.
import bpy, sys, mathutils
src, out = sys.argv[-2:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE"); mesh = next(o for o in bpy.data.objects if o.type == "MESH")
print("ARM", arm.name, arm.scale[:], "MESH", mesh.name, len(mesh.data.vertices), "shape keys", bool(mesh.data.shape_keys))
for b in arm.data.bones:
    h = arm.matrix_world @ b.head_local; t = arm.matrix_world @ b.tail_local
    print("BONE", b.name, "parent", b.parent.name if b.parent else None, [round(x, 3) for x in h], [round(x, 3) for x in t], sum(1 for v in mesh.data.vertices for g in v.groups if mesh.vertex_groups[g.group].name == b.name and g.weight > 0.3))
for a in bpy.data.actions: print("ACTION", a.name, a.frame_range[:])
print("FPS", bpy.context.scene.render.fps)
sc = bpy.context.scene; sc.render.engine = "BLENDER_WORKBENCH"; sc.render.resolution_x, sc.render.resolution_y = 1600, 800
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (1.3, -1.3, 0.55); cam.rotation_euler = (mathutils.Vector((0, 0, 0.3)) - cam.location).to_track_quat("-Z", "Y").to_euler()
for f in (1, 60, 150):
    sc.frame_set(f); sc.render.filepath = f"{out}-{f}.png"; bpy.ops.render.render(write_still=True)
