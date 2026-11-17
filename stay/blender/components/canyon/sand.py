# canyon/sand: the slot's floor, 38 m of flood-laid sand following the walls' feet, modelled by hand: wind and water
# ripples 22 cm apart crossing the slot (their crests wandering), low bars where the slot bends, and the sand banked
# up against both walls. Pale orange sand from Poly Haven's coast_sand_01 (CC0), tinted. Its low points are 2 cm above
# z 0, its bars up to 20 cm: things standing on it sit at about y 0.08 in raea. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, noise, Vector

col, root = comp.fresh("sand")
sand = comp.ph_texture("canyon_sand", "coast_sand_01", tile=1.6, res="2k", tint=(1.0, 0.68, 0.46))
DY, NU = 0.04, 46
NY = int(round((L.Y1 - L.Y0) / DY))


def height(x, y, u):
    z = 0.085 + 0.04 * math.sin(y * 0.9 + 2 * u) + 0.03 * math.sin(y * 0.31 + 1.0)
    z += 0.30 * abs(u) ** 3.2
    crest = y + 0.22 * math.sin(x * 2.1 + y * 0.15) + 0.07 * math.sin(x * 5.3 + y * 0.8)
    r = math.sin(2 * math.pi * crest / 0.22)
    z += 0.011 * (r + 0.35 * r * r) * (1 - 0.5 * abs(u) ** 2)
    z += 0.012 * noise.noise(Vector((x * 1.7, y * 1.7, 0.0)))
    return z


bm = bmesh.new()
rows = []
for i in range(NY + 1):
    y = L.Y0 + i * DY
    mid, hw = L.floor_mid(y)
    row = []
    for j in range(NU + 1):
        u = -1 + 2 * j / NU
        x = mid + u * (hw + 0.55)
        row.append(bm.verts.new((x, y, height(x, y, u))))
    rows.append(row)
for i in range(NY):
    for j in range(NU):
        bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
bm.normal_update()
bm.faces.ensure_lookup_table()
if bm.faces[0].normal.z < 0:
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
o = comp.mesh(col, root, "sand_floor", bm, sand, smooth=True)
bpy.context.view_layer.update()
comp.uv_box(o)
comp.export(col, root, L.PLACE, "sand", made="blender/components/canyon/sand.py",
            source="own geometry; sand https://polyhaven.com/a/coast_sand_01", license="ours; texture CC0", credit="texture: Poly Haven",
            notes="follows walls.glb's feet: place both at the same point")
