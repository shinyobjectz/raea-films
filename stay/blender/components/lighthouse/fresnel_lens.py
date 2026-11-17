# lighthouse/fresnel-lens: a second-order rotating Fresnel lens on its pedestal, modelled by hand: eight flash panels in
# a brass frame, each a bullseye (a domed centre lens and seven refracting rings) with catadioptric prism arcs above and
# below it, concentric with the bullseye, leaning in to a crown; a brass turntable with a gear ring running on chariot
# rollers; a green cast-iron pedestal with the clockwork case, its crank and pinion; and inside, standing still, the
# lamp on its standpipe (the mantle is its own material, lens_lamp). 1.6 m across the frame, 3.5 m to the finial; the
# focal plane is 2.1 m above its floor (the lantern room's). Rig: "turn" carries the whole optic one turn about the
# lamp, clockwise seen from above (eight flashes a turn); the lamp's glow is the scene's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe, ring, sphere
from mathutils import Vector

col, root = comp.fresh("fresnel_lens")
glass = comp.mat("lens_glass", (0.78, 0.95, 0.88), rough=0.04, alpha=0.5)
brass = comp.mat("lens_brass", (0.83, 0.6, 0.24), rough=0.28, metal=1.0)
iron = comp.mat("lens_pedestal", (0.018, 0.07, 0.04), rough=0.45)
steel = comp.mat("lens_steel", (0.55, 0.55, 0.57), rough=0.3, metal=1.0)
lamp_m = comp.mat("lens_lamp", (1.0, 0.9, 0.6), rough=0.4, emit=(1.0, 0.82, 0.45), strength=4000.0)
chim = comp.mat("lens_chimney", (0.9, 0.95, 1.0), rough=0.03, alpha=0.22)
M = _lib.maker(col, root)

ZC = 2.1                       # the focal plane
AP = 0.70                      # the belt's apothem (centre to a panel's face)
T8 = math.tan(math.radians(22.5))
C8 = math.cos(math.radians(22.5))
BELT = 0.40                    # half the belt's height
UP0, UP1, AP_TOP = 0.43, 1.16, 0.34   # the upper prisms: from, to (above the focal plane), the apothem at the top
LO0, LO1, AP_BOT = 0.43, 0.86, 0.56   # the lower prisms


def rod(a, b, r, seg=10):
    a, b = Vector(a), Vector(b)
    bm = comp.cyl(r, (b - a).length, seg=seg)
    xf(bm, (b - a).to_track_quat("Z", "Y").to_matrix())
    xf(bm, T(*a))
    return bm


def clip(bm, co, no):
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=co, plane_no=no, clear_outer=True)


def rings(r0, r1, width, depth, gap, steep_in=True, seg=96):
    """Concentric prism rings about z between two radii: each a sawtooth standing `depth` proud."""
    out, r = [], r0
    while r + width <= r1 + 1e-6:
        if steep_in:
            prof = [(r, 0.0), (r, depth), (r + width, depth * 0.2), (r + width, 0.0), (r, 0.0)]
        else:
            prof = [(r, 0.0), (r + width * 0.25, depth), (r + width, depth * 0.35), (r + width, 0.0), (r, 0.0)]
        out.append(lathe(prof, seg=seg))
        r += width + gap
    return comp.merge(*out)


