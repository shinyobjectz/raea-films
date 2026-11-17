# garage/car: a four-door saloon of the early nineties, 4.5 m long, 1.73 m wide, 1.41 m high on a 2.65 m wheelbase,
# modelled by hand (Poly Haven has no car but one under a tarpaulin). Its nose points to -y. The body is one lofted
# shell (cross-sections every few centimetres, the wheel arches cut out of it) in the material car_paint, with the
# glass, the pillars and the underside as their own materials; on it: bumpers, rub strips, shut lines, grille,
# headlamps, tail lamps, indicators, number plates, mirrors, door handles, wipers, an aerial and an exhaust; inside:
# a trimmed tub, dashboard, steering wheel, seats, a rear bench and a parcel shelf; four wheels (a grooved tyre, a
# five-spoke alloy rim with its nuts and valve, a brake disc and a caliper that stays still); and car_beads, about
# 1,400 rain beads sitting on the paint and the glass.
# Rig: "spin" turns the whole car one turn on the spot about the middle of its wheelbase (the cursor's turntable);
# "wheels" rolls all four one whole turn forward (the wheel the montage cuts on); "steer" turns the front wheels 30
# degrees left; "settle" dips the body 3 cm and noses it down 1.2 degrees on its springs (the stop in the bay).
# In the scene: car_paint's colour (dark to candy red), car_headlight's and car_taillight's glow, car_beads shown.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector
import numpy as np

random.seed(63)
col, root = comp.fresh("car")
M = L.maker(col, root)

