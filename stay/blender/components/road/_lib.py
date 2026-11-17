# The road's shared steps: the road's own surface (so markings, puddles and the wet sheet lie on its camber and in its
# dips), a lathe, cut-out (alpha-masked) and soft (alpha-blended) picture materials, a height-field ground and the
# Douglas fir builder the two trees share.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from comp import T, R, S, xf
from mathutils import Vector, Matrix, noise

PLACE = "road"
ROAD_W, ROAD_L = 7.2, 40.0          # two 3.6 m lanes; one section of road
# the puddles' dips: (x, y, half-width across, half-length along) in the road section's frame (Blender: y away)
DIPS = [(-1.4, -8.0, 1.4, 1.1), (1.2, -3.0, 0.9, 1.3), (-2.2, 3.0, 0.8, 1.6), (0.6, 11.0, 1.0, 1.2)]


def road_z(x, y):
    """The asphalt's height: a 2 % camber off the crown, wheel ruts, and a shallow dip at each puddle."""
    z = -0.02 * abs(x)
    for rx in (-2.65, -0.95, 0.95, 2.65):
        z -= 0.006 * math.exp(-((x - rx) / 0.28) ** 2)
    for px, py, hx, hy in DIPS:
        d = ((x - px) / hx) ** 2 + ((y - py) / hy) ** 2
        z -= 0.018 * math.exp(-d * 1.2)
    return z


def meshers(col, root):
    return lambda name, bm, m=None, parent=None, smooth=False: comp.mesh(col, root, name, bm, m, parent=parent, smooth=smooth)


def turn(prof, z0=0.0, seg=32):
    """A lathe: (radius, height) points spun about z."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z0 + z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def sheet(nx, ny, x0, x1, y0, y1, fz):
    """A height field: nx by ny quads over [x0, x1] x [y0, y1], z = fz(x, y), facing up."""
    bm = bmesh.new()
    vs = [[bm.verts.new((x0 + (x1 - x0) * i / nx, y0 + (y1 - y0) * j / ny, 0)) for i in range(nx + 1)] for j in range(ny + 1)]
    for row in vs:
        for v in row:
            v.co.z = fz(v.co.x, v.co.y)
    for j in range(ny):
        for i in range(nx):
            bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
    return bm


def uv_top(o, size=1.0):
    """UVs straight down from above in world metres (a ground's faces, whatever their slope)."""
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    uv = me.uv_layers.active.data
    mw = o.matrix_world
    for l in me.loops:
        p = mw @ me.vertices[l.vertex_index].co
        uv[l.index].uv = (p.x / size, p.y / size)


def uv_fit(bm, u0, v0, u1, v1, axes=(0, 1)):
    """UVs from the bmesh's own box on two axes, fitted into a rectangle of the picture."""
    uv = bm.loops.layers.uv.verify()
    a, b = axes
    lo = [min(v.co[k] for v in bm.verts) for k in (a, b)]
    hi = [max(v.co[k] for v in bm.verts) for k in (a, b)]
    for f in bm.faces:
        for l in f.loops:
            s = (l.vert.co[a] - lo[0]) / max(hi[0] - lo[0], 1e-9)
            t = (l.vert.co[b] - lo[1]) / max(hi[1] - lo[1], 1e-9)
            l[uv].uv = (u0 + (u1 - u0) * s, v0 + (v1 - v0) * t)
    return bm


def ph_map(asset, key, res="2k", ext="jpg", kind="Models"):
    """One map of a Poly Haven model's texture set (a model's maps aren't in its `files` under the texture keys)."""
    url = f"https://dl.polyhaven.org/file/ph-assets/{kind}/{ext}/{res}/{asset}/{asset}_{key}_{res}.{ext}"
    return comp.fetch(url, os.path.join(comp.CACHE, "polyhaven", "tex", asset, os.path.basename(url)))


def rgba(colour_path, alpha_path, out):
    """A picture with its alpha in it (glTF wants the cut-out in the base colour's alpha)."""
    if os.path.isfile(out):
        return out
    import numpy as np
    c = bpy.data.images.load(colour_path)
    a = bpy.data.images.load(alpha_path)
    a.colorspace_settings.name = "Non-Color"
    n = c.size[0] * c.size[1] * 4
    pc, pa = np.empty(n, dtype=np.float32), np.empty(n, dtype=np.float32)
    c.pixels.foreach_get(pc)
    a.pixels.foreach_get(pa)
    pc = pc.reshape(-1, 4)
    pc[:, 3] = pa.reshape(-1, 4)[:, 0]
    im = bpy.data.images.new("_rgba", c.size[0], c.size[1], alpha=True)
    im.pixels.foreach_set(pc.ravel())
    im.filepath_raw = out
    im.file_format = "PNG"
    im.save()
    for i in (c, a, im):
        bpy.data.images.remove(i)
    return out


def picture(out, w, h, fn):
    """A PNG made from fn(u, v) -> (r, g, b, a) arrays (u, v in 0..1, v up), cached by name."""
    import numpy as np
    if os.path.isfile(out):
        return out
    os.makedirs(os.path.dirname(out), exist_ok=True)
    u, v = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h)
    px = np.stack([np.broadcast_to(np.asarray(c, dtype=np.float32), u.shape) for c in fn(u, v)], axis=-1).astype(np.float32)
    im = bpy.data.images.new("_pic", w, h, alpha=True)
    im.pixels.foreach_set(px.ravel())
    im.filepath_raw = out
    im.file_format = "PNG"
    im.save()
    bpy.data.images.remove(im)
    return out


