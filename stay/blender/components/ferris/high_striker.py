# ferris/high-striker: a test-your-strength machine, 4.6 m, modelled by hand: a painted tower board with a scale of
# eleven coloured bands and their numbers, a steel guide wire with a puck on it, a brass bell under a hood at the
# top with a star over it, a base with the sprung strike pad and its see-saw lever, and a long mallet leaning on
# the base. Its front faces -y. Rig: "strike" drives the pad down 5 cm, tips the lever and sends the puck 3.55 m
# up the wire to the bell, which kicks 14 degrees; "mallet" swings the mallet 80 degrees over onto the pad.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("high_striker")
red = comp.mat("fair_red", (0.55, 0.05, 0.04), rough=0.45)
cream = comp.mat("fair_cream", (0.88, 0.82, 0.62), rough=0.5)
gold = comp.mat("fair_gold", (0.85, 0.6, 0.15), rough=0.35, metal=0.6)
brass = comp.mat("striker_bell", (0.8, 0.6, 0.22), rough=0.2, metal=1.0)
galv = comp.mat("wheel_galvanised", (0.55, 0.57, 0.58), rough=0.45, metal=1.0)
wood = comp.ph_texture("stall_timber", "weathered_planks", tile=1.0, res="1k")
dark = comp.mat("booth_dark", (0.02, 0.02, 0.022), rough=0.8)
blue = comp.mat("stall_blue", (0.06, 0.2, 0.5), rough=0.4)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
TW, Z0, Z1 = 0.5, 0.45, 4.2
bd = M("high_striker_board", comp.merge(comp.box((TW, 0.05, Z1 - Z0), at=(0, 0.1, (Z0 + Z1) / 2)), comp.box((TW + 0.3, 0.06, 0.5), at=(0, 0.1, Z1 + 0.2))), red)
comp.bevel(bd, 0.006, 2)
bands = {0: [], 1: [], 2: []}
nums = []
for i in range(11):
    z = Z0 + 0.25 + i * 0.32
    bands[i % 3].append(comp.box((TW - 0.2, 0.004, 0.3), at=(-0.08, 0.073, z + 0.15)))
    nums.append(xf(comp.text(str((i + 1) * 10), 0.11, depth=0.003), T(0.17, 0.07, z + 0.15)))
