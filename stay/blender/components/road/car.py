# road/car: the car, a mid-90s four-door saloon in dull red, 4.62 m, modelled by hand (Poly Haven has no car that
# isn't under a sheet): a lofted body with wheel arches cut into it and lips on them, six side windows, a windscreen
# and a rear window in rubber, shut lines for four doors, bonnet, boot and fuel flap, door handles, mirrors, a rub
# strip, bumpers with dark inserts and number plates, a slatted grille between twin headlamps, amber indicators,
# tail lamps with reversing lenses, an exhaust, an aerial, two wipers, and four wheels: treaded tyres on five-spoke
# alloys with discs behind them. Its nose is toward -y (raea +z), its origin on the road under its middle.
# Rig: "drive" rolls it 5.94 m forward, its wheels three whole turns (what the tyres cover); "wheels" turns every
# wheel one whole turn in place (the garage's turntable, a wheel spinning in a puddle); "wipers" sweeps both
# blades up the screen and over, 93 degrees; "steer" turns the front wheels 24 degrees to the car's left.
# "lights" and the paint are the scene's: materials car_headlight, car_taillight, car_indicator, car_paint.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, B, CL, CW, FA, RA, WHEEL_R, TRACK, ARCH_R

col, root = comp.fresh("car")
M = _lib.meshers(col, root)
paint = comp.mat("car_paint", (0.125, 0.02, 0.018), rough=0.28)
black = comp.mat("car_black", (0.012, 0.012, 0.013), rough=0.55)
rubber = comp.mat("car_rubber", (0.008, 0.008, 0.008), rough=0.85)
glass = comp.mat("car_glass", (0.012, 0.016, 0.02), rough=0.04)
chrome = comp.mat("car_chrome", (0.8, 0.8, 0.82), rough=0.12, metal=0.85)
alloy = comp.mat("car_alloy", (0.62, 0.63, 0.65), rough=0.3, metal=0.7)
disc_m = comp.mat("car_brake_disc", (0.3, 0.3, 0.31), rough=0.4, metal=0.8)
tyre_m = comp.mat("car_tyre", (0.014, 0.014, 0.015), rough=0.8)
groove = comp.mat("car_tyre_groove", (0.003, 0.003, 0.003), rough=0.95)
head = comp.mat("car_headlight", (0.95, 0.93, 0.85), rough=0.08, emit=(1.0, 0.95, 0.85), strength=3.0)
reflector = comp.mat("car_lamp_reflector", (0.75, 0.75, 0.76), rough=0.15, metal=0.8)
tail = comp.mat("car_taillight", (0.5, 0.02, 0.015), rough=0.15, emit=(1.0, 0.06, 0.03), strength=1.5)
amber = comp.mat("car_indicator", (0.85, 0.35, 0.02), rough=0.15, emit=(1.0, 0.4, 0.03), strength=0.4)
clear = comp.mat("car_reverse_lens", (0.85, 0.85, 0.85), rough=0.15)
plate_m = comp.mat("car_plate", (0.86, 0.87, 0.85), rough=0.4)
plate_ink = comp.mat("car_plate_ink", (0.03, 0.07, 0.2), rough=0.5)
mirror_m = comp.mat("car_mirror_glass", (0.5, 0.55, 0.6), rough=0.03, metal=0.9)

drive = comp.pivot(col, root, "car_drive", (0, 0, 0))
P = lambda name, bm, m, smooth=False, parent=None: M(name, bm, m, parent=parent or drive, smooth=smooth)

# --- the body ---------------------------------------------------------------------------------------------------
body = P("car_body", _lib.car_body(), [paint, black], smooth=True)
cutters = []
for l in (FA, RA):
    for s in (-1, 1):
        c = comp.cyl(ARCH_R, 0.42, seg=48, axis="X")
        xf(c, T(-0.42 if s < 0 else 0, 0, 0))
        xf(c, T(s * 0.5, -l, WHEEL_R + 0.005))
        me = bpy.data.meshes.new("_cut"); c.to_mesh(me); c.free()
        co = bpy.data.objects.new("_cut", me)
        bpy.context.scene.collection.objects.link(co)
        cutters.append(co)
        md = body.modifiers.new(f"arch{len(cutters)}", "BOOLEAN")
        md.operation = "DIFFERENCE"
        md.object = co
        md.solver = "EXACT"
