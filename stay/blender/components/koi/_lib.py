# koi/_lib: the koi pond's shared steps. What every component script here starts from (comp on the path, a
# collection and its mesh-adder), a lathe, rings, smooth shading that keeps hard edges, screen colours, the pond's
# shoreline (one outline the pond, the ground's hole and the rim stones all follow), weathered stones, bamboo culms,
# and the koi itself: a carp built in eight overlapping body segments on a chain of pivots, so it can curl into a
# turn and wag, in three colour varieties.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from comp import T, R, S, xf
from mathutils import Vector, Matrix, noise

PLACE = "koi"
WATER = -0.07          # the pond's water level below the garden's ground (z 0)


def start(name):
    col, root = comp.fresh(name)

    def M(n, bm, m, parent=None, smooth=False):
        return comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)

    return col, root, M


def done(col, root, name, source, rig=None, license="ours", credit="", notes=None):
    return comp.export(col, root, PLACE, name, made=f"blender/components/{PLACE}/{name}.py", source=source,
                       license=license, credit=credit, rig=rig, notes=notes)


def channel(name, keys):
    """comp.channel, but one action an object: comp.channel makes an action a key, and two keys on one object's
    same property (scale x and scale y, location y and z) then export as rival glTF channels on that node, each
    carrying the whole vector with only its own part moving."""
    by = {}
    for obj, path, index, rest, full in keys:
        by.setdefault(obj, []).append((path, index, rest, full))
    for obj, ks in by.items():
        act = bpy.data.actions.new(f"{name}|{obj.name}")
        obj.animation_data_create()
        obj.animation_data.action = act
        for path, index, rest, full in ks:
            cur = getattr(obj, path)
            cur[index] = rest
            obj.keyframe_insert(path, index=index, frame=0)
            cur[index] = full
            obj.keyframe_insert(path, index=index, frame=comp.FPS)
            cur[index] = rest
        for fc in comp._fcurves(act):
            for k in fc.keyframe_points:
                k.interpolation = "LINEAR"
        tr = obj.animation_data.nla_tracks.new()
        tr.name = name
        st = tr.strips.new(name, 0, act)
        st.name = name
        obj.animation_data.action = None


def srgb(c):
    """A screen colour as the linear one a material takes."""
    return tuple(v ** 2.2 for v in c)


def shade(o, angle=35):
    me = o.data
    for p in me.polygons:
        p.use_smooth = True
    if hasattr(me, "set_sharp_from_angle"):
        me.set_sharp_from_angle(angle=math.radians(angle))
    return o


def turn(prof, z0=0.0, seg=48, at=(0.0, 0.0)):
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z0 + z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.translate(bm, vec=(at[0], at[1], 0), verts=bm.verts)
    return bm


def paint(bm, i):
    for f in bm.faces:
        f.material_index = i
    return bm


