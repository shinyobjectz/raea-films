# Candidate rocks for the man on the rock, from Poly Haven's scans (CC0), each a component media/models/sea/NAME.glb with
# its foot at the origin. Prints each one's size and the highest point's place.   raea blender run blender/crags.py [NAME ...]
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp, bpy
from mathutils import Vector
ROCKS = {"crag-a": "mountainside", "crag-b": "namaqualand_boulder_04", "crag-c": "rock_face_02", "crag-d": "boulder_01", "crag-e": "namaqualand_boulder_03", "crag-f": "namaqualand_cliff_01"}
want = [a for a in sys.argv if a in ROCKS] or list(ROCKS)
for name in want:
    asset = ROCKS[name]
    try:
        col, root, parts, credit = comp.ph_component("sea", name.replace("-", "_"), asset, res="2k")
        bpy.context.view_layer.update()
        top, lo, hi = None, Vector((1e9,) * 3), Vector((-1e9,) * 3)
        for o in col.all_objects:
            if o.type != "MESH": continue
            for v in o.data.vertices:
                w = o.matrix_world @ v.co
                lo, hi = Vector(map(min, lo, w)), Vector(map(max, hi, w))
                if top is None or w.z > top.z: top = w.copy()
        print("rock", name, asset, "size", [round(hi[i] - lo[i], 2) for i in range(3)], "top (raea x y z)", round(top.x, 3), round(top.z, 3), round(-top.y, 3), flush=True)
        comp.export(col, root, "sea", name.replace("-", "_"), made="blender/crags.py", source=f"https://polyhaven.com/a/{asset}", license="CC0", credit=credit)
        for o in list(col.all_objects): bpy.data.objects.remove(o, do_unlink=True)
        comp.purge()
    except Exception as e:
        print("FAILED", name, asset, repr(e)[:200], flush=True)