# --- one panel, built facing +z about the origin, then stood up facing -y ------------------------------------------------
def panel_parts():
    hw = AP * T8 - 0.022
    # the bullseye: a domed centre and seven refracting rings, clipped to the belt's rectangle
    dome = lathe([(0.0, 0.045)] + [(0.105 * i / 8, 0.045 * (1 - (i / 8) ** 2)) for i in range(1, 9)] + [(0.105, 0.0), (0.0, 0.0)], seg=48)
    bull = comp.merge(dome, rings(0.112, 0.53, 0.05, 0.036, 0.008))
    for co, no in (((hw, 0, 0), (1, 0, 0)), ((-hw, 0, 0), (-1, 0, 0)), ((0, BELT - 0.012, 0), (0, 1, 0)), ((0, -BELT + 0.012, 0), (0, -1, 0))):
        clip(bull, co, no)
    # a thin pane behind the bullseye, so the panel is whole
    pane = comp.box((2 * hw, 2 * BELT - 0.024, 0.006), at=(0, 0, -0.003))
    belt = comp.merge(bull, pane)
    xf(belt, R(90, "X"))
    xf(belt, T(0, -AP, ZC))

    def zone(v0, v1, ap1, r1, up):
        z = rings(0.52, r1, 0.062, 0.05, 0.012, steep_in=False, seg=128)
        s = 1 if up else -1
        hw0, hw1 = AP * T8 - 0.022, ap1 * T8 - 0.018
        clip(z, (0, s * v0, 0), (0, -s, 0))
        clip(z, (0, s * v1, 0), (0, s, 0))
        for sx in (-1, 1):
            d = Vector((sx * (hw1 - hw0), s * (v1 - v0), 0)).normalized()
            n = Vector((d.y * sx * s, -d.x * sx * s, 0))
            if n.x * sx < 0:
                n = -n
            clip(z, (sx * hw0, s * v0, 0), n)
        # lean it in: its face goes back as it leaves the belt
        lean = (AP - ap1) / (v1 - v0)
        for v in z.verts:
            v.co.z -= (abs(v.co.y) - v0) * lean
        xf(z, R(90, "X"))
        xf(z, T(0, -AP, ZC))
        return z

    upper = zone(UP0, UP1, AP_TOP, 1.3, True)
    lower = zone(LO0, LO1, AP_BOT, 1.0, False)
    return belt, upper, lower


turn = comp.pivot(col, root, "fresnel_lens_optic", (0, 0, 0))
panels = []
for k in range(8):
    for part in panel_parts():
        xf(part, R(45 * k, "Z"))
        panels.append(part)
M("fresnel_lens_glass", comp.merge(*panels), glass, parent=turn, smooth=False)

# --- the brass frame ----------------------------------------------------------------------------------------------------
frame = []
for k in range(8):
    a = math.radians(22.5 + 45 * k)
    c, s = math.cos(a), math.sin(a)
    at = lambda ap, z: (ap / C8 * c, ap / C8 * s, z)
    frame.append(rod(at(AP, ZC - BELT - 0.03), at(AP, ZC + BELT + 0.03), 0.02, seg=12))
    frame.append(rod(at(AP, ZC + BELT + 0.03), at(AP_TOP, ZC + UP1 + 0.02), 0.017, seg=12))
    frame.append(rod(at(AP, ZC - BELT - 0.03), at(AP_BOT, ZC - LO1 - 0.02), 0.017, seg=12))
    for z in (ZC - BELT - 0.03, ZC + BELT + 0.03):
        frame.append(sphere(0.03, at(AP, z), u=12, v=8))


def oct_ring(ap, z, w=0.03, h=0.03):
    b = lathe([((ap - w / 2) / C8, z - h / 2), ((ap + w / 2) / C8, z - h / 2), ((ap + w / 2) / C8, z + h / 2), ((ap - w / 2) / C8, z + h / 2), ((ap - w / 2) / C8, z - h / 2)], seg=8)
    return xf(b, R(22.5, "Z"))


frame += [oct_ring(AP, ZC + BELT + 0.012, 0.036, 0.03), oct_ring(AP, ZC - BELT - 0.012, 0.036, 0.03),
          oct_ring(AP_TOP, ZC + UP1 + 0.02, 0.04, 0.04), oct_ring(AP_BOT, ZC - LO1 - 0.02, 0.05, 0.04)]
# the crown: a low eight-sided cap, a vent tube and a ball
crown = xf(lathe([(AP_TOP / C8 + 0.02, ZC + UP1 + 0.04), (0.2, ZC + UP1 + 0.2), (0.07, ZC + UP1 + 0.26), (0.0, ZC + UP1 + 0.26)], seg=8), R(22.5, "Z"))
frame += [crown, comp.cyl(0.05, 0.12, at=(0, 0, ZC + UP1 + 0.25), seg=20), sphere(0.045, (0, 0, ZC + UP1 + 0.4), u=16, v=10),
          lathe([(0.05, ZC + UP1 + 0.365), (0.085, ZC + UP1 + 0.372), (0.05, ZC + UP1 + 0.38)], seg=20)]
