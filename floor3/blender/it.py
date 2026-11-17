# "It": what walks floor 3 when the floor is asleep. An office worker made from a MakeHuman body (psx people/pavel:
# MakeHuman CC0 assets: polo shirt, wool trousers, boots), posed standing wrong (the head dropped to one side, the arms
# hanging long and slightly forward, the shoulders down), the pose baked into a plain mesh so the ray tracer lights it,
# then drawn out to about 2.1 m and thinned. Its skin is greyed and smooth (no face picture), its eyes black, no hair.
#   raea blender run blender/it.py $PROJECTS/psx/people/pavel/body.glb
import bpy, sys, os, math
from mathutils import Vector, Matrix, Quaternion
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp as C

argv = sys.argv[sys.argv.index("--") + 1:]
SRC = os.path.expanduser(argv[0])

def lin(h):
    h = h.lstrip("#")
    f = lambda c: (lambda x: x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4)(int(c, 16) / 255)
    return (f(h[0:2]), f(h[2:4]), f(h[4:6]), 1.0)

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
    print("bones", len(arm.pose.bones), "meshes", [o.name for o in body])
    # Blender frame: z up, the body faces -y, its right hand at -x. The shoulders dropped, the arms hanging long and a
    # little forward with a soft bend, the back hunched, the head fallen toward its right shoulder.
    aim(arm, "spine_03", "neck_01", (0, -0.14, 1.0))
    for s, sx in (("l", 1), ("r", -1)):
        aim(arm, f"clavicle_{s}", f"upperarm_{s}", (sx * 1.0, -0.05, -0.32))
        aim(arm, f"upperarm_{s}", f"lowerarm_{s}", (sx * 0.1, -0.12, -1.0))
        aim(arm, f"lowerarm_{s}", f"hand_{s}", (sx * 0.03, -0.3, -1.0))
        aim(arm, f"hand_{s}", f"middle_01_{s}", (sx * 0.0, -0.22, -1.0))
    aim(arm, "neck_01", "head", (-0.2, -0.28, 1.0))
    aim(arm, "head", None, (-0.55, -0.3, 0.78))
    bpy.context.view_layer.update()
    # bake the pose into each mesh and drop the skeleton
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
    bpy.context.view_layer.update()
    # no hair, no lashes; grey smooth skin, black eyes, dark clothes
    for o in body:
        me = o.data
        drop = {i for i, m in enumerate(me.materials) if m and m.name in ("hair", "eyelashes")}
        if drop:
            import bmesh
            bm = bmesh.new(); bm.from_mesh(me)
            bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index in drop], context="FACES")
            bm.to_mesh(me); bm.free()
    look = {"skin": ("#9d978d", 0.62), "eye": ("#050505", 0.08), "cornea": ("#050505", 0.04), "teeth": ("#6f675a", 0.5),
            "tongue": ("#2a1515", 0.5), "namuhekam_male_polo_shirt": ("#3b3e44", 0.85), "toigo_wool_pants": ("#24252a", 0.9),
            "toigo_ankle_boots_male": ("#1a1715", 0.55)}
    for m in bpy.data.materials:
        if m.name not in look:
            continue
        col, rough = look[m.name]
        m.use_nodes = True
        nt = m.node_tree
        b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
        for l in list(b.inputs["Base Color"].links):
            nt.links.remove(l)
        if m.name in ("skin", "eye", "cornea", "teeth", "tongue"):
            for l in list(b.inputs["Normal"].links):
                nt.links.remove(l)
        for inp in ("Alpha", "Roughness", "Metallic"):
            for l in list(b.inputs[inp].links):
                nt.links.remove(l)
        b.inputs["Base Color"].default_value = lin(col)
        b.inputs["Roughness"].default_value = rough
        b.inputs["Metallic"].default_value = 0.0
        b.inputs["Alpha"].default_value = 1.0
        if hasattr(m, "blend_method"):
            m.blend_method = "OPAQUE"
    # drawn out: 1.17 taller from the feet, 0.9 as wide and deep
    lo = min(min((o.matrix_world @ v.co).z for v in o.data.vertices) for o in body)
    for o in body:
        mw = o.matrix_world
        inv = mw.inverted()
        for v in o.data.vertices:
            w = mw @ v.co
            w = Vector((w.x * 0.9, w.y * 0.9, lo + (w.z - lo) * 1.17))
            v.co = inv @ w
    col, root = C.fresh("it")
    for o in body:
        C.link(col, root, o)
    lo2, hi2 = C.box_of(body)
    print("height", hi2.z - lo2.z)
    for o in body:
        o.matrix_world = Matrix.Translation((-(lo2.x + hi2.x) / 2, -(lo2.y + hi2.y) / 2, -lo2.z)) @ o.matrix_world
    C.export(col, root, "it", "it", "blender/it.py", "MakeHuman CC0 body and clothes (psx people/pavel), posed and baked", "CC0", "MakeHuman")
    print("DONE")
except Exception as e:
    import traceback
    traceback.print_exc()
    print("FAILED", e)
    sys.exit(1)
