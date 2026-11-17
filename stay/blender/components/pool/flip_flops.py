# pool/flip-flops: a pair of rubber flip-flops left under the bench, modelled by hand at real size (27 cm): a foam sole
# in two layers cut to a foot's outline, a toe post and a Y strap, one kicked askew. Their origin is the floor between
# them. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("flip_flops")
sole_m = comp.mat("pool_flipflop_sole", (0.95, 0.75, 0.08), rough=0.85)
base_m = comp.mat("pool_flipflop_base", (0.05, 0.2, 0.6), rough=0.85)
strap_m = comp.mat("pool_flipflop_strap", (0.05, 0.2, 0.6), rough=0.5)
OUT = [(0.0, -0.135), (0.028, -0.128), (0.04, -0.1), (0.038, -0.04), (0.042, 0.02), (0.05, 0.07), (0.045, 0.11), (0.025, 0.133), (0.0, 0.137), (-0.025, 0.128), (-0.04, 0.1), (-0.042, 0.05), (-0.034, -0.03), (-0.036, -0.09), (-0.026, -0.125)]
def flop(mirror, m):
    s = -1 if mirror else 1
    out = []
    for z0, z1, mat, n in ((0.0, 0.008, base_m, "base"), (0.008, 0.017, sole_m, "sole")):
        bm = bmesh.new()
        f = bm.faces.new([bm.verts.new((s * x, y, z0)) for x, y in OUT])
        r = bmesh.ops.extrude_face_region(bm, geom=[f])
        bmesh.ops.translate(bm, vec=(0, 0, z1 - z0), verts=[e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)])
        if not any(all(abs(v.co.z - z0) < 1e-6 for v in ff.verts) for ff in bm.faces):
            bm.faces.new([v for v in bm.verts if abs(v.co.z - z0) < 1e-6][:len(OUT)])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        out.append((xf(bm, m), mat, n))
    toe = Vector((s * 0.012, 0.085, 0.017))
    strap = [pipe(bend([toe, toe + Vector((0, -0.005, 0.022)), Vector((s * sx * 0.04 + s * 0.002, -0.0, 0.03)), Vector((s * sx * 0.041, -0.03, 0.017))], 0.02, 4), 0.004) for sx in (-1, 1)]
    out.append((xf(comp.merge(*strap), m), strap_m, "strap"))
    return out
k = 0
for mirror, m, side in ((False, T(0.06, 0.0, 0) @ R(-6, "Z"), "r"), (True, T(-0.07, 0.03, 0) @ R(24, "Z"), "l")):
    for bm, mat, n in flop(mirror, m):
        o = comp.mesh(col, root, f"flip_flops_{side}_{n}", bm, mat, smooth=(n == "strap"))
        if n != "strap":
            comp.bevel(o, 0.002, 2)
done(col, root, "flip_flops", source="own geometry (a generic pair of flip-flops)")