def pic_mat(name, path, mode="CLIP", rough=0.6, normal=None, metal=0.0, emit=None, strength=1.0, tint=None):
    """A material from a picture with alpha: cut out ("CLIP", glTF MASK), soft ("BLEND") or solid ("OPAQUE")."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL"):
            nt.nodes.remove(n)
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(path, check_existing=True)
    if tint:
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        mix.inputs[7].default_value = (*tint, 1)
        nt.links.new(t.outputs["Color"], mix.inputs[6])
        nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    else:
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if mode == "CLIP":
        r = nt.nodes.new("ShaderNodeMath")
        r.operation = "ROUND"
        nt.links.new(t.outputs["Alpha"], r.inputs[0])
        nt.links.new(r.outputs[0], b.inputs["Alpha"])
    elif mode == "BLEND":
        nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
    if hasattr(m, "blend_method"):
        m.blend_method = {"CLIP": "CLIP", "BLEND": "BLEND", "OPAQUE": "OPAQUE"}[mode]
    if hasattr(m, "alpha_threshold"):
        m.alpha_threshold = 0.5
    m.use_backface_culling = False
    if normal:
        tn = nt.nodes.new("ShaderNodeTexImage")
        tn.image = bpy.data.images.load(normal, check_existing=True)
        tn.image.colorspace_settings.name = "Non-Color"
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(tn.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    if emit is not None:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m


def recentre(o, at):
    """Move a mesh object's origin to `at` (world) without moving the mesh: raea sorts blended parts by their
    origins' distance, and comp.mesh leaves every part's origin at the component's."""
    bpy.context.view_layer.update()
    at = Vector(at)
    mw = o.matrix_world.copy()
    o.data.transform(Matrix.Translation(-(mw.inverted() @ at)))
    o.matrix_world = mw @ Matrix.Translation(mw.inverted() @ at)
    bpy.context.view_layer.update()
    return o


def bake(o):
    """Apply an object's modifiers now (a boolean's cutter can then be removed)."""
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    old = o.data
    o.modifiers.clear()
    o.data = me
    bpy.data.meshes.remove(old)
    return o


def quad(p0, p1, p2, p3, uvs, bm, uv):
    f = bm.faces.new([bm.verts.new(p) for p in (p0, p1, p2, p3)])
    for l, t in zip(f.loops, uvs):
        l[uv].uv = t
    return f


# --- the Douglas fir ----------------------------------------------------------------------------------------------
# The twig atlas (Poly Haven fir_tree_01, CC0) holds sprigs on a flat sheet; each (u0, v0, u1, v1, base-u) is one,
# its stem's foot at the bottom of the rectangle.
SPRIGS = [(0.30, 0.215, 0.655, 0.615, 0.475), (0.625, 0.165, 0.965, 0.565, 0.79), (0.64, 0.625, 0.945, 0.965, 0.81), (0.185, 0.68, 0.425, 0.965, 0.305)]


def fir_materials(prefix, res="2k"):
    twig = rgba(ph_map("fir_tree_01", "twig_diff", res=res), ph_map("fir_tree_01", "twig_alpha", res=res, ext="png"), os.path.join(comp.CACHE, "polyhaven", "tex", "fir_tree_01", f"fir_tree_01_twig_rgba_{res}.png"))
    needles = pic_mat(f"{prefix}_needles", twig, mode="CLIP", rough=0.62, tint=(0.5, 0.66, 0.52))
    bark = comp.ph_texture(f"{prefix}_bark", "pine_bark", tile=1.0, res="1k", tint=(0.37, 0.34, 0.33))
    return needles, bark


