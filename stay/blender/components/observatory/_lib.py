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


# --- the observatory's own helpers --------------------------------------------------------------------------------------
RD, HW = 4.5, 2.6          # the dome's inside radius; the drum wall's height
SW, YB = 0.75, -0.8        # the slit: half its width, and how far past the zenith it runs (toward -y)


def axis_pivot(col, root, name, m, mode="ZYX", parent=None):
    """A pivot whose own axes are turned (the 4x4 m, world): with mode "ZYX" a key on rotation_euler[2] turns its
    children about its own z; with "YZX", a key on [1] about its own y; with "XYZ", [0] about its own x."""
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "ARROWS"
    e.empty_display_size = 0.15
    e.rotation_mode = mode
    col.objects.link(e)
    e.matrix_world = m
    comp.link(col, root, e, parent=parent)
    bpy.context.view_layer.update()
    return e


def uv_round(o, r, tile_u=1.0, sphere=False, centre=(0, 0, 0)):
    """UVs in metres round the z axis: u the arc at radius r, v the height (or, on a dome, the arc up from its foot)."""
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.active
    mw = o.matrix_world
    c = Vector(centre)
    for f in bm.faces:
        fc = mw @ f.calc_center_median() - c
        a0 = math.atan2(fc.y, fc.x)
        for l in f.loops:
            p = mw @ l.vert.co - c
            a = math.atan2(p.y, p.x)
            while a - a0 > math.pi:
                a -= 2 * math.pi
            while a - a0 < -math.pi:
                a += 2 * math.pi
            v = math.atan2(p.z, math.hypot(p.x, p.y)) * r if sphere else p.z
            l[uv].uv = (a * r / tile_u, v / tile_u)
    bm.to_mesh(me)
    bm.free()


def dome_cut(r, keep, cuts_x=(), cuts_y=(), seg=96, rings=48):
    """The upper half of a sphere of radius r, cut along the planes x = each of cuts_x and y = each of cuts_y, keeping
    the faces whose middle passes keep(x, y, z)."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    all_ = lambda: bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=all_(), plane_co=(0, 0, 0), plane_no=(0, 0, 1), clear_inner=True)
    for x in cuts_x:
        bmesh.ops.bisect_plane(bm, geom=all_(), plane_co=(x, 0, 0), plane_no=(1, 0, 0))
    for y in cuts_y:
        bmesh.ops.bisect_plane(bm, geom=all_(), plane_co=(0, y, 0), plane_no=(0, 1, 0))
    drop = [f for f in bm.faces if not keep(*f.calc_center_median())]
    bmesh.ops.delete(bm, geom=drop, context="FACES")
    return bm


def alpha_image_mat(name, path, rough=0.5, emit=0.0):
    """image_mat with the picture's alpha as the material's (a halo, a cut-out)."""
    m = image_mat(name, path, rough=rough, emit=emit)
    t = next(n for n in m.node_tree.nodes if n.type == "TEX_IMAGE")
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    m.node_tree.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
    if hasattr(m, "blend_method"):
        m.blend_method = "BLEND"
    return m


def glow(m, name, colour, strength):
    """Turn a material into a lamp's glass: renamed, opaque, glowing one colour (the scene keys it)."""
    m.name = name
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    for key in ("Emission Color", "Alpha", "Base Color"):
        for l in list(b.inputs[key].links):
            m.node_tree.links.remove(l)
    b.inputs["Base Color"].default_value = (*colour, 1)
    b.inputs["Emission Color"].default_value = (*colour, 1)
    b.inputs["Emission Strength"].default_value = strength
    b.inputs["Alpha"].default_value = 1.0
    if hasattr(m, "blend_method"):
        m.blend_method = "OPAQUE"
    return m


