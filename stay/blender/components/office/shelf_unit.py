# office/shelf-unit: a steel-framed wooden shelf unit with four drawers, 1.14 m wide, for a wall. Rig: "drawer" pulls the top drawer out 0.35 m (Poly Haven's drawer_cabinet, CC0).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp

col, root, parts, credit = comp.ph_component("office", "shelf_unit", "drawer_cabinet", origin="floor")
ds = sorted((o for k, o in parts.items() if "drawer" in k), key=lambda o: -comp.box_of(o)[1].z)
comp.channel("drawer", [(ds[0], "location", 1, ds[0].location.y, ds[0].location.y - 0.35)])
comp.export(col, root, "office", "shelf_unit", made="blender/components/office/shelf_unit.py",
            source="https://polyhaven.com/a/drawer_cabinet", license="CC0", credit=credit, rig={"drawer": "the top drawer out 0.35 m toward the front"})
