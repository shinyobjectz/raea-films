# lighthouse/rocks: a scatter of mossed boulders for the plateau and the cliff's lip, 8 m across the set (Poly Haven's
# rock_moss_set_01, CC0). No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("lighthouse", "rocks", "rock_moss_set_01", res="1k")
print("parts", {k: [round(x, 2) for x in (*comp.box_of(v)[0], *comp.box_of(v)[1])] for k, v in parts.items()})
for o in parts.values():                      # bed each one 6 cm into the turf
    o.location.z -= comp.box_of(o)[0].z + 0.06
comp.bpy.context.view_layer.update()
comp.export(col, root, "lighthouse", "rocks", made="blender/components/lighthouse/rocks.py", source="https://polyhaven.com/a/rock_moss_set_01", license="CC0", credit=credit)
