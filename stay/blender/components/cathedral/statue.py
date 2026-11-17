# cathedral/statue: a carved stone figure (Poly Haven's gothic_statue, CC0) on our own moulded stone pedestal, 0.9 m
# high. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bpy
from comp import T, R, S, xf
col, root, parts, credit = comp.ph_component("cathedral", "statue", "gothic_statue", res="1k")
lo, hi = comp.box_of(list(parts.values()))
print("statue box", [round(c, 2) for c in lo], [round(c, 2) for c in hi])
PED = 0.9
for o in parts.values():
    o.location.z += PED
bpy.context.view_layer.update()
hw = max(hi.x - lo.x, hi.y - lo.y) / 2 + 0.06
ped = comp.mesh(col, root, "statue_pedestal", comp.merge(L.octa([(hw * 1.2, 0.0), (hw * 1.2, 0.12), (hw * 1.08, 0.18), (hw * 0.95, 0.22), (hw * 0.95, PED - 0.2), (hw * 1.08, PED - 0.12), (hw * 1.15, PED - 0.08), (hw * 1.15, PED), (0.0, PED)])), L.plain_stone())
comp.bevel(ped, 0.01, 2)
comp.export(col, root, "cathedral", "statue", made="blender/components/cathedral/statue.py", source="https://polyhaven.com/a/gothic_statue, on our own pedestal", license="CC0; pedestal ours", credit=credit)
