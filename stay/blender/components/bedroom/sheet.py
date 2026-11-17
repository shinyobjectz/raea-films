# bedroom/sheet: the white top sheet that drifts in from the laundromat and settles on the bed, modelled by hand: a
# cotton sheet 1.5 x 1.75 m draped over the mattress (top 0.52 m up) from the foot to just under the pillow, hanging
# 25 cm down both sides in soft folds and tucked at the foot, creased across the top. It shares the bed's origin and heading,
# so it stands at the bed's own position. Rig: "settle" runs from the sheet hanging 0.95 m over the bed, tipped and
# ballooned with air (0 s, its rest pose), down to lying on the bed (1 s): three nested parts, sheet_drop (the fall),
# sheet_tip (the tilt levelling) and sheet_billow (the balloon flattening).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector, noise
col, root = comp.fresh("sheet")
M = _lib.maker(col, root)
cotton = comp.ph_texture("sheet_cotton", "cotton_jersey", tile=0.3, res="1k", tint=(0.95, 0.95, 0.93), grey=True)
MW, ML, TOP = 0.95, 1.9, 0.525
HANG = 0.25
y_head = ML / 2 - 0.5            # the sheet's top edge, under the pillow
ex, ey0 = MW / 2 + 0.012, -ML / 2 - 0.012
NX, NY = 60, 70
SW, SL = MW + 2 * HANG, (y_head - ey0) + 0.035
bm = bmesh.new()
uvl = bm.loops.layers.uv.new("UVMap")
vs = []
for j in range(NY + 1):
    row = []
    for i in range(NX + 1):
        u = -SW / 2 + SW * i / NX              # across the bed
        v = y_head - SL * j / NY               # from the head edge down over the foot
        dx = max(0.0, abs(u) - ex)             # cloth past the mattress's side
        dy = max(0.0, ey0 - v)                 # cloth past its foot
        x = math.copysign(min(abs(u), ex), u)
        y = max(v, ey0)
        d = max(dx, dy)
        z = TOP - d
        # the hanging part bellies out and gathers into folds
        fold = 0.013 * (1 + math.sin((v if dx > dy else u) * 21 + 1.3)) * min(1.0, d / 0.08)
        out = (0.034 if dx > dy else 0.004) * (1 - math.exp(-d * 18)) + (fold if dx > dy else 0.0)
        if dx > 0:
            x += math.copysign(out * dx / (d + 1e-6), u)
        if dy > 0:
            y -= out * dy / (d + 1e-6)
        if d == 0:
            n = noise.noise(Vector((u * 3.1, v * 3.1, 0.4)))
            z += 0.008 + 0.006 * (1 + n) + 0.004 * (1 + math.sin(v * 17 + u * 5)) + 0.003 * (1 + math.sin(u * 29 - v * 7))
        else:
            z += 0.008 * math.sin(u * 14 + v * 9)
        row.append(bm.verts.new((x, y, z)))
    vs.append(row)
for j in range(NY):
    for i in range(NX):
        f = bm.faces.new((vs[j][i], vs[j + 1][i], vs[j + 1][i + 1], vs[j][i + 1]))
        for l, (a, b) in zip(f.loops, ((i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j))):
            l[uvl].uv = (a / NX * SW / 0.3, b / NY * SL / 0.3)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
drop = comp.pivot(col, root, "sheet_drop", (0, -0.1, TOP))
tip = comp.pivot(col, root, "sheet_tip", (0, -0.1, TOP), parent=drop)
billow = comp.pivot(col, root, "sheet_billow", (0, -0.1, TOP), parent=tip)
o = M("sheet_cloth", bm, cotton, parent=billow, smooth=True)
comp.solidify(o, 0.004, 0)
comp.subsurf(o, 1)
comp.channel("settle", [(drop, "location", 2, drop.location.z + 0.95, drop.location.z)])
comp.channel("settle", [(tip, "rotation_euler", 1, math.radians(16), 0.0)])
comp.channel("settle", [(billow, "scale", 2, 1.9, 1.0)])
comp.export(col, root, _lib.PLACE, "sheet", made="blender/components/bedroom/sheet.py",
            source="own geometry (a draped sheet); cotton: https://polyhaven.com/a/cotton_jersey", license="ours; texture CC0", credit="Poly Haven (cotton_jersey)",
            rig={"settle": "from hanging 0.95 m over the bed, tipped 16 degrees and ballooned (0 s, the rest pose) down to lying on the bed (1 s)"},
            notes="stands at the bed's own position and heading; the match cut's sheet (the laundromat's drifting sheet lands as this one)")