fr = M("fresnel_lens_frame", comp.merge(*frame), brass, parent=turn, smooth=True)
comp.bevel(fr, 0.002, 1, angle=50)

# the turntable: struts down from the lower ring to a brass table with a gear ring under its rim
TABLE = ZC - LO1 - 0.15            # the table's top
tb = [ring(0.2, 0.8, TABLE - 0.045, TABLE, seg=64), ring(0.16, 0.24, TABLE - 0.1, TABLE + 0.02, seg=32)]
for k in range(8):
    a = math.radians(22.5 + 45 * k)
    c, s = math.cos(a), math.sin(a)
    tb.append(rod((AP_BOT / C8 * c, AP_BOT / C8 * s, ZC - LO1 - 0.02), (0.72 * c, 0.72 * s, TABLE), 0.02, seg=12))
    tb.append(comp.cyl(0.035, 0.012, at=(0.72 * c, 0.72 * s, TABLE), seg=12))
tt = M("fresnel_lens_table", comp.merge(*tb), brass, parent=turn, smooth=True)
comp.bevel(tt, 0.004, 2, angle=50)
teeth = [ring(0.74, 0.8, TABLE - 0.1, TABLE - 0.045, seg=64)]
for k in range(96):
    teeth.append(xf(comp.box((0.03, 0.014, 0.05), at=(0.812, 0, TABLE - 0.073)), R(k * 3.75, "Z")))
M("fresnel_lens_gear", comp.merge(*teeth), steel, parent=turn)

# --- the pedestal (stands still) ------------------------------------------------------------------------------------------
BED = TABLE - 0.145                # the roller bed's top
ped = lathe([(0.0, 0.0), (0.62, 0.0), (0.62, 0.05), (0.5, 0.07), (0.36, 0.16), (0.3, 0.22), (0.27, 0.5), (0.27, BED - 0.42), (0.3, BED - 0.36),
             (0.34, BED - 0.33), (0.3, BED - 0.3), (0.3, BED - 0.22), (0.52, BED - 0.1), (0.84, BED - 0.06), (0.84, BED), (0.0, BED)], seg=56)
p = M("fresnel_lens_pedestal", ped, iron, smooth=True)
comp.bevel(p, 0.004, 2, angle=35)
flutes = [xf(comp.box((0.02, 0.03, BED - 1.0), at=(0.275, 0, 0.5 + (BED - 1.0) / 2)), R(k * 30, "Z")) for k in range(12)]
M("fresnel_lens_flutes", comp.merge(*flutes), iron)
bolts = [xf(comp.cyl(0.022, 0.03, at=(0.55, 0, 0.05), seg=6), R(k * 30 + 15, "Z")) for k in range(12)]
M("fresnel_lens_bolts", comp.merge(*bolts), steel)
rollers = []
for k in range(8):
    a = math.radians(45 * k)
    w = comp.cyl(0.05, 0.04, at=(0, -0.02, 0), seg=20, axis="Y")
    xf(w, R(90, "Z"))  # its axle along the radius
    yoke = comp.merge(comp.box((0.012, 0.07, 0.075), at=(0.03, 0, -0.012)), comp.box((0.012, 0.07, 0.075), at=(-0.03, 0, -0.012)))
    xf(yoke, R(90, "Z"))
    g = comp.merge(w, yoke)
    xf(g, T(0.74, 0, BED + 0.05))
    xf(g, R(45 * k, "Z"))
    rollers.append(g)
M("fresnel_lens_rollers", comp.merge(*rollers), steel, smooth=False)

