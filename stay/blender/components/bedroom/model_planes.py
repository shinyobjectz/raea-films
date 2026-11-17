# bedroom/model-planes: three plastic-kit model aeroplanes hung from the ceiling on threads, modelled by hand: a
# low-wing propeller fighter in olive with yellow tips (0.26 m span), a red biplane with struts and wires (0.24 m) and
# a silver swept-wing jet (0.22 m), each with its canopy, tailplane, fin, wheels or intakes, on two threads from a
# white ceiling hook. The origin is on the ceiling (z 0) between them; they hang 0.35 to 0.6 m down, 0.5 m apart.
# Rig: "sway" swings each plane on its threads about its hook (8 to 12 degrees, each its own way: the warm air);
# "turn" turns each slowly about its threads (40 to 70 degrees, alternate ways); "props" spins the two propellers.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bpy, bmesh
from comp import T, R, S, xf
from mathutils import Vector
col, root = comp.fresh("model_planes")
M = _lib.maker(col, root)
thread = comp.mat("planes_thread", (0.85, 0.85, 0.82), rough=0.8)
hook_m = comp.mat("planes_hook", (0.9, 0.9, 0.88), rough=0.4)
glass = comp.mat("planes_canopy", (0.35, 0.55, 0.7), rough=0.08)
tyre = comp.mat("planes_tyre", (0.02, 0.02, 0.02), rough=0.7)

def fuselage(prof, seg=16):
    """A lathe along x: (radius, station) pairs, the nose at +x."""
    return xf(_lib.turn(prof, seg=seg), R(90, "Y"))

def wing(span, root_c, tip_c, sweep=0.0, th=0.006, dihedral=0.0, at=(0, 0, 0)):
    """A wing across y, its leading edge toward +x: root chord, tip chord, sweep (the tip's set-back), dihedral degrees."""
    bm = bmesh.new()
    h = span / 2
    lift = math.tan(math.radians(dihedral)) * h
    secs = [(-h, tip_c, -sweep, lift), (0, root_c, 0, 0), (h, tip_c, -sweep, lift)]
    rings = []
    for y, c, sx, lz in secs:
        ring = [bm.verts.new((sx + c * 0.5, y, lz)), bm.verts.new((sx + c * 0.2, y, lz + th / 2)), bm.verts.new((sx - c * 0.5, y, lz + th * 0.1)), bm.verts.new((sx + c * 0.2, y, lz - th / 2))]
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for k in range(4):
            bm.faces.new((a[k], a[(k + 1) % 4], b[(k + 1) % 4], b[k]))
    bm.faces.new(rings[0]); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return xf(bm, T(*at))

def fin(h, root_c, tip_c, sweep, th=0.004, at=(0, 0, 0)):
    return xf(xf(wing(h * 2, root_c, tip_c, sweep, th), R(90, "X")), T(*at))   # half of it hides in the fuselage

def blob(rx, ry, rz, at):
    s = bmesh.new()
    bmesh.ops.create_uvsphere(s, u_segments=14, v_segments=8, radius=1)
    return xf(s, T(*at) @ S(rx, ry, rz))

def hang(name, at, length, yaw, build, span_pts):
    """A hook at `at` on the ceiling, a sway pivot there, a turn pivot under it, the plane `length` down."""
    x, y = at
    M(f"{name}_hook", comp.merge(comp.cyl(0.012, 0.004, at=(x, y, -0.004), seg=16), comp.tube([(x, y, -0.004), (x, y, -0.02), (x + 0.008, y, -0.028), (x, y, -0.034)], 0.0015)), hook_m, smooth=True)
    sway = comp.pivot(col, root, f"{name}_sway", (x, y, -0.03))
    turn = comp.pivot(col, root, f"{name}_turn", (x, y, -0.03), parent=sway)
    X = T(x, y, -length) @ R(yaw, "Z")
    props = build(name, turn, X)
    ths = [comp.cyl(0.0005, 1.0, seg=4) for _ in span_pts]
    out = []
    for th, p in zip(ths, span_pts):
        w = X @ Vector(p)
        top = Vector((x, y, -0.03))
        d = top - w
        xf(th, S(1, 1, d.length)); xf(th, d.to_track_quat("Z", "Y").to_matrix().to_4x4()); xf(th, T(*w))
        out.append(th)
    M(f"{name}_threads", comp.merge(*out), thread, parent=turn)
    return sway, turn, props

