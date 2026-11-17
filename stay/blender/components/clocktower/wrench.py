# clocktower/wrench: an adjustable wrench, 0.25 m (Poly Haven's adjustable_wrench, CC0), laid flat on its side at the
# origin, its jaw toward +x. Rig: "jaw" slides the moving jaw 12 mm open along the head.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
from mathutils import Matrix, Vector
col, root, parts, credit = comp.ph_component("clocktower", "wrench", "adjustable_wrench", res="1k", origin="floor")
lay = Matrix.Rotation(math.radians(90), 4, "Y") @ Matrix.Rotation(math.radians(90), 4, "Z")
for o in parts.values():
    o.matrix_world = lay @ o.matrix_world
lo, hi = comp.box_of(list(parts.values()))
for o in parts.values():
    o.matrix_world = Matrix.Translation((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)) @ o.matrix_world
comp.bpy.context.view_layer.update()
lo, hi = comp.box_of(list(parts.values()))
print("lying", [round(v, 3) for v in hi - lo])
jaw = parts["jaw"]
comp.channel("jaw", [(jaw, "location", 1, jaw.location.y, jaw.location.y - 0.012)])
comp.export(col, root, "clocktower", "wrench", made="blender/components/clocktower/wrench.py",
            source="https://polyhaven.com/a/adjustable_wrench", license="CC0", credit=credit,
            rig={"jaw": "the moving jaw slides 12 mm open"})