_lib.bake(body)
for c in cutters:
    bpy.data.objects.remove(c, do_unlink=True)
# the arches' insides are black: every face that lies on a cutter
me = body.data
for p in me.polygons:
    p.use_smooth = True
    for l in (FA, RA):
        if all(math.hypot(-me.vertices[v].co.y - l, me.vertices[v].co.z - WHEEL_R - 0.005) <= ARCH_R + 0.002 and abs(me.vertices[v].co.x) < 0.93 for v in p.vertices):
            n = p.normal
            if abs(n.x) > 0.9 or abs(math.hypot(-p.center.y - l, p.center.z - WHEEL_R - 0.005) - ARCH_R) < 0.004:
                p.material_index = 1
                p.use_smooth = False
# flat ends stay flat
for p in me.polygons:
    if abs(p.normal.y) > 0.98 and abs(abs(p.center.y) - CL) < 0.002:
        p.use_smooth = False
# arch lips: a rolled edge round each opening
lips = []
for l in (FA, RA):
    for s in (-1, 1):
        pts = []
        for i in range(33):
            ang = math.radians(-8 + 196 * i / 32)
            ll, zz = l + (ARCH_R + 0.004) * math.cos(ang), WHEEL_R + 0.005 + (ARCH_R + 0.004) * math.sin(ang)
            if zz < _lib.z_bot(ll) + 0.02:
                continue
            pts.append(tuple(B(ll, s * (_lib.side_a(ll, zz) + 0.002), zz)))
        lips.append(comp.tube(pts, 0.011, res=4, sides=2))
P("car_arch_lips", comp.merge(*lips), paint, smooth=True)

# --- glass in its rubber ----------------------------------------------------------------------------------------
lA, lC = _lib.glass_span(True), _lib.glass_span(False)
SIDE_WINDOWS = [("front", lA, -0.03), ("rear", -0.125, -0.80), ("quarter", -0.865, lC)]
gl, tr = [], []
for s in (-1, 1):
    for nm, l0, l1 in SIDE_WINDOWS:
        gl.append(_lib.side_patch(l0, l1, s, 0.004))
        tr.append(_lib.side_patch(l0 + 0.016 * (1 if l0 > l1 else -1), l1 - 0.016 * (1 if l0 > l1 else -1), s, 0.002, margin=0.014))
gl.append(_lib.top_patch(0.275, 0.915, 0.04, 0.005))
tr.append(_lib.top_patch(0.25, 0.94, 0.02, 0.0025))
gl.append(_lib.top_patch(-1.385, -0.83, 0.04, 0.005))
tr.append(_lib.top_patch(-1.41, -0.805, 0.02, 0.0025))
P("car_glass", comp.merge(*gl), glass, smooth=True)
P("car_window_rubber", comp.merge(*tr), rubber, smooth=True)

# --- shut lines, handles, strips --------------------------------------------------------------------------------
lines = []
for s in (-1, 1):
    zt = lambda l: _lib.z_belt(l)
    lines.append(_lib.side_line([(0.975, 0.30 + (zt(0.975) - 0.33) * i / 14) for i in range(15)], s))                 # front door, front
    lines.append(_lib.side_line([(-0.078, 0.215 + (zt(-0.078) + 0.02 - 0.215) * i / 16) for i in range(17)], s))      # between the doors
    lines.append(_lib.side_line([(-0.835, 0.215 + (zt(-0.835) + 0.02 - 0.215) * i / 16) for i in range(17)], s))      # rear door, rear
    lines.append(_lib.side_line([(0.975 - 1.81 * i / 30, 0.218) for i in range(31)], s, width=0.005))                 # the sills
    # bonnet and boot edges along the shoulders
    lines.append(_lib.side_line([(0.99 + 1.2 * i / 24, zt(0.99 + 1.2 * i / 24) - 0.012) for i in range(25)], s, width=0.005))
    lines.append(_lib.side_line([(-1.46 - 0.78 * i / 16, zt(-1.46 - 0.78 * i / 16) - 0.012) for i in range(17)], s, width=0.005))
