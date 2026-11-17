# turbines/boulders: mossed boulders pushed to the edge of the crest when the road was cut, 8 m across the set (Poly
# Haven's rock_moss_set_02, CC0), each bedded 6 cm into the turf. No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("turbines", "boulders", "rock_moss_set_02", res="1k")
for o in parts.values():
    o.location.z -= comp.box_of(o)[0].z + 0.06
comp.bpy.context.view_layer.update()
print("parts", {k: [round(x, 2) for x in (*comp.box_of(v)[0], *comp.box_of(v)[1])] for k, v in parts.items()})
comp.export(col, root, "turbines", "boulders", made="blender/components/turbines/boulders.py", source="https://polyhaven.com/a/rock_moss_set_02", license="CC0", credit=credit)
