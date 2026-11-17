# clocktower/floor: the clock room's floor, 8 x 6 m of old boards (Poly Haven's old_wood_floor, CC0) on its top at z 0,
# with a trapdoor 0.8 m square left of the middle: a boarded hatch with two strap hinges and a ring pull, in a
# trimmed opening with the top of the ladder below showing in the dark. Origin: the floor's middle, its top at z 0.
# A shell part. Rig: "hatch" swings the trapdoor up 80 degrees on its hinges.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, bolt, torus

col, root = comp.fresh("floor")
boards = comp.ph_texture("floor_boards", "old_wood_floor", tile=2.0)
hatch_m = comp.ph_texture("floor_hatch", "old_wood_floor", tile=1.4, res="1k", tint=(0.8, 0.74, 0.66))
iron = comp.mat("floor_iron", (0.03, 0.03, 0.035), rough=0.6, metal=0.4)
dark = comp.mat("floor_well", (0.006, 0.005, 0.004), rough=0.95)
rung = comp.mat("floor_ladder", (0.2, 0.13, 0.07), rough=0.8)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, D, TH, HX, HY, HS = 8.0, 6.0, 0.05, -2.2, -0.9, 0.8
bm = bmesh.new()
rect = [bm.verts.new((x, y, 0)) for x, y in ((-W / 2, -D / 2), (W / 2, -D / 2), (W / 2, D / 2), (-W / 2, D / 2))]
hole = [bm.verts.new((HX + sx * HS / 2, HY + sy * HS / 2, 0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
for vs in (rect, hole):
    for i in range(4):
        bm.edges.new((vs[i], vs[(i + 1) % 4]))
bmesh.ops.triangle_fill(bm, use_beauty=True, use_dissolve=False, edges=bm.edges[:])
ext = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
bmesh.ops.translate(bm, vec=(0, 0, -TH), verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
f = M("floor_boards", bm, boards)
comp.uv_box(f)
M("floor_well", comp.box((HS, HS, 0.002), at=(HX, HY, -0.011)), dark)  # inside the closed hatch's boards, so the stand's floor never shows
M("floor_ladder_top", comp.merge(comp.box((0.04, 0.05, 0.04), at=(HX - 0.2, HY + 0.34, -0.03)), comp.box((0.04, 0.05, 0.04), at=(HX + 0.2, HY + 0.34, -0.03)), comp.cyl(0.014, 0.4, at=(HX - 0.2, HY + 0.33, -0.035), seg=10, axis="X")), rung)
hp = comp.pivot(col, root, "floor_hatch", (HX, HY + HS / 2, 0.0))
h = M("floor_hatch_boards", comp.merge(*[comp.box((HS / 5 - 0.006, HS - 0.012, 0.03), at=(HX - HS / 2 + HS / 10 + i * HS / 5, HY, -0.015)) for i in range(5)],
                                      *[comp.box((HS - 0.04, 0.09, 0.02), at=(HX, HY + s * 0.26, -0.04)) for s in (-1, 1)]), hatch_m, parent=hp)
comp.bevel(h, 0.003, 2)
comp.uv_box(h)
iron_parts = []
for s in (-1, 1):
    iron_parts.append(comp.box((0.04, 0.5, 0.005), at=(HX + s * 0.24, HY + HS / 2 - 0.25, 0.0025)))
    iron_parts += [bolt((HX + s * 0.24, HY + HS / 2 - 0.08 - i * 0.14, 0.004), 0.008, 0.004) for i in range(3)]
iron_parts.append(xf(torus(0.04, 0.005, seg=24, sides=8, axis="Z"), T(HX, HY - 0.3, 0.006)))
iron_parts.append(comp.box((0.03, 0.05, 0.006), at=(HX, HY - 0.25, 0.003)))
M("floor_hatch_iron", comp.merge(*iron_parts), iron, parent=hp)
M("floor_hinge_knuckles", comp.merge(*[comp.cyl(0.009, 0.07, at=(HX + s * 0.24 - 0.035, HY + HS / 2, 0.006), seg=10, axis="X") for s in (-1, 1)]), iron)
comp.channel("hatch", [(hp, "rotation_euler", 0, 0, math.radians(-80))])
comp.export(col, root, "clocktower", "floor", made="blender/components/clocktower/floor.py", source="own geometry; boards https://polyhaven.com/a/old_wood_floor", license="ours; texture CC0", credit="texture: Poly Haven",
            rig={"hatch": "the trapdoor swings up 80 degrees on its hinges (its far edge)"})