def prop_at(name, parent, X, pos, r, colour):
    w = X @ Vector(pos)
    p = comp.pivot(col, root, f"{name}_prop", tuple(w), parent=parent)
    p.rotation_euler = X.to_euler()
    bpy.context.view_layer.update()
    bl = comp.merge(xf(comp.box((0.003, 2 * r, 0.014)), R(18, "Y")), comp.cyl(0.009, 0.016, at=(-0.004, 0, 0), seg=12, r2=0.002, axis="X"))
    xf(bl, T(*pos)); xf(bl, X)
    M(f"{name}_prop_blades", bl, colour, parent=p, smooth=False)
    return p

def fighter(name, parent, X):
    olive = comp.mat("planes_olive", (0.07, 0.11, 0.03), rough=0.5)
    yellow = comp.mat("planes_yellow", (0.92, 0.75, 0.08), rough=0.45)
    f = fuselage([(0.0, -0.12), (0.006, -0.118), (0.011, -0.08), (0.017, -0.02), (0.02, 0.04), (0.02, 0.085), (0.016, 0.1), (0.0, 0.1)])
    body = comp.merge(f, wing(0.26, 0.055, 0.03, 0.006, 0.007, 5, at=(0.035, 0, -0.012)), wing(0.1, 0.03, 0.018, 0.004, 0.004, 0, at=(-0.1, 0, 0.004)), fin(0.04, 0.035, 0.016, 0.014, at=(-0.1, 0, 0.004)))
    M(f"{name}_body", xf(body, X), olive, parent=parent, smooth=False)
    tips = comp.merge(*[comp.box((0.03, 0.012, 0.0085), at=(0.03, s * 0.124, -0.0005)) for s in (-1, 1)], comp.cyl(0.0205, 0.012, at=(0.086, 0, 0), seg=16, axis="X"))
    M(f"{name}_trim", xf(tips, X), yellow, parent=parent)
    M(f"{name}_canopy", xf(blob(0.03, 0.011, 0.012, (0.02, 0, 0.018)), X), glass, parent=parent, smooth=True)
    legs = comp.merge(*[comp.merge(comp.cyl(0.0015, 0.03, at=(0.045, s * 0.045, -0.042), seg=6), comp.cyl(0.011, 0.006, at=(0.045, s * 0.045 - 0.003, -0.044), seg=14, axis="Y")) for s in (-1, 1)])
    M(f"{name}_wheels", xf(legs, X), tyre, parent=parent)
    return [prop_at(name, parent, X, (0.104, 0, 0), 0.042, comp.mat("planes_prop", (0.06, 0.05, 0.04), rough=0.4))]

def biplane(name, parent, X):
    red = comp.mat("planes_red", (0.5, 0.012, 0.008), rough=0.4)
    cream = comp.mat("planes_cream", (0.9, 0.85, 0.7), rough=0.5)
    f = fuselage([(0.0, -0.1), (0.006, -0.098), (0.012, -0.05), (0.018, 0.02), (0.019, 0.06), (0.017, 0.075), (0.0, 0.075)], seg=12)
    body = comp.merge(f, wing(0.1, 0.03, 0.022, 0.002, 0.004, 0, at=(-0.085, 0, 0.004)), fin(0.038, 0.032, 0.02, 0.008, at=(-0.085, 0, 0.004)))
    M(f"{name}_body", xf(body, X), red, parent=parent)
    wings = comp.merge(wing(0.24, 0.045, 0.04, 0, 0.006, 2, at=(0.04, 0, 0.04)), wing(0.21, 0.04, 0.036, 0, 0.006, 2, at=(0.03, 0, -0.016)))
    M(f"{name}_wings", xf(wings, X), cream, parent=parent)
    struts = []
    for s in (-1, 1):
        for x in (0.045, 0.02):
            struts.append(comp.cyl(0.0012, 0.056, at=(x, s * 0.08, -0.014), seg=6))
        struts.append(comp.cyl(0.0012, 0.03, at=(0.04, s * 0.012, 0.014), seg=6))
        struts.append(comp.merge(comp.cyl(0.0014, 0.03, at=(0.04, s * 0.03, -0.046), seg=6), comp.cyl(0.012, 0.005, at=(0.04, s * 0.03 - 0.0025, -0.048), seg=14, axis="Y")))
    M(f"{name}_struts", xf(comp.merge(*struts), X), tyre, parent=parent)
    M(f"{name}_cowl", xf(comp.cyl(0.0195, 0.014, at=(0.066, 0, 0), seg=14, axis="X"), X), comp.mat("planes_cowl", (0.7, 0.7, 0.72), rough=0.25, metal=1.0), parent=parent, smooth=True)
    return [prop_at(name, parent, X, (0.084, 0, 0), 0.045, comp.mat("planes_wood", (0.45, 0.28, 0.12), rough=0.4))]

