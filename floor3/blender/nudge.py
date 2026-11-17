# Moves or shrinks parts of a finished model in place, for a model made elsewhere whose script FLOOR3 doesn't own (the
# stay project's component library): two parts sharing a face get pulled half a millimetre apart, so the renderer
# never has to pick between them. Offsets are in raea's frame (x, y up, z toward the viewer).
#   raea blender run blender/nudge.py MODEL.glb PART:move=dx,dy,dz PART:shrink=metres ...
# shrink=m pulls the part in by m on every side (about its own box's middle). The sidecar's notes record each change.
import bpy, json, os, sys
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
path, ops = args[0], args[1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=path)
by_name = {o.name: o for o in bpy.data.objects}
done = []
for op in ops:
    part, what = op.split(":", 1)
    key, val = what.split("=", 1)
    o = by_name[part]
    if key == "move":
        x, y, z = (float(v) for v in val.split(","))
        o.matrix_world.translation += Vector((x, -z, y))
    elif key == "shrink":
        m = float(val)
        me = o.data
        lo = Vector([min(v.co[i] for v in me.vertices) for i in range(3)])
        hi = Vector([max(v.co[i] for v in me.vertices) for i in range(3)])
        mid, half = (lo + hi) / 2, (hi - lo) / 2
        # in the part's own frame, scaled so each side comes in by m in world units (the object's scale is applied)
        sc = o.matrix_world.to_scale()
        k = [max(0.0, (half[i] * sc[i] - m) / (half[i] * sc[i])) if half[i] * sc[i] > m else 1.0 for i in range(3)]
        for v in me.vertices:
            v.co = Vector([mid[i] + (v.co[i] - mid[i]) * k[i] for i in range(3)])
    else:
        raise SystemExit(f"unknown op {op}")
    done.append(op)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_yup=True, export_apply=True,
                          export_animations=False, export_image_format="AUTO", export_extras=False, export_cameras=False,
                          export_lights=False)
side = path + ".json"
if os.path.exists(side):
    s = json.load(open(side))
    s.setdefault("steps", []).append("floor3 blender/nudge.py " + " ".join(done))
    json.dump(s, open(side, "w"), indent=1)
print("nudged", os.path.basename(path), done)
