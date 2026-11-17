# blender/critter_heads.py: where each watcher's head is through each of its clips, so the marks over them (the "!",
# the heart) ride the head the clip moves, not a fixed height over the body (the director 11-16 on v6: "the ! is not tracked
# to its head"). Model space as the film sees it (y up, facing +z, unscaled), sampled at 30 a second.
# usage: raea blender run blender/critter_heads.py GLB_DIR OUT.json
import bpy, sys, json, os
_a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[-2:]
src, out = _a[0], _a[1]
HEAD = {"deer": "Head", "frog": "Head", "rat": "Head"}
res = {}
for name, bone in HEAD.items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(src, f"critter-{name}.glb"))
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    if arm.animation_data is None: arm.animation_data_create()
    clips = {}
    for act in bpy.data.actions:
        arm.animation_data.action = act
        if hasattr(act, "slots") and len(act.slots): arm.animation_data.action_slot = act.slots[0]
        f0, f1 = act.frame_range; sc = bpy.context.scene; fps = sc.render.fps / sc.render.fps_base
        pts = []
        for k in range(int((f1 - f0) / fps * 30) + 1):
            sc.frame_set(int(f0), subframe=0.0); sc.frame_float = f0 + k * fps / 30
            bpy.context.view_layer.update()
            p = arm.matrix_world @ arm.pose.bones[bone].head
            pts.append([round(p.x, 4), round(p.z, 4), round(-p.y, 4)])
        clips[act.name] = pts
    res[name] = clips
    print(name, len(clips), "clips")
json.dump(res, open(out, "w"))
print("wrote", out)
