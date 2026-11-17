# cathedral/vault: one bay of the nave's quadripartite rib vault, 6.4 m across the nave and 4.5 m along it, modelled
# by hand: four plastered webs (two pointed tunnels crossing), the diagonal ribs meeting at a gilded boss carved as a
# rose, the transverse arches at the bay's two ends and the wall ribs along its sides. A ceiling piece: its top (the
# back of the crown) is at the origin, the crown of the vault 0.3 m below it and the springing 4.0 m below. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("vault")
dressed = L.plain_stone()
plaster = comp.ph_texture("cathedral_plaster", "white_plaster_rough_01", tile=2.0, res="1k", tint=(0.72, 0.69, 0.63))
gold = comp.mat("cathedral_gilt", (0.9, 0.66, 0.2), rough=0.3, metal=1.0)
red = comp.mat("cathedral_boss_red", (0.5, 0.05, 0.05), rough=0.5)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
A, B, RISE, CROWN = 3.2, 2.25, 3.7, -0.3
SPRING = CROWN - RISE
h = lambda x, y: SPRING + max(L.pointed(x, A, RISE), L.pointed(y, B, RISE))
NX, NY = 48, 36
bm = bmesh.new()
vs = [[bm.verts.new((-A + 2 * A * i / NX, -B + 2 * B * j / NY, h(-A + 2 * A * i / NX, -B + 2 * B * j / NY))) for j in range(NY + 1)] for i in range(NX + 1)]
for i in range(NX):
    for j in range(NY):
        bm.faces.new((vs[i][j], vs[i][j + 1], vs[i + 1][j + 1], vs[i + 1][j]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
for f in bm.faces:
    if f.normal.z > 0:
        f.normal_flip()
web = M("vault_webs", bm, plaster, smooth=True)
L.finish(web, 1.0)
comp.solidify(web, 0.2, 1.0)
ribs = []
N = 20
for sx in (-1, 1):
    for sy in (-1, 1):
        pts = []
        for k in range(N + 1):
            z = RISE * (1 - (1 - k / N) ** 2)        # closer samples near the crown
            pts.append((sx * L.pointed_inv(z, A, RISE), sy * L.pointed_inv(z, B, RISE), SPRING + z - 0.05))
        ribs.append(L.sweep(pts, 0.085))
M("vault_diagonal_ribs", comp.merge(*ribs), dressed, smooth=True)
tr = []
for sy in (-1, 1):
    pts = [(-A + 2 * A * k / 32, sy * B, SPRING + L.pointed(-A + 2 * A * k / 32, A, RISE) - 0.08) for k in range(33)]
    tr.append(L.sweep(pts, 0.13))
    tr.append(L.sweep([(x, y - sy * 0.12, z + 0.05) for x, y, z in pts], 0.05))
M("vault_transverse_arches", comp.merge(*tr), dressed, smooth=True)
wr = []
for sx in (-1, 1):
    wr.append(L.sweep([(sx * (A - 0.03), -B + 2 * B * k / 24, SPRING + L.pointed(-B + 2 * B * k / 24, B, RISE) - 0.04) for k in range(25)], 0.07))
M("vault_wall_ribs", comp.merge(*wr), dressed, smooth=True)
M("vault_boss", L.lathe([(0.0, CROWN - 0.3), (0.1, CROWN - 0.29), (0.24, CROWN - 0.22), (0.31, CROWN - 0.15), (0.29, CROWN - 0.1), (0.2, CROWN - 0.04)], seg=32), gold, smooth=True)
pet = []
for i in range(8):
    a = math.radians(45 * i)
    p = bmesh.new()
    bmesh.ops.create_icosphere(p, subdivisions=2, radius=0.07)
    xf(p, S(1.25, 0.85, 0.4))
    xf(p, R(45 * i, "Z"))
    xf(p, T(0.16 * math.cos(a), 0.16 * math.sin(a), CROWN - 0.27))
    pet.append(p)
M("vault_boss_petals", comp.merge(*pet), red, smooth=True)
comp.export(col, root, "cathedral", "vault", made="blender/components/cathedral/vault.py",
            source="own geometry (a quadripartite rib vault); plaster: https://polyhaven.com/a/white_plaster_rough_01", license="ours; texture CC0", credit="Poly Haven (white_plaster_rough_01)",
            notes="Hang it with its origin 14.3 m up: the springing is then at 10.3 m, on the arcade bays' vaulting shafts.")