def fir_trunk(h, r0, rnd, seg=20, rings=44, bare=0.0):
    """A tapering trunk with a root flare and a slow wander, bark UVs wrapped round it. Returns (bmesh, axis(z))."""
    wob = [(rnd.uniform(-1, 1), rnd.uniform(-1, 1)) for _ in range(4)]

    def axis(z):
        t = z / h
        return Vector((0.10 * h / 28 * (wob[0][0] * math.sin(2.1 * t * math.pi) + 0.5 * wob[1][0] * math.sin(5.3 * t * math.pi)),
                       0.10 * h / 28 * (wob[0][1] * math.sin(1.7 * t * math.pi) + 0.5 * wob[1][1] * math.sin(4.1 * t * math.pi)), z))

    def radius(z):
        t = z / h
        return r0 * max(0.0, 1 - t) ** 0.85 + 0.012 + r0 * 0.55 * math.exp(-z / (0.9 * r0 + 0.2))

    bm = bmesh.new()
    uv = bm.loops.layers.uv.verify()
    ring = []
    for j in range(rings + 1):
        z = h * (j / rings) ** 1.35
        c, r = axis(z), radius(z)
        row = []
        for i in range(seg + 1):
            a = 2 * math.pi * i / seg
            flare = 1 + 0.16 * math.exp(-z / (1.2 * r0 + 0.2)) * math.sin(5 * a + wob[2][0] * 3) + 0.04 * math.sin(9 * a + z * 1.3)
            row.append(bm.verts.new((c.x + r * flare * math.cos(a), c.y + r * flare * math.sin(a), z - (0.12 if j == 0 else 0))))
        ring.append((row, z))
    for j in range(rings):
        (a, za), (b, zb) = ring[j], ring[j + 1]
        for i in range(seg):
            f = bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
            for l, (u, v) in zip(f.loops, ((i, za), (i + 1, za), (i + 1, zb), (i, zb))):
                l[uv].uv = (u / seg * 2, v / 1.4)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    return bm, axis, radius


def fir_branch(bm_stem, bm_need, foot, yaw, length, droop, rnd, dense=1.0, dead=False):
    """One bough: a stem that leaves the trunk a little below level, sags, and lifts at its tip, with sprigs along
    both sides and hanging under it."""
    uvs, uvn = bm_stem.loops.layers.uv.verify(), bm_need.loops.layers.uv.verify()
    out = Vector((math.cos(yaw), math.sin(yaw), 0))
    side = Vector((-out.y, out.x, 0))
    n = 7
    pts = []
    for k in range(n + 1):
        t = k / n
        sag = -droop * length * (t ** 1.2) + 0.22 * length * droop * t ** 3.0
        pts.append(foot + out * (length * t) + Vector((0, 0, sag)) + side * (0.03 * length * math.sin(3 * t + yaw)))
    r0 = 0.012 + 0.012 * length
    prev = None
    for k, p in enumerate(pts):
        r = r0 * (1 - 0.85 * k / n)
        ringv = [bm_stem.verts.new(p + side * (r * math.cos(a)) + Vector((0, 0, r * math.sin(a)))) for a in (0, 2.094, 4.189)]
        if prev:
            for i in range(3):
                f = bm_stem.faces.new((prev[i], prev[(i + 1) % 3], ringv[(i + 1) % 3], ringv[i]))
                for l in f.loops:
                    l[uvs].uv = (0.1 * i, 0.15 * k)
        prev = ringv
    if dead:
        return
    count = max(6, int(length * 15 * dense))
    for c in range(count):
        t = 0.18 + 0.82 * (c + rnd.random() * 0.6) / count
        k = min(n - 1, int(t * n))
        p = pts[k].lerp(pts[k + 1], t * n - k)
        along = (pts[k + 1] - pts[k]).normalized()
        sgn = 1 if c % 2 == 0 else -1
        mode = c % 5
        L = (0.75 + 0.9 * rnd.random()) * (0.55 + 0.6 * (1 - t)) * min(1.0, 0.45 + length / 3.5)
        if mode == 4:       # hanging under the stem
            d = (along * 0.5 + Vector((0, 0, -1)) + side * rnd.uniform(-0.3, 0.3)).normalized()
            wdir = side
        else:               # out to one side, swept toward the tip, drooping
            d = (along * rnd.uniform(0.75, 1.2) + side * sgn * rnd.uniform(0.7, 1.1) + Vector((0, 0, rnd.uniform(-0.45, -0.1)))).normalized()
            wdir = d.cross(Vector((0, 0, 1))).normalized()
            wdir = (wdir + Vector((0, 0, rnd.uniform(-0.35, 0.35)))).normalized()
        u0, v0, u1, v1, ub = SPRIGS[rnd.randrange(len(SPRIGS))]
        W = L * (u1 - u0) / (v1 - v0)
        fb = (ub - u0) / (u1 - u0)
        a = p - wdir * (W * fb)
        b = p + wdir * (W * (1 - fb))
        mid = d * (L * 0.5) + Vector((0, 0, -0.06 * L))
        tip = d * L + Vector((0, 0, -0.16 * L))
        vm = (v0 + v1) / 2
        quad(a, b, b + mid, a + mid, ((u0, v0), (u1, v0), (u1, vm), (u0, vm)), bm_need, uvn)
        quad(a + mid, b + mid, b + tip, a + tip, ((u0, vm), (u1, vm), (u1, v1), (u0, v1)), bm_need, uvn)
    # the leader at the bough's tip
    u0, v0, u1, v1, ub = SPRIGS[0]
    L = 0.5 + 0.25 * length
    W = L * (u1 - u0) / (v1 - v0)
    d = (pts[-1] - pts[-2]).normalized()
    a, b = pts[-1] - side * W * 0.5 - d * 0.1, pts[-1] + side * W * 0.5 - d * 0.1
    quad(a, b, b + d * L, a + d * L, ((u0, v0), (u1, v0), (u1, v1), (u0, v1)), bm_need, uvn)