# the fuel flap, on the car's left rear wing
fl = [(-1.74, 0.70), (-1.60, 0.70), (-1.60, 0.83), (-1.74, 0.83), (-1.74, 0.70)]
for i in range(4):
    (l0, z0), (l1, z1) = fl[i], fl[i + 1]
    lines.append(_lib.side_line([(l0 + (l1 - l0) * k / 4, z0 + (z1 - z0) * k / 4) for k in range(5)], 1, width=0.004))
# bonnet's rear edge and the boot lid's front edge, across the car
for l in (0.985, -1.455):
    b = bmesh.new()
    prev = None
    for i in range(25):
        a = (_lib.car_at(l)[5] - 0.01) * (2 * i / 24 - 1)
        cur = [b.verts.new(B(l + d, a, _lib.top_z(l + d, a) + 0.0012)) for d in (-0.003, 0.003)]
        if prev: b.faces.new((prev[0], prev[1], cur[1], cur[0]))
        prev = cur
    lines.append(b)
P("car_shut_lines", comp.merge(*lines), black)
hs, hr = [], []
for s in (-1, 1):
    for l in (0.07, -0.69):
        z = 0.80
        a = _lib.side_a(l, z)
        hr.append(comp.box((0.012, 0.13, 0.04), at=tuple(B(l, s * (a + 0.001), z))))
        hs.append(comp.box((0.016, 0.105, 0.018), at=tuple(B(l, s * (a + 0.006), z + 0.006))))
    rub = _lib.side_patch(0.99, -0.82, s, 0.007, nl=30, nz=2, zlo=0.495, zhi=0.53)
    hr.append(rub)
ho = P("car_door_handles", comp.merge(*hs), paint)
comp.bevel(ho, 0.004, 2)
P("car_rub_strips", comp.merge(*hr), black, smooth=True)

# --- bumpers ----------------------------------------------------------------------------------------------------
BUMP = [(0.0, 0.345), (0.022, 0.355), (0.036, 0.385), (0.04, 0.44), (0.04, 0.5), (0.034, 0.545), (0.018, 0.57), (0.0, 0.578)]
INS = [(0.03, 0.45), (0.05, 0.455), (0.05, 0.493), (0.03, 0.498)]
fb = P("car_bumper_front", _lib.plan_sweep(_lib.end_path(True, 1.80), BUMP), paint, smooth=True)
rb = P("car_bumper_rear", _lib.plan_sweep(_lib.end_path(False, 1.63), [(o, z + 0.035) for o, z in BUMP]), paint, smooth=True)
P("car_bumper_inserts", comp.merge(_lib.plan_sweep(_lib.end_path(True, 1.80), INS), _lib.plan_sweep(_lib.end_path(False, 1.63), [(o, z + 0.035) for o, z in INS])), black)
# a slot in the front bumper's lower lip for the radiator
P("car_intake", comp.merge(comp.box((0.62, 0.012, 0.03), at=tuple(B(CL + 0.036, 0, 0.392))), *[comp.box((0.012, 0.014, 0.03), at=tuple(B(CL + 0.038, -0.24 + 0.12 * i, 0.392))) for i in range(5)]), black)

# --- the nose: grille, lamps, indicators, plate -----------------------------------------------------------------
NZ = 0.638       # the lamps' middle
gr = [comp.box((0.6, 0.012, 0.095), at=tuple(B(CL + 0.003, 0, NZ)))]
P("car_grille", comp.merge(*gr), black)
P("car_grille_slats", comp.merge(*[comp.box((0.58, 0.012, 0.007), at=tuple(B(CL + 0.011, 0, NZ - 0.036 + 0.018 * i))) for i in range(5)],
                                 comp.box((0.62, 0.014, 0.008), at=tuple(B(CL + 0.01, 0, NZ + 0.05))), comp.box((0.62, 0.014, 0.008), at=tuple(B(CL + 0.01, 0, NZ - 0.05))),
                                 comp.box((0.07, 0.014, 0.05), at=tuple(B(CL + 0.014, 0, NZ)))), chrome)
