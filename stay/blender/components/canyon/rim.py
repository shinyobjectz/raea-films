# canyon/rim: the cap rock along both walls' tops, modelled by hand: a harder, darker layer of jointed sandstone
# blocks standing about a metre above the walls' tops and overhanging the slot by up to half a metre, a second ledge
# set back behind it, the plateau running 9 m back, and loose blocks left on the edge. Each side is its own node.
# Rock from Poly Haven's dry_riverbed_rock (CC0), tinted to desert varnish. Sits on walls.glb (same origin). No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, noise, Vector, T, R, xf

col, root = comp.fresh("rim")
cap = comp.ph_texture("canyon_caprock", "dry_riverbed_rock", tile=2.2, res="1k", tint=(0.95, 0.58, 0.42))
DY = 0.1
NY = int(round((L.Y1 - L.Y0) / DY))
for side, name in ((-1, "rim_left"), (1, "rim_right")):
    rnd = random.Random(11 if side < 0 else 23)
    # the joints: blocks 0.7 to 2.4 m long, each with its own overhang and thickness
    blocks, y = [], L.Y0
    while y < L.Y1:
        n = rnd.uniform(2.2, 6.5)
        blocks.append((y, y + n, rnd.uniform(-0.07, 0.07), rnd.uniform(-0.06, 0.06), rnd.uniform(0.5, 0.8), rnd.uniform(1.6, 2.2)))
        y += n
    bm = bmesh.new()
    rows, b = [], 0
    for i in range(NY + 1):
        y = L.Y0 + i * DY
        while b < len(blocks) - 1 and y >= blocks[b][1]:
            b += 1
        y0, y1, over, t1, t2, back = blocks[b]
        over += 0.3 + 0.38 * noise.noise(Vector((y * 0.45, side * 3.0, 4.0))) + 0.12 * noise.noise(Vector((y * 1.7, side * 3.0, 4.0)))
        t1 += 0.95 + 0.5 * noise.noise(Vector((y * 0.3, side * 3.0, 9.0))) + 0.12 * noise.noise(Vector((y * 1.3, side * 3.0, 9.0)))
        t2 += 0.25 * noise.noise(Vector((y * 0.3, side * 3.0, 14.0)))
        back += 0.5 * noise.noise(Vector((y * 0.4, side * 3.0, 19.0)))
        if min(y - y0, y1 - y) < 0.06:      # a joint between two blocks: a narrow crack
            over, t1 = over - 0.07, t1 - 0.03
        xw = L.wall_x(side, y, L.H)
        w = 0.05 * noise.noise(Vector((y * 1.3, side * 7.0, 0.0)))
        mid = 0.12 + 0.1 * noise.noise(Vector((y * 0.6, side * 3.0, 30.0)))     # a bedding plane half way up, the upper bed set back
        prof = [(0.7, -0.08), (-over + 0.05, -0.03), (-over, 0.04), (-over + w * 0.5, t1 * 0.45), (-over + mid, t1 * 0.5), (-over + mid + w, t1 - 0.1), (-over + mid + 0.12 + w, t1), (back - 0.05, t1 + 0.04), (back, t1 + 0.1),
                (back + 0.05 + w, t1 + t2), (back + 0.2, t1 + t2 + 0.05), (5.0, t1 + t2 + 0.25 + 0.2 * noise.noise(Vector((y * 0.4, 5.0, side)))), (9.6, t1 + t2 + 0.1), (9.6, -1.0)]
        rows.append([bm.verts.new((xw + side * q, y, L.H + z)) for q, z in prof])
    for i in range(NY):
        for j in range(len(rows[0]) - 1):
            q = [rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]]
            bm.faces.new(q if side < 0 else q[::-1])
    bm.normal_update()
    bm.faces.ensure_lookup_table()
    f = bm.faces[2]   # the lip's face looks into the slot
    if f.normal.x * side > 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    o = comp.mesh(col, root, name, bm, cap)
    bpy.context.view_layer.update()
    comp.uv_box(o)
    # loose blocks on the edge and the ledge
    for k in range(13):
        y = rnd.uniform(L.Y0 + 1, L.Y1 - 1)
        q = rnd.uniform(0.15, 3.2)
        s = rnd.uniform(0.35, 1.3)
        blk = L.rock((s, s * rnd.uniform(0.6, 1.2), s * rnd.uniform(0.35, 0.7)), seed=k * 31 + (side + 2), sub=3, rough=0.2, flat=0.7)
        xf(blk, R(rnd.uniform(0, 360), "Z"))
        bb = next(bl for bl in blocks if bl[0] <= y < bl[1] or bl is blocks[-1])
        z = L.H + 0.95 + bb[3] + (bb[4] if q > bb[5] + 0.3 else 0) - 0.12
        xf(blk, T(L.wall_x(side, y, L.H) + side * q, y, z))
        ob = comp.mesh(col, root, f"{name}_block_{k + 1}", blk, cap)
        bpy.context.view_layer.update()
        comp.uv_box(ob)
comp.export(col, root, L.PLACE, "rim", made="blender/components/canyon/rim.py",
            source="own geometry; rock https://polyhaven.com/a/dry_riverbed_rock", license="ours; texture CC0", credit="texture: Poly Haven",
            notes="sits on walls.glb at the same point; rim_left and rim_right are separate nodes, each with 13 loose blocks")
