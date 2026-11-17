# clocktower/wall: the tower's front wall from inside, 8 x 5 m and 0.4 m thick, modelled by hand and bricked from Poly
# Haven's factory_brick (CC0): a round opening 2.66 m across for the dial, 2.95 m up, lined with a ring of dressed
# stone voussoirs, an oak wall plate along its top and a skirting timber at its foot, and two iron tie-rod plates.
# Origin: the floor at the wall's middle, its outside (back) at y 0, its inside face at y -0.4. A shell part.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, bolt

col, root = comp.fresh("wall")
brick = comp.ph_texture("wall_brick", "factory_brick", tile=1.6)
stone = comp.ph_texture("wall_stone", "plastered_stone_wall", tile=1.2, res="1k")
oak = comp.ph_texture("wall_oak", "rough_wood", tile=0.8, res="1k", tint=(0.75, 0.62, 0.48))
iron = comp.mat("wall_iron", (0.03, 0.03, 0.035), rough=0.6, metal=0.4)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, H, TH, CZ, RO = 8.0, 5.0, 0.4, 2.95, 1.33
bm = bmesh.new()
rect = [bm.verts.new((x, -TH, z)) for x, z in ((-W / 2, 0), (W / 2, 0), (W / 2, H), (-W / 2, H))]
N = 72
circ = [bm.verts.new((RO * math.cos(2 * math.pi * k / N), -TH, CZ + RO * math.sin(2 * math.pi * k / N))) for k in range(N)]
for vs in (rect, circ):
    for i in range(len(vs)):
        bm.edges.new((vs[i], vs[(i + 1) % len(vs)]))
bmesh.ops.triangle_fill(bm, use_beauty=True, use_dissolve=False, edges=bm.edges[:])
ext = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
bmesh.ops.translate(bm, vec=(0, TH, 0), verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
w = M("wall_brickwork", bm, brick)
comp.uv_box(w)
# the voussoir ring lining the opening, standing 3 cm proud of the brick inside
vs = []
NV = 36
for k in range(NV):
    a0, a1 = 2 * math.pi * (k + 0.04) / NV, 2 * math.pi * (k + 0.96) / NV
    v = bmesh.new()
    pts = []
    for y in (-TH - 0.03, 0.0):
        for r, a in ((RO - 0.005, a0), (RO - 0.005, a1), (RO + 0.2, a1), (RO + 0.2, a0)):
            pts.append(v.verts.new((r * math.cos(a), y, CZ + r * math.sin(a))))
    for q in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        v.faces.new([pts[i] for i in q])
    bmesh.ops.recalc_face_normals(v, faces=v.faces)
    vs.append(v)
s = M("wall_voussoirs", comp.merge(*vs), stone)
comp.bevel(s, 0.008, 2)
comp.uv_box(s)
t = M("wall_timbers", comp.merge(comp.box((W, 0.2, 0.2), at=(0, -TH - 0.1, H - 0.1)), comp.box((W, 0.06, 0.22), at=(0, -TH - 0.03, 0.11))), oak)
comp.bevel(t, 0.006, 2)
comp.uv_box(t)
pl = []
for x in (-3.3, 3.3):
    p = comp.box((0.5, 0.02, 0.08), at=(0, 0, 0)); q = comp.box((0.5, 0.02, 0.08), at=(0, 0, 0))
    xf(p, R(45, "Y")); xf(q, R(-45, "Y"))
    pl += [xf(p, T(x, -TH - 0.01, 3.4)), xf(q, T(x, -TH - 0.01, 3.4)), bolt((x, -TH - 0.04, 3.4), 0.03, 0.03, axis="Y")]
M("wall_tie_plates", comp.merge(*pl), iron)
comp.export(col, root, "clocktower", "wall", made="blender/components/clocktower/wall.py", source="own geometry; textures https://polyhaven.com/a/factory_brick, https://polyhaven.com/a/plastered_stone_wall, https://polyhaven.com/a/rough_wood", license="ours; textures CC0", credit="textures: Poly Haven",
            notes="The dial opening's centre is 2.95 m up at the wall's middle; clocktower/clock-face stands in it at the same origin depth (both backs at y 0).")
