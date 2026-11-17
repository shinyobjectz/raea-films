# bedroom/console: the games console beside the television with one controller on its lead (Poly Haven's
# gaming_console and gamepad, both CC0), the pad's body lying in front of the console (the asset's own sprawling lead cut off) and a
# hand-made lead curling between them. Rig: "pad" slides the controller 10 cm toward the front and turns it 25 degrees (a hand taking it up).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bpy
from mathutils import Matrix, Vector
col, root, parts, credit = comp.ph_component(_lib.PLACE, "console", "gaming_console", res="1k", origin="floor")
lo, hi = comp.box_of(list(parts.values()))
print("console parts", list(parts), lo, hi)
objs = [o for o in comp.ph_model("gamepad", "1k") ]
credit2, _ = comp.ph_credit("gamepad")
meshes = [o for o in objs if o.type == "MESH"]
for o in objs:
    if o not in meshes:
        bpy.data.objects.remove(o, do_unlink=True)
for o in meshes:
    o.parent = None
bpy.context.view_layer.update()
plo, phi = comp.box_of(meshes)
print("gamepad parts", [o.name for o in meshes], plo, phi)
# the asset's own lead sprawls 0.4 m behind the pad: keep the pad's body (the front 9 cm) and lay a lead of our own
import bmesh
for o in meshes:
    bm = bmesh.new(); bm.from_mesh(o.data)
    cut = (o.matrix_world.inverted() @ Vector((0, plo.y + 0.088, 0)))
    no = (o.matrix_world.inverted().to_3x3() @ Vector((0, 1, 0))).normalized()
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=cut, plane_no=no, clear_outer=True)
    bm.to_mesh(o.data); bm.free()
bpy.context.view_layer.update()
plo, phi = comp.box_of(meshes)
print("pad body", plo, phi)
mid = (plo + phi) / 2
at = Vector((0.0, lo.y - 0.1, 0.0))
for o in meshes:
    o.matrix_world = Matrix.Translation(at - Vector((mid.x, mid.y, plo.z))) @ o.matrix_world
bpy.context.view_layer.update()
pad = comp.pivot(col, root, "console_pad", (at.x, at.y, 0.0))
for i, o in enumerate(meshes):
    comp.link(col, root, o, name=f"console_pad_{i + 1}" if len(meshes) > 1 else "console_pad_body", parent=pad)
M = _lib.maker(col, root)
lead = comp.tube([(at.x, at.y + 0.04, 0.01), (at.x + 0.02, at.y + 0.07, 0.004), (at.x + 0.13, at.y + 0.06, 0.004), (at.x + 0.2, at.y + 0.02, 0.004), (0.21, lo.y + 0.1, 0.004), (0.19, lo.y + 0.2, 0.004), (0.17, lo.y + 0.12, 0.008), (0.1, lo.y - 0.012, 0.012), (0.06, lo.y + 0.004, 0.03)], 0.002, res=10)
M("console_lead", lead, comp.mat("console_lead", (0.03, 0.03, 0.03), rough=0.6), smooth=True)
_lib.channel("pad", [(pad, "location", 1, pad.location.y, pad.location.y - 0.1), (pad, "rotation_euler", 2, 0.0, math.radians(25))])
comp.export(col, root, _lib.PLACE, "console", made="blender/components/bedroom/console.py",
            source="https://polyhaven.com/a/gaming_console, https://polyhaven.com/a/gamepad; the lead is own geometry", license="CC0", credit=f"{credit}; {credit2}",
            rig={"pad": "the controller slides 10 cm toward the front and turns 25 degrees"})