def torus(R_, r, seg=32, sides=12, at=(0, 0, 0), axis="Z"):
    bm = bmesh.new()
    vs = [bm.verts.new((R_ + r * math.cos(2 * math.pi * j / sides), 0, r * math.sin(2 * math.pi * j / sides))) for j in range(sides)]
    es = [bm.edges.new((vs[j], vs[(j + 1) % sides])) for j in range(sides)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if axis == "Y":
        xf(bm, R(90, "X"))
    elif axis == "X":
        xf(bm, R(90, "Y"))
    xf(bm, T(*at))
    return bm


def sphere(r, at=(0, 0, 0), u=24, v=14, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    xf(bm, S(*scale))
    xf(bm, T(*at))
    return bm


# --- the pond's shoreline ---------------------------------------------------------------------------------------

def shore(a):
    """The water's edge: its distance from the pond's centre at angle a (radians), before the x stretch."""
    return 1.5 + 0.26 * math.cos(2 * a + 0.6) + 0.15 * math.cos(3 * a - 0.4)


def shore_pt(a, k=1.0, z=0.0):
    r = shore(a) * k
    return Vector((1.3 * r * math.cos(a), r * math.sin(a), z))


def stone(rng, size, at=(0, 0, 0), sub=3, rough=0.22, flat=0.35, yaw=None):
    """A weathered stone: an icosphere pushed about by noise, its underside cut flat, scaled to `size` (x, y, z)
    and stood with its flat underside at `at`."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0)
    off = Vector((rng.uniform(-50, 50), rng.uniform(-50, 50), rng.uniform(-50, 50)))
    for v in bm.verts:
        n = noise.noise(v.co * 1.1 + off) * rough + noise.noise(v.co * 2.6 + off) * rough * 0.4
        v.co *= 1.0 + n
        if v.co.z < -flat:
            v.co.z = -flat
    xf(bm, T(0, 0, flat))
    xf(bm, S(size[0] / 2, size[1] / 2, size[2] / (1 + flat)))
    xf(bm, R(math.degrees(rng.uniform(0, 6.28)) if yaw is None else yaw, "Z"))
    xf(bm, T(*at))
    return bm


def culm(length, r, nodes=0.22, seg=12, taper=1.0):
    """A bamboo culm along +z from the origin: a tube with a raised ring at every node."""
    parts = [comp.cyl(r, length, seg=seg, r2=r * taper)]
    z = nodes * 0.6
    while z < length - 0.02:
        rr = r + (r * taper - r) * z / length
        parts.append(turn([(rr, -0.006), (rr * 1.1, -0.002), (rr * 1.1, 0.002), (rr, 0.006)], z, seg=seg))
        z += nodes
    return comp.merge(*parts)


# --- the koi ----------------------------------------------------------------------------------------------------

def _curve(pts, s):
    for (s0, v0), (s1, v1) in zip(pts, pts[1:]):
        if s <= s1:
            t = (s - s0) / (s1 - s0)
            t = (1 - math.cos(math.pi * t)) / 2
            return v0 + (v1 - v0) * t
    return pts[-1][1]


HW = [(0, 0.01), (0.035, 0.05), (0.12, 0.078), (0.3, 0.09), (0.5, 0.08), (0.75, 0.045), (0.92, 0.022), (1.0, 0.014)]
HH = [(0, 0.012), (0.035, 0.045), (0.12, 0.078), (0.3, 0.1), (0.5, 0.094), (0.75, 0.06), (0.92, 0.036), (1.0, 0.03)]
JOINTS = [0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90]


def koi(name, L, variety, seed, about):
    """Build and export one koi, `L` metres long, its head toward -y, its belly on z 0. variety: 'kohaku' (white
    with red), 'ogon' (gold), 'showa' (black with red and white)."""
    col, root, M = start(name)
    white = comp.mat("koi_white", srgb((0.93, 0.9, 0.84)), rough=0.3)
    red = comp.mat("koi_red", srgb((0.86, 0.22, 0.06)), rough=0.3)
    black = comp.mat("koi_black", srgb((0.07, 0.07, 0.08)), rough=0.3)
    gold = comp.mat("koi_gold", srgb((0.93, 0.62, 0.12)), rough=0.22, metal=0.25)
    fin = comp.mat("koi_fin", srgb((0.95, 0.9, 0.8) if variety != "ogon" else (0.97, 0.8, 0.45)), rough=0.4)
    eye = comp.mat("koi_eye", (0.01, 0.01, 0.01), rough=0.1)
    skin = [white, red, black, gold]
    NA = 28
    ZC = 0.1 * L
    Y = lambda s: -L / 2 + 0.86 * L * s

    def ink(s, phi):
        top = math.sin(phi)
        n = math.sin(7.3 * s + seed) + math.sin(13.1 * s + 2.1 * phi + seed * 1.7) + math.sin(4.7 * phi - 5 * s + seed * 0.6)
        n2 = math.sin(9.1 * s - seed * 2.3) + math.sin(3.0 * phi + 11 * s + seed)
        if variety == "ogon":
            return 0 if top < -0.55 else 3
        if variety == "showa":
            if n2 > 0.75:
                return 2
            return 1 if (top > 0.0 and n > 0.0) else 0
        return 1 if (top > 0.1 and n > 0.15 and s > 0.05) else 0

    def body(stations, shrink_first=False, cap_front=False, cap_back=False):
        bm = bmesh.new()
        rings = []
        for k, s in enumerate(stations):
            hw, hh = _curve(HW, s) * L, _curve(HH, s) * L
            if shrink_first and k == 0:
                hw, hh = hw * 0.9, hh * 0.9
            rings.append([bm.verts.new((hw * math.cos(2 * math.pi * j / NA), Y(s), ZC + hh * math.sin(2 * math.pi * j / NA))) for j in range(NA)])
        for k in range(len(rings) - 1):
            sm = (stations[k] + stations[k + 1]) / 2
            for j in range(NA):
                f = bm.faces.new((rings[k][j], rings[k + 1][j], rings[k + 1][(j + 1) % NA], rings[k][(j + 1) % NA]))
                f.material_index = ink(sm, 2 * math.pi * (j + 0.5) / NA)
        if cap_front:
            f = bm.faces.new(rings[0]); f.material_index = ink(stations[0], 1.57)
        if cap_back:
            f = bm.faces.new(list(reversed(rings[-1]))); f.material_index = ink(stations[-1], 1.57)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return bm

    def lin(a, b, n):
        return [a + (b - a) * i / (n - 1) for i in range(n)]

    def sheet(pts, t=0.0025):
        """A thin fin from an outline (a fan about its first point)."""
        bm = bmesh.new()
        vs = [bm.verts.new(p) for p in pts]
        for i in range(1, len(vs) - 1):
            bm.faces.new((vs[0], vs[i], vs[i + 1]))
        return bm

    head_st = [0, 0.006, 0.015, 0.035, 0.06, 0.075, 0.09, 0.105, 0.12, 0.14, 0.16, 0.18, 0.2, 0.225, 0.25, 0.275, 0.30]
    head = M(f"{name}_head", body(head_st, cap_front=True), skin, smooth=True)
    for sx in (-1, 1):
        s = 0.075
        M(f"{name}_eye_{'lr'[sx < 0]}", sphere(0.011 * L, at=(sx * _curve(HW, s) * L * 0.86, Y(s), ZC + _curve(HH, s) * L * 0.42), u=12, v=8), eye, smooth=True)
        M(f"{name}_barbel_{'lr'[sx < 0]}", comp.tube([(sx * 0.02 * L, Y(0.012), ZC - 0.012 * L), (sx * 0.035 * L, Y(0.02), ZC - 0.03 * L), (sx * 0.04 * L, Y(0.04), ZC - 0.045 * L)], 0.0025 * L, sides=2), fin, smooth=True)
    # the pectoral fins, each on its own pivot at its root
    fins = []
    for sx in (-1, 1):
        s = 0.2
        rootp = Vector((sx * _curve(HW, s) * L * 0.92, Y(s), ZC - _curve(HH, s) * L * 0.45))
        pv = comp.pivot(col, root, f"{name}_fin_{'lr'[sx < 0]}", rootp)
        pts = [rootp]
        for i in range(9):
            a = math.radians(-8 + i * 10)
            rr = L * (0.15 - 0.03 * abs(i - 4) / 4)
            pts.append(rootp + Vector((sx * rr * math.cos(a), rr * math.sin(a), -rr * 0.25 * math.cos(a))))
        M(f"{name}_fin_{'lr'[sx < 0]}_web", sheet(pts), fin, parent=pv, smooth=True)
        fins.append((pv, sx))
    # the body's segments, each overlapping the one before and turning about its own joint
    prev, joints = None, []
    ends = JOINTS + [1.0]
    for k in range(7):
        s0, s1 = ends[k], ends[k + 1]
        pv = comp.pivot(col, root, f"{name}_joint_{k + 1}", (0, Y(s0), ZC), parent=prev)
        st = [s0 - 0.035] + lin(s0, s1, 8)
        M(f"{name}_body_{k + 1}", body(st, shrink_first=True, cap_back=(k == 6)), skin, parent=pv, smooth=True)
        if 0.3 <= s0 < 0.7:          # the dorsal fin's slice
            hgt = lambda s: L * 0.055 * math.sin(math.pi * min(1, max(0, (s - 0.28) / 0.44))) ** 0.6
            ss = lin(s0 - 0.01, s1, 5)
            d = bmesh.new()
            lo = [d.verts.new((0, Y(s), ZC + _curve(HH, s) * L - 0.004 * L)) for s in ss]
            hi = [d.verts.new((0, Y(s) + 0.02 * L, ZC + _curve(HH, s) * L + hgt(s))) for s in ss]
            for i in range(len(ss) - 1):
                d.faces.new((lo[i], lo[i + 1], hi[i + 1], hi[i]))
            M(f"{name}_dorsal_{k + 1}", d, fin, parent=pv, smooth=True)
        if k == 2:                    # the pelvic fins
            for sx in (-1, 1):
                rootp = Vector((sx * _curve(HW, s0) * L * 0.6, Y(s0 + 0.02), ZC - _curve(HH, s0) * L * 0.85))
                pts = [rootp] + [rootp + Vector((sx * L * 0.07 * math.cos(math.radians(20 + i * 14)), L * 0.07 * math.sin(math.radians(20 + i * 14)), -0.02 * L)) for i in range(5)]
                M(f"{name}_pelvic_{'lr'[sx < 0]}", sheet(pts), fin, parent=pv, smooth=True)
        joints.append(pv)
        prev = pv
    tail = comp.pivot(col, root, f"{name}_tail", (0, Y(0.985), ZC), parent=prev)
    y0 = Y(0.985)
    pts = [(0, y0, ZC)] + [(0, y0 + L * yy, ZC + L * zz) for yy, zz in ((0.02, 0.03), (0.09, 0.085), (0.15, 0.125), (0.17, 0.115), (0.145, 0.06), (0.115, 0.01), (0.14, -0.045), (0.16, -0.09), (0.14, -0.1), (0.085, -0.07), (0.02, -0.03))]
    M(f"{name}_tail_web", sheet(pts), fin, parent=tail, smooth=True)

    CURL = [10, 11, 12, 13, 13, 13, 12]
    channel("turn", [(j, "rotation_euler", 2, 0, math.radians(-c)) for j, c in zip(joints, CURL)] + [(tail, "rotation_euler", 2, 0, math.radians(-16))])
    WAG = [1.5, 3, 5, 7, 9, 11, 13]
    channel("swim", [(j, "rotation_euler", 2, math.radians(-w), math.radians(w)) for j, w in zip(joints, WAG)] + [(tail, "rotation_euler", 2, math.radians(-18), math.radians(18))])
    for j in joints + [tail]:
        j.rotation_euler[2] = 0
    channel("fins", [(pv, "rotation_euler", 2, 0, math.radians(-38 * sx)) for pv, sx in fins])
    bpy.context.view_layer.update()
    return done(col, root, name, f"own geometry ({about})",
                rig={"turn": f"the body curls {sum(CURL)} degrees to its left along seven joints from behind the head to the tail, the tail fin trailing 16 more (the koi turning)",
                     "swim": "the tail's wag from full right to full left: every joint through twice its angle, growing toward the tail (play it there and back)",
                     "fins": "both pectoral fins fold 38 degrees back against the body"})