bez, lens, refl = [], [], []
for s in (-1, 1):
    bez.append(comp.box((0.36, 0.02, 0.112), at=tuple(B(CL + 0.004, s * 0.495, NZ))))
    refl.append(comp.box((0.335, 0.02, 0.09), at=tuple(B(CL + 0.008, s * 0.495, NZ))))
    for k, (da, wd) in enumerate(((-0.085, 0.155), (0.085, 0.155))):
        lens.append(comp.box((wd, 0.02, 0.082), at=tuple(B(CL + 0.014, s * 0.495 + da, NZ))))
bz = P("car_lamp_bezels", comp.merge(*bez), chrome)
comp.bevel(bz, 0.004, 2)
P("car_lamp_reflectors", comp.merge(*refl), reflector)
hl = P("car_headlights", comp.merge(*lens), head)
comp.bevel(hl, 0.006, 3)
ind = [comp.box((0.15, 0.014, 0.04), at=tuple(B(CL + 0.043, s * 0.56, 0.535))) for s in (-1, 1)]
# side repeaters on the front wings
ind += [comp.box((0.01, 0.06, 0.022), at=tuple(B(1.92, s * (_lib.side_a(1.92, 0.62) + 0.003), 0.62))) for s in (-1, 1)]
io = P("car_indicators", comp.merge(*ind), amber)
comp.bevel(io, 0.003, 2)

def plate(l, z, face):
    """A number plate on the nose (face 1) or the tail (-1): a holder, the plate, its letters."""
    y = l + face * 0.0
    P(f"car_plate_holder_{'front' if face > 0 else 'rear'}", comp.box((0.33, 0.008, 0.175), at=tuple(B(y, 0, z))), black)
    P(f"car_plate_{'front' if face > 0 else 'rear'}", comp.box((0.305, 0.004, 0.152), at=tuple(B(y + face * 0.005, 0, z))), plate_m)
    t = comp.text("STA 961", 0.075, 0.0015)
    if face < 0:
        xf(t, R(180, "Z"))
    xf(t, T(*B(y + face * 0.008, 0, z - 0.005)))
    P(f"car_plate_text_{'front' if face > 0 else 'rear'}", t, plate_ink)
plate(CL + 0.05, 0.475, 1)

# --- the tail: lamps, plate, exhaust, aerial --------------------------------------------------------------------
TZ = 0.75
tb, tl, tc = [], [], []
for s in (-1, 1):
    tb.append(comp.box((0.4, 0.016, 0.135), at=tuple(B(-CL - 0.003, s * 0.47, TZ))))
    tl.append(comp.box((0.27, 0.02, 0.118), at=tuple(B(-CL - 0.008, s * 0.525, TZ))))
    tc.append(comp.box((0.1, 0.02, 0.055), at=tuple(B(-CL - 0.008, s * 0.325, TZ - 0.03))))
    tl.append(comp.box((0.1, 0.02, 0.055), at=tuple(B(-CL - 0.008, s * 0.325, TZ + 0.031))))
