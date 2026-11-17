# bedroom/_lib: the bedroom components' shared steps: a lathe, UV'd panels and spheres, and pictures painted with
# numpy (the globe's map, the posters, the play rug) and saved under blender/src/bedroom/ for image materials.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
import numpy as np
from comp import T, R, S, xf
from mathutils import Vector, Matrix

PLACE = "bedroom"
SRC = os.path.join(comp.CACHE, "bedroom")
ROOM_W, ROOM_D, ROOM_H = 4.2, 3.6, 2.5      # the room: x, y (depth), z
WIN_W, WIN_H, WIN_SILL, WIN_X = 1.4, 1.2, 1.0, -0.6   # the window's opening in the back wall


def maker(col, root):
    return lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)


def turn(prof, z0=0.0, seg=32, cap=False):
    """A lathe: the (radius, height) profile spun about z."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z0 + z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def panel(w, h, at=(0, 0, 0), nx=1, ny=1):
    """A flat panel w x h in the xz plane facing -y with UVs 0..1 across it (u left to right, v bottom to top)."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    vs = [[bm.verts.new((-w / 2 + w * i / nx, 0, -h / 2 + h * j / ny)) for i in range(nx + 1)] for j in range(ny + 1)]
    for j in range(ny):
        for i in range(nx):
            f = bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
            for l in f.loops:
                l[uv].uv = ((l.vert.co.x + w / 2) / w, (l.vert.co.z + h / 2) / h)
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


def flat(w, d, at=(0, 0, 0), nx=1, ny=1):
    """A flat panel w x d lying in the xy plane facing +z with UVs 0..1 (u along x, v from the front, -y, to the back)."""
    bm = panel(w, d, nx=nx, ny=ny)
    xf(bm, R(-90, "X"))
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


def uv_sphere(r, seg=48, rings=24):
    """A sphere with an equirectangular map on it (u round the equator, v pole to pole), its poles on z."""
    bm = bmesh.new()
    bm.loops.layers.uv.new("UVMap")     # calc_uvs writes nothing unless the layer is there
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r, calc_uvs=True)
    return bm


def save_image(name, px):
    """Save an (h, w, 3) float array (0..1, row 0 the TOP of the picture) as blender/src/bedroom/NAME.png."""
    os.makedirs(SRC, exist_ok=True)
    path = os.path.join(SRC, name + ".png")
    h, w = px.shape[:2]
    rgba = np.ones((h, w, 4), dtype=np.float32)
    rgba[..., :3] = np.clip(px, 0, 1)
    old = bpy.data.images.get(name)
    if old:
        bpy.data.images.remove(old)
    im = bpy.data.images.new(name, w, h, alpha=False)
    im.colorspace_settings.name = "sRGB"
    im.pixels.foreach_set(rgba[::-1].ravel())
    im.filepath_raw = path
    im.file_format = "PNG"
    im.save()
    bpy.data.images.remove(im)
    return path


