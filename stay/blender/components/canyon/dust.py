# canyon/dust: dust hanging in the slot's air, modelled by hand: 900 pale motes from 5 to 16 mm in a volume 2.4 m
# wide, 5 m long and 4.4 m high, in three clouds that move apart from each other. Motes take the sun's light and go
# dim in shade, so they show where the light is. Stands on the sand; its volume starts 0.3 m up. Rig: "drift" carries
# the three clouds down the slot at different speeds (1.2 m, 0.8 m and 1.6 m), one rising a quarter of a metre, one
# sinking, one turning 8 degrees.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, Matrix

col, root = comp.fresh("dust")
mote = comp.mat("canyon_dust", (1.0, 0.9, 0.72), rough=1.0)
rnd = random.Random(44)
clouds = [bmesh.new() for _ in range(3)]
for k in range(900):
    bm = clouds[k % 3]
    s = rnd.choice((0.005, 0.006, 0.008, 0.008, 0.011, 0.016))
    p = Vector((rnd.uniform(-1.2, 1.2), rnd.uniform(-2.5, 2.5), rnd.uniform(0.3, 4.7)))
    g = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=s / 2, matrix=Matrix.Translation(p) @ S(1, rnd.uniform(0.7, 1.4), rnd.uniform(0.6, 1.0)))
ps = []
for i, bm in enumerate(clouds):
    p = comp.pivot(col, root, f"dust_cloud_{i + 1}", (0, 0, 2.5))
    comp.mesh(col, root, f"dust_motes_{i + 1}", bm, mote, parent=p, smooth=True)
    ps.append(p)
a, b, c = ps
comp.channel("drift", [(a, "location", 1, a.location.y, a.location.y + 1.2), (a, "location", 2, a.location.z, a.location.z + 0.25),
                       (b, "location", 1, b.location.y, b.location.y + 0.8), (b, "location", 2, b.location.z, b.location.z - 0.2), (b, "location", 0, b.location.x, b.location.x + 0.3),
                       (c, "location", 1, c.location.y, c.location.y + 1.6), (c, "location", 2, c.location.z, c.location.z + 0.5), (c, "rotation_euler", 2, 0, math.radians(8))])
comp.export(col, root, L.PLACE, "dust", made="blender/components/canyon/dust.py", source="own geometry", license="ours", credit="",
            rig={"drift": "the three clouds move down the slot 1.2 m, 0.8 m and 1.6 m, one rising 0.25 m, one sinking 0.2 m and sliding right, one rising 0.5 m and turning 8 degrees"})
