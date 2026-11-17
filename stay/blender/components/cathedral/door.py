# cathedral/door: the great door, 2 m wide and 2.9 m high: two leaves of studded oak in a frame (Poly Haven's
# large_castle_door, CC0). Stands on the floor, its face toward -y. Rig: "open" swings both leaves 80 degrees inward
# (toward +y) on their outer edges.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp
col, root, parts, credit = comp.ph_component("cathedral", "door", "large_castle_door", res="1k")
print("door parts", {k: [tuple(round(c, 2) for c in v) for v in comp.box_of(o)] for k, o in parts.items()})
llo, lhi = comp.box_of(parts["left"])
rlo, rhi = comp.box_of(parts["right"])
flo, fhi = comp.box_of(parts["frame"])
ymid = (flo.y + fhi.y) / 2
lp = comp.hang(col, root, parts["left"], "door_leaf_left", at=(llo.x + 0.03, ymid, 0))
rp = comp.hang(col, root, parts["right"], "door_leaf_right", at=(rhi.x - 0.03, ymid, 0))
L.channel("open", [(lp, "rotation_euler", 2, 0, math.radians(80)), (rp, "rotation_euler", 2, 0, math.radians(-80))])
comp.export(col, root, "cathedral", "door", made="blender/components/cathedral/door.py", source="https://polyhaven.com/a/large_castle_door", license="CC0", credit=credit,
            rig={"open": "both leaves (door_leaf_left, door_leaf_right) swing 80 degrees inward about their outer edges"})
