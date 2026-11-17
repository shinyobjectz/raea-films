# lighthouse/tower: a masonry light tower, 18 m to its gallery deck, modelled by hand: a whitewashed brick shaft tapering
# from 7.2 m across at the ground to 4.6 m, a broad red-painted band, a dressed-stone plinth, a doorway in a stone
# surround with a date stone, steps and a planked door, four stair windows in stone surrounds climbing round it, a
# corbelled cornice and the gallery's stone deck (the railing is lighthouse/gallery, the lantern lighthouse/lantern-room;
# both stand on the deck, 18 m up). Brick, stone and door from Poly Haven texture sets. Rig: "door" swings the door
# open 100 degrees outward on its left hinges; the windows' glass is its own material (tower_window) for the scene.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe, ring, sphere
from mathutils import Vector

col, root = comp.fresh("tower")
white = comp.ph_texture("tower_whitewash", "whitewashed_brick", tile=2.0)
red = comp.ph_texture("tower_red_band", "whitewashed_brick", tile=2.0, tint=(0.62, 0.05, 0.04))
stone = comp.ph_texture("tower_stone", "large_sandstone_blocks_01", tile=2.2, res="1k", grey=True, tint=(0.62, 0.6, 0.56))
door_m = comp.ph_texture("tower_door", "green_rough_planks", tile=1.2, res="1k")
iron = comp.mat("tower_iron", (0.02, 0.02, 0.022), rough=0.5, metal=0.6)
glass = comp.mat("tower_window", (0.03, 0.045, 0.06), rough=0.08)
dark = comp.mat("tower_inside", (0.004, 0.004, 0.004), rough=0.9)
paint = comp.mat("tower_frames", (0.8, 0.8, 0.77), rough=0.5)
brass = comp.mat("tower_brass", (0.8, 0.58, 0.22), rough=0.3, metal=1.0)
M = _lib.maker(col, root)

H = 18.0
rad = lambda z: 2.3 + 1.3 * (1 - min(z, 17.0) / 17.0) ** 1.6

# --- the shaft: whitewash with one red band ----------------------------------------------------------------------------
zs = [1.2 + i * (15.8 / 40) for i in range(41)]
shaft = M("tower_shaft", lathe([(rad(z), z) for z in zs], seg=72), [white, red], smooth=True)
_lib.paint_by(shaft, lambda n, c: 1 if 7.4 < c.z < 11.4 else 0)
_lib.uv_cyl(shaft, r_ref=3.0)

# --- the plinth, the cornice and the deck (stone) -------------------------------------------------------------------------
pl = M("tower_plinth", lathe([(0.0, 0.0), (rad(0) + 0.28, 0.0), (rad(0) + 0.28, 0.45), (rad(0) + 0.2, 0.52), (rad(0.6) + 0.18, 1.1), (rad(1.2) + 0.1, 1.2), (rad(1.2) - 0.05, 1.2)], seg=72), stone, smooth=False)
_lib.uv_cyl(pl, r_ref=3.7)
cn = M("tower_cornice", lathe([(2.28, 16.9), (2.36, 16.95), (2.36, 17.1), (2.44, 17.14), (2.5, 17.3), (2.9, 17.62), (3.0, 17.66), (3.0, 17.76), (3.3, 17.8), (3.3, 17.96), (3.26, 18.0), (0.0, 18.0)], seg=72), stone, smooth=False)
_lib.uv_cyl(cn, r_ref=2.6)
corbels = []
for k in range(28):
    b = comp.merge(comp.box((0.2, 0.4, 0.14), at=(0, -2.72, 17.5)), comp.box((0.2, 0.26, 0.14), at=(0, -2.62, 17.36)), comp.box((0.2, 0.14, 0.12), at=(0, -2.54, 17.23)))
    corbels.append(xf(b, R(k * 360 / 28, "Z")))