P("car_tail_bezels", comp.merge(*tb), black)
to = P("car_taillights", comp.merge(*tl), tail)
comp.bevel(to, 0.005, 2)
co = P("car_reverse_lenses", comp.merge(*tc), clear)
comp.bevel(co, 0.005, 2)
P("car_boot_strip", comp.box((0.52, 0.01, 0.02), at=tuple(B(-CL - 0.006, 0, TZ + 0.075))), chrome)
plate(-CL - 0.008, TZ - 0.01, -1)
P("car_exhaust", comp.merge(comp.cyl(0.026, 0.16, at=tuple(B(-CL + 0.09, -0.45, 0.27)), seg=16, axis="Y")), chrome, smooth=True)
P("car_exhaust_bore", comp.cyl(0.021, 0.004, at=tuple(B(-CL - 0.071, -0.45, 0.27)), seg=16, axis="Y"), black)
P("car_aerial", comp.merge(comp.cyl(0.012, 0.02, at=tuple(B(-1.85, 0.66, _lib.top_z(-1.85, 0.66) - 0.004)), seg=10),
                           xf(comp.cyl(0.0022, 0.78, seg=6), T(*B(-1.85, 0.66, _lib.top_z(-1.85, 0.66))))), black)

# --- mirrors ----------------------------------------------------------------------------------------------------
ms, mg = [], []
for s in (-1, 1):
    l, z = 0.80, _lib.z_belt(0.80) + 0.075
    a = _lib.side_a(l, z - 0.04)
    ms.append(comp.box((0.07, 0.05, 0.03), at=tuple(B(l, s * (a + 0.02), z - 0.03))))
    housing = comp.box((0.17, 0.085, 0.105), at=tuple(B(l - 0.015, s * (a + 0.115), z)))
    ms.append(housing)
    mg.append(comp.box((0.15, 0.004, 0.088), at=tuple(B(l - 0.059, s * (a + 0.115), z))))
mo = P("car_mirrors", comp.merge(*ms), paint)
comp.bevel(mo, 0.018, 3)
P("car_mirror_glass", comp.merge(*mg), mirror_m)

# --- wipers -----------------------------------------------------------------------------------------------------
wiper_keys = _lib.wipers(col, root, "car", parent=drive)
P("car_cowl", _lib.top_patch(0.925, 0.975, 0.03, 0.003, nl=2, na=12), black)

# --- wheels -----------------------------------------------------------------------------------------------------
def wheel_parts():
    """One wheel about the x axis, its outer face toward +x, centred on the origin."""
    W2 = 0.0975
    prof = [(0.192, -W2 + 0.012), (0.205, -W2 + 0.002), (0.25, -W2 - 0.006), (0.285, -W2 + 0.0), (0.305, -W2 + 0.014), (0.313, -W2 + 0.03)]
    for gx in (-0.045, 0.0, 0.045):       # three grooves round the tread
        prof += [(0.315, gx - 0.009), (0.308, gx - 0.007), (0.308, gx + 0.007), (0.315, gx + 0.009)]
    prof += [(r, -x) for r, x in reversed(prof[:6])]
    tyre = xf(_lib.turn(prof, seg=56), R(90, "Y"))
    sipes = []
    for i in range(44):
        a = 360 * i / 44
        for x0 in (-0.068, -0.0225, 0.0225, 0.068):
            sipes.append(xf(comp.box((0.03, 0.005, 0.006), at=(x0, 0, 0.3135)), R(a + (4 if x0 > 0 else 0), "X")))
    rim_prof = [(0.185, -0.09), (0.202, -0.094), (0.205, -0.085), (0.19, -0.075), (0.182, 0.06), (0.19, 0.078), (0.206, 0.088), (0.204, 0.096), (0.186, 0.092), (0.176, 0.07), (0.17, 0.05)]
    rim = xf(_lib.turn(rim_prof, seg=56), R(90, "Y"))
    spokes = [comp.cyl(0.068, 0.05, at=(0.03, 0, 0), seg=28, axis="X")]
    for i in range(5):
        sp = comp.taper((0, 0.045, 0.0), (0, 0.184, 0.0), 0.062, 0.04, 0.03, 0.02)
        xf(sp, T(0, 0, 0.012)); xf(sp, R(90, "Y"))        # lay it in the wheel's plane (its length along y, thickness along x)
        xf(sp, T(0.062, 0, 0)); xf(sp, R(72 * i, "X"))
        spokes.append(sp)
    cap = comp.cyl(0.03, 0.012, at=(0.078, 0, 0), seg=20, axis="X")
    nuts = [xf(comp.cyl(0.009, 0.012, at=(0.08, 0, 0.048), seg=6, axis="X"), R(72 * i + 36, "X")) for i in range(5)]
    disc = comp.merge(comp.cyl(0.14, 0.022, at=(-0.005, 0, 0), seg=40, axis="X"), comp.cyl(0.165, 0.004, at=(-0.07, 0, 0), seg=32, axis="X"))
    caliper = comp.box((0.05, 0.11, 0.06), at=(0.0, 0.0, 0.125))
    valve = comp.cyl(0.004, 0.03, at=(0.075, 0, 0.17), seg=6, axis="X")
    return tyre, comp.merge(*sipes), rim, comp.merge(*spokes), comp.merge(cap, *nuts), disc, caliper, valve