def fir(col, root, name, h, r0, seed, crown_from, tiers=6, dense=1.0, reach=None, mats=None, at=(0, 0, 0), stubs_n=None, whorl=1.0, res="2k"):
    """A Douglas fir NAME: trunk, dead stubs up the bare bole, and the crown in `tiers` parts each hung from a pivot
    on the trunk (so a sway can turn the upper tiers further than the lower). Returns the tiers' pivots."""
    rnd = random.Random(seed)
    needles, bark = mats or fir_materials(name, res)
    M0 = meshers(col, root)
    at = Vector(at)
    M = lambda n, bm, m=None, parent=None, smooth=False: M0(n, xf(bm, T(*at)), m, parent=parent, smooth=smooth)
    tb, axis, radius = fir_trunk(h, r0, rnd)
    stubs = bmesh.new()
    dump = bmesh.new()
    dump.loops.layers.uv.verify()
    for i in range(int(crown_from / 0.8) if stubs_n is None else stubs_n):
        z = 2.2 + (crown_from - 2.2) * rnd.random()
        yaw = rnd.uniform(0, 2 * math.pi)
        fir_branch(stubs, dump, axis(z) + Vector((math.cos(yaw), math.sin(yaw), 0)) * radius(z) * 0.7, yaw, rnd.uniform(0.4, 1.3), 0.25, rnd, dead=True)
    dump.free()
    M(f"{name}_trunk", comp.merge(tb, stubs), bark, smooth=True)
    reach = reach or 0.2 * h
    pivots = []
    for ti in range(tiers):
        z0 = crown_from + (h - crown_from) * ti / tiers
        z1 = crown_from + (h - crown_from) * (ti + 1) / tiers
        st, nd = bmesh.new(), bmesh.new()
        z = z0
        while z < z1:
            t = (z - crown_from) / (h - crown_from)
            ln = reach * max(0.0, 1 - t) ** 0.8 * (0.35 + 0.65 * min(1.0, t / 0.12)) + 0.25
            for b in range(rnd.choice((4, 5, 5, 6))):
                yaw = rnd.uniform(0, 2 * math.pi)
                zz = z + rnd.uniform(-0.15, 0.15)
                fir_branch(st, nd, axis(zz) + Vector((math.cos(yaw), math.sin(yaw), 0)) * radius(zz) * 0.6, yaw, ln * rnd.uniform(0.7, 1.15), 0.34 - 0.5 * t * 0.34 * 0 - (0.5 if t > 0.9 else 0), rnd, dense=dense)
            z += (0.3 + 0.22 * (1 - t)) * max(0.25, h / 30) * whorl
        if ti == tiers - 1:   # the leader
            fir_branch(st, nd, axis(h - 2.4 * (0.012 * h + 0.06)), 0.0, 0.012 * h + 0.06, -3.0, rnd, dense=dense)
        c = axis((z0 + z1) / 2)
        p = comp.pivot(col, root, f"{name}_tier_{ti + 1}", (c.x + at.x, c.y + at.y, z0 + at.z))
        M(f"{name}_boughs_{ti + 1}", st, bark, parent=p, smooth=True)
        M(f"{name}_needles_{ti + 1}", nd, needles, parent=p)
        pivots.append(p)
    return pivots