cb = M("tower_corbels", comp.merge(*corbels), stone)
comp.bevel(cb, 0.012, 2)
comp.uv_box(cb, 2.2)
# string courses either side of the red band
for i, z in enumerate((7.4, 11.4)):
    sc = M(f"tower_string_course_{i + 1}", lathe([(rad(z) - 0.02, z - 0.09), (rad(z) + 0.07, z - 0.07), (rad(z) + 0.07, z + 0.07), (rad(z) - 0.02, z + 0.09)], seg=72), stone, smooth=False)
    _lib.uv_cyl(sc, r_ref=rad(z))


def on_wall(bm, ang, z, lean=True):
    """Stand a piece built at the origin (its back at y 0, facing -y) on the wall at `ang` degrees round and z up."""
    r0, r1 = rad(z - 0.5), rad(z + 0.5)
    if lean:
        xf(bm, R(-math.degrees(math.atan2(r0 - r1, 1.0)), "X"))
    xf(bm, T(0, -rad(z), z))
    xf(bm, R(ang + 90, "Z"))
    return bm


# --- the stair windows -----------------------------------------------------------------------------------------------------
sur, pane, bars = [], [], []
for ang, z in ((-90, 6.0), (-140, 9.4), (-35, 9.4), (-90, 13.4), (160, 4.6), (20, 13.6)):
    W, HH = 0.75, 1.35
    s = comp.merge(comp.box((0.2, 0.3, HH + 0.3), at=(-W / 2 - 0.1, -0.02, 0)), comp.box((0.2, 0.3, HH + 0.3), at=(W / 2 + 0.1, -0.02, 0)),
                   comp.box((W + 0.56, 0.36, 0.24), at=(0, -0.03, HH / 2 + 0.2)), comp.box((W + 0.62, 0.42, 0.14), at=(0, -0.06, -HH / 2 - 0.12)))
    sur.append(on_wall(s, ang, z))
    pane.append(on_wall(comp.box((W, 0.02, HH), at=(0, 0.0, 0)), ang, z))
    b = comp.merge(comp.box((0.045, 0.05, HH), at=(0, -0.02, 0)), comp.box((W, 0.05, 0.045), at=(0, -0.02, 0.1)), comp.box((W, 0.05, 0.045), at=(0, -0.02, -0.35)),
                   comp.box((W + 0.02, 0.06, 0.06), at=(0, -0.02, HH / 2 - 0.03)), comp.box((W + 0.02, 0.06, 0.06), at=(0, -0.02, -HH / 2 + 0.03)),
                   comp.box((0.06, 0.06, HH), at=(-W / 2 + 0.03, -0.02, 0)), comp.box((0.06, 0.06, HH), at=(W / 2 - 0.03, -0.02, 0)))
    bars.append(on_wall(b, ang, z))
so = M("tower_window_surrounds", comp.merge(*sur), stone)
comp.bevel(so, 0.015, 2)
comp.uv_box(so, 2.2)
M("tower_window_glass", comp.merge(*pane), glass)
M("tower_window_frames", comp.merge(*bars), paint)

# --- the doorway: surround, lintel and pediment, date stone, steps, the dark inside, the door on its hinges ---------------
DW, DH, DZ = 1.1, 2.15, 0.62           # the opening, and the threshold's height
YW = -rad(DZ + 1.0)                    # the wall's face at the door
dsur = comp.merge(comp.box((0.34, 0.75, DH + 0.1), at=(-DW / 2 - 0.17, YW - 0.05, DZ + DH / 2)), comp.box((0.34, 0.75, DH + 0.1), at=(DW / 2 + 0.17, YW - 0.05, DZ + DH / 2)),
                  comp.box((DW + 0.9, 0.8, 0.34), at=(0, YW - 0.06, DZ + DH + 0.17)))
