# turbines/turbine: a 2 MW three-bladed wind turbine, modelled by hand at real size: an 80 m hub height and an 82 m rotor.
# A tubular steel tower in four flanged sections tapering from 4.2 m to 2.4 m, on a concrete foundation with its ring of
# anchor bolts, a door 2.3 m up reached by a steel stair and grating landing with handrails, a lamp and a vent beside it;
# a yaw bearing; a nacelle with side louvres, a roof hatch, a rear cooler, a mast carrying the cup anemometer and wind
# vane, and two aviation lights; a spinner with three root collars; and three blades lofted from a round root through a
# thick aerofoil at the widest chord (3.3 m) to a thin, pre-bent tip, twisted 16 degrees along their length, with two
# red warning bands at each tip. The rotor is upwind, toward the front (-y), its shaft tilted 5 degrees.
# Rig: "spin" turns the rotor one whole turn about its shaft, clockwise seen from the front (the way every turbine on
# the ridge turns); "yaw" swings the nacelle and rotor 90 degrees round the tower top; "pitch" feathers all three
# blades 85 degrees about their own lengths. The aviation lights are their own material (turbine_beacon).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe, ring, sphere
from mathutils import Vector, Matrix

col, root = comp.fresh("turbine")
paint = comp.mat("turbine_paint", (0.74, 0.75, 0.76), rough=0.38)
blade_m = comp.mat("turbine_blade", (0.8, 0.8, 0.8), rough=0.3)
red = comp.mat("turbine_tip_red", (0.55, 0.03, 0.025), rough=0.35)
steel = comp.mat("turbine_steel", (0.42, 0.43, 0.45), rough=0.4, metal=1.0)
dark = comp.mat("turbine_dark", (0.02, 0.02, 0.022), rough=0.6)
conc = comp.ph_texture("turbine_concrete", "concrete_floor_worn_001", tile=3.0, res="1k")
beacon = comp.mat("turbine_beacon", (0.9, 0.05, 0.03), rough=0.3, emit=(1.0, 0.06, 0.03), strength=6000.0)
lamp = comp.mat("turbine_door_lamp", (1.0, 0.95, 0.8), rough=0.3, emit=(1.0, 0.9, 0.7), strength=3000.0)
M = _lib.maker(col, root)

HUB, RTIP = 80.0, 41.0
FOUND = 0.35
TOP = 77.7                      # the tower's top flange (the yaw bearing sits on it)
R0, R1 = 2.1, 1.2
rad = lambda z: R0 + (R1 - R0) * ((z - FOUND) / (TOP - FOUND)) ** 0.92


def joint(name, parent, loc=(0, 0, 0), rot=(0, 0, 0)):
    """An empty in its parent's own frame (no parent inverse), so a nested turn stays about its own axis."""
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "ARROWS"
    e.empty_display_size = 1.0
    col.objects.link(e)
    e.parent = parent
    e.matrix_parent_inverse = Matrix.Identity(4)
    e.location = loc
    e.rotation_euler = rot
    bpy.context.view_layer.update()
    return e


def rod(a, b, r, seg=8):
    a, b = Vector(a), Vector(b)
    bm = comp.cyl(r, (b - a).length, seg=seg)
    xf(bm, (b - a).to_track_quat("Z", "Y").to_matrix())
    return xf(bm, T(*a))


# --- the foundation and the tower ----------------------------------------------------------------------------------------
f = M("turbine_foundation", lathe([(0.0, 0.0), (5.2, 0.0), (5.2, 0.16), (2.75, FOUND), (0.0, FOUND)], seg=64), conc)
comp.uv_box(f, 1.0)
prof = []
seams = [FOUND + (TOP - FOUND) * k / 4 for k in range(1, 4)]
n = 60
for i in range(n + 1):
    z = FOUND + (TOP - FOUND) * i / n
    prof.append((rad(z), z))
for z in seams:
    prof += [(rad(z - 0.09), z - 0.09), (rad(z) + 0.035, z - 0.08), (rad(z) + 0.035, z + 0.08), (rad(z + 0.09), z + 0.09)]