def sway_keys(pivots, deg):
    """A gust's lean: each tier turns a little further than the one under it (about x: the tops go back, +y)."""
    return [(p, "rotation_euler", 0, 0, -math.radians(deg) * (i + 1) / len(pivots)) for i, p in enumerate(pivots)]


def done(col, root, name, source, license, credit, rig=None, notes=None):
    return comp.export(col, root, PLACE, name, made=f"blender/components/{PLACE}/{name}.py", source=source, license=license, credit=credit, rig=rig, notes=notes)


# --- the car's shape --------------------------------------------------------------------------------------------
# A mid-90s four-door saloon, 4.62 m long, 1.74 m wide, 1.41 m high, as functions of l (along the car from its
# middle, the nose at +2.31), a (across, the car's left +) and z: so the body, its glass, its trim and road/windscreen's
# cut of it all lie on the same surface. B() puts a point in Blender's frame (the nose toward -y).
CL, CW, FA, RA, WHEEL_R, TRACK, ARCH_R = 2.31, 0.87, 1.42, -1.25, 0.315, 0.755, 0.375


def B(l, a, z):
    return Vector((a, -l, z))


def _tab(fn, lo=-2.4, hi=2.4, step=0.01, k=4):
    n = int(round((hi - lo) / step)) + 1
    v = [fn(lo + i * step) for i in range(n)]
    for _ in range(2):
        v = [sum(v[max(0, min(n - 1, i + j))] for j in range(-k, k + 1)) / (2 * k + 1) for i in range(n)]

    def f(l):
        x = (min(hi, max(lo, l)) - lo) / step
        i = min(n - 2, int(x))
        return v[i] + (v[i + 1] - v[i]) * (x - i)
    return f


def _belt(l):
    if l >= 0.95:
        t = min(1.0, (l - 0.95) / 1.36)
        return 0.93 - 0.17 * t ** 1.5 - 0.05 * max(0.0, (t - 0.86) / 0.14) ** 2
    if l >= -1.42:
        return 0.93 + 0.02 * (0.95 - l) / 2.37
    t = min(1.0, (-1.42 - l) / 0.89)
    return 0.95 - 0.04 * t ** 1.5 - 0.04 * max(0.0, (t - 0.86) / 0.14) ** 2


def _roof(l):
    if l >= 0.95 or l <= -1.42:
        return _belt(l)
    if l > 0.22:
        return 0.93 + 0.455 * ((0.95 - l) / 0.73) ** 0.93
    if l >= -0.78:
        return 1.385 + 0.02 * (1 - ((l + 0.28) / 0.5) ** 2)
    return 0.95 + 0.435 * ((l + 1.42) / 0.64) ** 0.95


z_belt = _tab(_belt)
z_roof = _tab(_roof)


def halfw(l):
    w = CW * (1 - 0.035 * (l / CL) ** 2)
    e = abs(l)
    if e > CL - 0.24:
        t = min(1.0, (e - (CL - 0.24)) / 0.24)
        w *= 0.80 + 0.20 * math.sqrt(max(0.0, 1 - t * t))
    return w


def z_bot(l):
    if l > 1.75:
        return 0.19 + 0.10 * min(1.0, (l - 1.75) / 0.56) ** 1.5
    if l < -1.65:
        return 0.19 + 0.16 * min(1.0, (-l - 1.65) / 0.66) ** 1.5
    return 0.19


def car_at(l):
    """A station's numbers: half-width, floor, belt, roof, the greenhouse's height, its roof's half-width and the
    drop of the roof's edge."""
    w, zb, zt = halfw(l), z_bot(l), z_belt(l)
    hgt = max(0.0, z_roof(l) - zt)
    zr = zt + hgt
    drop = min(0.05, 0.25 * hgt)
    wr = (w - 0.07) - 0.20 * hgt / 0.455
    return w, zb, zt, zr, hgt, wr, drop


