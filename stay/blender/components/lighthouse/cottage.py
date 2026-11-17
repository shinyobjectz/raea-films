# lighthouse/cottage: the keeper's cottage, modelled by hand: a single-storey whitewashed house 9 by 5.5 m under a
# slate roof, a stone base course, two brick chimneys with clay pots, six sash windows (six panes over six) in painted
# frames on stone sills, a planked front door in a stone surround, a doorstep, cast gutters and downpipes, ridge tiles
# and a lamp by the door. Walls, slates, brick and door from Poly Haven texture sets. The windows' glass is its own
# material (cottage_window), lit warm. Rig: "door" opens the front door 95 degrees outward on its left hinges.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe, sphere
from mathutils import Vector

col, root = comp.fresh("cottage")
wall_m = comp.ph_texture("cottage_wall", "white_plaster_rough_01", tile=2.5, res="1k")
slate = comp.ph_texture("cottage_slates", "roof_slates_02", tile=2.0, res="1k", grey=True, tint=(0.3, 0.32, 0.37))
stone = comp.ph_texture("cottage_stone", "large_sandstone_blocks_01", tile=2.2, res="1k", grey=True, tint=(0.62, 0.6, 0.56))
brick = comp.ph_texture("cottage_brick", "red_brick_03", tile=1.2, res="1k")
door_m = comp.ph_texture("cottage_door", "green_rough_planks", tile=1.2, res="1k")
paint = comp.mat("cottage_frames", (0.8, 0.8, 0.77), rough=0.5)
glass = comp.mat("cottage_window", (0.9, 0.6, 0.3), rough=0.1, emit=(1.0, 0.62, 0.26), strength=1500.0)
iron = comp.mat("cottage_iron", (0.015, 0.015, 0.017), rough=0.5, metal=0.6)
clay = comp.mat("cottage_pots", (0.5, 0.2, 0.1), rough=0.8)
dark = comp.mat("cottage_inside", (0.004, 0.004, 0.004), rough=0.9)
lamp_m = comp.mat("cottage_lamp", (1.0, 0.85, 0.6), rough=0.4, emit=(1.0, 0.75, 0.4), strength=3000.0)
M = _lib.maker(col, root)
W, D, EAVE, RIDGE, BASE = 9.0, 5.5, 2.7, 4.7, 0.3


def prism(pts, x0, x1):
    """A shape in the yz plane pushed from x0 to x1."""
    bm = bmesh.new()
    f = bm.faces.new([bm.verts.new((x0, y, z)) for y, z in pts])
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(x1 - x0, 0, 0), verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


walls = M("cottage_walls", prism([(-D / 2, BASE), (D / 2, BASE), (D / 2, EAVE), (0, RIDGE - 0.12), (-D / 2, EAVE)], -W / 2, W / 2), wall_m)
comp.uv_box(walls, 1.0)
base = M("cottage_base_course", comp.box((W + 0.12, D + 0.12, BASE + 0.02), at=(0, 0, (BASE + 0.02) / 2)), stone)
comp.bevel(base, 0.015, 2)
comp.uv_box(base, 1.0)
# the roof: two slate slopes oversailing the walls, ridge tiles, bargeboards
OV = 0.35
slope = math.atan2(RIDGE - EAVE, D / 2)
roof = []
for s in (-1, 1):
    y0, z0 = s * (D / 2 + OV), EAVE - OV * math.tan(slope)
    roof.append(prism([(y0, z0), (0, RIDGE), (0, RIDGE + 0.09), (y0, z0 + 0.09)][::s], -W / 2 - 0.3, W / 2 + 0.3))
rf = M("cottage_roof", comp.merge(*roof), slate)
comp.uv_box(rf, 1.0)
ridge = [comp.merge(comp.cyl(0.11, 0.44, at=(-W / 2 - 0.3 + i * 0.46, 0, RIDGE + 0.04), seg=12, axis="X"), comp.cyl(0.125, 0.04, at=(-W / 2 - 0.3 + i * 0.46, 0, RIDGE + 0.04), seg=12, axis="X")) for i in range(21)]
M("cottage_ridge_tiles", comp.merge(*ridge), clay, smooth=True)
barge = []
for sx in (-1, 1):
    for s in (-1, 1):
        L = math.hypot(D / 2 + OV, (D / 2 + OV) * math.tan(slope))
        b = comp.box((0.04, L, 0.18), at=(0, s * L / 2, -0.06))
        xf(b, R(-s * math.degrees(slope), "X")) if False else xf(b, R(s * -math.degrees(slope), "X"))
        xf(b, T(sx * (W / 2 + 0.3), 0, RIDGE))
        barge.append(b)