prof.sort(key=lambda p: p[1])
M("turbine_tower", lathe(prof, seg=64), paint, smooth=True)
M("turbine_base_flange", ring(R0 - 0.05, R0 + 0.22, FOUND, FOUND + 0.07, seg=64), steel)
M("turbine_anchor_bolts", comp.merge(*[xf(comp.merge(comp.cyl(0.03, 0.14, at=(R0 + 0.12, 0, FOUND + 0.05), seg=6), comp.cyl(0.045, 0.04, at=(R0 + 0.12, 0, FOUND + 0.07), seg=6)), R(k * 6, "Z")) for k in range(60)]), steel)
M("turbine_top_flange", ring(R1 - 0.05, R1 + 0.1, TOP - 0.12, TOP, seg=48), steel)

# the door, its landing and stair (front), a lamp over it, a vent beside it
DZ = 2.3
yw = lambda z: -rad(z)
frame = comp.merge(comp.box((1.14, 0.3, 2.3), at=(0, yw(DZ + 1.0) + 0.05, DZ + 1.07)))
fo = M("turbine_door_frame", frame, paint)
comp.bevel(fo, 0.05, 3)
leaf = M("turbine_door", comp.box((0.9, 0.04, 2.06), at=(0, yw(DZ + 1.0) - 0.105, DZ + 1.07)), paint)
comp.bevel(leaf, 0.02, 2)
M("turbine_door_fittings", comp.merge(comp.box((0.03, 0.05, 0.22), at=(0.34, yw(DZ + 1.0) - 0.14, DZ + 1.05)), comp.cyl(0.012, 0.14, at=(0.34, yw(DZ + 1.0) - 0.18, DZ + 0.98), seg=8),
                                       *[comp.box((0.05, 0.03, 0.14), at=(-0.44, yw(DZ + 1.0) - 0.12, DZ + z)) for z in (0.35, 1.07, 1.8)],
                                       comp.box((0.5, 0.012, 0.22), at=(0, yw(DZ + 1.0) - 0.128, DZ + 1.75))), steel)
M("turbine_door_sign", comp.box((0.3, 0.008, 0.3), at=(0, yw(DZ + 1.0) - 0.13, DZ + 1.3)), comp.mat("turbine_sign_yellow", (0.9, 0.7, 0.02), rough=0.5))
bolt = bmesh.new()
bv = [bolt.verts.new(p) for p in ((0.03, 0, 0.11), (-0.05, 0, 0.0), (0.0, 0, 0.0), (-0.03, 0, -0.11), (0.05, 0, 0.0), (0.0, 0, 0.0))]
bolt.faces.new(bv[:3]); bolt.faces.new(bv[3:])
xf(bolt, T(0, yw(DZ + 1.0) - 0.136, DZ + 1.3))
M("turbine_door_sign_bolt", bolt, dark)
M("turbine_door_lamp_body", comp.merge(comp.box((0.2, 0.16, 0.08), at=(0, yw(DZ + 2.5) - 0.06, DZ + 2.5))), steel)
M("turbine_door_lamp", comp.box((0.16, 0.12, 0.05), at=(0, yw(DZ + 2.5) - 0.07, DZ + 2.44)), lamp)
vent = comp.merge(comp.box((0.6, 0.08, 0.5), at=(1.25, 0, 0)), *[xf(comp.box((0.54, 0.012, 0.05), at=(1.25, -0.045, -0.2 + i * 0.08)), Matrix.Identity(4)) for i in range(6)])
xf(vent, T(-1.25, 0, 0)); xf(vent, T(0, yw(1.5) + 0.0, 1.5)); xf(vent, R(38, "Z"))
M("turbine_vent", vent, steel)
# the landing and the stair down to the foundation's skirt
LY0, LY1 = yw(DZ) + 0.1, yw(DZ) - 1.2
land = comp.merge(comp.box((1.5, LY0 - LY1, 0.05), at=(0, (LY0 + LY1) / 2, DZ - 0.025)), *[comp.box((1.5, 0.03, 0.02), at=(0, LY1 + 0.05 + i * 0.1, DZ + 0.006)) for i in range(int((LY0 - LY1) / 0.1))])
NS = 11
RISE, GO = (DZ - 0.1) / NS, 0.26
steps = [comp.box((1.0, GO + 0.02, 0.04), at=(0, LY1 - GO * (i + 0.5), DZ - RISE * (i + 1))) for i in range(NS)]
SY = LY1 - GO * NS
strs = [rod((sx * 0.52, LY1, DZ - 0.1), (sx * 0.52, SY, 0.12), 0.05, seg=6) for sx in (-1, 1)]
legs = [comp.box((0.08, 0.08, DZ - 0.05 - 0.2), at=(sx * 0.7, LY1 + 0.06, (DZ - 0.05 + 0.2) / 2)) for sx in (-1, 1)]
M("turbine_stair", comp.merge(land, *steps, *strs, *legs, comp.box((1.3, 0.5, 0.12), at=(0, SY - 0.1, 0.06))), steel)
hr = []
for sx in (-1, 1):
    x = sx * 0.72
    top_pts = [(x, LY0 - 0.15, DZ + 1.05), (x, LY1, DZ + 1.05), (x, SY, 0.12 + 1.05)]
    for a, b in zip(top_pts, top_pts[1:]):
        hr += [rod(a, b, 0.022), rod((a[0], a[1], a[2] - 0.5), (b[0], b[1], b[2] - 0.5), 0.016)]
    for (px, py, pz) in ((x, LY0 - 0.15, DZ), (x, (LY0 + LY1) / 2, DZ), (x, LY1, DZ), (x, (LY1 + SY) / 2, (DZ + 0.12) / 2), (x, SY, 0.12)):
        hr.append(comp.cyl(0.02, 1.05, at=(px, py, pz), seg=8))