def side_a(l, z):
    """The body side's distance out from the centre line at height z (rocker, door, shoulder, side glass)."""
    w, zb, zt, zr, hgt, wr, drop = car_at(l)
    z0, z1 = zb + 0.10, zt - 0.05
    if z <= z0:
        c = max(0.0, min(1.0, (z0 - z) / 0.10))
        return w - 0.10 + 0.088 * math.sqrt(max(0.0, 1 - c * c))
    if z <= z1:
        return w - 0.012 + 0.012 * math.sin(math.pi * (z - z0) / (z1 - z0))
    if z <= zt:
        s = (z - z1) / 0.05
        return w - 0.07 + 0.058 * math.sqrt(max(0.0, 1 - s * s))
    if hgt < 1e-4:
        return w - 0.07
    return (w - 0.07) - ((w - 0.07) - wr) * min(1.0, (z - zt) / max(1e-4, zr - drop - zt))


def top_z(l, a):
    """The height of the hood, windscreen, roof, rear window or deck at a across."""
    w, zb, zt, zr, hgt, wr, drop = car_at(l)
    crown = 0.022
    s = min(1.0, abs(a) / max(wr, 1e-4))
    return zr + crown * (1 - s * s) - drop * s ** 4


def car_section(l):
    """Half a cross-section at l, from the floor's middle out, up the side and in to the roof's middle."""
    w, zb, zt, zr, hgt, wr, drop = car_at(l)
    pts = [((w - 0.10) * i / 4, zb) for i in range(4)]
    for i in range(0, 5):
        a = math.pi / 2 * i / 4
        pts.append((w - 0.10 + 0.088 * math.sin(a), zb + 0.10 * (1 - math.cos(a))))
    z0, z1 = zb + 0.10, zt - 0.05
    for i in range(1, 9):
        z = z0 + (z1 - z0) * i / 8
        pts.append((side_a(l, z), z))
    for i in range(1, 4):
        ph = math.pi / 2 * i / 3
        pts.append((w - 0.07 + 0.058 * math.cos(ph), z1 + 0.05 * math.sin(ph)))
    for i in range(1, 7):
        z = zt + (zr - drop - zt) * i / 6
        pts.append((side_a(l, z) if hgt > 1e-4 else w - 0.07, z))
    for i in range(1, 13):
        a = wr * (1 - i / 12)
        pts.append((a, top_z(l, a)))
    return pts


def car_body(l0=-CL, l1=CL, step=0.025, caps=True):
    """The body's skin lofted through its sections from l0 to l1."""
    bm = bmesh.new()
    n = int(round((l1 - l0) / step))
    rings = []
    for k in range(n + 1):
        l = l0 + (l1 - l0) * k / n
        half = car_section(l)
        ring = [B(l, a, z) for a, z in half] + [B(l, -a, z) for a, z in reversed(half[1:-1])]
        rings.append([bm.verts.new(p) for p in ring])
    m = len(rings[0])
    for k in range(n):
        for i in range(m):
            bm.faces.new((rings[k][i], rings[k][(i + 1) % m], rings[k + 1][(i + 1) % m], rings[k + 1][i]))
    if caps:
        for ring in (rings[0], rings[-1]):
            c = bm.faces.new([bm.verts.new(v.co) for v in ring])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def side_patch(l0, l1, sign, off, nl=16, nz=8, zlo=None, zhi=None, margin=0.0):
    """A patch lying `off` outside the body's side between l0 and l1: by default the side glass's opening (3 cm over
    the belt to 4.5 cm under the roof's edge), or between two heights."""
    bm = bmesh.new()
    rows = []
    for j in range(nz + 1):
        row = []
        for i in range(nl + 1):
            l = l0 + (l1 - l0) * i / nl
            w, zb, zt, zr, hgt, wr, drop = car_at(l)
            a0 = (zt + 0.03 - margin) if zlo is None else zlo
            a1 = (zr - drop - 0.045 + margin) if zhi is None else zhi
            a1 = max(a1, a0 + 0.002)
            z = a0 + (a1 - a0) * j / nz
            row.append(bm.verts.new(B(l, sign * (side_a(l, z) + off), z)))
        rows.append(row)
    for j in range(nz):
        for i in range(nl):
            bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def glass_span(front=True, need=0.03):
    """Where along the car the side glass's opening is at least `need` high: (from, to) for the front or rear end."""
    ls = [i * 0.005 - 1.6 for i in range(int(2.8 / 0.005))]
    ok = [l for l in ls if (lambda c: (c[3] - c[6] - 0.045) - (c[2] + 0.03))(car_at(l)) >= need]
    return (max(ok) if front else min(ok))


