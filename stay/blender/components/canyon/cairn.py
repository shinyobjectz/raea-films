# canyon/cairn: a hiker's cairn, seven flat sandstone slabs stacked half a metre high on a ring of footing stones, modelled
# by hand (each stone its own shape, set a little off the one below), in the walls' sandstone (Poly Haven's
# sandstone_cracks, CC0) and the rim's darker cap rock (dry_riverbed_rock, CC0). Marks the way at a bend. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, xf, Vector

col, root = comp.fresh("cairn")
red = comp.ph_texture("canyon_sandstone_s", "sandstone_cracks", tile=1.0, res="1k", tint=(1.0, 0.68, 0.48))
dark = comp.ph_texture("canyon_caprock_s", "dry_riverbed_rock", tile=1.2, res="1k", tint=(0.95, 0.58, 0.42))
rnd = random.Random(15)
z = 0.0
for i in range(7):
    w = 0.36 * (1 - i * 0.105) * rnd.uniform(0.9, 1.1)
    h = rnd.uniform(0.07, 0.11) * (1 - i * 0.04)
    b = L.rock((w, w * rnd.uniform(0.7, 0.95), h), seed=300 + i, sub=3, rough=0.16, flat=0.45)
    xf(b, R(rnd.uniform(-4, 4), "X") @ R(rnd.uniform(0, 360), "Z"))
    xf(b, T(rnd.uniform(-0.02, 0.02), rnd.uniform(-0.02, 0.02), z - 0.008))
    o = comp.mesh(col, root, f"cairn_stone_{i + 1}", b, dark if i in (2, 5) else red, smooth=True)
    bpy.context.view_layer.update()
    comp.uv_box(o)
    z += h * 0.9
for i in range(6):
    az = i * 1.05 + rnd.uniform(-0.2, 0.2)
    s = rnd.uniform(0.1, 0.19)
    b = L.rock((s, s * 0.8, s * 0.6), seed=320 + i, sub=2, rough=0.22, flat=0.3)
    xf(b, R(rnd.uniform(0, 360), "Z"))
    xf(b, T(0.27 * math.cos(az), 0.25 * math.sin(az), -0.02))
    o = comp.mesh(col, root, f"cairn_foot_{i + 1}", b, red if i % 2 else dark, smooth=True)
    bpy.context.view_layer.update()
    comp.uv_box(o)
comp.export(col, root, L.PLACE, "cairn", made="blender/components/canyon/cairn.py",
            source="own geometry; https://polyhaven.com/a/sandstone_cracks, https://polyhaven.com/a/dry_riverbed_rock", license="ours; textures CC0", credit="textures: Poly Haven")
