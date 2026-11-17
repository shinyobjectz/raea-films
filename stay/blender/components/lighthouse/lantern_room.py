# lighthouse/lantern-room: the lantern, modelled by hand: a red cast-iron murette of sixteen riveted panels with the
# gallery door, sixteen panes of plate glass between iron astragals with two horizontal glazing bars, a gutter ring with
# handholds, a ribbed cupola roof, the ventilator ball, a lightning rod and a wind vane with its N-E-S-W arms. 3.9 m
# across the gutter, 7.4 m to the rod's tip; its origin is the tower's deck top on the tower's axis, and the lens stands
# inside it on the same point. The glass is its own material (lantern_glass). Rig: "vane" turns the wind vane one whole
# turn on the rod; "hatch" opens the gallery door 90 degrees outward.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe, ring, sphere

col, root = comp.fresh("lantern_room")
redp = comp.mat("lantern_red", (0.42, 0.025, 0.02), rough=0.38)
iron = comp.mat("lantern_iron", (0.012, 0.012, 0.014), rough=0.45, metal=0.7)
glass = comp.mat("lantern_glass", (0.75, 0.9, 0.95), rough=0.03, alpha=0.14)
brass = comp.mat("lantern_brass", (0.8, 0.58, 0.22), rough=0.3, metal=1.0)
floor_m = comp.mat("lantern_floor", (0.05, 0.05, 0.055), rough=0.6, metal=0.5)
gold = comp.mat("lantern_vane", (0.85, 0.62, 0.2), rough=0.25, metal=1.0)
M = _lib.maker(col, root)
RM, N = 1.85, 16
Z0, Z1 = 1.0, 3.5          # the glazing


def round_about(bm, n=N, off=0.0):
    out = []
    for k in range(n):
        c = bm.copy()
        xf(c, R(off + k * 360 / n, "Z"))
        out.append(c)
    bm.free()
    return comp.merge(*out)


# the murette: a sixteen-sided iron wall, a plinth and a sill, a rivet line down each seam
C = math.cos(math.pi / N)
wall = xf(lathe([(RM / C - 0.06, 0.0), (RM / C + 0.06, 0.0), (RM / C + 0.06, 0.08), (RM / C, 0.1), (RM / C, Z0 - 0.08), (RM / C + 0.07, Z0 - 0.06), (RM / C + 0.07, Z0), (RM / C - 0.06, Z0)], seg=N), R(180 / N, "Z"))
M("lantern_room_murette", wall, redp)
seam = comp.merge(comp.box((0.07, 0.03, Z0 - 0.2), at=(0, -RM / C - 0.01, Z0 / 2)), *[comp.cyl(0.011, 0.012, at=(sx * 0.022, -RM / C - 0.036, 0.16 + i * 0.105), seg=6, axis="Y") for i in range(8) for sx in (-1, 1)])
M("lantern_room_seams", round_about(xf(seam, R(180 / N, "Z"))), redp)
panel = comp.box((0.42, 0.012, 0.6), at=(0, -RM - 0.004, 0.5))
M("lantern_room_panels", round_about(panel, off=0), redp)
M("lantern_room_floor", lathe([(0.0, 0.03), (RM - 0.05, 0.03)], seg=48), floor_m)
# the gallery door: one panel wide, at the back right
DA = 135.0
hp = comp.pivot(col, root, "lantern_room_hatch", (0, 0, 0))
dz = xf(comp.merge(comp.box((0.6, 0.04, 0.84), at=(0, -RM - 0.03, 0.5)), comp.box((0.5, 0.01, 0.3), at=(0, -RM - 0.055, 0.68)), comp.box((0.5, 0.01, 0.3), at=(0, -RM - 0.055, 0.3))), R(DA, "Z"))
import mathutils
hinge_at = mathutils.Matrix.Rotation(math.radians(DA), 4, "Z") @ mathutils.Vector((-0.3, -RM - 0.03, 0.08))
hp.location = hinge_at
bpy.context.view_layer.update()
M("lantern_room_hatch_door", dz, redp, parent=hp)
M("lantern_room_hatch_handle", xf(comp.merge(comp.cyl(0.012, 0.06, at=(0.22, -RM - 0.11, 0.5), seg=8, axis="Y"), comp.cyl(0.014, 0.12, at=(0.16, -RM - 0.11, 0.5), seg=8, axis="X")), R(DA, "Z")), brass, parent=hp)

# the glazing: sixteen flat panes, astragals at the corners, two glazing bars, sill and head
M("lantern_room_glass", xf(lathe([(RM / C - 0.02, Z0), (RM / C - 0.02, Z1)], seg=N), R(180 / N, "Z")), glass)
ast = comp.box((0.055, 0.09, Z1 - Z0), at=(0, -RM / C + 0.02, (Z0 + Z1) / 2))
M("lantern_room_astragals", round_about(xf(ast, R(180 / N, "Z"))), iron)
for i, z in enumerate((Z0 + (Z1 - Z0) / 3, Z0 + 2 * (Z1 - Z0) / 3)):
    M(f"lantern_room_glazing_bar_{i + 1}", xf(ring(RM / C - 0.045, RM / C + 0.005, z - 0.02, z + 0.02, seg=N), R(180 / N, "Z")), iron)