M("turbine_handrails", comp.merge(*hr), comp.mat("turbine_rail_yellow", (0.85, 0.62, 0.02), rough=0.45), smooth=True)

# --- the nacelle (turns on the tower top) ----------------------------------------------------------------------------------
yaw = joint("turbine_yaw", root, (0, 0, TOP))
M("turbine_yaw_bearing", comp.merge(comp.cyl(1.45, 0.42, at=(0, 0, TOP), seg=48), ring(1.45, 1.6, TOP + 0.1, TOP + 0.24, seg=48)), steel, parent=yaw, smooth=False)
NL0, NL1, NW, NH = -3.3, 7.6, 3.7, 3.9          # front, rear, width, height
NZ = HUB + 0.05
body = bmesh.new()
bmesh.ops.create_cube(body, size=1.0)
bmesh.ops.subdivide_edges(body, edges=body.edges[:], cuts=5, use_grid_fill=True)
for v in body.verts:
    y = NL0 + (v.co.y + 0.5) * (NL1 - NL0)
    t = (y - NL0) / (NL1 - NL0)
    k = 1.0 - 0.14 * max(0.0, (t - 0.45) / 0.55) ** 1.5 - 0.1 * max(0.0, (0.2 - t) / 0.2) ** 2      # tapers to the rear, tucks in at the nose
    v.co.x = v.co.x * NW * k
    v.co.z = NZ + v.co.z * NH * k + 0.12 * (1 - k) * NH
    v.co.y = y
nb = M("turbine_nacelle", body, paint, parent=yaw, smooth=True)
comp.bevel(nb, 0.55, 5, angle=60)
louvres = []
for sx in (-1, 1):
    for j, y0 in enumerate((0.6, 3.4)):
        louvres.append(comp.box((0.06, 1.9, 1.3), at=(sx * (NW / 2 - 0.05), y0 + 0.95, NZ - 0.3)))
        louvres += [comp.box((0.1, 1.8, 0.03), at=(sx * (NW / 2 + 0.0), y0 + 0.95, NZ - 0.86 + i * 0.125)) for i in range(10)]
M("turbine_louvres", comp.merge(*louvres), steel, parent=yaw)
ZR = NZ + NH / 2                 # the roof
cool = comp.merge(comp.box((2.5, 1.0, 1.5), at=(0, 5.6, ZR + 0.95)), *[comp.box((0.1, 0.1, 0.4), at=(sx * 1.0, 5.6 + sy * 0.35, ZR + 0.1)) for sx in (-1, 1) for sy in (-1, 1)])
co = M("turbine_cooler", cool, paint, parent=yaw)
comp.bevel(co, 0.06, 2)
M("turbine_cooler_fins", comp.merge(*[comp.box((0.02, 1.04, 1.3), at=(-1.1 + i * 0.1, 5.6, ZR + 0.95)) for i in range(23)]), steel, parent=yaw)
M("turbine_roof_hatch", comp.merge(comp.box((1.1, 1.4, 0.06), at=(0, 1.2, ZR - 0.02)), comp.box((0.3, 0.04, 0.05), at=(0, 0.6, ZR + 0.03))), steel, parent=yaw)
rails = []
for sx in (-1, 1):
    x = sx * (NW / 2 - 0.55)
    rails += [rod((x, -1.6, ZR + 0.72), (x, 4.6, ZR + 0.62), 0.025)] + [comp.cyl(0.022, 0.75, at=(x, y, ZR - 0.08), seg=8) for y in (-1.6, 0.0, 1.5, 3.0, 4.6)]
