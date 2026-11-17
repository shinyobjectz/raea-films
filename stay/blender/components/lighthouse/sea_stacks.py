# lighthouse/sea-stacks: three sea stacks off the point, modelled by hand: pillars of the cliff's own layered rock, 16,
# 10 and 6 m above the water, undercut at the tide line, each on a skirt of dark wet rock. Rock from Poly Haven texture
# sets (the cliff's). They stand in the sea: the origin is sea level at the middle of the group.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, fbm
from mathutils import Vector

col, root = comp.fresh("sea_stacks")
rock = comp.ph_texture("cliff_rock", "cliff_side", tile=9.0, res="1k")
wet = comp.ph_texture("cliff_tide_rock", "seaside_rock", tile=5.0, res="1k", tint=(0.2, 0.2, 0.2))
M = _lib.maker(col, root)
for i, (cx, cy, rad, top, seed) in enumerate(((0.0, 0.0, 5.0, 16.0, 1.0), (-11.0, 5.0, 3.6, 10.0, 2.0), (9.0, -6.0, 3.0, 6.0, 3.0))):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=56, v_segments=44, radius=1.0)
    for v in bm.verts:
        d = v.co.copy()
        t = (d.z + 1) / 2                                                 # 0 at the foot, 1 at the top
        z = -2.5 + (top + 2.5) * t
        zs = 0.4 * z + 0.6 * (round(z / 2.8) * 2.8) if 0.04 < t < 0.96 else z   # ledges
        flat = math.hypot(d.x, d.y)
        girth = rad * (1.0 - 0.35 * t) * (0.72 + 0.28 * math.exp(-((z - 0.2) / 1.2) ** 2) * -1 + 0.28) * (1 + 0.5 * math.exp(-((z + 1.5) / 1.5) ** 2))
        girth *= 1 + 0.28 * fbm(d.x * 3, d.y * 3, z * 0.25, scale=1.6, octaves=3, seed=seed) + 0.1 * fbm(d.x * 9, d.y * 9, z, scale=2.0, octaves=2, seed=seed + 4)
        if flat > 1e-6:
            pinch = min(1.0, flat / max(1e-6, math.sqrt(max(0.0, 1 - d.z * d.z))))
            k = math.sqrt(max(0.0, 1 - (2 * t - 1) ** 8))                 # a blunt top and foot rather than a ball's
            v.co.x, v.co.y = d.x / flat * girth * k * pinch, d.y / flat * girth * k * pinch * 0.8
        v.co.z = zs
        v.co.x += cx
        v.co.y += cy
    o = M(f"sea_stacks_stack_{i + 1}", bm, [rock, wet], smooth=True)
    _lib.paint_by(o, lambda n, p: 1 if p.z < 1.6 else 0)
    comp.uv_box(o, 1.0)
comp.export(col, root, "lighthouse", "sea_stacks", made="blender/components/lighthouse/sea_stacks.py",
            source="own geometry (three stacks); textures: https://polyhaven.com/a/cliff_side, https://polyhaven.com/a/seaside_rock", license="ours; textures CC0",
            credit="Poly Haven (cliff_side, seaside_rock)", notes="origin: sea level at the middle of the group; they stand off the promontory's point")