def jet(name, parent, X):
    silver = comp.mat("planes_silver", (0.78, 0.79, 0.82), rough=0.25, metal=1.0)
    blue = comp.mat("planes_blue", (0.08, 0.2, 0.6), rough=0.4)
    f = fuselage([(0.0, -0.13), (0.011, -0.128), (0.014, -0.11), (0.016, -0.02), (0.016, 0.05), (0.011, 0.1), (0.004, 0.135), (0.0, 0.14)])
    body = comp.merge(f, wing(0.22, 0.085, 0.022, 0.07, 0.006, -2, at=(0.0, 0, -0.003)), wing(0.1, 0.04, 0.016, 0.03, 0.004, 0, at=(-0.105, 0, 0.012)))
    M(f"{name}_body", xf(body, X), silver, parent=parent)
    trim = comp.merge(fin(0.05, 0.05, 0.018, 0.035, at=(-0.1, 0, 0.008)), *[comp.cyl(0.006, 0.05, at=(-0.07, s * 0.111, -0.007), seg=10, axis="X") for s in (-1, 1)])
    M(f"{name}_trim", xf(trim, X), blue, parent=parent)
    M(f"{name}_canopy", xf(blob(0.034, 0.01, 0.011, (0.055, 0, 0.012)), X), glass, parent=parent, smooth=True)
    M(f"{name}_exhaust", xf(comp.cyl(0.0115, 0.006, at=(-0.134, 0, 0), seg=14, axis="X"), X), tyre, parent=parent)
    return []

P = [("model_planes_fighter", (-0.5, 0.05), 0.48, 25, fighter, [(0.035, -0.1, 0.0), (0.035, 0.1, 0.0)], 11, 55),
     ("model_planes_biplane", (0.02, -0.12), 0.36, -140, biplane, [(0.04, -0.09, 0.046), (0.04, 0.09, 0.046)], 8, -70),
     ("model_planes_jet", (0.5, 0.1), 0.6, 160, jet, [(0.03, 0, 0.016), (-0.1, 0, 0.02)], 12, 40)]
sways, turns, props = [], [], []
for i, (name, at, length, yaw, build, pts, sw, tn) in enumerate(P):
    s, t, pr = hang(name, at, length, yaw, build, pts)
    sways.append((s, i % 2, math.radians(sw if i != 1 else -sw)))
    turns.append((t, math.radians(tn)))
    props += pr
comp.channel("sway", [(s, "rotation_euler", ax, 0, a) for s, ax, a in sways])
comp.channel("turn", [(t, "rotation_euler", 2, 0, a) for t, a in turns])
comp.channel("props", [(p, "rotation_euler", 0, p.rotation_euler[0], p.rotation_euler[0] + 2 * math.pi) for p in props])
comp.export(col, root, _lib.PLACE, "model_planes", made="blender/components/bedroom/model_planes.py", source="own geometry (generic kit planes: a fighter, a biplane, a jet)", license="ours", credit="",
            rig={"sway": "each plane swings on its threads about its ceiling hook (11, -8 and 12 degrees, the fighter and jet about x, the biplane about y)",
                 "turn": "each plane turns about its threads (55, -70 and 40 degrees)", "props": "the fighter's and the biplane's propellers one whole turn"},
            notes="origin on the ceiling; hooks at x -0.5, 0.02, 0.5; the planes hang 0.48, 0.36 and 0.6 m down")
