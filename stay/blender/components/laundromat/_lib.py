# laundromat/_lib: the shapes the laundromat's components share, on top of blender/lib/comp.py: a lathe, a plate with a
# round hole (a dryer's front), labels, wadded cloth, a Poly Haven model set down inside a component, and a clip on a
# mesh's shape keys (the sheet's billow), which comp.channel (object transforms only) doesn't write.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import bpy, bmesh
import comp
from comp import T, R, S, xf
from mathutils import Vector, Matrix, noise

PLACE = "laundromat"


def turn(prof, seg=48, axis="Z", at=(0, 0, 0)):
    """A lathe: the profile's (radius, height) points spun about z. axis "F" lays it down with the profile's height
    running toward the front (-y); "X" toward +x. Then moved to `at`."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if axis == "F":
        xf(bm, R(90, "X"))
    elif axis == "X":
        xf(bm, R(90, "Y"))
    xf(bm, T(*at))
    return bm


def holed(w, h, r, seg=64, cx=0.0, cz=0.0):
    """A plate w x h in the xz plane facing -y, centred, with a round hole of radius r at (cx, cz)."""
    bm = bmesh.new()
    inner, outer = [], []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        c, s = math.cos(a), math.sin(a)
        k = 1 / max(abs(c), abs(s))
        inner.append(bm.verts.new((cx + r * c, 0, cz + r * s)))
        outer.append(bm.verts.new((c * k * w / 2, 0, s * k * h / 2)))
    for i in range(seg):
        j = (i + 1) % seg
        bm.faces.new((inner[i], inner[j], outer[j], outer[i]))
    bm.normal_update()
    if bm.faces[:][0].normal.y > 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return bm


def disc(r, seg=32, at=(0, 0, 0), axis="F"):
    """A flat disc facing the front (-y) ("F") or up ("Z")."""
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, cap_tris=False, segments=seg, radius=r)
    if axis == "F":
        xf(bm, R(90, "X"))
    xf(bm, T(*at))
    return bm


def sphere(r, at=(0, 0, 0), u=24, v=14, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    xf(bm, S(*scale))
    xf(bm, T(*at))
    return bm


def label(body, size, at, yaw=0.0, depth=0.0012, align="CENTER", pitch=0.0):
    """Letters facing the front, their centre at `at` (set a hair proud of the surface they are on)."""
    bm = comp.text(body, size, depth=depth, align=align)
    if pitch:
        xf(bm, R(pitch, "X"))
    if yaw:
        xf(bm, R(yaw, "Z"))
    xf(bm, T(*at))
    return bm


def rbox(size, at=(0, 0, 0), r=0.01, seg=3):
    """A box with every edge rounded (in the mesh, so merged parts keep it)."""
    bm = comp.box(size, at)
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(r, min(size) * 0.45), segments=seg, profile=0.5, affect="EDGES")
    return bm


def wad(seed, size=(0.3, 0.22, 0.14), rough=0.35, detail=3):
    """A wadded garment: a ball crumpled by noise into folds and squashed, centred on the origin."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=detail + 1, radius=0.5)
    off = Vector((rnd.uniform(-50, 50), rnd.uniform(-50, 50), rnd.uniform(-50, 50)))
    for v in bm.verts:
        d = v.co.normalized()
        n = noise.noise(d * 1.6 + off) * 0.55 + noise.noise(d * 4.2 + off) * 0.28 + abs(noise.noise(d * 9.0 + off)) * 0.12
        v.co = d * (0.5 * (1 + rough * n * 2))
    xf(bm, S(*size))
    return bm


def fold(w, d, layers=3, t=0.012, seed=0):
    """A folded towel or shirt: `layers` soft slabs stacked, each a little off the one below."""
    rnd = random.Random(seed)
    out = []
    for i in range(layers):
        b = rbox((w * rnd.uniform(0.96, 1.0), d * rnd.uniform(0.96, 1.0), t), at=(rnd.uniform(-0.004, 0.004), rnd.uniform(-0.004, 0.004), t / 2 + i * t), r=t * 0.45, seg=3)
        out.append(b)
    return comp.merge(*out)


