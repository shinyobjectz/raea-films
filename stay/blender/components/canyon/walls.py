# canyon/walls: the slot canyon's two walls, 38 m of slot 12 m deep, modelled by hand from the slot's shape (_lib):
# water-carved Navajo sandstone, the two faces leaning together so their overhangs interlock, fluted and scalloped,
# with strata ledges, 2.6 m apart at the sand and 4.8 m at the rim, turning right out of sight at the far end. Each
# wall is its own node (walls_left, walls_right) with a flat top running 9 m back from the slot for the rim to sit on.
# Sandstone from Poly Haven's sandstone_cracks (CC0), tinted red-orange and laid along the strata. Stands with the
# slot's mouth toward the camera; the sand's level is z 0. No rig: the sun is the canyon's moving part.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy

col, root = comp.fresh("walls")
stone = comp.ph_texture("canyon_sandstone", "sandstone_cracks", tile=2.0, res="2k", tint=(1.0, 0.68, 0.48))
DY, DZ = 0.125, 0.12
NY, NZ = int(round((L.Y1 - L.Y0) / DY)), int(round(L.H / DZ))
BACK = 9.0

for side, name in ((-1, "walls_left"), (1, "walls_right")):
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    rows = []
    for i in range(NY + 1):
        y = L.Y0 + i * DY
        row = []
        for j in range(NZ + 1):
            z = j * DZ
            row.append((bm.verts.new((L.wall_x(side, y, z), y, z - (0.3 if j == 0 else 0))), y / 2.6, z))
        # the top: back from the slot, and a skirt down the outside so the wall is a solid thing from above
        xo = L.centre(y, L.H) + side * (L.half(y, L.H) + BACK)
        xe = L.wall_x(side, y, L.H)
        row.append((bm.verts.new((xe + side * 0.6, y, L.H + 0.05)), y / 2.6, L.H + 0.6))
        row.append((bm.verts.new((xo, y, L.H + 0.05)), y / 2.6, L.H + BACK))
        row.append((bm.verts.new((xo, y, 0)), y / 2.6, L.H + BACK + L.H))
        rows.append(row)
    for i in range(NY):
        for j in range(len(rows[0]) - 1):
            q = [rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]]
            if side > 0:
                q.reverse()
            f = bm.faces.new([v for v, _, _ in q])
            for l, (_, u, w) in zip(f.loops, q):
                l[uv].uv = (u / 2.0, w / 2.0)
    # the faces must look into the slot: check one near the floor
    bm.faces.ensure_lookup_table()
    bm.normal_update()
    if bm.faces[5].normal.x * side > 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    o = comp.mesh(col, root, name, bm, stone, smooth=True)

# the texture's own tiling is in the UVs (stretched 2.6 times along the slot, so its grain runs with the strata)
mp = next(n for n in stone.node_tree.nodes if n.type == "MAPPING")
mp.inputs["Scale"].default_value = (1, 1, 1)
comp.export(col, root, L.PLACE, "walls", made="blender/components/canyon/walls.py",
            source="own geometry; sandstone https://polyhaven.com/a/sandstone_cracks", license="ours; texture CC0", credit="texture: Poly Haven",
            notes="walls_left and walls_right are separate nodes; the slot runs from z +8 (its mouth) to z -30 in raea, the sand's level at y 0, the rim at y 12")