M("turbine_roof_rails", comp.merge(*rails), steel, parent=yaw, smooth=True)
# the met mast: cups and a vane; the aviation lights
MX, MY = 0.9, 3.6
mast = [comp.cyl(0.04, 1.6, at=(MX, MY, ZR - 0.1), seg=10), rod((MX - 0.5, MY, ZR + 1.45), (MX + 0.5, MY, ZR + 1.45), 0.025)]
mast += [comp.cyl(0.02, 0.28, at=(MX + sx * 0.5, MY, ZR + 1.45), seg=8) for sx in (-1, 1)]
cups = []
for k in range(3):
    c = comp.merge(rod((0, 0, 0), (0.16, 0, 0), 0.008, seg=6), sphere(0.05, (0.16, 0.045, 0), u=10, v=6, squash=(1, 1, 1)))
    cups.append(xf(c, R(k * 120, "Z")))
cu = comp.merge(*cups)
xf(cu, T(MX - 0.5, MY, ZR + 1.75))
vane = comp.merge(rod((0, -0.22, 0), (0, 0.25, 0), 0.01, seg=6), comp.box((0.01, 0.2, 0.16), at=(0, 0.26, 0)), sphere(0.03, (0, -0.22, 0), u=8, v=6))
xf(vane, T(MX + 0.5, MY, ZR + 1.75))
M("turbine_met_mast", comp.merge(*mast, cu, vane), steel, parent=yaw, smooth=True)
for i, (bx, by) in enumerate(((-1.0, 2.6), (1.0, 6.9))):
    M(f"turbine_beacon_post_{i + 1}", comp.merge(comp.cyl(0.05, 0.5, at=(bx, by, ZR - 0.25 if i else ZR - 0.1), seg=10), comp.cyl(0.13, 0.08, at=(bx, by, ZR + 0.3), seg=16)), steel, parent=yaw)
    M(f"turbine_beacon_{i + 1}", lathe([(0.11, 0.0), (0.12, 0.12), (0.09, 0.22), (0.0, 0.26)], seg=16, z0=ZR + 0.38, at=(bx, by)), beacon, parent=yaw, smooth=True)

# --- the rotor: a tilted shaft, the hub turning on it, three blades each on its pitch bearing ------------------------------
TILT = math.radians(5)
HUB_Y = -5.2
shaft = joint("turbine_shaft", yaw, (0, HUB_Y, HUB - TOP), (-TILT, 0, 0))
rotor = joint("turbine_rotor", shaft)
W = lambda j: j.matrix_world.copy()
# the spinner, built along the shaft (nose toward -y)
sp = lathe([(0.0, -2.9), (0.5, -2.8), (1.05, -2.45), (1.5, -1.8), (1.78, -0.9), (1.85, 0.0), (1.8, 1.2), (1.72, 1.95), (1.3, 2.0)], seg=48)
xf(sp, R(-90, "X"))                 # the lathe's z to +y
M("turbine_spinner", xf(sp, W(rotor)), paint, parent=rotor, smooth=True)
M("turbine_main_bearing", xf(xf(lathe([(1.3, 1.9), (1.55, 2.0), (1.55, 2.45), (1.3, 2.5)], seg=40), R(-90, "X")), W(shaft)), steel, parent=shaft, smooth=False)