def ph_add(col, root, asset, prefix, at=(0, 0, 0), turn_deg=0.0, scale=1.0, res="1k", parent=None, keep=None):
    """Set a Poly Haven model (CC0) down inside this component: its bottom centre at `at`, turned about z, its parts
    named PREFIX_PART. Returns (parts, credit)."""
    objs = comp.ph_model(asset, res)
    credit, _ = comp.ph_credit(asset)
    bpy.context.view_layer.update()
    meshes = [o for o in objs if o.type == "MESH" and (keep is None or keep(o.name))]
    world = {o: o.matrix_world.copy() for o in meshes}
    for o in objs:
        if o not in meshes:
            bpy.data.objects.remove(o, do_unlink=True)
    rot = Matrix.Rotation(math.radians(turn_deg), 4, "Z") @ Matrix.Scale(scale, 4)
    for o in meshes:
        o.parent = None
        o.matrix_world = rot @ world[o]
    lo, hi = comp.box_of(meshes)
    move = Matrix.Translation(Vector(at) - Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z)))
    parts = {}
    for i, o in enumerate(meshes):
        o.matrix_world = move @ o.matrix_world
        base = o.name.split(".")[0]
        part = base[len(asset):].strip("_") if base.lower().startswith(asset.lower()) else base
        comp.link(col, root, o, name=f"{prefix}_{part}" if part else f"{prefix}_body", parent=parent)
        parts[part or "body"] = o
    bpy.context.view_layer.update()
    return parts, credit


def key_channel(name, obj, keys):
    """A clip NAME on a mesh's shape keys: for each (key, rest, full) its value goes from rest at 0 s to full at 1 s,
    all in one NLA track of the clip's name on the mesh's keys (the glTF export joins it with the object tracks of
    that name)."""
    sk = obj.data.shape_keys
    sk.animation_data_create()
    act = bpy.data.actions.new(f"{name}|{obj.name}|keys")
    sk.animation_data.action = act
    for key, rest, full in keys:
        kb = sk.key_blocks[key]
        kb.value = rest
        kb.keyframe_insert("value", frame=0)
        kb.value = full
        kb.keyframe_insert("value", frame=comp.FPS)
        kb.value = 0.0
    for fc in comp._fcurves(act):
        for k in fc.keyframe_points:
            k.interpolation = "LINEAR"
    tr = sk.animation_data.nla_tracks.new()
    tr.name = name
    st = tr.strips.new(name, 0, act)
    st.name = name
    sk.animation_data.action = None


def maker(col, root):
    return lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)


def wall_mats():
    """The room's finishes, shared by its walls: painted plaster, a wainscot of white tile, a rubber cove base."""
    return dict(
        plaster=comp.ph_texture("laundromat_plaster", "painted_plaster_wall", tile=2.0, res="1k", tint=(0.86, 0.93, 0.88)),
        tile=comp.ph_texture("laundromat_wall_tile", "long_white_tiles", tile=1.27, res="1k"),
        base=comp.mat("laundromat_cove_base", (0.035, 0.035, 0.04), rough=0.6),
        rail=comp.mat("laundromat_rail", (0.55, 0.57, 0.58), rough=0.35, metal=0.6),
        white=comp.mat("laundromat_white", (0.88, 0.88, 0.85), rough=0.5),
        steel=comp.mat("laundromat_steel", (0.62, 0.63, 0.65), rough=0.35, metal=0.7),
        dark=comp.mat("laundromat_dark", (0.03, 0.03, 0.035), rough=0.6),
    )


