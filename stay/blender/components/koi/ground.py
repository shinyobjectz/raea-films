# koi/ground: the garden's ground, 10 x 9 m, modelled by hand: level mossy turf (Poly Haven's forrest_ground_01,
# CC0), a hole in it that follows the pond's shoreline, a raked gravel court along
# the front (gravel_floor) edged with a row of rough kerb stones, and a skirt 0.8 m down round its edge (the pond
# goes below the ground, so on a stand the garden sits as a block). The shell's floor: its top at z 0 at the pond.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("ground")
rng = random.Random(8)
turf = comp.ph_texture("ground_moss", "forrest_ground_01", tile=2.0, res="2k", tint=(0.6, 0.82, 0.5))
gravel = comp.ph_texture("ground_gravel", "gravel_floor", tile=2.25, res="1k", tint=(0.95, 0.93, 0.88))
sett = comp.ph_texture("ground_setts", "lichen_rock", tile=1.2, res="1k")
earth = comp.mat("ground_earth", srgb((0.2, 0.15, 0.1)), rough=0.9)
N, K = 96, 14
HX, HY, GY = 5.0, 4.5, -2.9          # half sizes; the gravel court starts in front of GY
def edge(a):
    c, s = math.cos(a), math.sin(a)
    t = min(HX / abs(c) if abs(c) > 1e-6 else 1e9, HY / abs(s) if abs(s) > 1e-6 else 1e9)
    return Vector((c * t, s * t, 0))
bm = bmesh.new()
grid = []
for i in range(N):
    a = 2 * math.pi * i / N
    p0, p1 = shore_pt(a, 1.05), edge(a)
    row = []
    for k in range(K + 1):
        t = (k / K) ** 1.5
        p = p0.lerp(p1, t)
        h = 0.0
        row.append(bm.verts.new((p.x, p.y, h)))
    grid.append(row)
for i in range(N):
    for k in range(K):
        f = bm.faces.new((grid[i][k], grid[i][k + 1], grid[(i + 1) % N][k + 1], grid[(i + 1) % N][k]))
        mid = (grid[i][k].co + grid[i][k + 1].co + grid[(i + 1) % N][k + 1].co + grid[(i + 1) % N][k].co) / 4
        f.material_index = 1 if mid.y < GY else 0
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
if sum(f.normal.z for f in bm.faces) < 0:
    bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
g = M("ground_top", bm, [turf, gravel], smooth=True)
comp.uv_box(g, 1.0)
sk = bmesh.new()
loop = [edge(2 * math.pi * i / N) for i in range(N)]
for i in range(N):
    a, b = loop[i], loop[(i + 1) % N]
    sk.faces.new([sk.verts.new(p) for p in ((a.x, a.y, 0), (b.x, b.y, 0), (b.x, b.y, -0.8), (a.x, a.y, -0.8))])
bmesh.ops.recalc_face_normals(sk, faces=sk.faces)
M("ground_skirt", sk, earth)
setts = []
x = -HX + 0.1
while x < HX - 0.1:
    w = rng.uniform(0.26, 0.42)
    setts.append(stone(rng, (w, rng.uniform(0.2, 0.26), 0.16), at=(x + w / 2, GY, -0.07), sub=3, rough=0.14, flat=0.5, yaw=rng.uniform(-5, 5)))
    x += w + 0.012
s = M("ground_setts", comp.merge(*setts), sett, smooth=True)
comp.uv_box(s, 1.0)
done(col, root, "ground", "own geometry; https://polyhaven.com/a/forrest_ground_01, https://polyhaven.com/a/gravel_floor and https://polyhaven.com/a/lichen_rock (CC0)", license="CC0", credit="Poly Haven (textures)")
