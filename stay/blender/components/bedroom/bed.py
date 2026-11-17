# bedroom/bed: a kid's single bed in stained pine, modelled by hand, 1.05 x 2.03 m: turned corner posts with ball
# finials, a slatted headboard 0.95 m high and a low footboard, side rails on bolts, a slat base, a 19 cm mattress in
# a striped fitted sheet (its top 0.52 m up) and a plump pillow. Built along
# y: the head toward +y, the foot toward -y (the front); turn it to stand along a wall. The top sheet is "sheet".
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from comp import T, R, S, xf
col, root = comp.fresh("bed")
M = _lib.maker(col, root)
pine = comp.ph_texture("bed_pine", "stained_pine", tile=0.9, res="1k")
tick = comp.ph_texture("bed_mattress", "cotton_jersey", tile=0.4, res="1k", tint=(0.72, 0.8, 0.92), grey=True)
pill = comp.ph_texture("bed_pillow", "cotton_jersey", tile=0.3, res="1k", tint=(0.93, 0.92, 0.88), grey=True)
bolt = comp.mat("bed_bolt", (0.55, 0.5, 0.4), rough=0.35, metal=1.0)
W, L = 1.05, 2.03
MW, ML, MT, TOP = 0.95, 1.9, 0.19, 0.52
posts = []
for sx in (-1, 1):
    for sy, h in ((1, 0.95), (-1, 0.6)):
        prof = [(0.0, 0), (0.03, 0), (0.035, 0.01), (0.035, h - 0.1), (0.028, h - 0.09), (0.036, h - 0.075), (0.028, h - 0.06), (0.02, h - 0.05), (0.036, h - 0.025), (0.03, h - 0.005), (0.0, h)]
        posts.append(xf(_lib.turn(prof, seg=20), T(sx * (W / 2 - 0.035), sy * (L / 2 - 0.035), 0)))
po = M("bed_posts", comp.merge(*posts), pine, smooth=True)
comp.uv_box(po, 1.0)
def board(name, y, z0, z1, slats):
    parts = [comp.box((W - 0.07, 0.025, 0.09), at=(0, y, z1 - 0.045)), comp.box((W - 0.07, 0.025, 0.09), at=(0, y, z0 + 0.045))]
    n = slats
    for i in range(n):
        parts.append(comp.box((0.07, 0.016, z1 - z0 - 0.18), at=(-(W - 0.2) / 2 + i * (W - 0.2) / (n - 1), y, (z0 + z1) / 2)))
    o = M(name, comp.merge(*parts), pine)
    comp.bevel(o, 0.004, 2)
    comp.uv_box(o, 1.0)
board("bed_headboard", L / 2 - 0.035, 0.3, 0.86, 7)
board("bed_footboard", -L / 2 + 0.035, 0.22, 0.52, 7)
rails = M("bed_rails", comp.merge(*[comp.box((0.025, L - 0.1, 0.14), at=(sx * (W / 2 - 0.03), 0, 0.28)) for sx in (-1, 1)]), pine)
comp.bevel(rails, 0.004, 2)
comp.uv_box(rails, 1.0)
M("bed_bolts", comp.merge(*[comp.cyl(0.009, 0.004, at=(sx * (W / 2 - 0.0155) - (0.004 if sx < 0 else 0), sy * (L / 2 - 0.09), 0.28 + dz), seg=10, axis="X") for sx in (-1, 1) for sy in (-1, 1) for dz in (-0.035, 0.035)]), bolt)
sl = M("bed_slats", comp.merge(*[comp.box((W - 0.1, 0.07, 0.018), at=(0, -L / 2 + 0.15 + i * (L - 0.3) / 11, 0.315)) for i in range(12)]), pine)
comp.uv_box(sl, 1.0)
# the mattress: a soft box with piped edges
mb = comp.box((MW, ML, MT), at=(0, 0, TOP - MT / 2))
m = M("bed_mattress", mb, tick, smooth=True)
comp.bevel(m, 0.035, 4, angle=30)
comp.uv_box(m, 1.0)
# the pillow: a pinched, plump box
pb = comp.box((0.62, 0.4, 0.15))
bmesh.ops.subdivide_edges(pb, edges=pb.edges[:], cuts=7, use_grid_fill=True)
for v in pb.verts:
    fx, fy = abs(v.co.x) / 0.31, abs(v.co.y) / 0.2
    v.co.z *= max(0.06, (1 - fx ** 3) * (1 - fy ** 3)) ** 0.6
    v.co.z += 0.006 * math.sin(v.co.x * 23) * math.sin(v.co.y * 31)
xf(pb, R(4, "Z") @ T(0.02, ML / 2 - 0.25, TOP + 0.07))
p = M("bed_pillow", pb, pill, smooth=True)
comp.subsurf(p, 1)
comp.uv_box(p, 1.0)
comp.export(col, root, _lib.PLACE, "bed", made="blender/components/bedroom/bed.py",
            source="own geometry (a generic pine single bed); textures: https://polyhaven.com/a/stained_pine, /cotton_jersey",
            license="ours; textures CC0", credit="Poly Haven (stained_pine, cotton_jersey)",
            notes="mattress top 0.52 m up; head toward Blender +y (raea -z)")
