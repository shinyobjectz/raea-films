# canyon/slab: a flake of sandstone spalled off the wall and left leaning on it, 1.9 m wide, 2.5 m tall and 0.26 m
# thick, modelled by hand, with the two pieces that broke from its foot lying in front. Its back top edge rests on the
# wall at y 0 (a wall item), its foot 0.95 m out on the sand. Sandstone from Poly Haven's sandstone_cracks (CC0). No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, xf, Vector

col, root = comp.fresh("slab")
stone = comp.ph_texture("canyon_sandstone_s", "sandstone_cracks", tile=1.0, res="1k", tint=(1.0, 0.68, 0.48))
b = L.rock((1.9, 0.26, 2.55), seed=51, sub=4, rough=0.1, flat=0.8)
for v in b.verts:      # no flake is a rectangle: one shoulder broken off, the top narrowed, its faces dished and stepped along the beds
    t = v.co.z / 2.55
    n = L.noise.noise(Vector((v.co.x * 0.9, v.co.z * 0.9, 3.0)))
    v.co.x = v.co.x * (1 - 0.3 * t ** 2) + 0.16 * t * n + (0.22 * (t - 0.55) if v.co.x > 0.3 and t > 0.55 else 0) * -1
    v.co.y += 0.05 * n + 0.018 * math.copysign(1, math.sin(v.co.z * 9 + 2 * n))
    if v.co.x > 0.25 and t > 0.72:
        v.co.z -= (v.co.x - 0.25) * 0.9 * (t - 0.72) / 0.28
LEAN = math.degrees(math.atan2(0.95, 2.4))
xf(b, T(0, 0.13, 0))
xf(b, R(-LEAN, "X"))          # its top back toward the wall (+y)
xf(b, T(0, -1.08, -0.04))
o = comp.mesh(col, root, "slab_flake", b, stone)
comp.bevel(o, 0.012, 2, angle=50)
bpy.context.view_layer.update()
comp.uv_box(o)
for i, (size, at, turn, tip) in enumerate((((0.62, 0.2, 0.5), (0.75, -1.5, -0.02), 25, 78), ((0.4, 0.16, 0.3), (-0.55, -1.42, -0.02), -40, 84))):
    p = L.rock(size, seed=60 + i, sub=3, rough=0.14, flat=0.8)
    xf(p, R(tip, "X"))
    xf(p, R(turn, "Z"))
    xf(p, T(*at))
    q = comp.mesh(col, root, f"slab_piece_{i + 1}", p, stone)
    bpy.context.view_layer.update()
    lo, hi = comp.box_of(q)
    q.location.z -= lo.z + 0.03
    bpy.context.view_layer.update()
    comp.uv_box(q)
comp.export(col, root, L.PLACE, "slab", made="blender/components/canyon/slab.py", source="own geometry; sandstone https://polyhaven.com/a/sandstone_cracks", license="ours; texture CC0", credit="texture: Poly Haven")
