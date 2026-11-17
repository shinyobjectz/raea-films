# The forest's trees, one tree a component: Poly Haven's fir_tree_01 and fir_sapling_medium each hold three scanned
# trees side by side (their LOD0), so each is split out, stood on the origin, and thinned to a share of its triangles
# (a whole fir is over two million, too many to stand thirty of along a road).
#   raea blender run blender/forest-trees.py
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp, bpy
from mathutils import Vector
for name, asset, letter, keep_share in (("fir-a", "fir_tree_01", "a", 0.3), ("fir-b", "fir_tree_01", "b", 0.3), ("fir-c", "fir_tree_01", "c", 0.3), ("sapling-a", "fir_sapling_medium", "a", 0.5), ("sapling-b", "fir_sapling_medium", "b", 0.5)):
    col, root, parts, credit = comp.ph_component("forest", name.replace("-", "_"), asset, res="1k", keep=lambda n, l=letter: f"_{l}_LOD0" in n or n.endswith(f"_{l}"))
    tris = 0
    for o in list(col.all_objects):
        if o.type != "MESH":
            continue
        m = o.modifiers.new("thin", "DECIMATE")
        m.ratio = keep_share
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier="thin")
        tris += len(o.data.polygons)
    bpy.context.view_layer.update()
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for o in col.all_objects:
        if o.type == "MESH":
            for c in o.bound_box:
                w = o.matrix_world @ Vector(c); lo, hi = Vector(map(min, lo, w)), Vector(map(max, hi, w))
    print("size", "forest", name, round(hi.x - lo.x, 2), round(hi.z - lo.z, 2), round(hi.y - lo.y, 2), "faces", tris)
    comp.export(col, root, "forest", name.replace("-", "_"), made="blender/forest-trees.py", source=f"https://polyhaven.com/a/{asset} (tree {letter}, thinned to {int(keep_share * 100)}% of its triangles)", license="CC0", credit=credit)
    for o in list(col.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)
    comp.purge()
print("trees done")
