# canyon/pebbles: a spill of flood pebbles on the sand, 46 stones from 3 to 20 cm over a patch 1.8 m by 1.3 m, thickest
# at its middle (Poly Haven's namaqualand_stones_01, CC0: its five stones cut to a sixth of their triangles, copied,
# turned and half-buried), warmed toward the walls' red. Lies on the sand. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, Matrix

col, root = comp.fresh("pebbles")
got, credit = L.take(col, root, "namaqualand_stones_01", "1k")
src = []
for n, o in sorted(got.items()):
    L.drop(o, 0, 0, 0)
    L.decimate(o, 1400 / L.tris(o))
    L.bake(o)
    # bring its mesh to the origin so copies turn about their own middles
    o.data.transform(o.matrix_world)
    o.matrix_world = Matrix.Identity(4)
    src.append(o)
mat = src[0].data.materials[0]
L.tint(mat, (0.62, 0.42, 0.32))
rnd = random.Random(8)
groups = {i: [] for i in range(len(src))}
for k in range(46):
    r = abs(rnd.gauss(0, 0.42))
    az = rnd.uniform(0, 2 * math.pi)
    s = rnd.choice((0.5, 0.7, 0.9, 1.0, 1.2, 1.5, 2.0)) * rnd.uniform(0.8, 1.2)
    m = T(min(0.9, r * 1.4) * math.cos(az), min(0.65, r) * math.sin(az), -0.022 * s) @ R(rnd.uniform(0, 360), "Z") @ R(rnd.uniform(-12, 12), "X") @ S(s)
    groups[rnd.randrange(len(src))].append(m)
bm = comp.merge(*[L.scatter(src[i], ms) for i, ms in groups.items() if ms])
for o in src:
    bpy.data.objects.remove(o, do_unlink=True)
comp.mesh(col, root, "pebbles_stones", bm, mat)
comp.export(col, root, L.PLACE, "pebbles", made="blender/components/canyon/pebbles.py", source="https://polyhaven.com/a/namaqualand_stones_01", license="CC0", credit=credit)
