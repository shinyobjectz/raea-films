# Two more places from scanned things (Poly Haven, CC0), for the film's main shots that were still hand-modelled:
# a garden at dusk and a harbour with a sailing ship. One component each; anything over 400,000 triangles is thinned
# to that. Prints "size PLACE NAME w h d faces".   raea blender run blender/outdoors.py [-- garden|harbour]
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp, bpy
from mathutils import Vector
PLACES = {
    "garden": [("tree", "jacaranda_tree", None), ("small-tree", "tree_small_02", None), ("shrub", "shrub_01", None), ("shrub-b", "shrub_03", None), ("shrub-c", "shrub_04", None),
               ("grass", "grass_medium_01", None), ("grass-b", "grass_medium_02", None), ("gazania", "flower_gazania", None), ("ursinia", "flower_ursinia", None),
               ("picnic-table", "wooden_picnic_table", None), ("bench", "painted_wooden_bench", None), ("street-lamp", "street_lamp_01", None), ("lantern", "Lantern_01", None),
               ("gnome", "garden_gnome", None), ("watering-can", "watering_can_metal_01", None), ("planter", "planter_box_01", None), ("rocks", "rock_moss_set_02", None), ("fire-pit", "stone_fire_pit", None)],
    "harbour": [("pier", "modular_wooden_pier", None), ("ship", "dutch_ship_medium", None), ("pinnace", "ship_pinnace", None), ("rocks", "coast_rocks_01", None), ("rocks-b", "coast_rocks_02", None),
                ("barrels", "wooden_barrels_01", None), ("crate", "wooden_crate_01", None), ("lantern", "Lantern_01", None), ("life-jacket", "life_jacket", None), ("bucket", "wooden_bucket_02", None),
                ("basket", "wicker_basket_01", None), ("oil-lamp", "vintage_oil_lamp", None)],
}
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
want = [a for a in argv if not a.endswith(".py")]
def ground(place, tex, size):
    col, root = comp.fresh("ground")
    g = comp.mesh(col, root, "ground_floor", comp.box((size, size, 0.05), at=(0, 0, -0.025)), comp.ph_texture(f"{place}_ground", tex, tile=3.0, res="2k"))
    comp.uv_box(g, 1.0)
    comp.export(col, root, place, "ground", made="blender/outdoors.py", source=f"own geometry; ground: https://polyhaven.com/a/{tex}", license="ours; texture CC0", credit=f"Poly Haven ({tex})")
    for o in list(col.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)
    comp.purge()
for place, rows in PLACES.items():
    if want and place not in want:
        continue
    if place == "garden":
        ground(place, "forrest_ground_01", 60)
    for name, asset, _ in rows:
        try:
            col, root, parts, credit = comp.ph_component(place, name.replace("-", "_"), asset, res="1k")
            faces = sum(len(o.data.polygons) for o in col.all_objects if o.type == "MESH")
            thinned = ""
            if faces > 400000:
                ratio = 400000 / faces
                for o in list(col.all_objects):
                    if o.type == "MESH":
                        m = o.modifiers.new("thin", "DECIMATE"); m.ratio = ratio
                        bpy.context.view_layer.objects.active = o
                        bpy.ops.object.modifier_apply(modifier="thin")
                thinned = f" (thinned to {int(ratio * 100)}% of its triangles)"
                faces = sum(len(o.data.polygons) for o in col.all_objects if o.type == "MESH")
            bpy.context.view_layer.update()
            lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
            for o in col.all_objects:
                if o.type == "MESH":
                    for c in o.bound_box:
                        w = o.matrix_world @ Vector(c); lo, hi = Vector(map(min, lo, w)), Vector(map(max, hi, w))
            print("size", place, name, round(hi.x - lo.x, 2), round(hi.z - lo.z, 2), round(hi.y - lo.y, 2), faces, flush=True)
            comp.export(col, root, place, name.replace("-", "_"), made="blender/outdoors.py", source=f"https://polyhaven.com/a/{asset}{thinned}", license="CC0", credit=credit)
            for o in list(col.all_objects):
                bpy.data.objects.remove(o, do_unlink=True)
            comp.purge()
        except Exception as e:
            print("FAILED", place, name, asset, repr(e)[:160], flush=True)
print("outdoors done")
