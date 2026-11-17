# PLACE/_lib: helpers this place's components share on top of blender/lib/comp.py: a lathe (a profile spun about z),
# a torus, a sphere, a painted image (numpy to a PNG under blender/src/own/PLACE) and a material from it, planar UVs.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import bpy, bmesh, comp
from comp import T, R, S, xf
from mathutils import Vector, Matrix

PLACE = os.path.basename(os.path.dirname(os.path.abspath(__file__)))


def maker(col, root):
    return lambda name, bm, m, parent=None, smooth=True: comp.mesh(col, root, name, bm, m, parent=parent, smooth=smooth)


def lathe(profile, seg=48, at=(0, 0, 0), axis="Z"):
    """Spin a profile of (r, z) points about z. r 0 closes onto the axis."""
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        if r < 1e-7:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            try:
                if len(a) == 1 and len(b) == 1:
                    continue
                if len(a) == 1:
                    bm.faces.new((a[0], b[i], b[j]))
                elif len(b) == 1:
                    bm.faces.new((a[i], a[j], b[0]))
                else:
                    bm.faces.new((a[i], a[j], b[j], b[i]))
            except ValueError:
                pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if axis == "X":
        xf(bm, R(90, "Y"))
    elif axis == "Y":
        xf(bm, R(-90, "X"))
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


def torus(R_, r, seg=48, sides=12, at=(0, 0, 0), axis="Z"):
    prof = [(R_ + r * math.cos(2 * math.pi * i / sides), r * math.sin(2 * math.pi * i / sides)) for i in range(sides + 1)]
    return lathe(prof, seg=seg, at=at, axis=axis)


def sphere(r, at=(0, 0, 0), seg=32, rings=16, scale=(1, 1, 1)):
    bm = bmesh.new()
    bm.loops.layers.uv.new("UVMap")   # create_uvsphere fills UVs only into a layer that is already there
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r, calc_uvs=True)
    xf(bm, S(*scale))
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


def rod(a, b, r, seg=12):
    """A cylinder from point a to point b."""
    a, b = Vector(a), Vector(b)
    d = b - a
    bm = comp.cyl(r, d.length, seg=seg)
    xf(bm, Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4())
    xf(bm, T(*a))
    return bm


def paint(name, w, h, fn):
    """A PNG painted by fn(u, v) -> (h, w, 3 or 4) floats in sRGB 0..1 (u right, v up), kept under blender/src/own."""
    import numpy as np
    path = os.path.join(comp.CACHE, "own", PLACE, name + ".png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    u, v = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h)
    px = np.clip(np.asarray(fn(u, v), dtype=np.float32), 0, 1)
    if px.shape[2] == 3:
        px = np.concatenate([px, np.ones((h, w, 1), np.float32)], axis=2)
    old = bpy.data.images.get(name)
    if old:
        bpy.data.images.remove(old)
    im = bpy.data.images.new(name, w, h, alpha=True)
    im.colorspace_settings.name = "sRGB"
    # pixels are stored as given when saved from a byte image: write the sRGB values straight
    im.pixels.foreach_set(px.ravel())
    im.filepath_raw = path
    im.file_format = "PNG"
    im.save()
    bpy.data.images.remove(im)
    return path


def image_mat(name, path, rough=0.5, metal=0.0, emit=0.0):
    """A material whose colour (and glow, with emit) is the image at path, on the part's own UVs."""
    m = comp.mat(name, (1, 1, 1), rough=rough, metal=metal)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type == "TEX_IMAGE":
            nt.nodes.remove(n)
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(path, check_existing=False)
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if emit:
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = emit
    return m


def uv_planar(o, lo, hi, axes=(0, 1)):
    """UVs 0..1 across the box lo..hi on two world axes (0 x, 1 y, 2 z)."""
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.active
    mw = o.matrix_world
    a, b = axes
    for f in bm.faces:
        for l in f.loops:
            p = mw @ l.vert.co
            l[uv].uv = ((p[a] - lo[0]) / (hi[0] - lo[0]), (p[b] - lo[1]) / (hi[1] - lo[1]))
    bm.to_mesh(me)
    bm.free()


def rbox(size, at=(0, 0, 0), r=0.01, seg=3):
    """A box with every edge rounded (bevelled in the mesh itself, for parts that are merged)."""
    bm = comp.box(size, at)
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=r, segments=seg, profile=0.5, affect="EDGES")
    return bm


