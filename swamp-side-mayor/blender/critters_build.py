# blender/critters_build.py: the watchers (Quaternius, CC0: assets/critters/LICENCES.md) made to sit in the goose's
# sticker look: their faceted low-poly skin subdivided under the skeleton and shaded smooth, so the film's cel shade
# draws two clean tones and one line round them, as it does the goose; matte, no glare. Their clips are kept.
# usage: raea blender run blender/critters_build.py SRC_DIR OUT_DIR [NAME...]
import bpy, sys, os
_a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[-2:]
src, out = _a[0], _a[1]
# the swamp's colours, louder: the critters' own flat colours pushed to the film's vivid cartoon palette
PAL = {"Green": "#5fd147", "Yellow": "#ffd84a", "Red": "#ff4d6d", "Frog_Main": "#8be04e", "Frog_Secondary": "#ffe36b", "Grey": "#9a98c9", "Pink": "#ff9ec4",
       "DarkGreen": "#27b36a", "LightGreen": "#a6ec6f", "Purple": "#a35cff", "DarkRed": "#d6336c", "Body": "#ff8a2a", "Stripes": "#fffaf0"}
from mathutils import Vector, Quaternion
LOOK = {"deer": ("AnimalArmature|Idle", ["Neck1", "Neck2", "Neck3", "Head"]), "frog": ("FrogArmature|Frog_Idle", ["Neck", "Head"]),
        "rat": ("RatArmature|Rat_Idle", ["Neck", "Head"]), "raccoon": ("AnimalArmature|AnimalArmature|AnimalArmature|Idle", ["Head"])}
def fcurves_of(act):
    if getattr(act, "layers", None) and len(act.layers): return [fc for st in act.layers[0].strips for bag in st.channelbags for fc in bag.fcurves]
    return list(act.fcurves)
def look_clip(arm, src, bones, name, axis_world, angle):
    """a copy of clip `src` with `bones` turned about a world axis by `angle` in all (the head the most), in each bone's rest frame"""
    a = bpy.data.actions.get(src)
    if a is None: print("no clip", src); return
    act = a.copy(); act.name = name; share = [0.25] * (len(bones) - 1) + [1.0]; tot = sum(share)
    axis_arm = (arm.matrix_world.to_3x3().inverted() @ axis_world).normalized()
    for b, w in zip(bones, share):
        if b not in arm.data.bones: continue
        q_off = Quaternion((arm.data.bones[b].matrix_local.to_3x3().inverted() @ axis_arm).normalized(), angle * w / tot)
        fcs = sorted([fc for fc in fcurves_of(act) if fc.data_path == f'pose.bones["{b}"].rotation_quaternion'], key=lambda fc: fc.array_index)
        if len(fcs) != 4 or len({len(fc.keyframe_points) for fc in fcs}) != 1: print("skip", name, b, len(fcs)); continue
        for k in range(len(fcs[0].keyframe_points)):
            q = Quaternion([fcs[i].keyframe_points[k].co[1] for i in range(4)]); qn = q_off @ q
            for i in range(4): fcs[i].keyframe_points[k].co[1] = qn[i]; fcs[i].keyframe_points[k].handle_left[1] = qn[i]; fcs[i].keyframe_points[k].handle_right[1] = qn[i]
        for fc in fcs: fc.update()
def lin(h): return [((int(h[i:i + 2], 16) / 255 + 0.055) / 1.055) ** 2.4 for i in (1, 3, 5)] + [1]
import sys as _s
NAMES = [a for a in _s.argv[_s.argv.index("--") + 3:]] if _s.argv.count("--") and len(_s.argv) > _s.argv.index("--") + 3 else ["frog", "frog2", "raccoon", "rat", "snake", "fish", "deer"]
for name in NAMES:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(src, f"{name}.glb"))
    for ob in [o for o in bpy.data.objects if o.type == "MESH" and (o.name.startswith("Icosphere") or not o.data.materials)]:
        bpy.data.objects.remove(ob)   # a bone's display shape, not part of the animal
    for ob in [o for o in bpy.data.objects if o.type == "MESH"]:
        if "Outline" in [m.name for m in ob.data.materials if m]:   # an inverted-hull outline: the film draws its own
            bm_i = [i for i, m in enumerate(ob.data.materials) if m and m.name == "Outline"][0]
            import bmesh; bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index == bm_i], context="FACES"); bm.to_mesh(ob.data); bm.free()
        bpy.ops.object.select_all(action="DESELECT"); bpy.context.view_layer.objects.active = ob; ob.select_set(True)
        if name == "deer":   # its faces come apart (flat-shaded, every face its own vertices): weld them, or a subdivision shrinks each to a spot
            import bmesh; bm = bmesh.new(); bm.from_mesh(ob.data); d = max(ob.dimensions) / max(ob.scale) * 1e-4
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=d); bm.to_mesh(ob.data); bm.free(); print(name, "welded to", len(ob.data.vertices), "verts")
        if len(ob.data.vertices) < 6000:
            sub = ob.modifiers.new("sub", "SUBSURF"); sub.levels = 2 if len(ob.data.vertices) < 1500 else 1
            while ob.modifiers[0] != sub: bpy.ops.object.modifier_move_up(modifier="sub")
            bpy.ops.object.modifier_apply(modifier="sub")
        bpy.ops.object.shade_smooth()
        for m in ob.data.materials:
            if m and m.use_nodes:
                bs = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
                if bs:
                    bs.inputs["Roughness"].default_value = 1; bs.inputs["Metallic"].default_value = 0
                    if m.name in PAL and not bs.inputs["Base Color"].links: bs.inputs["Base Color"].default_value = lin(PAL[m.name])
                    if "Specular IOR Level" in bs.inputs: bs.inputs["Specular IOR Level"].default_value = 0
        print(name, ob.name, len(ob.data.vertices), "verts", [m.name for m in ob.data.materials if m])
    for m in bpy.data.materials:   # opaque, every one (the deer's light spots came through see-through)
        if m.use_nodes:
            bs = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
            if bs:
                for l in list(bs.inputs["Alpha"].links): m.node_tree.links.remove(l)
                bs.inputs["Alpha"].default_value = 1
        if hasattr(m, "surface_render_method"): m.surface_render_method = "DITHERED"
        if hasattr(m, "blend_method"): m.blend_method = "OPAQUE"
    # its head turned, as clips: copies of its idle with the head (and some of the neck) turned left, right and up, so
    # the film can aim the head anywhere between by blending them with the idle by weight (a bone set by hand is
    # overridden by a playing clip)
    if name in LOOK:
        arm = next(o for o in bpy.data.objects if o.type == "ARMATURE"); idle, bones = LOOK[name]
        for tag, axis, ang in (("L", (0, 0, 1), 1.0), ("R", (0, 0, 1), -1.0), ("U", (1, 0, 0), -0.6)):
            look_clip(arm, idle, bones, f"Look_{tag}", Vector(axis), ang)
    print(name, "clips", [a.name for a in bpy.data.actions])
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=os.path.join(out, f"critter-{name}.glb"), export_format="GLB", export_animations=True, export_yup=True)