paint = comp.mat("car_paint", (0.018, 0.022, 0.032), rough=0.32, metal=0.55)
_b = next(n for n in paint.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
for k, v in (("Coat Weight", 1.0), ("Coat Roughness", 0.04)):
    if k in _b.inputs:
        _b.inputs[k].default_value = v
glass = comp.mat("car_glass", (0.02, 0.03, 0.035), rough=0.03, alpha=0.5)
trim = comp.mat("car_trim", (0.012, 0.012, 0.013), rough=0.45)
plastic = comp.mat("car_bumper", (0.035, 0.036, 0.04), rough=0.6)
under = comp.mat("car_underside", (0.01, 0.01, 0.011), rough=0.9)
chrome = comp.mat("car_chrome", (0.9, 0.9, 0.92), rough=0.07, metal=1.0)
rubber = comp.mat("car_tyre", (0.012, 0.012, 0.013), rough=0.82)
alloy = comp.mat("car_alloy", (0.78, 0.79, 0.8), rough=0.24, metal=1.0)
steel = comp.mat("car_disc", (0.5, 0.5, 0.52), rough=0.35, metal=1.0)
caliper_m = comp.mat("car_caliper", (0.25, 0.03, 0.03), rough=0.5)
head_m = comp.mat("car_headlight", (0.95, 0.95, 0.9), rough=0.08, emit=(1.0, 0.93, 0.78), strength=2.5)
tail_m = comp.mat("car_taillight", (0.45, 0.01, 0.01), rough=0.15, emit=(1.0, 0.04, 0.02), strength=1.6)
amber = comp.mat("car_indicator", (0.9, 0.38, 0.02), rough=0.2)
white = comp.mat("car_plate", (0.85, 0.85, 0.8), rough=0.5)
ink = comp.mat("car_plate_ink", (0.01, 0.01, 0.012), rough=0.6)
cloth = comp.ph_texture("car_seat", "jersey_melange", tile=0.3, tint=(0.2, 0.2, 0.23), grey=True, res="1k")
inner = comp.mat("car_interior", (0.02, 0.02, 0.022), rough=0.7)
beads_m = comp.mat("car_beads", (0.45, 0.5, 0.56), rough=0.02, alpha=0.3)

# --- the shell's lines ------------------------------------------------------------------------------------------
NOSE, TAIL = -2.25, 2.25
COWL, HEADER, RHEADER, DECK = -0.93, -0.21, 0.94, 1.54
AXF, AXR, TRACK, WR = -1.33, 1.32, 0.752, 0.315


def spline(keys, n=16):
    """A value along the car from its keys [(y, v)]: straight between them, the corners rounded."""
    k = [np.array(p, dtype=float) for p in keys]
    pts = [k[0]]
    for i in range(1, len(k) - 1):
        a, b = (k[i - 1] + k[i]) / 2, (k[i] + k[i + 1]) / 2
        for j in range(n + 1):
            t = j / n
            pts.append((1 - t) ** 2 * a + 2 * t * (1 - t) * k[i] + t * t * b)
    pts.append(k[-1])
    ys, vs = np.array([p[0] for p in pts]), np.array([p[1] for p in pts])
    return lambda y: float(np.interp(y, ys, vs))


ZTOP = spline([(-2.25, 0.655), (-2.2, 0.7), (-2.0, 0.765), (-1.0, 0.905), (-0.94, 0.915), (-0.92, 0.925), (-0.24, 1.37), (-0.12, 1.395), (0.3, 1.405),
               (0.85, 1.385), (0.97, 1.36), (1.5, 1.0), (1.54, 0.985), (1.58, 0.98), (2.1, 0.955), (2.22, 0.93), (2.25, 0.895)])
ZBELT = spline([(-2.25, 0.63), (-2.0, 0.74), (-1.0, 0.88), (-0.9, 0.89), (1.5, 0.945), (1.6, 0.95), (2.2, 0.91), (2.25, 0.875)])
WAIST = spline([(-2.25, 0.7), (-2.235, 0.76), (-2.08, 0.83), (-1.7, 0.856), (-0.5, 0.866), (1.0, 0.866), (1.8, 0.85), (2.08, 0.825), (2.235, 0.76), (2.25, 0.7)])
WTOP = spline([(-2.25, 0.6), (-2.0, 0.735), (-1.0, 0.768), (-0.9, 0.765), (-0.22, 0.59), (0.3, 0.58), (0.95, 0.575), (1.52, 0.735), (1.6, 0.748), (2.2, 0.7), (2.25, 0.6)])
CROWN = spline([(-2.25, 0.0), (-2.1, 0.024), (-1.0, 0.03), (0.3, 0.032), (1.6, 0.024), (2.1, 0.022), (2.25, 0.0)])
ZSILL = spline([(-2.25, 0.3), (-2.1, 0.24), (-1.8, 0.2), (1.7, 0.2), (2.1, 0.27), (2.25, 0.33)])
MS = 4          # samples to a corner
NC = 24         # control points round the ring


def ctrl(y):
    """The right half's control points, the roof's middle down to the floor's middle."""
    zt, zb, w, cr, zs = ZTOP(y), ZBELT(y), WAIST(y), CROWN(y), ZSILL(y)
    zb = min(zb, zt - 0.022)
    wb = w - 0.034
    wt = min(WTOP(y), wb - 0.05)
    p2, p4 = np.array((wt, zt)), np.array((wb, zb))
    zw = min(0.6, zb - 0.1)
    return [np.array((0, zt + cr)), np.array((wt * 0.6, zt + cr * 0.8)), p2, p2 + (p4 - p2) * 0.08, p2 + (p4 - p2) * 0.93, p4,
            np.array((w, zb - 0.05)), np.array((w, zw)), np.array((w - 0.012, zs + 0.15)), np.array((w - 0.03, zs + 0.02)),
            np.array((w - 0.065, zs - 0.02)), np.array((w - 0.22, zs - 0.03)), np.array((0, zs - 0.03))]


def ring(y):
    """The whole section at y: NC * MS points (x, z), from the roof's middle down the right side and back up the left."""
    h = ctrl(y)
    c = h + [np.array((-p[0], p[1])) for p in reversed(h[1:-1])]
    out = []
    for i in range(NC):
        a, b = (c[i - 1] + c[i]) / 2, (c[i] + c[(i + 1) % NC]) / 2
        for k in range(MS):
            t = k / MS
            out.append((1 - t) ** 2 * a + 2 * t * (1 - t) * c[i] + t * t * b)
    return out


def half(y):
    r = ring(y)
    return r[: 12 * MS + 1]


def side_x(y, z):
    """The body side's x at height z (the right side)."""
    h = half(y)[2 * MS:]
    zs, xs = [p[1] for p in reversed(h)], [p[0] for p in reversed(h)]
    return float(np.interp(z, zs, xs))


def top_z(y, x):
    """The height of the bonnet, the glass, the roof or the boot lid at (x, y)."""
    h = half(y)[: 2 * MS + 3]
    return float(np.interp(abs(x), [p[0] for p in h], [p[1] for p in h]))


# stations: every 4 cm, finer at the two ends, and one on each line the glass starts or stops at
SIDE_A, SIDE_B, BP0, BP1 = -0.7, 1.06, 0.03, 0.11
ys = set(round(NOSE + i * 0.04, 4) for i in range(int((TAIL - NOSE) / 0.04) + 1))
ys |= {round(NOSE + i * 0.008, 4) for i in range(8)} | {round(TAIL - i * 0.008, 4) for i in range(8)}
ys |= {COWL + 0.03, HEADER - 0.03, RHEADER + 0.03, DECK - 0.04, SIDE_A, SIDE_B, BP0, BP1}
ys = sorted(ys)
ys = [y for i, y in enumerate(ys) if i == 0 or y - ys[i - 1] > 0.004 or y in (SIDE_A, SIDE_B, BP0, BP1)]

bm = bmesh.new()
rings = [[bm.verts.new((p[0], y, p[1])) for p in ring(y)] for y in ys]
NR = NC * MS
PAINT, GLASS, TRIM, UNDER = 0, 1, 2, 3
for s in range(len(ys) - 1):
    ym = (ys[s] + ys[s + 1]) / 2
    for q in range(NR):
        i, k = divmod(q, MS)
        hh = i if i <= 12 else NC - i
        off = (k + 0.5) / MS - 0.5
        u = hh + (off if i <= 12 else -off)
        f = bm.faces.new((rings[s][q], rings[s][(q + 1) % NR], rings[s + 1][(q + 1) % NR], rings[s + 1][q]))
        m = PAINT
        if u > 10.4:
            m = UNDER
        elif u < 1.7 and (COWL + 0.03 < ym < HEADER - 0.03 or RHEADER + 0.03 < ym < DECK - 0.04):
            m = GLASS
        elif 3.0 < u < 4.0 and SIDE_A < ym < SIDE_B:
            m = TRIM if BP0 < ym < BP1 else GLASS
        f.material_index = m
bm.faces.new(list(reversed(rings[0])))
bm.faces.new(rings[-1])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

turn = comp.pivot(col, root, "car_turn", (0, 0, 0))
spring = comp.pivot(col, root, "car_springs", (0, 0, WR), parent=turn)
body = comp.pivot(col, root, "car_body", (0, 0, WR), parent=spring)  # two pivots: one clip keeps one key an object
shell = comp.mesh(col, root, "car_shell", bm, [paint, glass, trim, under], parent=body, smooth=True)

# the wheel arches, cut out with a drum each
cutters = []
for sx in (-1, 1):
    for ay in (AXF, AXR):
        c = comp.cyl(0.372, 0.6, at=(0.5 if sx > 0 else -1.1, ay, WR + 0.005), seg=56, axis="X")
        me = bpy.data.meshes.new("_cut")
        c.to_mesh(me)
        c.free()
        me.materials.append(under)
        o = bpy.data.objects.new("_cut", me)
        bpy.context.scene.collection.objects.link(o)
        cutters.append(o)
        mod = shell.modifiers.new("arch", "BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.object = o
        mod.solver = "EXACT"
        if hasattr(mod, "material_mode"):
            mod.material_mode = "TRANSFER"
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
cut = bpy.data.meshes.new_from_object(shell.evaluated_get(dg))
shell.modifiers.clear()
old = shell.data
shell.data = cut
cut.name = "car_shell"
bpy.data.meshes.remove(old)
for o in cutters:
    me = o.data
    bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.meshes.remove(me)
under_i = next((i for i, m in enumerate(shell.data.materials) if m and m.name == under.name), UNDER)
L.sharp(shell, 38)
B = lambda name, b, m, smooth=False, parent=None: M(name, b, m, parent=parent or body, smooth=smooth)


def smooth_path(pts, n=6):
    k = [Vector(p) for p in pts]
    out = [k[0]]
    for i in range(1, len(k) - 1):
        a, b = (k[i - 1] + k[i]) / 2, (k[i] + k[i + 1]) / 2
        for j in range(n + 1):
            t = j / n
            out.append((1 - t) ** 2 * a + 2 * t * (1 - t) * k[i] + t * t * b)
    out.append(k[-1])
    return out


# --- bumpers, rub strips, sills -----------------------------------------------------------------------------------
def bumper(end, z, name, stand=0.014):
    """A bumper round one end: from behind the arch on one side, round the corner, across, and back."""
    y0 = end * 1.735
    side = [(side_x(y, z) + stand, y, z) for y in np.linspace(y0, end * 2.2, 9)]
    face = end * (2.25 + 0.03)
    right = side + [(0.72, end * 2.262, z), (0.6, face, z), (0.3, face, z)]
    path = smooth_path(right + [(-x, y, zz) for x, y, zz in reversed(right)], 5)
    prof = L.rrect(0.07, 0.16, 0.022, 4)
    o = B(name, L.sweep(path, prof), plastic, smooth=True)
    L.sharp(o, 50)
    return face


FB = bumper(-1, 0.42, "car_bumper_front")
RB = bumper(1, 0.45, "car_bumper_rear")
for sx, n in ((1, "l"), (-1, "r")):
    path = [(sx * (side_x(y, 0.53) + 0.003), y, 0.53) for y in np.linspace(AXF + 0.42, AXR - 0.42, 30)]
    L.sharp(B(f"car_rub_strip_{n}", L.sweep(path, L.rrect(0.016, 0.045, 0.006, 3)), plastic, smooth=True), 50)
    for nm, y0, y1 in (("f", AXF - 0.4, -1.76), ("b", AXR + 0.4, 1.76)):
        path = [(sx * (side_x(y, 0.53) + 0.003), y, 0.53) for y in np.linspace(y0, y1, 4)]
        L.sharp(B(f"car_rub_strip_{n}{nm}", L.sweep(path, L.rrect(0.016, 0.045, 0.006, 3)), plastic, smooth=True), 50)
    # the arch lips
    for nm, ay in (("f", AXF), ("r", AXR)):
        pts = []
        for a in np.linspace(math.radians(-8), math.radians(188), 40):
            y, z = ay + 0.376 * math.cos(a), WR + 0.005 + 0.376 * math.sin(a)
            if z > ZSILL(y) + 0.005:
                pts.append((sx * (side_x(y, z) + 0.001), y, z))
        B(f"car_arch_lip_{n}{nm}", L.sweep(pts, L.rrect(0.012, 0.016, 0.004, 2), up=(sx, 0, 0)), paint, smooth=True)

# --- shut lines: thin dark seams where the doors, the bonnet and the boot lid meet the body -----------------------
seams = []
SEAM = L.rrect(0.005, 0.005, 0.001, 1)
for sx in (1, -1):
    for y, z0 in ((-0.9, 0.215), (0.07, 0.215), (0.985, 0.5)):
        zs = np.linspace(ZBELT(y) - 0.012, z0, 14)
        seams.append(L.sweep([(sx * (side_x(y, z) + 0.0005), y, z) for z in zs], SEAM, up=(0, 1, 0)))
    for y0, y1 in ((-0.9, 0.07), (0.07, 0.985)):   # along the sill
        seams.append(L.sweep([(sx * (side_x(y, 0.235) + 0.0005), y, 0.235) for y in np.linspace(y0, y1, 12)], SEAM))
    q = 2 * MS + 2
    for y0, y1 in ((NOSE + 0.07, COWL - 0.02), (DECK + 0.05, TAIL - 0.06)):
        pts = []
        for y in np.linspace(y0, y1, 40):
            p = ring(y)[q]
            pts.append((sx * p[0], y, p[1] + 0.0005))
        seams.append(L.sweep(pts, SEAM))
for y in (NOSE + 0.07, COWL - 0.02, DECK + 0.05, TAIL - 0.06):
    r = ring(y)
    pts = [(r[q % NR][0], y, r[q % NR][1] + 0.0005) for q in range(-(2 * MS + 2), 2 * MS + 3)]
    seams.append(L.sweep(pts, SEAM))
# the fuel flap
fy, fz = 1.86, 0.74
flap = [(side_x(fy + dy, fz + dz) + 0.0005, fy + dy, fz + dz) for dy, dz in ((-0.07, -0.06), (0.07, -0.06), (0.07, 0.06), (-0.07, 0.06))]
seams.append(L.sweep(flap, SEAM, closed=True, up=(1, 0, 0)))
B("car_seams", comp.merge(*seams), trim)

# --- the nose: grille, headlamps, indicators, plate ---------------------------------------------------------------
Y0 = NOSE
grille = [comp.box((0.56, 0.02, 0.12), at=(0, Y0 - 0.002, 0.575))]
B("car_grille", comp.merge(*grille), trim)
bars = [comp.box((0.54, 0.012, 0.01), at=(0, Y0 - 0.012, 0.535 + i * 0.02)) for i in range(5)] + [comp.box((0.012, 0.012, 0.1), at=(x, Y0 - 0.012, 0.575)) for x in (-0.18, 0, 0.18)]
B("car_grille_bars", comp.merge(*bars), plastic)
frame = L.sweep([(-0.285, Y0 - 0.014, 0.515), (0.285, Y0 - 0.014, 0.515), (0.285, Y0 - 0.014, 0.635), (-0.285, Y0 - 0.014, 0.635)], L.rrect(0.008, 0.008, 0.002, 1), closed=True, up=(0, -1, 0))
B("car_grille_frame", frame, chrome)
for sx, n in ((1, "l"), (-1, "r")):
    lamp = B(f"car_headlamp_{n}", comp.box((0.33, 0.03, 0.115), at=(sx * 0.47, Y0 - 0.004, 0.577)), head_m)
    comp.bevel(lamp, 0.012, 3)
    B(f"car_headlamp_{n}_bezel", L.sweep([(sx * 0.3, Y0 - 0.012, 0.515), (sx * 0.64, Y0 - 0.012, 0.515), (sx * 0.64, Y0 - 0.012, 0.64), (sx * 0.3, Y0 - 0.012, 0.64)], L.rrect(0.007, 0.012, 0.002, 1), closed=True, up=(0, -1, 0)), chrome)
    ribs = [comp.box((0.002, 0.004, 0.1), at=(sx * (0.33 + i * 0.035), Y0 - 0.02, 0.577)) for i in range(9)]
    B(f"car_headlamp_{n}_ribs", comp.merge(*ribs), chrome)
    ind = B(f"car_indicator_f{n}", comp.box((0.16, 0.012, 0.045), at=(sx * 0.5, -(abs(FB) + 0.034), 0.42)), amber)
    comp.bevel(ind, 0.004, 2)
    ti = B(f"car_indicator_r{n}", comp.box((0.1, 0.03, 0.15), at=(sx * 0.62, TAIL - 0.004, 0.78)), amber)
    comp.bevel(ti, 0.01, 2)
    tl = B(f"car_taillamp_{n}", comp.box((0.26, 0.03, 0.15), at=(sx * 0.435, TAIL - 0.004, 0.78)), tail_m)
    comp.bevel(tl, 0.01, 2)
    B(f"car_taillamp_{n}_ribs", comp.merge(*[comp.box((0.36, 0.004, 0.003), at=(sx * 0.485, TAIL + 0.012, 0.72 + i * 0.03)) for i in range(5)]), trim)
B("car_intake", comp.merge(*[comp.box((0.9, 0.012, 0.012), at=(0, Y0 - 0.002, 0.3 + i * 0.022)) for i in range(2)]), trim)
B("car_tail_panel", comp.box((0.58, 0.012, 0.15), at=(0, TAIL + 0.002, 0.78)), trim)
for end, nm, y, z in ((-1, "front", -(abs(FB) + 0.036), 0.42), (1, "rear", TAIL + 0.01, 0.78)):
    pl = B(f"car_plate_{nm}", comp.box((0.5, 0.004, 0.11), at=(0, y, z)), white)
    comp.bevel(pl, 0.0015, 1)
    t = comp.text("STAY 63", 0.075, 0.002)
    if end > 0:
        xf(t, R(180, "Z"))
    xf(t, T(0, y + end * 0.003, z))
    B(f"car_plate_{nm}_text", t, ink)
B("car_exhaust", comp.merge(comp.cyl(0.026, 0.16, at=(-0.45, TAIL - 0.1, 0.24), seg=20, axis="Y"), comp.cyl(0.02, 0.4, at=(-0.45, TAIL - 0.5, 0.24), seg=12, axis="Y")), chrome, smooth=True)
B("car_aerial", comp.merge(comp.cyl(0.012, 0.012, at=(-0.62, 1.8, top_z(1.8, 0.62) - 0.002), seg=12), comp.cyl(0.0025, 0.5, at=(-0.62, 1.8, top_z(1.8, 0.62)), seg=8)), trim)

# --- mirrors, handles, wipers --------------------------------------------------------------------------------------
for sx, n in ((1, "l"), (-1, "r")):
    my, mz = -0.74, ZBELT(-0.74) + 0.075
    mx = side_x(my, ZBELT(my)) + 0.1
    h = B(f"car_mirror_{n}", comp.box((0.2, 0.09, 0.125), at=(sx * mx, my, mz)), trim)
    comp.bevel(h, 0.03, 4)
    B(f"car_mirror_{n}_glass", comp.box((0.16, 0.003, 0.09), at=(sx * mx, my + 0.046, mz)), chrome)
    B(f"car_mirror_{n}_foot", comp.taper((sx * (mx - 0.14), my, mz - 0.01), (sx * (mx - 0.06), my, mz - 0.01), 0.05, 0.06, 0.06, 0.07), trim)
    for dn, hy in (("f", -0.05), ("b", 0.87)):
        hz = 0.8
        hx = side_x(hy, hz)
        B(f"car_handle_{n}{dn}_cup", comp.box((0.006, 0.12, 0.04), at=(sx * (hx - 0.0015), hy, hz)), trim)
        hb = B(f"car_handle_{n}{dn}", comp.box((0.012, 0.1, 0.02), at=(sx * (hx + 0.006), hy, hz + 0.004)), plastic)
        comp.bevel(hb, 0.004, 2)
        B(f"car_lock_{n}{dn}", comp.cyl(0.008, 0.004, at=(sx * (hx - 0.001), hy + 0.085, hz), seg=14, axis="X") if sx > 0 else comp.cyl(0.008, 0.004, at=(sx * (hx + 0.003), hy + 0.085, hz), seg=14, axis="X"), chrome)
wip = []
for px in (0.42, -0.08):
    a, b = (px, COWL + 0.015), (px - 0.5, COWL + 0.09)
    pts = [(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) for t in np.linspace(0, 1, 6)]
    wip.append(L.sweep([(x, y, top_z(y, x) + 0.014) for x, y in pts], L.rrect(0.008, 0.006, 0.002, 1)))
    pts = [(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) for t in np.linspace(0.35, 1.25, 6)]
    wip.append(L.sweep([(x, y + 0.012, top_z(y + 0.012, x) + 0.007) for x, y in pts], L.rrect(0.012, 0.01, 0.003, 1)))
    wip.append(comp.cyl(0.012, 0.016, at=(px, COWL + 0.015, top_z(COWL + 0.015, px)), seg=12))
B("car_wipers", comp.merge(*wip), trim)

# --- inside ----------------------------------------------------------------------------------------------------------
tub = bmesh.new()
trs = []
for y in np.linspace(COWL + 0.02, AXR - 0.4, 24):
    h = half(y)
    pts = [(p[0] - 0.035, max(p[1], ZSILL(y) + 0.06)) for p in h[5 * MS + 2:: 2]]
    pts = pts + [(-x, z) for x, z in reversed(pts[:-1])]
    trs.append([tub.verts.new((x, y, z)) for x, z in pts])
for a, b in zip(trs, trs[1:]):
    for j in range(len(a) - 1):
        tub.faces.new((a[j], a[j + 1], b[j + 1], b[j]))
bmesh.ops.recalc_face_normals(tub, faces=tub.faces)
B("car_tub", tub, inner, smooth=True)
B("car_bulkheads", comp.merge(comp.box((1.6, 0.03, 0.62), at=(0, COWL + 0.01, 0.57)), comp.box((1.02, 0.03, 0.7), at=(0, 1.16, 0.6)), comp.box((1.5, 0.42, 0.02), at=(0, 1.33, 0.93))), inner)
dash = B("car_dashboard", comp.merge(comp.box((1.56, 0.34, 0.2), at=(0, COWL + 0.17, 0.8)), comp.box((0.34, 0.14, 0.09), at=(0.37, COWL + 0.26, 0.93)), comp.box((0.26, 0.5, 0.2), at=(0, -0.3, 0.42))), inner)
comp.bevel(dash, 0.02, 3)
sw = bmesh.new()
bmesh.ops.create_circle(sw, segments=28, radius=0.185)
swp = [v.co.copy() for v in sw.verts]
sw.free()
wheel = comp.merge(L.sweep(swp, L.circle(0.015, 8), closed=True), comp.cyl(0.045, 0.04, at=(0, 0, -0.03), seg=16),
                   *[xf(comp.box((0.17, 0.03, 0.012), at=(0.095, 0, -0.012)), R(a, "Z")) for a in (0, 180, 270)], comp.cyl(0.02, 0.22, at=(0, 0, -0.24), seg=10))
xf(wheel, R(-68, "X"))
xf(wheel, T(0.37, -0.5, 0.95))
B("car_steering_wheel", wheel, trim, smooth=True)
for sx, n in ((1, "l"), (-1, "r")):
    cu = B(f"car_seat_{n}", comp.box((0.5, 0.5, 0.14), at=(sx * 0.37, -0.05, 0.47)), cloth)
    bk = B(f"car_seat_{n}_back", xf(xf(comp.box((0.48, 0.11, 0.62), at=(0, 0, 0.31)), R(-14, "X")), T(sx * 0.37, 0.2, 0.5)), cloth)
    hr = B(f"car_seat_{n}_headrest", xf(xf(comp.box((0.26, 0.09, 0.17), at=(0, 0, 0.74)), R(-14, "X")), T(sx * 0.37, 0.2, 0.5)), cloth)
    for o, w in ((cu, 0.04), (bk, 0.04), (hr, 0.035)):
        comp.bevel(o, w, 4)
        L.sharp(o, 60)
        comp.uv_box(o, 1.0)
bench = B("car_bench", comp.merge(comp.box((1.3, 0.5, 0.14), at=(0, 0.67, 0.47)), xf(xf(comp.box((1.02, 0.11, 0.56), at=(0, 0, 0.28)), R(-18, "X")), T(0, 0.93, 0.5))), cloth)
comp.bevel(bench, 0.04, 4)
L.sharp(bench, 60)
comp.uv_box(bench, 1.0)
B("car_gear_lever", comp.merge(comp.cyl(0.007, 0.16, at=(0, -0.33, 0.52), seg=8), L.lathe([(0, 0), (0.02, 0.008), (0.024, 0.025), (0.018, 0.045), (0, 0.05)], 12, at=(0, -0.33, 0.67))), trim, smooth=True)
B("car_rear_view_mirror", comp.merge(comp.box((0.2, 0.02, 0.055), at=(0, HEADER - 0.02, 1.285)), comp.cyl(0.006, 0.06, at=(0, HEADER - 0.01, 1.3), seg=8)), trim)

# --- the wheels ------------------------------------------------------------------------------------------------------
def tyre_prof():
    p = [(0.19, -0.088), (0.205, -0.097), (0.25, -0.103), (0.29, -0.098), (0.307, -0.086), (0.3145, -0.07)]
    for a in (-0.045, 0.0, 0.045):
        p += [(0.315, a - 0.012), (0.307, a - 0.008), (0.307, a + 0.008), (0.315, a + 0.012)]
    p += [(0.3145, 0.07), (0.307, 0.086), (0.29, 0.098), (0.25, 0.103), (0.205, 0.097), (0.19, 0.088)]
    return p


RIM = [(0.19, -0.089), (0.199, -0.092), (0.199, -0.084), (0.182, -0.074), (0.172, -0.02), (0.172, 0.045), (0.186, 0.078), (0.199, 0.085), (0.199, 0.094), (0.19, 0.096), (0.176, 0.086), (0.168, 0.07)]


def wheel_parts():
    """A wheel about z, its outer face up: (tyre, rim, disc, caliper)."""
    ty = L.lathe(tyre_prof(), 56)
    # the tread's cross cuts, so a turning tyre shows it
    cuts = [xf(xf(comp.box((0.006, 0.004, 0.15), at=(0.3128, 0, 0)), R(12, "X")), R(360 * i / 60, "Z")) for i in range(60)]
    rim = [L.lathe(RIM, 56), L.lathe([(0.0, 0.094), (0.032, 0.092), (0.045, 0.082), (0.05, 0.06), (0.05, 0.03), (0.0, 0.03)], 28)]
    for i in range(5):
        a = math.radians(90 + 72 * i)
        d = Vector((math.cos(a), math.sin(a), 0))
        sp = comp.taper(d * 0.035 + Vector((0, 0, 0.082)), d * 0.185 + Vector((0, 0, 0.072)), 0.062, 0.04, 0.03, 0.02)
        rim.append(sp)
        b = math.radians(90 + 72 * i + 36)
        rim.append(comp.cyl(0.009, 0.014, at=(0.033 * math.cos(b), 0.033 * math.sin(b), 0.088), seg=6))
    rim.append(comp.cyl(0.004, 0.03, at=(0.165, 0, 0.068), seg=8))  # the valve
    disc = comp.merge(comp.cyl(0.135, 0.022, at=(0, 0, 0.0), seg=40), comp.cyl(0.07, 0.05, at=(0, 0, 0.0), seg=24))
    cal = bmesh.new()
    for a in np.linspace(math.radians(20), math.radians(75), 5):
        cal = comp.merge(cal, xf(comp.box((0.05, 0.05, 0.062), at=(0.118, 0, 0.012)), R(math.degrees(a), "Z")))
    return comp.merge(ty, *cuts), comp.merge(*rim), disc, cal


rolls, steers = [], []
for nm, sx, ay in (("fl", 1, AXF), ("fr", -1, AXF), ("rl", 1, AXR), ("rr", -1, AXR)):
    at = (sx * TRACK, ay, WR)
    hubp = comp.pivot(col, root, f"car_wheel_{nm}_steer", at, parent=turn)
    roll = comp.pivot(col, root, f"car_wheel_{nm}", at, parent=hubp)
    place = T(*at) @ R(90 if sx > 0 else -90, "Y")
    ty, rim, disc, cal = wheel_parts()
    L.sharp(M(f"car_wheel_{nm}_tyre", xf(ty, place), rubber, parent=roll, smooth=True), 40)
    L.sharp(M(f"car_wheel_{nm}_rim", xf(rim, place), alloy, parent=roll, smooth=True), 40)
    L.sharp(M(f"car_wheel_{nm}_disc", xf(disc, place), steel, parent=roll, smooth=True), 40)
    M(f"car_wheel_{nm}_caliper", xf(cal, place), caliper_m, parent=hubp)
    # the strut up into the arch and the drive shaft inboard, which stay with the car
    M(f"car_wheel_{nm}_strut", comp.merge(comp.cyl(0.028, 0.38, at=(sx * (TRACK - 0.14), ay, WR), seg=12), comp.cyl(0.025, 0.3, at=(min(sx * (TRACK - 0.12), sx * (TRACK - 0.42)), ay, WR), seg=10, axis="X")), under, parent=turn)
    rolls.append(roll)
    if ay == AXF:
        steers.append(hubp)

# --- the rain beads --------------------------------------------------------------------------------------------------
bpy.context.view_layer.update()
me = shell.data
me.calc_loop_triangles()
tris = [t for t in me.loop_triangles if t.material_index in (PAINT, GLASS) and t.normal.z > -0.2 and t.area > 1e-5]
wts = np.array([t.area * (1.0 if t.normal.z > 0.35 else 0.3) for t in tris])
wts /= wts.sum()
rs = np.random.RandomState(63)
picks = rs.choice(len(tris), size=1400, p=wts)
bb = bmesh.new()
mw = shell.matrix_world
for ti in picks:
    t = tris[ti]
    a, b_, c = (mw @ me.vertices[i].co for i in t.vertices)
    u, v = rs.rand(), rs.rand()
    if u + v > 1:
        u, v = 1 - u, 1 - v
    p = a + (b_ - a) * u + (c - a) * v
    n = (mw.to_3x3() @ t.normal).normalized()
    r = 0.0014 + 0.003 * rs.rand() ** 2
    d = bmesh.new()
    bmesh.ops.create_uvsphere(d, u_segments=6, v_segments=3, radius=r)
    bmesh.ops.bisect_plane(d, geom=d.verts[:] + d.edges[:] + d.faces[:], plane_co=(0, 0, -r * 0.15), plane_no=(0, 0, -1), clear_outer=True)
    sag = 1.25 if abs(n.z) < 0.5 else 1.0
    xf(d, S(1, 1, 0.62))
    rot = Vector((0, 0, 1)).rotation_difference(n).to_matrix().to_4x4()
    xf(d, T(*p) @ rot @ S(1, sag, 1))
    tmp = bpy.data.meshes.new("_b")
    d.to_mesh(tmp)
    d.free()
    bb.from_mesh(tmp)
    bpy.data.meshes.remove(tmp)
B("car_beads", bb, beads_m, smooth=True)

# --- the rig ---------------------------------------------------------------------------------------------------------
comp.channel("spin", [(turn, "rotation_euler", 2, 0, 2 * math.pi)])
comp.channel("wheels", [(r, "rotation_euler", 0, 0, 2 * math.pi) for r in rolls])
comp.channel("steer", [(s, "rotation_euler", 2, 0, math.radians(30)) for s in steers])
comp.channel("settle", [(spring, "location", 2, spring.location.z, spring.location.z - 0.03), (body, "rotation_euler", 0, 0, math.radians(1.2))])
L.look(col, "car", eye=(4.6, -4.2, 1.7), target=(0, 0, 0.6), lens=55)
L.look(col, "car-flank", eye=(6.0, 0.3, 1.0), target=(0, 0, 0.65), lens=60)
L.look(col, "car-turn", eye=(4.6, -4.2, 2.6), target=(0, 0, 0.6), lens=45, frame=8, tag="")
comp.export(col, root, "garage", "car", made="blender/components/garage/car.py",
            source="own geometry (a generic early-nineties four-door saloon); seat cloth: https://polyhaven.com/a/jersey_melange",
            license="ours; texture CC0", credit="Poly Haven (jersey_melange)",
            rig={"spin": "the whole car, one turn on the spot about the middle of its wheelbase (car_turn)",
                 "wheels": "all four wheels roll one whole turn forward on their axles (car_wheel_fl/fr/rl/rr); the calipers stay",
                 "steer": "the front wheels turn 30 degrees to the left",
                 "settle": "the body dips 3 cm and noses down 1.2 degrees on its springs (car_springs, car_body)",
                 "paint": "in the scene: the material car_paint's colour and clearcoat (dark anthracite at rest, candy red directed)",
                 "lights": "in the scene: the glow of car_headlight and car_taillight",
                 "beads": "in the scene: car_beads (the rain beads on the paint and glass) shown or hidden"},
            notes="Nose toward -y (raea +z). Left-hand drive. The doors do not open: the shell is one piece.")