def ph_into(col, root, asset, name, at=(0, 0, 0), scale=1.0, turn=0.0, res="1k", parent=None, keep=None):
    """A Poly Haven model set down inside a component: its bottom centre at `at`, turned `turn` degrees about z,
    its meshes named NAME_n and hung from parent. Returns (meshes, credit)."""
    objs = comp.ph_model(asset, res)
    credit, _ = comp.ph_credit(asset)
    meshes = [o for o in objs if o.type == "MESH" and (keep is None or keep(o.name))]
    for o in meshes:
        mw = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = mw
    for o in objs:
        if o not in meshes:
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.context.view_layer.update()
    rot = Matrix.Rotation(math.radians(turn), 4, "Z") @ Matrix.Scale(scale, 4)
    for o in meshes:
        o.matrix_world = rot @ o.matrix_world
    lo, hi = comp.box_of(meshes)
    shift = Vector(at) - Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    for o in meshes:
        o.matrix_world = Matrix.Translation(shift) @ o.matrix_world
    bpy.context.view_layer.update()
    for i, o in enumerate(meshes):
        comp.link(col, root, o, name=f"{name}_{i + 1}" if len(meshes) > 1 else name, parent=parent)
    return meshes, credit


def fillet(points, r, n=5):
    """A polyline with each inside corner rounded to radius r (neon bends, bent tube)."""
    pts = [Vector(p) for p in points]
    out = [pts[0]]
    for a, b, c in zip(pts, pts[1:], pts[2:]):
        u, v = (a - b), (c - b)
        rr = min(r, u.length * 0.45, v.length * 0.45)
        p0, p1 = b + u.normalized() * rr, b + v.normalized() * rr
        for i in range(n + 1):
            t = i / n
            out.append((1 - t) ** 2 * p0 + 2 * t * (1 - t) * b + t * t * p1)
    out.append(pts[-1])
    return out


def pipe(points, r, sides=4, cyclic=False):
    """A round tube straight through the points (no smoothing: round the corners first with fillet)."""
    cu = bpy.data.curves.new("_pipe", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = sides
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, co in zip(sp.points, points):
        p.co = (*co, 1)
    sp.use_cyclic_u = cyclic
    return comp._to_mesh_bm(bpy.data.objects.new("_pipe", cu))


def ph_plain(name, asset, color, res="1k"):
    """A Poly Haven set used for its grain only (normal, roughness), in one plain colour. For sets comp.ph_texture finds
    no colour map in (it reads only "Diffuse"; leather_red_03 and others name theirs coll1/coll2, and come out white
    with the tint dropped). Tile it with the UVs (uv_box(o, TILE)): with no colour texture raea keeps no UV transform."""
    m = comp.ph_texture(name, asset, tile=1.0, res=res)
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    for l in list(b.inputs["Base Color"].links):
        m.node_tree.links.remove(l)
    b.inputs["Base Color"].default_value = (*color, 1)
    return m


# --- the court's basketball (as the gym's) -------------------------------------------------
BALL_R = 0.1195


def ball_mat():
    """Orange pebbled rubber with the eight panels' black seams, painted on the sphere's own (equirect) UVs."""
    import numpy as np
    if bpy.data.materials.get("ball_leather"):
        return bpy.data.materials["ball_leather"]

    def skin(u, v):
        lon, lat = 2 * np.pi * u, np.pi * (v - 0.5)
        x, y, z = np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)
        w = 0.022
        d = np.minimum(np.abs(x), np.abs(z))
        f = x * x - 0.62 * z * z - 0.27
        d = np.minimum(d, np.abs(f) / (np.sqrt((2 * x) ** 2 + (2 * 0.62 * z) ** 2) + 1e-6))
        seam = np.clip((w - d) / (w * 0.35), 0, 1)
        rng = np.random.default_rng(3)
        # pebbles: a jittered dot lattice, denser toward the equator the way an equirect map needs
        peb = (np.sin(lon * 150) * np.sin(lat * 150) > 0.25).astype(np.float32)
        mott = rng.normal(0, 0.012, x.shape)
        base = np.array([0.78, 0.3, 0.07])
        rgb = base[None, None, :] * (1 - 0.16 * peb[..., None]) + mott[..., None]
        rgb *= (0.9 + 0.1 * np.sin(lat * 3 + lon * 2))[..., None]   # hands' wear, uneven
        ink = np.array([0.02, 0.018, 0.016])
        return rgb * (1 - seam[..., None]) + ink[None, None, :] * seam[..., None]

    return image_mat("ball_leather", paint("ball_leather", 2048, 1024, skin), rough=0.62)


def ball_bm(at=(0, 0, 0), turn=(0, 0, 0)):
    bm = sphere(BALL_R, seg=48, rings=24)
    from mathutils import Euler
    xf(bm, Euler(turn).to_matrix().to_4x4())
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


# --- the court's own helpers ------------------------------------------------------------------------------------------
def wet(m, rough=0.3):
    """A texture set's material gone wet: its roughness map dropped for one low roughness (rain on it)."""
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    for l in list(b.inputs["Roughness"].links):
        m.node_tree.links.remove(l)
    b.inputs["Roughness"].default_value = rough
    return m


