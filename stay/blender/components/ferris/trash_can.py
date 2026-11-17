# ferris/trash-can: a galvanised dustbin with its lid, 0.9 m (Poly Haven's metal_trash_can, CC0; the clean one of its
# two). Origin: on the ground at its middle. Rig: "lid" lifts the lid 30 cm and tips it 35 degrees (something
# looking out, the wind taking it).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp
col, root, parts, credit = comp.ph_component("ferris", "trash_can", "metal_trash_can", res="1k", keep=lambda n: "rust" not in n)
lo, hi = comp.box_of(parts["lid"])
lid = comp.hang(col, root, parts["lid"], "trash_can_lid_lift", at=((lo.x + hi.x) / 2, hi.y, lo.z))
L.clip("lid", lid, {("location", 2): [(0, lid.location.z), (1, lid.location.z + 0.3)], ("rotation_euler", 0): [(0, 0), (1, math.radians(35))]})
comp.export(col, root, "ferris", "trash_can", made="blender/components/ferris/trash_can.py", source="https://polyhaven.com/a/metal_trash_can", license="CC0", credit=credit,
            rig={"lid": "the lid lifts 30 cm and tips 35 degrees back"})
