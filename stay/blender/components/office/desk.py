# office/desk: a steel tanker desk, 2 m, two pedestals of three drawers (Poly Haven's metal_office_desk, CC0, by Ulan
# Cabanilla). The rows either side of the aisle are copies of it. Rig: "drawer" pulls the right pedestal's top drawer
# out 0.32 m (the cursor's grab); "drawers" pulls all six out a little at once (the generator's reroll rattling them).
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
from mathutils import Vector

col, root = comp.fresh("desk")
objs = comp.ph_model("metal_office_desk")
credit, info = comp.ph_credit("metal_office_desk")
for o in objs:
    if o.type == "EMPTY" and not o.children:
        continue
    comp.link(col, root, o)
for o in objs:
    if o.name not in col.objects:
        import bpy
        bpy.data.objects.remove(o, do_unlink=True)

parts = {o.name: o for o in col.objects}
body = next(o for n, o in parts.items() if n.startswith("metal_office_desk") and "drawer" not in n and "tray" not in n and o.type == "MESH")
body.name = "desk_body"
drawers = sorted((o for n, o in parts.items() if "drawer" in n), key=lambda o: (-o.matrix_world.translation.x, -o.matrix_world.translation.z))
for i, d in enumerate(drawers):
    d.name = f"desk_drawer_{i + 1}"
for i, t in enumerate(sorted((o for n, o in parts.items() if "tray" in n), key=lambda o: -o.matrix_world.translation.x)):
    t.name = f"desk_tray_{i + 1}"

top = drawers[0]
comp.channel("drawer", [(top, "location", 1, top.location.y, top.location.y - 0.32)])
comp.channel("drawers", [(d, "location", 1, d.location.y, d.location.y - 0.06) for d in drawers])

comp.export(col, root, "office", "desk", made="blender/components/office/desk.py",
            source="https://polyhaven.com/a/metal_office_desk", license="CC0", credit=credit,
            rig={"drawer": "the right pedestal's top drawer (desk_drawer_1) out 0.32 m toward the front",
                 "drawers": "all six drawers out 6 cm"})
