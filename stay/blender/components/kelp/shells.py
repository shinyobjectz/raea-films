# kelp/shells: three spider-conch shells lying on the sand, 14 cm each, one mouth up (Poly Haven's lambis_shell, CC0,
# copied twice and turned). No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bpy
from mathutils import Matrix
col, root, parts, credit = comp.ph_component("kelp", "shells", "lambis_shell", res="1k")
src = list(parts.values())[0]
src.name = "shells_shell_1"
lo, hi = comp.box_of(src)
for i, (x, y, turn, flip) in enumerate(((0.22, 0.08, 130, False), (-0.16, 0.2, 250, True))):
    c = src.copy()
    col.objects.link(c)
    c.name = f"shells_shell_{i + 2}"
    m = Matrix.Translation((x, y, (hi.z - lo.z) if flip else 0.0)) @ Matrix.Rotation(math.radians(turn), 4, "Z") @ (Matrix.Rotation(math.pi, 4, "X") if flip else Matrix.Identity(4))
    c.matrix_world = m @ src.matrix_world
bpy.context.view_layer.update()
for o in col.all_objects:
    for sl in getattr(o, "material_slots", []):
        L.ambient(sl.material, 55.0)      # the water's scattered light (see _lib.ambient)
comp.export(col, root, "kelp", "shells", made="blender/components/kelp/shells.py", source="https://polyhaven.com/a/lambis_shell", license="CC0", credit=credit)