# the clockwork: a case on the pedestal's side, a door with a brass knob, the winding crank, a shaft up to the pinion
CX = 0.56
case = M("fresnel_lens_clockwork", comp.box((0.46, 0.4, 0.62), at=(CX, 0, 0.62)), iron)
comp.bevel(case, 0.012, 3)
M("fresnel_lens_clock_door", comp.merge(comp.box((0.34, 0.012, 0.46), at=(CX, -0.206, 0.62)), comp.box((0.3, 0.006, 0.42), at=(CX, -0.214, 0.62))), iron)
M("fresnel_lens_clock_feet", comp.merge(*[comp.box((0.05, 0.05, 0.31), at=(CX + sx * 0.19, sy * 0.16, 0.155)) for sx in (-1, 1) for sy in (-1, 1)]), iron)
crank = comp.merge(comp.cyl(0.014, 0.1, at=(CX + 0.23, 0, 0.66), seg=12, axis="X"), rod((CX + 0.32, 0, 0.66), (CX + 0.32, 0, 0.5), 0.011),
                   comp.cyl(0.017, 0.09, at=(CX + 0.32, 0, 0.5), seg=12, axis="X"), sphere(0.02, (CX - 0.1, -0.225, 0.62), u=12, v=8),
                   comp.cyl(0.045, 0.006, at=(CX, -0.215, 0.78), seg=24, axis="Y"))
M("fresnel_lens_crank", crank, brass, smooth=True)
PIN = 0.86
drive = comp.merge(comp.cyl(0.018, TABLE - 0.05 - 0.93, at=(PIN + 0.0, 0, 0.93), seg=12), comp.cyl(0.05, 0.05, at=(PIN + 0.0, 0, TABLE - 0.098), seg=16),
                   rod((CX + 0.1, 0, 0.93), (PIN, 0, 0.93), 0.03), comp.box((0.1, 0.1, 0.03), at=(PIN - 0.02, 0, BED - 0.075)))
M("fresnel_lens_drive", drive, steel, smooth=True)
# the weight's cable, down through the floor
M("fresnel_lens_weight_cable", comp.merge(rod((CX, 0.12, 0.31), (CX, 0.12, 0.0), 0.006, seg=6), comp.cyl(0.04, 0.012, at=(CX, 0.12, 0.0), seg=16)), steel)

# --- the lamp (stands still, inside the turning optic) ---------------------------------------------------------------------
lampstand = comp.merge(comp.cyl(0.035, ZC - 0.16 - BED, at=(0, 0, BED), seg=20), lathe([(0.035, ZC - 0.2), (0.075, ZC - 0.15), (0.075, ZC - 0.11), (0.05, ZC - 0.1), (0.0, ZC - 0.1)], seg=28),
                       ring(0.085, 0.1, ZC - 0.26, ZC - 0.24, seg=28), *[xf(rod((0.04, 0, ZC - 0.32), (0.092, 0, ZC - 0.25), 0.006, seg=6), R(k * 120, "Z")) for k in range(3)])
M("fresnel_lens_lampstand", lampstand, brass, smooth=True)
M("fresnel_lens_lamp", sphere(0.06, (0, 0, ZC + 0.0), u=24, v=16, squash=(1, 1, 1.5)), lamp_m, smooth=True)
M("fresnel_lens_chimney", lathe([(0.07, ZC - 0.11), (0.085, ZC - 0.02), (0.085, ZC + 0.08), (0.05, ZC + 0.2), (0.045, ZC + 0.42)], seg=28), chim, smooth=True)

comp.channel("turn", [(turn, "rotation_euler", 2, 0, -2 * math.pi)])
comp.export(col, root, "lighthouse", "fresnel_lens", made="blender/components/lighthouse/fresnel_lens.py",
            source="own geometry (a generic second-order rotating Fresnel lens with eight bullseye panels, after the published form of such optics)",
            license="ours", credit="",
            rig={"turn": "the whole optic (glass, frame, turntable, gear) one turn about the lamp, clockwise seen from above; the pedestal and the lamp stand still",
                 "lamp": "in the scene: the material lens_lamp's glow (the mantle at the focal plane, 2.1 m up) and a light there"},
            notes="origin: the lantern room's floor under the lamp; the bullseyes' centres are 2.1 m up; eight flashes a turn")
