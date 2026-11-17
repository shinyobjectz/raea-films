# A forest road from scanned things (Poly Haven, CC0), to replace the modelled road's trees and ground in the film's
# road shot (11-11: "nothign shor of hyperrealism"; the old road's trees were hand-built cones and its sky a blank).
# Components in media/models/forest: the road (a strip of asphalt 7.2 m wide and 90 m long, its paint as thin raised
# lines), the ground either side (forest floor, 90 x 90 m), and one component each of a fir, a pine, two saplings, a
# fern, a stump, a dead trunk, a mossy rock set, roots and grass. sets/forest.ts stands them along the road.
#   raea blender run blender/forest.py
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp, bpy
from mathutils import Vector

MADE = "blender/forest.py"
def size_of(col):
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for o in col.all_objects:
        if o.type != "MESH":
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo, hi = Vector(map(min, lo, w)), Vector(map(max, hi, w))
    return [round(hi.x - lo.x, 3), round(hi.z - lo.z, 3), round(hi.y - lo.y, 3)]
def done(col, root, name, source, license, credit):
    bpy.context.view_layer.update()
    print("size", "forest", name, *size_of(col))
    comp.export(col, root, "forest", name.replace("-", "_"), made=MADE, source=source, license=license, credit=credit)
    for o in list(col.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)
    comp.purge()

# the road
col, root = comp.fresh("road")
asphalt = comp.ph_texture("forest_asphalt", "asphalt_02", tile=3.0, res="2k")
r = comp.mesh(col, root, "road_asphalt", comp.box((7.2, 90, 0.06), at=(0, 0, -0.03)), asphalt)
comp.uv_box(r, 1.0)
yellow = comp.mat("forest_line_yellow", (0.78, 0.6, 0.1), rough=0.6)
white = comp.mat("forest_line_white", (0.82, 0.82, 0.8), rough=0.6)
comp.mesh(col, root, "road_centre", comp.merge(comp.box((0.11, 90, 0.004), at=(-0.1, 0, 0.002)), comp.box((0.11, 90, 0.004), at=(0.1, 0, 0.002))), yellow)
comp.mesh(col, root, "road_edges", comp.merge(comp.box((0.12, 90, 0.004), at=(-3.3, 0, 0.002)), comp.box((0.12, 90, 0.004), at=(3.3, 0, 0.002))), white)
done(col, root, "road", "own geometry; asphalt: https://polyhaven.com/a/asphalt_02", "ours; texture CC0", "Poly Haven (asphalt_02)")
# the forest floor either side, a little under the road's edge
col, root = comp.fresh("ground")
floor = comp.ph_texture("forest_floor", "forest_floor", tile=4.0, res="2k")
g = comp.mesh(col, root, "ground_floor", comp.box((90, 90, 0.05), at=(0, 0, -0.07)), floor)
comp.uv_box(g, 1.0)
done(col, root, "ground", "own geometry; floor: https://polyhaven.com/a/forest_floor", "ours; texture CC0", "Poly Haven (forest_floor)")
for name, asset in (("fir", "fir_tree_01"), ("pine", "pine_tree_01"), ("fir-sapling", "fir_sapling_medium"), ("pine-sapling", "pine_sapling_medium"), ("fern", "fern_02"), ("stump", "tree_stump_01"),
                    ("trunk", "dead_tree_trunk"), ("rocks", "rock_moss_set_01"), ("roots", "pine_roots"), ("grass", "grass_medium_01"), ("shrub", "shrub_02")):
    try:
        col, root, parts, credit = comp.ph_component("forest", name.replace("-", "_"), asset, res="1k")
        done(col, root, name, f"https://polyhaven.com/a/{asset}", "CC0", credit)
    except Exception as e:
        print("FAILED", name, asset, repr(e)[:200])
print("forest done")