M("high_striker_bands_cream", comp.merge(*bands[0]), cream)
M("high_striker_bands_gold", comp.merge(*bands[1]), gold)
M("high_striker_bands_blue", comp.merge(*bands[2]), blue)
M("high_striker_numbers", comp.merge(*nums), cream)
M("high_striker_wire", comp.merge(L.seg((-0.08, 0.02, Z0 - 0.1), (-0.08, 0.02, Z1 + 0.05), 0.006, 6), comp.box((0.06, 0.08, 0.03), at=(-0.08, 0.05, Z1 + 0.05)), comp.box((0.06, 0.08, 0.03), at=(-0.08, 0.05, Z0 - 0.08))), galv, None, True)
pk = comp.pivot(col, root, "high_striker_puck", (-0.08, 0.02, Z0 + 0.02))
M("high_striker_puck_weight", comp.merge(comp.cyl(0.04, 0.07, at=(-0.08, 0.02, Z0 - 0.015), seg=16), comp.cyl(0.05, 0.012, at=(-0.08, 0.02, Z0 - 0.02), seg=16)), galv, pk, True)
bell = comp.pivot(col, root, "high_striker_bell", (-0.08, 0.06, Z1 + 0.22))
bm = bmesh.new()
prof = [(0.0, 0.0), (0.05, -0.005), (0.09, -0.04), (0.105, -0.1), (0.125, -0.13)]
vs = [bm.verts.new((r, 0, z)) for r, z in prof]
es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=24, use_duplicate=False)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bo = M("high_striker_bell_dome", xf(bm, T(-0.08, 0.02, Z1 + 0.2)), brass, bell, True)
comp.solidify(bo, 0.006)
M("high_striker_bell_bolt", comp.merge(comp.cyl(0.012, 0.05, at=(-0.08, 0.02, Z1 + 0.19), seg=8), L.seg((-0.08, 0.02, Z1 + 0.22), (-0.08, 0.08, Z1 + 0.22), 0.008, 6)), galv, bell, True)
star = bmesh.new()
pts = [Vector((math.sin(math.pi * k / 5) * (0.22 if k % 2 == 0 else 0.09), 0.065, math.cos(math.pi * k / 5) * (0.22 if k % 2 == 0 else 0.09) + Z1 + 0.62)) for k in range(10)]
star.faces.new([star.verts.new(p) for p in pts])
so = M("high_striker_star", star, gold)
comp.solidify(so, 0.03)
base = M("high_striker_base", comp.merge(comp.box((0.9, 1.3, 0.1), at=(0, -0.35, 0.05)), comp.box((0.7, 0.3, 0.35), at=(0, 0.1, 0.27)), *[comp.taper((sx * 0.3, 0.1, 0.45), (sx * 0.4, 0.75, 0.1), 0.06, 0.06, 0.06, 0.06) for sx in (-1, 1)]), wood)
comp.bevel(base, 0.006, 2)
comp.uv_box(base, 1.0)
M("high_striker_back_stays", comp.merge(*[L.seg((sx * 0.2, 0.13, 2.6), (sx * 0.4, 0.75, 0.1), 0.02, 8) for sx in (-1, 1)]), galv, None, True)
lv = comp.pivot(col, root, "high_striker_lever", (-0.08, -0.25, 0.2))
M("high_striker_lever_beam", comp.merge(comp.box((0.07, 0.75, 0.035), at=(-0.08, -0.3, 0.2)), comp.cyl(0.02, 0.16, at=(-0.16, -0.25, 0.2), seg=10, axis="X")), galv, lv)
M("high_striker_fulcrum", comp.merge(comp.box((0.18, 0.08, 0.1), at=(-0.08, -0.25, 0.15))), dark)
pad = comp.pivot(col, root, "high_striker_pad", (-0.08, -0.62, 0.24))
M("high_striker_pad_rubber", comp.merge(comp.cyl(0.11, 0.05, at=(-0.08, -0.62, 0.22), seg=24), comp.cyl(0.03, 0.06, at=(-0.08, -0.62, 0.16), seg=10)), dark, pad, True)
M("high_striker_pad_ring", L.torus(0.115, 0.012, seg_=24, sides=6, at=(-0.08, -0.62, 0.225)), red, pad, True)
ml = comp.pivot(col, root, "high_striker_mallet", (0.36, -0.75, 0.1))
mal = comp.merge(comp.cyl(0.018, 1.05, at=(0, 0, 0), seg=10), comp.cyl(0.075, 0.2, at=(-0.1, 0, 1.05), seg=18, axis="X"), *[comp.cyl(0.078, 0.02, at=(x, 0, 1.05), seg=18, axis="X") for x in (-0.1, 0.08)])
mo = M("high_striker_mallet_body", xf(mal, comp.Matrix.Translation((0.36, -0.75, 0.1)) @ R(-22, "X") @ R(12, "Y")), wood, ml, True)
comp.uv_box(mo, 1.0)
L.clip("strike", pad, {("location", 2): [(0, pad.location.z), (0.08, pad.location.z - 0.05), (0.3, pad.location.z), (1, pad.location.z)]})
L.clip("strike", lv, {("rotation_euler", 0): [(0, 0), (0.08, math.radians(-7)), (0.3, 0), (1, 0)]})
L.clip("strike", pk, {("location", 2): [(0, pk.location.z), (0.08, pk.location.z), (0.75, pk.location.z + 3.55), (1, pk.location.z + 3.55)]})
L.clip("strike", bell, {("rotation_euler", 0): [(0, 0), (0.75, 0), (0.85, math.radians(14)), (1, math.radians(6))]})
comp.channel("mallet", [(ml, "rotation_euler", 0, 0, math.radians(-80))])
comp.export(col, root, "ferris", "high_striker", made="blender/components/ferris/high_striker.py", source="own geometry (a generic high striker); texture: https://polyhaven.com/a/weathered_planks; numbers in Blender's built-in font", license="ours; texture CC0", credit="Poly Haven (weathered_planks)",
            rig={"strike": "the pad goes down 5 cm and springs back, the lever tips, the puck runs 3.55 m up the wire to the bell (there by 0.75 s and held), the bell kicks 14 degrees", "mallet": "the mallet swings 80 degrees over toward the pad"})
