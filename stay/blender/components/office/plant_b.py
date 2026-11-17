# office/plant-b: a low bushy plant in a pot, 0.84 m (Poly Haven's potted_plant_02, CC0), a second plant so the rows
# don't repeat. Rig: "sway" as plant's.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("office", "plant_b", "potted_plant_02")
lo, hi = comp.box_of(parts["pot"])
top = comp.hang(col, root, [parts["leaves"]], "plant_b_top", at=((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z))
comp.channel("sway", [(top, "rotation_euler", 0, 0, math.radians(4))])
comp.export(col, root, "office", "plant_b", made="blender/components/office/plant_b.py",
            source="https://polyhaven.com/a/potted_plant_02", license="CC0", credit=credit,
            rig={"sway": "the leaves lean 4 degrees toward the back, pivoting at the pot's rim"})
