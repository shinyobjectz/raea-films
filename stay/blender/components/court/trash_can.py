# court/trash-can: a dented, rusted steel bin with its lid leaning on it, Poly Haven's metal_trash_can (CC0, the rusted
# one of its pair). Rig: "lid" lifts the lid 30 cm and tips it 25 degrees (a hand taking it off).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component("court", "trash_can", "metal_trash_can", res="2k", keep=lambda n: "rust" in n)
lid = next(o for k, o in parts.items() if "lid" in k)
p = comp.hang(col, root, [lid], "trash_can_lid_lift")
_lib.channel("lid", [(p, "location", 2, p.location.z, p.location.z + 0.3), (p, "rotation_euler", 1, 0, math.radians(25))])
comp.export(col, root, "court", "trash_can", made="blender/components/court/trash_can.py", source="https://polyhaven.com/a/metal_trash_can (the rusted bin, its handles and lid)", license="CC0", credit=credit,
            rig={"lid": "the lid lifts 30 cm off the ground and tips 25 degrees"})