wheels, steers = [], []
for nm, l, s in (("fl", FA, 1), ("fr", FA, -1), ("rl", RA, 1), ("rr", RA, -1)):
    c = B(l, s * TRACK, WHEEL_R)
    parent = drive
    if l == FA:
        st = comp.pivot(col, root, f"car_steer_{nm}", c, parent=drive)
        steers.append(st)
        parent = st
    wp = comp.pivot(col, root, f"car_wheel_{nm}", c, parent=parent)
    tyre, sipes, rim, spokes, cap, disc, caliper, valve = wheel_parts()
    place = lambda bm: xf(xf(bm, R(0 if s > 0 else 180, "Z")), T(*c))
    M(f"car_wheel_{nm}_tyre", place(tyre), tyre_m, parent=wp, smooth=True)
    M(f"car_wheel_{nm}_tread", place(sipes), groove, parent=wp)
    M(f"car_wheel_{nm}_rim", place(rim), alloy, parent=wp, smooth=True)
    so = M(f"car_wheel_{nm}_spokes", place(spokes), alloy, parent=wp)
    comp.bevel(so, 0.005, 2)
    M(f"car_wheel_{nm}_cap", place(comp.merge(cap, valve)), chrome, parent=wp)
    M(f"car_wheel_{nm}_disc", place(disc), disc_m, parent=wp, smooth=True)
    M(f"car_brake_{nm}", place(caliper), black, parent=parent)
    wheels.append(wp)

# --- the rig ----------------------------------------------------------------------------------------------------
TURNS = 3
_lib.channel("drive", [(drive, "location", 1, 0.0, -TURNS * 2 * math.pi * WHEEL_R)] + [(w, "rotation_euler", 0, 0.0, TURNS * 2 * math.pi) for w in wheels])
_lib.channel("wheels", [(w, "rotation_euler", 0, 0.0, 2 * math.pi) for w in wheels])
_lib.channel("wipers", wiper_keys)
_lib.channel("steer", [(st, "rotation_euler", 2, 0.0, math.radians(-24)) for st in steers])
_lib.done(col, root, "car", source="own geometry (a generic mid-90s four-door saloon)", license="ours", credit="",
          rig={"drive": "the car rolls 5.94 m forward (toward raea +z) and its wheels turn three whole turns, which is what the tyres cover; loop it with the Model's position stepping 5.94 m, or use `wheels` under a position of your own",
               "wheels": "every wheel one whole turn forward on its axle, in place",
               "wipers": "both blades sweep up the screen and over toward the car's left: the driver's 93 degrees, the passenger's 88, each about its own spindle in the glass's plane",
               "steer": "the front wheels turn 24 degrees to the car's left about their king pins",
               "lights": "in the scene: car_headlight (four lenses), car_taillight, car_indicator are emissive materials; the headlamps are at (x +-0.5, y 0.64, z 2.32) from the origin",
               "paint": "in the scene: car_paint (Refinish)"},
          notes="4.62 x 1.74 x 1.41 m, wheelbase 2.67, tyres 0.63 m. The flank the lens sees is a clean rectangle from the rub strip to the belt, 0.5 to 0.93 m up. The glass is opaque dark: road/windscreen is the view out from inside.")
