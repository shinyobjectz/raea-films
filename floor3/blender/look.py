# A quick look at finished models side by side, lit in Eevee, to judge a model before it goes in the level.
#   raea blender run blender/look.py OUT.png MODEL.glb [MODEL.glb ...]
import bpy, math, sys
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
out, paths = args[0], args[1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
x, top = 0.0, 0.0
for p in paths:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=p)
    new = [o for o in bpy.data.objects if o not in before]
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in new if o.type == "MESH" for c in o.bound_box]
    lo = Vector([min(v[i] for v in pts) for i in range(3)])
    hi = Vector([max(v[i] for v in pts) for i in range(3)])
    shift = Vector((x - lo.x, -(lo.y + hi.y) / 2, -lo.z))
    for o in new:
        if o.parent is None:
            o.location += shift
    x += (hi.x - lo.x) + 0.25
    top = max(top, hi.z - lo.z)
w = x - 0.25
bpy.ops.mesh.primitive_plane_add(size=40, location=(w / 2, 0, 0))
floor = bpy.context.object
m = bpy.data.materials.new("floor")
m.use_nodes = True
next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs["Base Color"].default_value = (0.32, 0.31, 0.29, 1)
floor.data.materials.append(m)
for loc, e in (((w / 2 - 2, -3, 4), 900), ((w / 2 + 3, -1, 2.5), 300), ((w / 2, 3, 3), 400)):
    bpy.ops.object.light_add(type="AREA", location=loc)
    L = bpy.context.object
    L.data.energy, L.data.size = e, 2.5
    L.rotation_euler = (Vector((w / 2, 0, top / 2)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
span = max(w, top * 2.2)
bpy.ops.object.camera_add(location=(w / 2, -span * 1.25, top * 0.75 + span * 0.25))
cam = bpy.context.object
cam.data.lens = 50
cam.rotation_euler = (Vector((w / 2, 0, top * 0.42)) - cam.location).to_track_quat("-Z", "Y").to_euler()
sc.camera = cam
sc.world = bpy.data.worlds.new("w")
sc.world.color = (0.05, 0.05, 0.05)
for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        sc.render.engine = eng
        break
    except TypeError:
        pass
sc.render.resolution_x, sc.render.resolution_y = 1600, 800
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("looked", out)