def image_mat(name, path, rough=0.6, emit=0.0, metal=0.0):
    """A material showing a picture on the part's UVs (and glowing with it, for a screen)."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL"):
            nt.nodes.remove(n)
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(path, check_existing=False)
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = emit
    return m


# --- painting -------------------------------------------------------------------------------------------------------

def canvas(w, h, colour=(1, 1, 1)):
    px = np.empty((h, w, 3), dtype=np.float32)
    px[:] = colour
    return px


def grid_xy(px):
    h, w = px.shape[:2]
    return np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h)   # x 0..1 left to right, y 0..1 top to bottom


def gradient(px, top, bottom):
    h = px.shape[0]
    t = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    px[:] = np.array(top, dtype=np.float32) * (1 - t) + np.array(bottom, dtype=np.float32) * t
    return px


def put(px, mask, colour, a=1.0):
    px[mask] = px[mask] * (1 - a) + np.array(colour, dtype=np.float32) * a


def rect(px, x0, y0, x1, y1, colour, a=1.0):
    X, Y = grid_xy(px)
    put(px, (X >= x0) & (X < x1) & (Y >= y0) & (Y < y1), colour, a)


def disc(px, cx, cy, r, colour, a=1.0, aspect=None):
    X, Y = grid_xy(px)
    asp = aspect if aspect is not None else px.shape[1] / px.shape[0]
    put(px, ((X - cx) * asp) ** 2 + (Y - cy) ** 2 < r * r, colour, a)


def inside(X, Y, pts):
    """Even-odd point in polygon over the grids X, Y."""
    m = np.zeros(X.shape, dtype=bool)
    n = len(pts)
    for i in range(n):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % n]
        if y0 == y1:
            continue
        c = ((y0 > Y) != (y1 > Y)) & (X < (x1 - x0) * (Y - y0) / (y1 - y0) + x0)
        m ^= c
    return m


def poly(px, pts, colour, a=1.0):
    X, Y = grid_xy(px)
    put(px, inside(X, Y, pts), colour, a)


def noise(px, amount=0.02, seed=1):
    rng = np.random.default_rng(seed)
    px += rng.normal(0, amount, px.shape[:2])[..., None].astype(np.float32)
    return px


# --- more than one Poly Haven model in a component --------------------------------------------------------------------

def ph_add(col, root, asset, name, X=None, res="1k", scale=1.0, turn=0.0, parent=None, keep=None):
    """Import a Poly Haven model into an existing component: stood on the floor at its box's centre, scaled and turned
    (degrees about z), then moved by the 4x4 X; its meshes named NAME_n under `parent`. Returns (meshes, credit)."""
    objs = comp.ph_model(asset, res)
    credit, _ = comp.ph_credit(asset)
    meshes = [o for o in objs if o.type == "MESH" and (keep is None or keep(o.name))]
    for o in objs:
        if o not in meshes:
            bpy.data.objects.remove(o, do_unlink=True)
    for o in meshes:
        o.parent = None
    pre = Matrix.Rotation(math.radians(turn), 4, "Z") @ Matrix.Scale(scale, 4)
    for o in meshes:
        o.matrix_world = pre @ o.matrix_world
    lo, hi = comp.box_of(meshes)
    mid = (lo + hi) / 2
    move = (X or Matrix.Identity(4)) @ Matrix.Translation((-mid.x, -mid.y, -lo.z))
    for o in meshes:
        o.matrix_world = move @ o.matrix_world
    bpy.context.view_layer.update()
    for i, o in enumerate(meshes):
        comp.link(col, root, o, name=f"{name}_{i + 1}" if len(meshes) > 1 else name, parent=parent)
    print(f"ph_add {asset}: {[o.name for o in meshes]} size {tuple(round(v, 3) for v in (hi - lo))}")
    return meshes, credit


def channel(name, keys):
    """comp.channel, for a clip that moves one object on more than one property (x and y, a slide and a turn):
    comp.channel gives every key its own action and NLA track, and of several same-named tracks on one object the
    glTF export keeps one. Here an object's keys share one action and one track."""
    by = {}
    for obj, path, index, rest, full in keys:
        by.setdefault(obj.name, (obj, []))[1].append((path, index, rest, full))
    for obj, ks in by.values():
        act = bpy.data.actions.new(f"{name}|{obj.name}")
        obj.animation_data_create()
        obj.animation_data.action = act
        for frame, which in ((0, 2), (comp.FPS, 3)):
            for k in ks:
                getattr(obj, k[0])[k[1]] = k[which]
            for path, index, _, _ in ks:
                obj.keyframe_insert(path, index=index, frame=frame)
        for path, index, rest, _ in ks:
            getattr(obj, path)[index] = rest
        for fc in comp._fcurves(act):
            for k in fc.keyframe_points:
                k.interpolation = "LINEAR"
        tr = obj.animation_data.nla_tracks.new()
        tr.name = name
        st = tr.strips.new(name, 0, act)
        st.name = name
        obj.animation_data.action = None


def srgb(c):
    """A colour picked by eye (sRGB) as the linear value a material wants: without it bright paints wash out pale."""
    return tuple(v ** 2.2 for v in c)


def plain_wall(col, root, name, width, th=0.14):
    """A plain wall of the room, `width` x ROOM_H: the pale-blue plaster, the skirting and the star border the window
    wall and the side wall have. Room face at y 0, foot at z 0, centred in x. Returns the maker."""
    import random
    M = maker(col, root)
    plaster = comp.ph_texture("wall_plaster", "painted_plaster_wall", tile=2.0, res="1k", tint=(0.58, 0.74, 0.86), grey=True)
    white = comp.mat("wall_trim", (0.9, 0.89, 0.84), rough=0.4)
    border = comp.mat("wall_border", (0.03, 0.07, 0.3), rough=0.6)
    w = M(f"{name}_plaster", comp.box((width, th, ROOM_H), at=(0, th / 2, ROOM_H / 2)), plaster)
    comp.uv_box(w, 1.0)
    sk = M(f"{name}_skirting", comp.merge(comp.box((width, 0.018, 0.12), at=(0, -0.009, 0.06)), comp.box((width, 0.01, 0.025), at=(0, -0.005, 0.132))), white)
    comp.bevel(sk, 0.004, 2)
    M(f"{name}_border", comp.box((width, 0.002, 0.09), at=(0, -0.001, 2.28)), border)
    rnd = random.Random(len(name))
    stars = []
    for i in range(int(width / 0.15)):
        s = comp.cyl(0.022, 0.0015, seg=5, axis="Y")
        xf(s, R(rnd.uniform(0, 72), "Y")); xf(s, T(-width / 2 + 0.08 + i * 0.15, -0.0035, 2.28))
        stars.append(s)
    M(f"{name}_border_stars", comp.merge(*stars), comp.mat("wall_border_star", (0.9, 0.6, 0.06), rough=0.6))
    return M