def top_patch(l0, l1, inset, off, nl=12, na=20):
    """A patch on the hood, screen, roof or deck from l0 to l1, `inset` in from the roof's edge, lifted `off`."""
    bm = bmesh.new()
    rows = []
    for i in range(nl + 1):
        l = l0 + (l1 - l0) * i / nl
        wr = car_at(l)[5] - inset
        dz = (top_z(l + 0.01, 0) - top_z(l - 0.01, 0)) / 0.02
        nrm = Vector((-dz, 1.0)).normalized()      # (l, z) of the surface's normal
        rows.append([bm.verts.new(B(l + nrm.x * off, wr * (2 * j / na - 1), top_z(l, wr * (2 * j / na - 1)) + nrm.y * off)) for j in range(na + 1)])
    for i in range(nl):
        for j in range(na):
            bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def side_line(pts, sign, width=0.006, off=0.0012):
    """A thin dark line on the body's side through (l, z) points: a shut line."""
    bm = bmesh.new()
    prev = None
    for i, (l, z) in enumerate(pts):
        l2, z2 = pts[min(i + 1, len(pts) - 1)]
        l1, z1 = pts[max(i - 1, 0)]
        d = Vector((l2 - l1, z2 - z1)).normalized()
        nl, nz = -d.y * width / 2, d.x * width / 2
        cur = [bm.verts.new(B(l + s * nl, sign * (side_a(l + s * nl, z + s * nz) + off), z + s * nz)) for s in (-1, 1)]
        if prev:
            bm.faces.new((prev[0], prev[1], cur[1], cur[0]))
        prev = cur
    return bm


def plan_sweep(path, prof):
    """Sweep a profile [(out, z)] along a path of (l, a) points in plan, pushed out along the path's normal."""
    bm = bmesh.new()
    rows = []
    n = len(path)
    for i, (l, a) in enumerate(path):
        l0, a0 = path[max(i - 1, 0)]
        l1, a1 = path[min(i + 1, n - 1)]
        d = Vector((l1 - l0, a1 - a0)).normalized()
        nrm = Vector((d.y, -d.x))
        if nrm.x * l + nrm.y * a < 0:
            nrm = -nrm
        rows.append([bm.verts.new(B(l + nrm.x * o, a + nrm.y * o, z)) for o, z in prof])
    for i in range(n - 1):
        for j in range(len(prof) - 1):
            bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
    for row in (rows[0], rows[-1]):
        bm.faces.new(row)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def end_path(front=True, from_l=1.80, off=0.0, n=10):
    """The plan outline round the nose (or the tail) from one flank to the other."""
    s = 1 if front else -1
    pts = []
    for i in range(n + 1):
        l = s * (abs(from_l) + (CL - 0.24 - abs(from_l)) * i / n)
        pts.append((l, halfw(l) + off))
    for i in range(1, 9):       # the corner
        t = math.sin(math.pi / 2 * i / 8)
        l = s * (CL - 0.24 + 0.24 * t)
        pts.append((l + s * off * t, halfw(l) + off * (1 - t * 0.5)))
    a_end = pts[-1][1]
    for i in range(1, 12):
        pts.append((s * (CL + off), a_end * (1 - 2 * i / 12)))
    mirror = [(l, -a) for l, a in reversed(pts[:n + 9])]
    return pts + mirror


# the windscreen's plane: across (the car's left), up the glass, and out of it
GLASS_UP = Vector((0.0, 0.70, 0.455)).normalized()
GLASS_N = Vector((0.0, -0.455, 0.70)).normalized()
GLASS_TILT = math.atan2(0.455, 0.70)
WIPERS = [("driver", 0.50, 0.44, 0.52, -93.0), ("passenger", -0.05, 0.42, 0.48, -88.0)]   # name, a, arm, blade, sweep


def glass_frame(a, l=0.925, lift=0.0):
    """The matrix of the windscreen's plane at a across its foot: x across, y up the glass, z out of it."""
    p = B(l, a, top_z(l, a)) + GLASS_N * lift
    m = Matrix.Identity(4)
    m.col[0][:3] = (1, 0, 0)
    m.col[1][:3] = GLASS_UP
    m.col[2][:3] = GLASS_N
    m.col[3][:3] = p
    return m