def wall(M, prefix, L, Hh, mats, thick=0.2, wainscot=1.2):
    """A wall L long and Hh high, its room face at y 0 and its thickness behind it, standing on the floor: plaster, a
    tiled wainscot a little proud of it with a cap rail, and a cove base."""
    w = M(f"{prefix}_plaster", comp.box((L, thick, Hh), at=(0, thick / 2, Hh / 2)), mats["plaster"])
    comp.uv_box(w, 1.0)
    t = M(f"{prefix}_wainscot", comp.box((L, 0.012, wainscot - 0.1), at=(0, -0.006, 0.1 + (wainscot - 0.1) / 2)), mats["tile"])
    comp.uv_box(t, 1.0)
    M(f"{prefix}_cap", rbox((L, 0.022, 0.035), at=(0, -0.011, wainscot + 0.0175), r=0.006), mats["rail"])
    b = M(f"{prefix}_cove_base", comp.merge(comp.box((L, 0.008, 0.1), at=(0, -0.016, 0.05)), comp.box((L, 0.02, 0.012), at=(0, -0.022, 0.006))), mats["base"])
    return w


def outlet(at, mats_white, mats_dark):
    """A duplex socket's plate and its two faces, on a wall at `at` (x, z), a hair proud of y 0."""
    x, z = at
    plate = rbox((0.07, 0.006, 0.115), at=(x, -0.015, z), r=0.002)
    faces = comp.merge(*[rbox((0.034, 0.004, 0.03), at=(x, -0.019, z + s * 0.022), r=0.008) for s in (-1, 1)])
    slots = comp.merge(*[comp.box((0.003, 0.002, 0.009), at=(x + sx * 0.007, -0.0215, z + s * 0.022 + 0.003)) for s in (-1, 1) for sx in (-1, 1)])
    return plate, faces, slots


def channel(name, keys):
    """comp.channel, but with one action (and one NLA track) an object: comp.channel makes a track a key, and of
    several same-named tracks on one object the glTF export keeps one, so an object keyed on two axes loses one."""
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


def rod(a, b, r, seg=8, over=0.0):
    """A straight round bar from a to b."""
    a, b = Vector(a), Vector(b)
    d = b - a
    c = comp.cyl(r, d.length + 2 * over, at=(0, 0, -over), seg=seg)
    xf(c, Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4())
    xf(c, T(*a))
    return c


def path(points, r, seg=8, closed=False):
    """Straight bars joined end to end through the points, a ball at each joint (a bent wire or tube)."""
    pts = list(points) + ([points[0]] if closed else [])
    out = [rod(a, b, r, seg) for a, b in zip(pts[:-1], pts[1:])]
    out += [sphere(r, at=p, u=seg, v=max(4, seg // 2)) for p in (pts[1:] if closed else pts[1:-1])]
    return comp.merge(*out)


def rrect(w, d, r, z=0.0, n=6):
    """The points of a rounded rectangle w x d (in xy) at height z, anticlockwise from above."""
    pts = []
    for cx, cy, a0 in ((w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a), z))
    return pts


def loft(loops, cap_bottom=False, cap_top=False):
    """A skin through closed loops of the same number of points, bottom to top."""
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in loop] for loop in loops]
    n = len(rings[0])
    for a, b in zip(rings[:-1], rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
    if cap_bottom:
        bm.faces.new(list(reversed(rings[0])))
    if cap_top:
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def outline(points, y=0.0):
    """A flat face in the xz plane through (x, z) points (a silhouette: a shirt, a sign)."""
    bm = bmesh.new()
    bm.faces.new([bm.verts.new((x, y, z)) for x, z in points])
    bmesh.ops.triangulate(bm, faces=bm.faces)
    return bm


def glass(name, color=(0.6, 0.7, 0.72), alpha=0.1, rough=0.04, spec=0.2):
    """Clear glass: a thin tint, and its mirror turned down so a lit room doesn't white it out."""
    m = comp.mat(name, color, rough=rough, alpha=alpha)
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = spec
    return m
