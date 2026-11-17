# wreck/fish: one fish of the kelp world's school (a jack mackerel's shape, 17 cm): a silver body, its back dark blue-
# green, a forked tail, a small dorsal fin and dark eyes. The scene draws it a hundred times (<Instances>) and moves
# each one itself, so it has no rig. Its nose is +x, its back +z (raea: nose +x, back +y).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from mathutils import Vector

L = 0.17
SILVER = comp.mat("fish_silver", (0.9, 0.92, 0.94), rough=0.28, metal=0.7)
BACK = comp.mat("fish_back", (0.12, 0.28, 0.3), rough=0.3, metal=0.6)
FIN = comp.mat("fish_fin", (0.36, 0.4, 0.38), rough=0.45, metal=0.2)
EYE = comp.mat("fish_eye", (0.01, 0.01, 0.012), rough=0.08)

col, root = comp.fresh("fish")

# the body: an ellipsoid pulled into a fish (blunt nose, a long taper into the tail's wrist)
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=10, radius=1.0)
A = L * 0.43
for v in bm.verts:
    x, y, z = v.co
    u = x                                                   # -1 tail .. 1 nose
    k = 1.0 if u > -0.1 else 1.0 - 0.86 * ((-u - 0.1) / 0.9) ** 1.25
    nose = 1.0 if u < 0.6 else 1.0 - 0.25 * ((u - 0.6) / 0.4) ** 2
    v.co = Vector((x * A, y * 0.0135 * k * nose, z * 0.0215 * k * nose - 0.003 * (1 - k)))
bm.normal_update()
for f in bm.faces:
    f.material_index = 1 if f.calc_center_median().z > 0.007 else 0
o = comp.mesh(col, root, "fish_body", bm, [SILVER, BACK], smooth=True)

# the tail: a fork, thin
tx = -A * 0.93
poly = [(tx + 0.01, 0.0), (tx - 0.045, 0.028), (tx - 0.034, 0.0), (tx - 0.045, -0.028)]
tb = bmesh.new()
f = [tb.verts.new((x, -0.0012, z)) for x, z in poly]
b = [tb.verts.new((x, 0.0012, z)) for x, z in poly]
tb.faces.new(f)
tb.faces.new(list(reversed(b)))
for i in range(4):
    tb.faces.new((f[i], b[i], b[(i + 1) % 4], f[(i + 1) % 4]))
bmesh.ops.recalc_face_normals(tb, faces=tb.faces)
# the dorsal fin
db = bmesh.new()
dp = [(0.0, 0.019), (-0.03, 0.036), (-0.036, 0.018)]
f = [db.verts.new((x, -0.001, z)) for x, z in dp]
b = [db.verts.new((x, 0.001, z)) for x, z in dp]
db.faces.new(f)
db.faces.new(list(reversed(b)))
for i in range(3):
    db.faces.new((f[i], b[i], b[(i + 1) % 3], f[(i + 1) % 3]))
bmesh.ops.recalc_face_normals(db, faces=db.faces)
comp.mesh(col, root, "fish_fins", comp.merge(tb, db), FIN)

eyes = []
for s in (-1, 1):
    e = bmesh.new()
    bmesh.ops.create_uvsphere(e, u_segments=8, v_segments=6, radius=0.0036)
    bmesh.ops.translate(e, vec=Vector((A * 0.74, s * 0.0085, 0.0045)), verts=e.verts)
    eyes.append(e)
comp.mesh(col, root, "fish_eyes", comp.merge(*eyes), EYE, smooth=True)

comp.export(col, root, "wreck", "fish", made="blender/components/wreck/fish.py", source="own geometry", license="ours", credit="",
            notes="17 cm, nose +x, back +z; no rig: the scene moves each copy.")
