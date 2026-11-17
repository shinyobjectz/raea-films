# The canyon as it is come into from a door (the director, 11-11: "have it open up right into the canyon"). The slot's walls,
# rim and sand run 11 m out past where the lens starts, flaring into a mouth, and the cellar now stands there with its
# door opening on the slot. This cuts those three pieces off at the door's plane (z 7.9 in the canyon's own space), so
# the rock begins behind the cellar's wall and none of it stands in the cellar.
#   raea blender run blender/canyon-in.py    ->  media/models/canyon/{walls,rim,sand}-in.glb
import bpy, bmesh, os, shutil, json
HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "..", "media", "models", "canyon")
CUT = 7.9
for name in ("walls", "rim", "sand"):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(D, name + ".glb"))
    for o in [o for o in bpy.data.objects if o.type == "MESH"]:
        bm = bmesh.new(); bm.from_mesh(o.data)
        inv = o.matrix_world.inverted()
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        # glTF z is Blender -y: keep z < CUT, which is Blender y > -CUT
        co = inv @ __import__("mathutils").Vector((0, -CUT, 0)); no = (inv.to_3x3().transposed().inverted() @ __import__("mathutils").Vector((0, -1, 0))).normalized()
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=no, clear_outer=True)
        bm.to_mesh(o.data); bm.free()
    bpy.ops.object.select_all(action="SELECT")
    out = os.path.join(D, name + "-in.glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_yup=True, export_apply=True, export_animations=False)
    side = json.load(open(os.path.join(D, name + ".glb.json")))
    side["made"] = "blender/canyon-in.py"; side["notes"] = f"{name}.glb cut off at z {CUT}"
    json.dump(side, open(out + ".json", "w"), indent=1)
    print("wrote", out, flush=True)
