# cathedral/_lib: the shapes the cathedral's components share (blender/lib/comp.py is not ours to edit): a lathe, a
# plate cut from outlines with holes (tracery, arcades), pointed arches, a picture material, planar UVs, flames.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from comp import T, R, S, xf
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "_tex")
STONE_TINT = (0.95, 0.88, 0.74)


def stone(name="cathedral_stone", tile=2.4, res="1k"):
    """The cathedral's limestone ashlar (Poly Haven's large_sandstone_blocks_01, CC0), courses 30 cm high."""
    return comp.ph_texture(name, "large_sandstone_blocks_01", tile=tile, res=res, tint=STONE_TINT, grey=True)


def plain_stone(name="cathedral_dressed_stone"):
    """Dressed stone for mouldings and tracery: the same colour without the block joints."""
    return comp.mat(name, (0.5, 0.45, 0.36), rough=0.85)


def oak(name="cathedral_oak", tile=1.2, res="1k"):
    return comp.ph_texture(name, "dark_wood", tile=tile, res=res, tint=(1.0, 0.72, 0.42), grey=True)


def lathe(profile, seg=32, cap=True):
    """Turn a profile of (radius, z) pairs about z. Radius 0 points close the form."""
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        if r <= 1e-6:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            if len(a) == 1 and len(b) == 1:
                continue
            if len(a) == 1:
                bm.faces.new((a[0], b[i], b[j]))
            elif len(b) == 1:
                bm.faces.new((a[i], a[j], b[0]))
            else:
                bm.faces.new((a[i], a[j], b[j], b[i]))
    if cap:
        if len(rings[0]) > 1:
            bm.faces.new(list(reversed(rings[0])))
        if len(rings[-1]) > 1:
            bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def plate(loops, depth):
    """A plate in the xz plane cut from closed outlines of (x, z) points: an outline inside another is a hole. Its
    back is at y 0 and its front at y -depth."""
    cu = bpy.data.curves.new("_plate", "CURVE")
    cu.dimensions = "2D"
    cu.fill_mode = "BOTH"
    cu.extrude = depth / 2
    for pts in loops:
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        for p, (x, z) in zip(sp.points, pts):
            p.co = (x, z, 0, 1)
        sp.use_cyclic_u = True
    bm = comp._to_mesh_bm(bpy.data.objects.new("_plate", cu))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    xf(bm, R(90, "X"))
    xf(bm, T(0, -depth / 2, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def circle(r, at=(0, 0), n=48, start=0.0):
    return [(at[0] + r * math.cos(start + 2 * math.pi * i / n), at[1] + r * math.sin(start + 2 * math.pi * i / n)) for i in range(n)]


def rect(x0, z0, x1, z1):
    return [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]


def arch(span, z0, z_base, at=0.0, n=14, sharp=1.0):
    """A pointed-arch opening: jambs from z_base up to the springing at z0, then two arcs of radius span*sharp
    (1 is the equilateral arch) meeting at the apex."""
    h = span / 2
    rad = span * sharp
    c = rad - h                      # the arcs' centres sit this far past the centre line
    top = math.sqrt(rad * rad - c * c)
    a_end = math.atan2(top, c)       # angle at the apex, seen from the right-hand arc's centre at (-c, z0)
    pts = [(at - h, z_base), (at + h, z_base)]
    for i in range(n + 1):
        a = a_end * i / n
        pts.append((at - c + rad * math.cos(a), z0 + rad * math.sin(a)))
    for i in range(1, n + 1):
        a = a_end * (1 - i / n)
        pts.append((at + c - rad * math.cos(a), z0 + rad * math.sin(a)))
    return pts, z0 + top


def torus(R_, r, seg=64, sides=10, arc=2 * math.pi, start=0.0):
    """A ring about y (lying in the xz plane), major radius R_, minor r."""
    bm = bmesh.new()
    n = seg + (0 if arc >= 2 * math.pi - 1e-6 else 1)
    rings = []
    for i in range(n):
        a = start + arc * i / seg
        rings.append([bm.verts.new(((R_ + r * math.cos(b)) * math.cos(a), r * math.sin(b), (R_ + r * math.cos(b)) * math.sin(a))) for b in (2 * math.pi * j / sides for j in range(sides))])
    closed = n == seg
    for i in range(n if closed else n - 1):
        a, b = rings[i], rings[(i + 1) % n]
        for j in range(sides):
            k = (j + 1) % sides
            bm.faces.new((a[j], b[j], b[k], a[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def sweep(points, r, sides=8):
    """A straight-jointed rod through the points (no smoothing), radius r: for ribs and arch mouldings."""
    return comp.tube(points, r, res=2, sides=max(1, sides // 4))


def uv_planar(o, x0, z0, w, h):
    """UVs from x and z: (x0, z0) is the picture's bottom left, w by h its size."""
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    uv = me.uv_layers.active.data
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            uv[li].uv = ((v.x - x0) / w, (v.z - z0) / h)


def picture(name, path, emit=0.0, rough=0.35, tint=(1, 1, 1), alpha=False, base=True):
    """A material from one picture: its colour, and its glow too when emit > 0."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL"):
            nt.nodes.remove(n)
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(path, check_existing=False)
    b.inputs["Roughness"].default_value = rough
    if base:
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    else:
        b.inputs["Base Color"].default_value = (0, 0, 0, 1)
    if emit > 0:
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = emit
    if alpha:
        nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
        m.blend_method = "BLEND"
    return m


def save_png(path, px):
    """Write an (h, w, 4) float array (row 0 at the bottom) as a PNG."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    h, w = px.shape[:2]
    im = bpy.data.images.new("_png", w, h, alpha=True)
    im.pixels.foreach_set(px.astype("float32").ravel())
    im.filepath_raw = path
    im.file_format = "PNG"
    im.save()
    bpy.data.images.remove(im)
    return path


def flame(h=0.035, at=(0, 0, 0)):
    """A candle flame: a teardrop h tall standing on `at`."""
    prof = [(0.0, 0.0), (0.22 * h, 0.1 * h), (0.3 * h, 0.28 * h), (0.24 * h, 0.5 * h), (0.12 * h, 0.76 * h), (0.0, h)]
    return xf(lathe(prof, seg=10, cap=False), T(*at))


def flame_mat(name, strength=3000.0):
    return comp.mat(name, (1.0, 0.75, 0.3), rough=0.4, emit=(1.0, 0.62, 0.2), strength=strength)


def wax_mat(name="cathedral_wax"):
    return comp.mat(name, (0.93, 0.89, 0.78), rough=0.45)


def brass_mat(name="cathedral_brass"):
    return comp.mat(name, (0.78, 0.58, 0.24), rough=0.28, metal=1.0)


def iron_mat(name="cathedral_iron"):
    return comp.mat(name, (0.03, 0.03, 0.032), rough=0.6, metal=0.6)


def finish(o, size=1.0):
    bpy.context.view_layer.update()
    comp.uv_box(o, size)
    return o


def grisaille(name="cathedral_grisaille", emit=1200.0):
    """Pale diamond-quarry glass with a coloured border, for the lancets: a picture 1 wide by 3 high."""
    import numpy as np
    path = os.path.join(TEX, "grisaille.png")
    w, h = 256, 768
    yy, xx = np.mgrid[0:h, 0:w]
    u, v = (xx + 0.5) / w, (yy + 0.5) / h * 3
    frac = lambda a: a - np.floor(a)
    g1, g2 = (u + v) * 7, (u - v) * 7
    hs = frac(np.sin(np.floor(g1) * 12.9898 + np.floor(g2) * 78.233) * 43758.5453)
    img = np.zeros((h, w, 3))
    img[:] = (0.78, 0.84, 0.8)
    img[hs < 0.12] = (0.9, 0.78, 0.4)
    img[(hs > 0.12) & (hs < 0.2)] = (0.5, 0.7, 0.9)
    img *= (0.75 + 0.4 * frac(hs * 7.3))[..., None]
    border = (u < 0.1) | (u > 0.9)
    img[border] = (0.1, 0.2, 0.75)
    img[border & (frac(v * 5) < 0.3)] = (0.75, 0.06, 0.06)
    lead = (frac(g1) < 0.08) | (frac(g2) < 0.08) | (np.abs(u - 0.1) < 0.012) | (np.abs(u - 0.9) < 0.012) | (frac(v * 2) < 0.02)
    img[lead] = (0.015, 0.015, 0.015)
    save_png(path, np.dstack([np.clip(img, 0, 1), np.ones((h, w))]))
    return picture(name, path, emit=emit, rough=0.25)


def pointed(t, a, rise):
    """The height of a pointed arch of half-span a and rise `rise`, t from its centre line."""
    c = (rise * rise - a * a) / (2 * a)
    rho = a + c
    return math.sqrt(max(0.0, rho * rho - (abs(t) + c) ** 2))


def pointed_inv(z, a, rise):
    c = (rise * rise - a * a) / (2 * a)
    rho = a + c
    return max(0.0, math.sqrt(max(0.0, rho * rho - z * z)) - c)


def chain(p0, p1, link=0.05, r=0.006, sides=5, seg=10):
    """A chain of round links from p0 to p1, every other link turned a quarter."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    n = max(1, int(d.length / (link * 0.72)))
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
    parts = []
    for i in range(n):
        t = xf(torus(link / 2, r, seg, sides), S(0.7, 1, 1))
        if i % 2:
            xf(t, R(90, "Z"))
        xf(t, T(0, 0, (i + 0.5) * d.length / n))
        parts.append(t)
    return xf(xf(comp.merge(*parts), rot), Matrix.Translation(p0))


def octa(profile):
    return xf(lathe(profile, seg=8), R(22.5, "Z"))


def ball(r, at=(0, 0, 0), sub=2, squash=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    xf(bm, S(*squash))
    return xf(bm, T(*at))


def velvet(name="cathedral_velvet", tint=(0.75, 0.1, 0.1)):
    return comp.ph_texture(name, "velour_velvet", tile=0.28, res="1k", tint=tint, grey=True)


def channel(name, keys):
    """comp.channel, but an object's keys all go in one action and one NLA track. comp.channel makes an action and a
    track of the clip's name for every key, and the glTF export keeps only one such track an object, so the second
    property keyed on the same object (a flame's stretch beside its lean, a joint's second axis) never reaches the clip."""
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
