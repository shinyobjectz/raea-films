# Someone asleep at a desk: the MakeHuman body (psx people/pavel: MakeHuman CC0 assets) posed seated, slumped forward,
# the forearms crossed on the desk and the head down on them, the pose baked into a plain mesh. It is only ever seen in
# the copier's page, from behind and above. Its origin is midway between the hip joints, so it is placed at seat height.
#   raea blender run blender/slumped.py $PROJECTS/psx/people/pavel/body.glb
import bpy, sys, os
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp as C

argv = sys.argv[sys.argv.index("--") + 1:]
SRC = os.path.expanduser(argv[0])

from pose import aim

try:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SRC)
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    for o in [o for o in bpy.data.objects if o.type == "MESH" and o.name.startswith("Icosphere")]:
        bpy.data.objects.remove(o, do_unlink=True)
    body = [o for o in bpy.data.objects if o.type == "MESH"]
    for o in body:
        if o.data.shape_keys:
            o.shape_key_clear()
    # the legs: thighs out along the seat, shins down to the floor
    for s, sx in (("l", 1), ("r", -1)):
        aim(arm, f"thigh_{s}", f"calf_{s}", (sx * 0.1, -1.0, -0.06))
        aim(arm, f"calf_{s}", f"foot_{s}", (sx * 0.02, -0.18, -1.0))
        aim(arm, f"foot_{s}", f"ball_{s}", (0, -1.0, -0.3))
    # the back rounds forward over the desk; the head drops onto the arms, turned a little to one side
    aim(arm, "spine_01", "spine_02", (0, -0.5, 1.0))
    aim(arm, "spine_02", "spine_03", (0, -0.85, 1.0))
    aim(arm, "spine_03", "neck_01", (0.0, -1.25, 0.7))
    aim(arm, "neck_01", "head", (0.05, -1.0, -0.15))
    aim(arm, "head", None, (0.25, -0.75, -0.6))
    # the arms forward onto the desk, the forearms crossed under the head
    for s, sx in (("l", 1), ("r", -1)):
        aim(arm, f"clavicle_{s}", f"upperarm_{s}", (sx * 1.0, -0.35, -0.05))
        aim(arm, f"upperarm_{s}", f"lowerarm_{s}", (sx * 0.3, -0.85, -0.42))
        aim(arm, f"lowerarm_{s}", f"hand_{s}", (sx * -0.85, -0.45, 0.02))
        aim(arm, f"hand_{s}", None, (sx * -0.2, -0.3, 1.0))
    bpy.context.view_layer.update()
    hips = (arm.matrix_world @ arm.pose.bones["thigh_l"].head + arm.matrix_world @ arm.pose.bones["thigh_r"].head) / 2
    for o in body:
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers):
            if m.type == "ARMATURE":
                bpy.ops.object.modifier_apply(modifier=m.name)
        mw = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = mw
        for vg in list(o.vertex_groups):
            o.vertex_groups.remove(vg)
    bpy.data.objects.remove(arm, do_unlink=True)
    col, root = C.fresh("slumped")
    for o in body:
        C.link(col, root, o)
        o.matrix_world = Matrix.Translation(-hips) @ o.matrix_world
    lo, hi = C.box_of(body)
    print("box", tuple(round(v, 3) for v in lo), tuple(round(v, 3) for v in hi))
    C.export(col, root, "afk", "slumped", "blender/slumped.py", "MakeHuman CC0 body and clothes (psx people/pavel), posed and baked", "CC0", "MakeHuman")
    print("DONE")
except Exception as e:
    import traceback
    traceback.print_exc()
    print("FAILED", e)
    sys.exit(1)