def star_chart(polar=False, seed=1, paper=(0.86, 0.8, 0.66), ink=(0.1, 0.09, 0.12)):
    """A star chart's picture for paint(): aged paper, a ruled grid (or a polar net of circles and hour lines), stars
    of six sizes, constellation lines between near bright ones, the ecliptic, a double border, foxing."""
    import numpy as np

    def fn(u, v):
        h, w = u.shape
        rng = np.random.default_rng(seed)
        asp = w / h
        x, y = (u - 0.5) * asp, v - 0.5
        rgb = np.ones((h, w, 3), np.float32) * np.array(paper, np.float32)
        yy, xx = np.mgrid[0:h, 0:w]
        blot = sum(np.sin(xx / s + p) * np.sin(yy / (s * 1.4) + 2 * p) for s, p in ((53, 0.7), (131, 2.0), (29, 4.1))) / 3
        rgb *= (0.93 + 0.07 * blot)[..., None]
        k = np.zeros((h, w), np.float32)                       # ink, 0..1
        px = 1.0 / h
        line = lambda d, t=1.2: np.clip(1 - np.abs(d) / (t * px), 0, 1)
        if polar:
            r, a = np.hypot(x, y), np.arctan2(y, x)
            for rr in (0.09, 0.18, 0.27, 0.36, 0.45):
                k = np.maximum(k, line(r - rr) * 0.55)
            k = np.maximum(k, line(r - 0.455, 2.5))
            spoke = np.abs(((a / (2 * np.pi) * 24) + 0.5) % 1 - 0.5) * (2 * np.pi / 24) * r
            k = np.maximum(k, line(spoke) * 0.5 * (r < 0.45) * (r > 0.02))
            tick = (np.abs(((a / (2 * np.pi) * 360) + 0.5) % 1 - 0.5) < 0.18) & (r > 0.44) & (r < 0.455)
            k = np.maximum(k, tick * 0.8)
            ecl = np.hypot(x - 0.1, y - 0.02) - 0.3
            k = np.maximum(k, line(ecl) * 0.6 * (np.sin(a * 40) > 0) * (r < 0.45))
            inside = r < 0.45
        else:
            for g in np.arange(-0.9, 0.91, 0.1):
                k = np.maximum(k, line(x - g) * 0.45)
                k = np.maximum(k, line(y - g * 0.5) * 0.45)
            ecl = y - 0.16 * np.sin(x * 4.2)
            k = np.maximum(k, line(ecl) * 0.6 * (np.sin(x * 160) > 0))
            inside = (np.abs(x) < asp / 2 - 0.04) & (np.abs(y) < 0.46)
            bx, by = asp / 2 - np.abs(x), 0.5 - np.abs(y)
            edge = np.minimum(bx, by)
            k = np.maximum(k, line(edge - 0.04, 2.0))
            k = np.maximum(k, line(edge - 0.03, 1.0))
        k *= inside if polar else 1
        n = 420
        sx, sy = rng.uniform(-asp / 2 + 0.05, asp / 2 - 0.05, n), rng.uniform(-0.45, 0.45, n)
        mag = rng.power(0.35, n)                               # few big, many small
        if polar:
            ok = np.hypot(sx, sy) < 0.44
            sx, sy, mag = sx[ok], sy[ok], mag[ok]
        for i in range(len(sx)):
            rad = (0.0016 + 0.006 * (1 - mag[i]) ** 2)
            x0, x1 = int((sx[i] / asp + 0.5 - rad * 2) * w), int((sx[i] / asp + 0.5 + rad * 2) * w) + 2
            y0, y1 = int((sy[i] + 0.5 - rad * 2) * h), int((sy[i] + 0.5 + rad * 2) * h) + 2
            x0, y0 = max(x0, 0), max(y0, 0)
            d = np.hypot(x[y0:y1, x0:x1] - sx[i], y[y0:y1, x0:x1] - sy[i])
            k[y0:y1, x0:x1] = np.maximum(k[y0:y1, x0:x1], np.clip((rad - d) / px + 0.5, 0, 1))
        bright = np.argsort(mag)[:70]
        for i in bright:
            dd = np.hypot(sx[bright] - sx[i], sy[bright] - sy[i])
            for j in bright[np.argsort(dd)[1:3]]:
                if np.hypot(sx[j] - sx[i], sy[j] - sy[i]) > 0.16:
                    continue
                ax, ay, bx_, by_ = sx[i], sy[i], sx[j], sy[j]
                x0, x1 = int((min(ax, bx_) / asp + 0.5) * w) - 3, int((max(ax, bx_) / asp + 0.5) * w) + 3
                y0, y1 = int((min(ay, by_) + 0.5) * h) - 3, int((max(ay, by_) + 0.5) * h) + 3
                x0, y0 = max(x0, 0), max(y0, 0)
                X, Y = x[y0:y1, x0:x1], y[y0:y1, x0:x1]
                L = np.hypot(bx_ - ax, by_ - ay) + 1e-9
                t = np.clip(((X - ax) * (bx_ - ax) + (Y - ay) * (by_ - ay)) / L ** 2, 0, 1)
                d = np.hypot(X - (ax + t * (bx_ - ax)), Y - (ay + t * (by_ - ay)))
                k[y0:y1, x0:x1] = np.maximum(k[y0:y1, x0:x1], np.clip(1 - d / (1.0 * px), 0, 1) * 0.75)
        k = np.clip(k, 0, 1)[..., None]
        return rgb * (1 - k) + np.array(ink, np.float32) * k

    return fn


def sphere_uv(r, seg=64, rings=32):
    """A sphere about the origin with equirect UVs of its own: u from the longitude about z, v from the latitude."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        c = f.calc_center_median()
        a0 = math.atan2(c.y, c.x)
        for l in f.loops:
            p = l.vert.co
            a = math.atan2(p.y, p.x) if math.hypot(p.x, p.y) > 1e-6 else a0
            while a - a0 > math.pi:
                a -= 2 * math.pi
            while a - a0 < -math.pi:
                a += 2 * math.pi
            l[uv].uv = (a / (2 * math.pi) + 0.5, math.asin(max(-1, min(1, p.z / r))) / math.pi + 0.5)
    return bm


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
