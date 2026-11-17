# vinyl/_lib: the record shop's shared steps. What every component script here starts from (comp on the path, a
# collection and its mesh-adder), a lathe, rings and fans for records and labels, smooth shading that keeps hard
# edges, and the shop's record sleeves: a 315 mm card square in one of twelve inks with a printed design of our own
# (discs, bands, a diagonal, rings) on its front. No real label, band or artwork is copied.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from comp import T, R, S, xf
from mathutils import Vector, Matrix

PLACE = "vinyl"


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


def shade(o, angle=35):
    """Smooth shading that keeps every edge sharper than `angle` hard."""
    me = o.data
    for p in me.polygons:
        p.use_smooth = True
    if hasattr(me, "set_sharp_from_angle"):
        me.set_sharp_from_angle(angle=math.radians(angle))
    return o


def turn(prof, z0=0.0, seg=48, at=(0.0, 0.0)):
    """A lathe: the (radius, height) profile spun about z through `at`."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z0 + z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.translate(bm, vec=(at[0], at[1], 0), verts=bm.verts)
    return bm


def fan(r0, r1, z, seg=64, index=lambda a: 0, at=(0.0, 0.0)):
    """A flat annulus facing +z from r0 to r1 at height z; each segment's material index from its angle (degrees)."""
    bm = bmesh.new()
    ring = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        c, s = math.cos(a), math.sin(a)
        ring.append((bm.verts.new((at[0] + r0 * c, at[1] + r0 * s, z)), bm.verts.new((at[0] + r1 * c, at[1] + r1 * s, z))))
    for i in range(seg):
        a, b = ring[i], ring[(i + 1) % seg]
        f = bm.faces.new((a[0], a[1], b[1], b[0]))
        f.material_index = index((i + 0.5) * 360 / seg)
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


# --- records ----------------------------------------------------------------------------------------------------

LP_R, LP_T = 0.1508, 0.0025   # a 12-inch LP
SLEEVE, CARD = 0.315, 0.004   # its sleeve

INKS = [(0.74, 0.12, 0.08), (0.9, 0.55, 0.08), (0.92, 0.82, 0.3), (0.1, 0.32, 0.5), (0.05, 0.42, 0.4), (0.82, 0.78, 0.68),
        (0.06, 0.06, 0.07), (0.45, 0.12, 0.3), (0.2, 0.45, 0.2), (0.85, 0.4, 0.45), (0.3, 0.55, 0.75), (0.5, 0.3, 0.16)]


def inks():
    """The sleeves' twelve printed-card materials, in INKS' order (a mesh's material list)."""
    return [comp.mat(f"sleeve_ink_{i + 1}", tuple(v ** 2.2 for v in c), rough=0.62) for i, c in enumerate(INKS)]   # INKS are screen colours


def sleeve(rng, art=True, w=SLEEVE, t=CARD):
    """One sleeve standing on z 0, centred on x, its front face at y -t/2 (toward -y), with a design on the front."""
    base = rng.randrange(len(INKS))
    bm = paint(comp.box((w, t, w), at=(0, 0, w / 2)), base)
    if not art:
        return bm
    others = [i for i in range(len(INKS)) if i != base]
    a, b = rng.sample(others, 2)
    y = -t / 2
    kind = rng.randrange(5)
    parts = [bm]
    if kind == 0:      # a sun: one big disc, one small
        parts.append(paint(comp.cyl(w * rng.uniform(0.26, 0.36), 0.0008, at=(rng.uniform(-0.03, 0.03), y - 0.0008, w * 0.52), seg=40, axis="Y"), a))
        parts.append(paint(comp.cyl(w * 0.1, 0.0016, at=(rng.uniform(-0.08, 0.08), y - 0.0016, w * rng.uniform(0.35, 0.7)), seg=28, axis="Y"), b))
    elif kind == 1:    # bands
        n = rng.randrange(3, 6)
        for k in range(n):
            parts.append(paint(comp.box((w * 0.94, 0.0008, w * 0.5 / n), at=(0, y - 0.0004, w * (0.12 + 0.62 * k / (n - 1)))), a if k % 2 == 0 else b))
    elif kind == 2:    # rings
        for k, rr in enumerate((0.4, 0.3, 0.2, 0.1)):
            parts.append(paint(comp.cyl(w * rr, 0.0008 * (k + 1), at=(0, y - 0.0008 * (k + 1), w * 0.5), seg=40, axis="Y"), (a, b)[k % 2]))
    elif kind == 3:    # a diagonal half and a block
        tri = bmesh.new()
        vs = [tri.verts.new(p) for p in ((-w * 0.47, y - 0.0008, w * 0.03), (w * 0.47, y - 0.0008, w * 0.03), (w * 0.47, y - 0.0008, w * 0.97))]
        tri.faces.new(vs)
        parts.append(paint(tri, a))
        parts.append(paint(comp.box((w * 0.3, 0.0016, w * 0.3), at=(-w * 0.2, y - 0.0008, w * 0.68)), b))
    else:              # a framed photo block with a title strip
        parts.append(paint(comp.box((w * 0.78, 0.0008, w * 0.62), at=(0, y - 0.0004, w * 0.44)), a))
        parts.append(paint(comp.box((w * 0.5, 0.0016, w * 0.34), at=(rng.uniform(-0.03, 0.03), y - 0.0008, w * 0.42)), b))
    parts.append(paint(comp.box((w * rng.uniform(0.3, 0.6), 0.0008, w * 0.035), at=(-w * 0.15, y - 0.0004, w * 0.9)), b))  # the title's bar
    return comp.merge(*parts)


def lp(z=0.0, at=(0.0, 0.0), seg=72, tracks=5):
    """An LP lying flat, its underside at z: a list of (bmesh, material key) for 'groove', 'gap'. The grooves are
    bands between shinier gaps; the label is separate (label())."""
    edges = [LP_R, 0.1462]
    inner, outer = 0.062, 0.1462
    lens = [1.0, 0.8, 1.2, 0.9, 1.1, 0.7, 1.0][:tracks]
    tot = sum(lens)
    r = outer
    bands = [("gap", LP_R, outer)]
    for i, l in enumerate(lens):
        r1 = r - (outer - inner) * l / tot
        bands.append(("groove", r, r1 + (0.0014 if i < tracks - 1 else 0)))
        if i < tracks - 1:
            bands.append(("gap", r1 + 0.0014, r1))
        r = r1
    bands.append(("gap", inner, 0.0036))
    out = {"groove": [], "gap": []}
    for key, ro, ri in bands:
        out[key].append(fan(ri, ro, z + LP_T, seg, at=at))
        under = fan(ri, ro, z, seg, at=at)
        bmesh.ops.reverse_faces(under, faces=under.faces)
        out[key].append(under)
    rim = comp.cyl(LP_R, LP_T, at=(at[0], at[1], z), seg=seg)
    bmesh.ops.delete(rim, geom=[f for f in rim.faces if len(f.verts) > 4], context="FACES")
    out["gap"].append(rim)
    return [(comp.merge(*v), k) for k, v in out.items()]


def vinyl_mats():
    return {"groove": comp.mat("vinyl_groove", (0.012, 0.012, 0.014), rough=0.34),
            "gap": comp.mat("vinyl_gap", (0.008, 0.008, 0.01), rough=0.1)}