def blade():
    """One blade in its own frame: the span up +z from the hub's centre, the leading edge toward +x, the suction side
    toward +y (downwind)."""
    NST, NPT = 46, 30
    r0 = 1.55
    ss = lambda a, b, x: max(0.0, min(1.0, (x - a) / (b - a))) ** 2 * (3 - 2 * max(0.0, min(1.0, (x - a) / (b - a))))
    bm = bmesh.new()
    loops, mats = [], []
    for i in range(NST + 1):
        s = (i / NST) ** 1.15 if i > 6 else (i / NST) * (6 / NST) ** 0.15
        z = r0 + (RTIP - r0) * s
        w = ss(0.03, 0.2, s)                                                  # how much aerofoil, how much round root
        chord = 1.9 + (3.3 - 1.9) * ss(0.0, 0.2, s) if s < 0.2 else 3.3 - (3.3 - 0.6) * ((s - 0.2) / 0.8) ** 0.85
        if s > 0.965:
            chord *= max(0.12, math.sqrt(max(0.0, 1 - ((s - 0.965) / 0.035) ** 2)))
        thick = 0.42 + (0.17 - 0.42) * ss(0.2, 0.9, s)
        twist = math.radians(16.0 * (1 - s) ** 1.6)
        bend = -1.9 * s * s                                                   # pre-bent upwind
        ring_ = []
        for j in range(NPT):
            ph = 2 * math.pi * j / NPT
            xc = (1 + math.cos(ph)) / 2
            yt = 5 * thick * (0.2969 * math.sqrt(xc) - 0.126 * xc - 0.3516 * xc ** 2 + 0.2843 * xc ** 3 - 0.1015 * xc ** 4)
            cam = 0.035 * 4 * xc * (1 - xc)
            au, av = chord * (0.32 - xc), chord * ((1 if math.sin(ph) >= 0 else -1) * yt + cam)
            cu_, cv = -0.95 * math.cos(ph), 0.95 * math.sin(ph)
            u, v = cu_ + (au - cu_) * w, cv + (av - cv) * w
            x = u * math.cos(twist) + v * math.sin(twist)
            y = -u * math.sin(twist) + v * math.cos(twist)
            ring_.append(bm.verts.new((x, y + bend, z)))
        loops.append(ring_)
        mats.append(1 if (0.80 < s < 0.86 or 0.92 < s < 0.98) else 0)
    for i in range(NST):
        for j in range(NPT):
            fc = bm.faces.new((loops[i][j], loops[i][(j + 1) % NPT], loops[i + 1][(j + 1) % NPT], loops[i + 1][j]))
            fc.material_index = 1 if (mats[i] and mats[i + 1]) else 0
    bm.faces.new(loops[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


pitch = []
for k in range(3):
    arm = joint(f"turbine_blade_arm_{k + 1}", rotor, rot=(0, math.radians(k * 120), 0))
    bl = joint(f"turbine_blade_{k + 1}", arm)
    pitch.append(bl)
    M(f"turbine_blade_{k + 1}_shell", xf(blade(), W(bl)), [blade_m, red], parent=bl, smooth=True)
    collar = comp.merge(comp.cyl(1.0, 0.75, at=(0, 0, 1.25), seg=40), ring(1.0, 1.12, 1.82, 2.0, seg=40),
                        *[xf(comp.cyl(0.03, 0.05, at=(1.06, 0, 2.0), seg=6), R(q * 10, "Z")) for q in range(36)])
    M(f"turbine_blade_{k + 1}_bearing", xf(collar, W(arm)), steel, parent=arm, smooth=False)

comp.channel("spin", [(rotor, "rotation_euler", 1, 0, 2 * math.pi)])
comp.channel("yaw", [(yaw, "rotation_euler", 2, 0, math.radians(90))])
comp.channel("pitch", [(b, "rotation_euler", 2, 0, math.radians(-85)) for b in pitch])
comp.export(col, root, "turbines", "turbine", made="blender/components/turbines/turbine.py",
            source="own geometry (a generic 2 MW upwind three-bladed turbine, 80 m hub, 82 m rotor; blades lofted from NACA-style thickness sections); foundation: https://polyhaven.com/a/concrete_floor_worn_001",
            license="ours; texture CC0", credit="Poly Haven (concrete_floor_worn_001)",
            rig={"spin": "the rotor (hub, spinner, three blades) one whole turn about its tilted shaft, clockwise seen from the front; it loops",
                 "yaw": "the nacelle and rotor swing 90 degrees round the tower top (turbine_yaw)",
                 "pitch": "all three blades feather 85 degrees about their own lengths (turbine_blade_1..3)",
                 "beacon": "in the scene: the material turbine_beacon (the two aviation lights) and turbine_door_lamp"},
            notes="origin: the ground at the tower's axis; the hub's centre is 80 m up and 5.2 m in front of the axis; the rotor's disc is 82 m across, so its lowest tip passes 39 m above the ground")