def wipers(col, root, name, parent=None):
    """Two wipers lying along the screen's foot, each arm on a spindle whose pivot turns in the glass's plane.
    Returns the channel keys of one sweep (tips up the glass and over toward the car's left)."""
    M = meshers(col, root)
    black = comp.mat(f"{name}_wiper", (0.012, 0.012, 0.013), rough=0.45)
    rubber = comp.mat(f"{name}_wiper_rubber", (0.008, 0.008, 0.008), rough=0.8)
    keys = []
    for nm, a, arm, blade, sweep in WIPERS:
        fr = glass_frame(a, lift=0.004)
        tilt = comp.pivot(col, root, f"{name}_wiper_{nm}_axis", fr.translation, parent=parent)
        tilt.rotation_euler[0] = GLASS_TILT
        bpy.context.view_layer.update()
        turn_p = comp.pivot(col, root, f"{name}_wiper_{nm}", fr.translation, parent=tilt)
        turn_p.matrix_parent_inverse = Matrix.Identity(4)      # comp.pivot keeps it upright in the world; it must lie in the glass
        turn_p.matrix_basis = Matrix.Identity(4)
        bpy.context.view_layer.update()
        sp = xf(comp.merge(comp.cyl(0.016, 0.014, at=(0, 0, -0.004), seg=16), comp.cyl(0.011, 0.012, at=(0, 0, 0.01), seg=12)), fr)
        M(f"{name}_wiper_{nm}_spindle", sp, black, parent=tilt)
        # the arm: a sprung steel strip from the spindle out to the blade's saddle, lifting 1.5 cm then down to it
        ab = comp.merge(
            comp.taper((0, 0, 0.026), (-arm * 0.35, 0.012, 0.03), 0.026, 0.02, 0.012, 0.009),
            comp.taper((-arm * 0.35, 0.012, 0.03), (-arm, 0.03, 0.022), 0.012, 0.008, 0.005, 0.004),
            comp.box((0.03, 0.014, 0.012), at=(-arm, 0.03, 0.016)))
        M(f"{name}_wiper_{nm}_arm", xf(ab, fr), black, parent=turn_p)
        # the blade: a bridge frame with two yokes and the rubber under it
        bl = [comp.box((blade, 0.007, 0.004), at=(-arm, 0.03, 0.014)), comp.box((blade * 0.5, 0.006, 0.009), at=(-arm, 0.03, 0.0185))]
        for s in (-1, 1):
            bl.append(comp.box((blade * 0.24, 0.006, 0.006), at=(-arm + s * blade * 0.3, 0.03, 0.015)))
        M(f"{name}_wiper_{nm}_blade", xf(comp.merge(*bl), fr), black, parent=turn_p)
        M(f"{name}_wiper_{nm}_rubber", xf(comp.box((blade, 0.004, 0.011), at=(-arm, 0.03, 0.0065)), fr), rubber, parent=turn_p)
        keys.append((turn_p, "rotation_euler", 2, 0.0, math.radians(sweep)))
    return keys


def _track(name, obj, act):
    for fc in comp._fcurves(act):
        for k in fc.keyframe_points:
            k.interpolation = "LINEAR"
    tr = obj.animation_data.nla_tracks.new()
    tr.name = name
    st = tr.strips.new(name, 0, act)
    st.name = name
    obj.animation_data.action = None


def channel(name, keys, steps=()):
    """comp.channel, but one action an object: comp.channel makes an action and an NLA track for every key, and of
    two keys on one object (a scale's x and y, a slide and a turn) the glTF export keeps only the first. `steps` are
    keys that hold and then jump: (object, path, index, before, after, frame), for what happens at a moment of the
    clip (a wiper's blade passing)."""
    by = {}
    for obj, path, index, rest, full in keys:
        by.setdefault(obj, []).append((path, index, ((0, rest), (comp.FPS, full)), rest))
    for obj, path, index, before, after, frame in steps:
        by.setdefault(obj, []).append((path, index, ((0, before), (max(0, frame - 1), before), (frame, after), (comp.FPS, after)), before))
    for obj, ks in by.items():
        act = bpy.data.actions.new(f"{name}|{obj.name}")
        obj.animation_data_create()
        obj.animation_data.action = act
        for path, index, frames, rest in ks:
            cur = getattr(obj, path)
            for f, v in frames:
                cur[index] = v
                obj.keyframe_insert(path, index=index, frame=f)
            cur[index] = rest
        _track(name, obj, act)