M("cottage_bargeboards", comp.merge(*barge), paint)
# the chimneys: brick stacks at the gables, a stone cap and two pots each
for i, sx in enumerate((-1, 1)):
    x = sx * (W / 2 - 0.45)
    st = M(f"cottage_chimney_{i + 1}", comp.box((0.7, 1.0, 1.9), at=(x, 0, RIDGE - 0.6 + 0.95)), brick)
    comp.uv_box(st, 1.0)
    cap = M(f"cottage_chimney_cap_{i + 1}", comp.merge(comp.box((0.86, 1.16, 0.1), at=(x, 0, RIDGE + 1.35)), comp.box((0.78, 1.08, 0.06), at=(x, 0, RIDGE + 1.26))), stone)
    comp.uv_box(cap, 1.0)
    M(f"cottage_pots_{i + 1}", comp.merge(*[lathe([(0.13, 0), (0.11, 0.05), (0.1, 0.34), (0.125, 0.37), (0.125, 0.42), (0.09, 0.42)], seg=16, z0=RIDGE + 1.4, at=(x, sy * 0.26)) for sy in (-1, 1)]), clay, smooth=True)


def window(wd=0.95, ht=1.35):
    """A sash window built at the origin facing -y, its glass at y 0: returns (stone, frame, glass)."""
    st = comp.merge(comp.box((wd + 0.36, 0.26, 0.1), at=(0, -0.1, -ht / 2 - 0.05)), comp.box((wd + 0.3, 0.16, 0.2), at=(0, -0.04, ht / 2 + 0.1)))
    fr = [comp.box((wd, 0.07, 0.07), at=(0, -0.03, z)) for z in (-ht / 2 + 0.035, ht / 2 - 0.035)]
    fr += [comp.box((0.07, 0.07, ht), at=(x, -0.03, 0)) for x in (-wd / 2 + 0.035, wd / 2 - 0.035)]
    fr += [comp.box((wd, 0.06, 0.055), at=(0, -0.035, 0))]                                               # the meeting rail
    fr += [comp.box((0.022, 0.03, ht), at=(x, -0.02, 0)) for x in (-wd / 6, wd / 6)]
    fr += [comp.box((wd, 0.03, 0.022), at=(0, -0.02, z)) for z in (-ht / 4, ht / 4)]
    return st, comp.merge(*fr), comp.box((wd - 0.1, 0.012, ht - 0.1), at=(0, 0.0, 0))


def placed(bm, x, y, z, turn):
    xf(bm, R(turn, "Z"))
    return xf(bm, T(x, y, z))


sts, frs, gls = [], [], []
spots = [(-2.9, -D / 2 - 0.01, 1.55, 0), (2.9, -D / 2 - 0.01, 1.55, 0), (-2.6, D / 2 + 0.01, 1.55, 180), (2.6, D / 2 + 0.01, 1.55, 180), (0, D / 2 + 0.01, 1.55, 180),
         (-W / 2 - 0.01, 0, 1.55, -90), (W / 2 + 0.01, 0, 1.55, 90)]
for x, y, z, turn in spots:
    a, b, c = window()
    sts.append(placed(a, x, y, z, turn)); frs.append(placed(b, x, y, z, turn)); gls.append(placed(c, x, y, z, turn))
so = M("cottage_window_stone", comp.merge(*sts), stone)
comp.bevel(so, 0.01, 2)
comp.uv_box(so, 1.0)
M("cottage_window_frames", comp.merge(*frs), paint)
M("cottage_window_glass", comp.merge(*gls), glass)

# the front door
DW, DH = 0.95, 2.05
YF = -D / 2
ds = M("cottage_door_surround", comp.merge(comp.box((0.2, 0.2, DH), at=(-DW / 2 - 0.1, YF - 0.04, BASE + DH / 2)), comp.box((0.2, 0.2, DH), at=(DW / 2 + 0.1, YF - 0.04, BASE + DH / 2)),
                                          comp.box((DW + 0.6, 0.24, 0.24), at=(0, YF - 0.05, BASE + DH + 0.12)), comp.box((DW + 0.9, 0.7, BASE), at=(0, YF - 0.35, BASE / 2)),
                                          comp.box((DW + 1.3, 0.4, BASE / 2), at=(0, YF - 0.85, BASE / 4))), stone)
