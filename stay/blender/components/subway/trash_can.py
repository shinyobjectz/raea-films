# subway/trash-can: a dented galvanised steel trash can, its lid off beside it (Poly Haven's metal_trash_can, CC0), standing on the floor at the origin.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("subway", "trash_can", "metal_trash_can", res="1k", origin="floor", turn=0, keep=lambda n: "rust" not in n)
print("parts", {k: [round(v, 3) for v in o.dimensions] for k, o in parts.items()})
comp.export(col, root, "subway", "trash_can", made="blender/components/subway/trash_can.py",
            source="https://polyhaven.com/a/metal_trash_can", license="CC0", credit=credit)