ped = bmesh.new()
pv = [ped.verts.new(p) for p in ((-DW / 2 - 0.55, 0, 0), (DW / 2 + 0.55, 0, 0), (0, 0, 0.5))]
ped.faces.new(pv)
ext = bmesh.ops.extrude_face_region(ped, geom=ped.faces[:])
bmesh.ops.translate(ped, vec=(0, 0.8, 0), verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
bmesh.ops.recalc_face_normals(ped, faces=ped.faces)
xf(ped, T(0, YW - 0.46, DZ + DH + 0.34))
ds = M("tower_door_surround", comp.merge(dsur, ped), stone)
comp.bevel(ds, 0.02, 2)
comp.uv_box(ds, 2.2)
date = comp.text("1894", 0.2, depth=0.012)
xf(date, T(0, YW - 0.462, DZ + DH + 0.5))
M("tower_date_stone", date, iron)
steps = comp.merge(*[comp.box((DW + 1.5 - i * 0.3, 0.42, 0.21), at=(0, YW - 0.55 - (2 - i) * 0.36, 0.105 + i * 0.205)) for i in range(3)],
                   comp.box((DW + 0.7, 0.7, DZ), at=(0, YW - 0.1, DZ / 2)))
st = M("tower_steps", steps, stone)
comp.bevel(st, 0.02, 2)
comp.uv_box(st, 2.2)
M("tower_doorway", comp.box((DW, 0.04, DH), at=(0, YW - 0.2, DZ + DH / 2)), dark)
hinge = comp.pivot(col, root, "tower_door_hinge", (-DW / 2, YW - 0.3, DZ))
leaf = M("tower_door_leaf", comp.box((DW - 0.02, 0.06, DH - 0.02), at=(0, YW - 0.3, DZ + DH / 2)), door_m, parent=hinge)
comp.bevel(leaf, 0.006, 2)
comp.uv_box(leaf, 1.0)
fit = [comp.box((DW - 0.1, 0.012, 0.07), at=(-0.03, YW - 0.337, DZ + z)) for z in (0.3, DH - 0.3)]             # strap hinges
fit += [comp.cyl(0.022, 0.16, at=(-DW / 2 + 0.01, YW - 0.335, DZ + z - 0.08), seg=10) for z in (0.3, DH - 0.3)]
fit += [comp.box((0.07, 0.014, 0.2), at=(DW / 2 - 0.13, YW - 0.337, DZ + 1.05))]                                  # the lock plate
M("tower_door_ironwork", comp.merge(*fit), iron, parent=hinge)
M("tower_door_handle", comp.merge(sphere(0.04, (DW / 2 - 0.13, YW - 0.39, DZ + 1.08), u=14, v=10), comp.cyl(0.012, 0.05, at=(DW / 2 - 0.13, YW - 0.39, DZ + 1.08), seg=10, axis="Y")), brass, parent=hinge, smooth=True)
# a lamp over the door and a handrail up the steps
lampb = comp.merge(comp.box((0.1, 0.25, 0.04), at=(0, YW - 0.6, DZ + DH + 1.0)), comp.cyl(0.11, 0.2, at=(0, YW - 0.7, DZ + DH + 0.8), seg=16, r2=0.06))
M("tower_door_lamp", lampb, iron)
rail = []
for sx in (-1, 1):
    x = sx * (DW / 2 + 0.6)
    rail += [comp.cyl(0.02, 0.95, at=(x, YW - 0.35, DZ), seg=10), comp.cyl(0.02, 0.95, at=(x, YW - 1.3, 0.0), seg=10),
             comp.tube([(x, YW - 0.35, DZ + 0.95), (x, YW - 0.8, DZ + 0.75), (x, YW - 1.3, 0.95)], 0.022)]
M("tower_handrails", comp.merge(*rail), iron, smooth=True)

comp.channel("door", [(hinge, "rotation_euler", 2, 0, math.radians(-100))])
comp.export(col, root, "lighthouse", "tower", made="blender/components/lighthouse/tower.py",
            source="own geometry (a generic tapered masonry light tower); textures: https://polyhaven.com/a/whitewashed_brick, https://polyhaven.com/a/large_sandstone_blocks_01, https://polyhaven.com/a/green_rough_planks",
            license="ours; textures CC0", credit="Poly Haven (whitewashed_brick, large_sandstone_blocks_01, green_rough_planks)",
            rig={"door": "the door swings 100 degrees outward on its left-hand hinges (tower_door_hinge), showing the dark doorway",
                 "windows": "in the scene: the material tower_window (the stair windows' glass) lit or dark"},
            notes="the gallery deck's top is 18 m up, 3.3 m in radius: lighthouse/gallery and lighthouse/lantern-room stand on it at the tower's axis")