comp.bevel(ds, 0.012, 2)
comp.uv_box(ds, 1.0)
M("cottage_doorway", comp.box((DW, 0.03, DH), at=(0, YF - 0.0, BASE + DH / 2)), dark)
hinge = comp.pivot(col, root, "cottage_door_hinge", (-DW / 2, YF - 0.06, BASE))
leaf = M("cottage_door_leaf", comp.box((DW - 0.015, 0.05, DH - 0.015), at=(0, YF - 0.06, BASE + DH / 2)), door_m, parent=hinge)
comp.bevel(leaf, 0.005, 2)
comp.uv_box(leaf, 1.0)
fit = [comp.box((DW - 0.12, 0.01, 0.06), at=(-0.03, YF - 0.09, BASE + z)) for z in (0.28, DH - 0.28)]
fit += [comp.box((0.06, 0.012, 0.16), at=(DW / 2 - 0.11, YF - 0.09, BASE + 1.0)), comp.cyl(0.012, 0.05, at=(DW / 2 - 0.11, YF - 0.14, BASE + 1.02), seg=8, axis="Y"),
        comp.cyl(0.03, 0.03, at=(DW / 2 - 0.11, YF - 0.155, BASE + 1.02), seg=12, axis="Y"), comp.box((0.26, 0.012, 0.045), at=(0, YF - 0.09, BASE + 1.25))]
M("cottage_door_ironwork", comp.merge(*fit), iron, parent=hinge)
# gutters, downpipes, the lamp by the door
gut = []
for s in (-1, 1):
    y, z = s * (D / 2 + OV + 0.05), EAVE - OV * math.tan(slope) - 0.02
    g = comp.cyl(0.07, W + 0.6, at=(-W / 2 - 0.3, y, z), seg=12, axis="X")
    bmesh.ops.bisect_plane(g, geom=g.verts[:] + g.edges[:] + g.faces[:], plane_co=(0, 0, z + 0.005), plane_no=(0, 0, 1), clear_outer=True)
    gut.append(g)
    for sx in (-1, 1):
        if s * sx > 0:
            x = sx * (W / 2 + 0.12)
            gut.append(comp.tube([(x, y, z - 0.05), (x, y - s * 0.1, z - 0.3), (x, s * (D / 2 + 0.07), z - 0.55), (x, s * (D / 2 + 0.07), 1.2), (x, s * (D / 2 + 0.07), 0.12)], 0.038, sides=3))
            gut += [comp.box((0.12, 0.03, 0.03), at=(x, s * (D / 2 + 0.03), zz)) for zz in (0.6, 1.6)]
M("cottage_gutters", comp.merge(*gut), iron, smooth=True)
lx, lz = DW / 2 + 0.55, BASE + 1.95
M("cottage_lamp_bracket", comp.merge(comp.box((0.1, 0.02, 0.16), at=(lx, YF - 0.01, lz)), comp.tube([(lx, YF - 0.02, lz), (lx, YF - 0.2, lz + 0.08), (lx, YF - 0.3, lz - 0.02)], 0.012),
                                     lathe([(0.02, 0.0), (0.11, -0.05), (0.12, -0.07)], seg=16, z0=lz - 0.02, at=(lx, YF - 0.3))), iron, smooth=True)
M("cottage_lamp", sphere(0.05, (lx, YF - 0.3, lz - 0.1), u=14, v=10, squash=(1, 1, 1.3)), lamp_m, smooth=True)

comp.channel("door", [(hinge, "rotation_euler", 2, 0, math.radians(-95))])
comp.export(col, root, "lighthouse", "cottage", made="blender/components/lighthouse/cottage.py",
            source="own geometry (a generic keeper's cottage); textures: https://polyhaven.com/a/white_plaster_rough_01, https://polyhaven.com/a/roof_slates_02, https://polyhaven.com/a/large_sandstone_blocks_01, https://polyhaven.com/a/red_brick_03, https://polyhaven.com/a/green_rough_planks",
            license="ours; textures CC0", credit="Poly Haven (white_plaster_rough_01, roof_slates_02, large_sandstone_blocks_01, red_brick_03, green_rough_planks)",
            rig={"door": "the front door opens 95 degrees outward on its left hinges (cottage_door_hinge), showing the dark hall",
                 "windows": "in the scene: the material cottage_window (lit warm or dark) and cottage_lamp (the lamp by the door)"})