def kit(asset, res="2k"):
    """A Poly Haven kit's meshes by name, unparented where the kit has them, to copy from with put() and drop with
    kit_done(). Returns (parts, credit)."""
    objs = comp.ph_model(asset, res)
    credit, _ = comp.ph_credit(asset)
    parts = {}
    for o in objs:
        if o.type == "MESH":
            mw = o.matrix_world.copy()
            o.parent = None
            o.matrix_world = mw
            parts[o.name.split(".")[0]] = o
    for o in objs:
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.context.view_layer.update()
    return parts, credit


def put(col, root, src, name, m, parent=None):
    """A copy of a kit part (sharing its mesh), moved by the 4x4 m from where the kit has it."""
    o = src.copy()
    bpy.context.scene.collection.objects.link(o)
    o.matrix_world = m @ src.matrix_world
    bpy.context.view_layer.update()
    return _named(col, root, o, name, parent)


def _named(col, root, o, name, parent):
    comp.link(col, root, o, parent=parent)
    o.name = name
    return o


def kit_done(parts):
    for o in parts.values():
        bpy.data.objects.remove(o, do_unlink=True)


def arc(r, a0, a1, w=0.05, z=0.004, t=0.002, at=(0, 0), n=64):
    """A painted line along an arc (degrees, anticlockwise from +x), w wide, centred `at` on the ground."""
    bm = bmesh.new()
    prev = None
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        c, s = math.cos(a), math.sin(a)
        ring = [bm.verts.new((at[0] + rr * c, at[1] + rr * s, zz)) for rr, zz in ((r - w / 2, z), (r + w / 2, z), (r + w / 2, z + t), (r - w / 2, z + t))]
        if prev:
            for k in range(4):
                bm.faces.new((prev[k], prev[(k + 1) % 4], ring[(k + 1) % 4], ring[k]))
        prev = ring
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def blob(r, seed, n=40, z=0.0, wob=0.35, squash=1.0):
    """A flat irregular patch (a puddle's outline) about the origin, radius about r."""
    import random
    rnd = random.Random(seed)
    ph = [rnd.uniform(0, 6.28) for _ in range(4)]
    am = [rnd.uniform(0.3, 1.0) * wob / (k + 1) for k in range(4)]
    bm = bmesh.new()
    vs = []
    for i in range(n):
        a = 2 * math.pi * i / n
        rr = r * (1 + sum(am[k] * math.sin((k + 2) * a + ph[k]) for k in range(4)))
        vs.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a) * squash, z)))
    bm.faces.new(vs)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def mask(objs):
    """Blended materials on these objects become cut-outs (an alpha mask at 0.5): Solari traces a mask, where a blend
    is drawn after it and neither stops nor passes the traced light properly (the chain-link threw a solid shadow)."""
    for o in objs:
        for m in o.data.materials:
            if m is None or not m.use_nodes:
                continue
            b = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
            if b is None or not b.inputs["Alpha"].links:
                continue
            l = b.inputs["Alpha"].links[0]
            if l.from_node.type == "MATH":
                continue
            src = l.from_socket
            m.node_tree.links.remove(l)
            r = m.node_tree.nodes.new("ShaderNodeMath")
            r.operation = "ROUND"
            m.node_tree.links.new(src, r.inputs[0])
            m.node_tree.links.new(r.outputs[0], b.inputs["Alpha"])
            if hasattr(m, "blend_method"):
                m.blend_method = "CLIP"


def alpha_image_mat(name, path, rough=0.5, emit=0.0):
    """image_mat with the picture's alpha as the material's (a soft-edged glow)."""
    m = image_mat(name, path, rough=rough, emit=emit)
    t = next(n for n in m.node_tree.nodes if n.type == "TEX_IMAGE")
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    m.node_tree.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
    if hasattr(m, "blend_method"):
        m.blend_method = "BLEND"
    return m


def channel(name, keys):
    """comp.channel, but with all of one object's keys in ONE action and one NLA track. comp.channel makes an action
    and a track of the clip's name for every key, and where two keys are on the same object the glTF export animates
    only the first and holds the others at their full value for the whole clip (a roll that turns but doesn't travel,
    a squash that starts already wide)."""
    by = {}
    for obj, path, index, rest, full in keys:
        by.setdefault(obj, []).append((path, index, rest, full))
    for obj, ks in by.items():
        act = bpy.data.actions.new(f"{name}|{obj.name}")
        obj.animation_data_create()
        obj.animation_data.action = act
        for frame, which in ((0, 2), (comp.FPS, 3)):
            for k in ks:
                getattr(obj, k[0])[k[1]] = k[which]
                obj.keyframe_insert(k[0], index=k[1], frame=frame)
        for k in ks:
            getattr(obj, k[0])[k[1]] = k[2]
        for fc in comp._fcurves(act):
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"
        tr = obj.animation_data.nla_tracks.new()
        tr.name = name
        st = tr.strips.new(name, 0, act)
        st.name = name
        obj.animation_data.action = None