gut = lathe([(RM / C - 0.08, Z1), (RM / C + 0.06, Z1), (RM / C + 0.1, Z1 + 0.05), (RM / C + 0.16, Z1 + 0.07), (RM / C + 0.16, Z1 + 0.17), (RM / C + 0.1, Z1 + 0.19), (RM / C + 0.02, Z1 + 0.19)], seg=64)
M("lantern_room_gutter", gut, redp, smooth=False)
hold = comp.merge(comp.cyl(0.012, 0.09, at=(-0.12, -RM / C - 0.14, Z1 + 0.11), seg=8, axis="Y"), comp.cyl(0.012, 0.09, at=(0.12, -RM / C - 0.14, Z1 + 0.11), seg=8, axis="Y"),
                  comp.cyl(0.012, 0.264, at=(-0.132, -RM / C - 0.23, Z1 + 0.11), seg=8, axis="X"))
M("lantern_room_handholds", round_about(hold, n=8, off=11.25), iron)
# the outside handrail the keeper cleans the glass from
M("lantern_room_cleaning_rail", lathe([(RM / C + 0.14 + 0.014 * math.cos(i * math.pi / 4), Z0 + 0.92 + 0.014 * math.sin(i * math.pi / 4)) for i in range(9)], seg=64), iron, smooth=True)
M("lantern_room_rail_stays", round_about(comp.cyl(0.01, 0.12, at=(0, -RM / C - 0.14, Z0 + 0.92), seg=6, axis="Y"), off=180 / N), iron)

# the cupola: an ogee roof, sixteen ribs, the ventilator ball, the rod
ZR = Z1 + 0.19
prof = [(RM / C + 0.12, ZR), (RM / C + 0.02, ZR + 0.12), (1.62, ZR + 0.42), (1.2, ZR + 0.82), (0.74, ZR + 1.12), (0.44, ZR + 1.32), (0.34, ZR + 1.5)]
roof = M("lantern_room_roof", lathe(prof, seg=64), redp, smooth=True)
ribs = []
for (r0, z0), (r1, z1) in zip(prof[1:-1], prof[2:]):
    L = math.hypot(r1 - r0, z1 - z0)
    b = comp.box((0.05, 0.045, L + 0.02), at=(0, 0, L / 2))
    xf(b, R(-math.degrees(math.atan2(r0 - r1, z1 - z0)), "X"))
    xf(b, T(0, -r0 - 0.012, z0))
    ribs.append(b)
M("lantern_room_ribs", round_about(comp.merge(*ribs), off=180 / N), redp)
ZB = ZR + 1.5
vent = comp.merge(lathe([(0.34, ZB), (0.36, ZB + 0.05), (0.3, ZB + 0.09), (0.2, ZB + 0.12)], seg=32), sphere(0.33, (0, 0, ZB + 0.36), u=32, v=20), ring(0.2, 0.345, ZB + 0.34, ZB + 0.38, seg=32),
                  lathe([(0.12, ZB + 0.66), (0.06, ZB + 0.74), (0.035, ZB + 0.8)], seg=16))
M("lantern_room_ventilator", vent, iron, smooth=True)
ZT = ZB + 0.8
M("lantern_room_rod", comp.merge(comp.cyl(0.018, 1.25, at=(0, 0, ZT - 0.05), seg=10), lathe([(0.018, ZT + 1.2), (0.0, ZT + 1.42)], seg=10)), iron, smooth=True)
arms = [comp.cyl(0.009, 0.84, at=(-0.42, 0, ZT + 0.42), seg=6, axis="X"), comp.cyl(0.009, 0.84, at=(0, -0.42, ZT + 0.42), seg=6, axis="Y")]
for ch, (x, y, turn) in {"N": (0, 0.48, 180), "S": (0, -0.48, 0), "E": (0.48, 0, 90), "W": (-0.48, 0, -90)}.items():
    t = comp.text(ch, 0.14, depth=0.012)
    xf(t, R(turn, "Z")); xf(t, T(x, y, ZT + 0.42))
    arms.append(t)
M("lantern_room_cardinals", comp.merge(*arms), gold)
vp = comp.pivot(col, root, "lantern_room_vane", (0, 0, ZT + 0.75))
arrow = bmesh.new()
pts = [(-0.55, 0.0), (-0.36, 0.1), (-0.36, 0.022), (0.2, 0.022), (0.2, 0.17), (0.6, 0.12), (0.52, 0.0), (0.6, -0.12), (0.2, -0.17), (0.2, -0.022), (-0.36, -0.022), (-0.36, -0.1)]
arrow.faces.new([arrow.verts.new((x, 0, ZT + 0.75 + z)) for x, z in pts])
ext = bmesh.ops.extrude_face_region(arrow, geom=arrow.faces[:])
bmesh.ops.translate(arrow, vec=(0, 0.012, 0), verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
xf(arrow, T(0, -0.006, 0))
bmesh.ops.recalc_face_normals(arrow, faces=arrow.faces)
M("lantern_room_vane_arrow", comp.merge(arrow, comp.cyl(0.028, 0.1, at=(0, 0, ZT + 0.7), seg=12)), gold, parent=vp)

comp.channel("vane", [(vp, "rotation_euler", 2, 0, 2 * math.pi)])
comp.channel("hatch", [(hp, "rotation_euler", 2, 0, math.radians(-90))])
comp.export(col, root, "lighthouse", "lantern_room", made="blender/components/lighthouse/lantern_room.py",
            source="own geometry (a generic cast-iron lighthouse lantern); letters in Blender's built-in font", license="ours", credit="",
            rig={"vane": "the wind vane's arrow one whole turn on the lightning rod", "hatch": "the gallery door in the murette opens 90 degrees outward",
                 "glass": "in the scene: the material lantern_glass (the panes) and whatever lights the room"},
            notes="origin: the deck top on the tower's axis, 18 m up; lighthouse/fresnel-lens stands on the same point inside it")
