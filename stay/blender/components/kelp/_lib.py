# kelp/_lib: what the kelp forest's components share (blender/lib/comp.py is not ours to edit): a lathe, balls,
# painted pictures, and the two builders most of the place is made of: a stipe of giant kelp jointed so it can lean in
# the current and stand, and a fish.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
import numpy as np
from comp import T, R, S, xf
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "_tex")
DEPTH = 12.0          # the water over the seabed


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


def ball(r, at=(0, 0, 0), sub=2, squash=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    xf(bm, S(*squash))
    return xf(bm, T(*at))


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


def picture(name, path, emit=0.0, rough=0.5, alpha=False, base=True, metal=0.0):
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
    b.inputs["Metallic"].default_value = metal
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


def noise(h, w, seed, octaves=4):
    """Smooth value noise in 0..1, tileable."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w))
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        n = 4 * 2 ** o
        g = rng.random((n, n))
        yy, xx = np.mgrid[0:h, 0:w]
        fy, fx = yy / h * n, xx / w * n
        y0, x0 = np.floor(fy).astype(int) % n, np.floor(fx).astype(int) % n
        y1, x1 = (y0 + 1) % n, (x0 + 1) % n
        ty, tx = fy - np.floor(fy), fx - np.floor(fx)
        ty, tx = ty * ty * (3 - 2 * ty), tx * tx * (3 - 2 * tx)
        out += amp * ((g[y0, x0] * (1 - tx) + g[y0, x1] * tx) * (1 - ty) + (g[y1, x0] * (1 - tx) + g[y1, x1] * tx) * ty)
        tot += amp
        amp *= 0.5
    return out / tot


def uv_planar(o, x0, y0, w, h, axes="xz"):
    """UVs from two of the mesh's own axes: (x0, y0) is the picture's bottom left, w by h its size."""
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    uv = me.uv_layers.active.data
    ia, ib = "xyz".index(axes[0]), "xyz".index(axes[1])
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            uv[li].uv = ((v[ia] - x0) / w, (v[ib] - y0) / h)


# --- giant kelp ---------------------------------------------------------------------------------------------------

def kelp_mats():
    """The blade's picture (golden-brown, wrinkled, a paler edge) and the stipe's and the bladders' colours."""
    path = os.path.join(TEX, "kelp_blade.png")
    h, w = 512, 128
    n1, n2 = noise(h, w, 3, 5), noise(h, w, 9, 3)
    yy, xx = np.mgrid[0:h, 0:w]
    u = xx / w
    wr = 0.5 + 0.5 * np.sin(yy / h * 90 + 9 * n2 + 6 * np.abs(u - 0.5))        # the blade's wrinkles run across it
    base = np.array((0.44, 0.33, 0.06))[None, None, :] * (0.55 + 0.6 * n1[..., None])
    base = base * (0.62 + 0.5 * wr[..., None])
    edge = np.clip((np.abs(u - 0.5) - 0.36) / 0.14, 0, 1)[..., None]
    base = base * (1 - edge) + np.array((0.6, 0.5, 0.14)) * edge
    save_png(path, np.dstack([np.clip(base, 0, 1), np.ones((h, w))]))
    blade = picture("kelp_blade", path, emit=110.0, rough=0.35)             # a little glow: the sun through the blade
    stipe = ambient(comp.mat("kelp_stipe", (0.2, 0.15, 0.04), rough=0.5), 80.0)
    bulb = comp.mat("kelp_bladder", (0.42, 0.34, 0.08), rough=0.3, emit=(0.5, 0.4, 0.08), strength=70.0)
    return blade, stipe, bulb


def blade(length, width, rnd, droop=0.25, nx=4, ny=14):
    """One blade lying along +y from the origin, its face up: lance-shaped, corrugated, drooping toward its tip."""
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    ph = rnd.uniform(0, 6.28)
    twist = rnd.uniform(-0.9, 0.9)
    grid = []
    for j in range(ny + 1):
        t = j / ny
        wd = width * (0.12 + 0.88 * math.sin(math.pi * min(1.0, t * 0.62 + 0.06)) ** 0.8) * (1.0 if t < 0.7 else 1.0 - ((t - 0.7) / 0.3) ** 1.6)
        row = []
        for i in range(nx + 1):
            s = i / nx - 0.5
            x = s * wd
            z = 0.012 * math.sin(t * 34 + ph) * (0.4 + abs(s) * 2.2) + 0.25 * wd * (s * s) - droop * length * t * t
            a = twist * t
            row.append((bm.verts.new((x * math.cos(a) - z * math.sin(a) * 0.3, t * length, z + x * math.sin(a))), (i / nx, t)))
        grid.append(row)
    for j in range(ny):
        for i in range(nx):
            q = (grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i])
            f = bm.faces.new([v for v, _ in q])
            for l, (_, uv) in zip(f.loops, q):
                l[uvl].uv = uv
    return bm


def with_uv(bm):
    """Make sure a bmesh carries the UV layer the blades use, so merges keep it."""
    if not bm.loops.layers.uv:
        bm.loops.layers.uv.new("UVMap")
    return bm


def stipe(col, root, name, base, height, segs, seed, mats, lean=58.0, heading=0.0, parent=None, blade_len=0.7, blades=2):
    """One stipe of giant kelp from `base` on the seabed, built standing straight up, jointed every height/segs.
    Each joint carries the stretch of stipe above it and, at its top, bladders and blades. Returns the keys of the
    clip that stands it up: at rest every joint leans a few degrees down-current (toward `heading`, degrees from +x),
    `lean` degrees in all at the tip; at full it stands, wavering a degree or two."""
    blade_m, stipe_m, bulb_m = mats
    rnd = random.Random(seed)
    L = height / segs
    hd = math.radians(heading)
    keys = []
    prev = parent
    pos = Vector((base[0], base[1], base[2]))
    weights = [0.5 + 1.0 * (i / (segs - 1)) for i in range(segs)]
    tot = sum(weights)
    for i in range(segs):
        p = comp.pivot(col, root, f"{name}_joint_{i + 1:02d}", pos, parent=prev)
        r0 = 0.017 * (1 - 0.45 * i / segs)
        r1 = 0.017 * (1 - 0.45 * (i + 1) / segs)
        st = with_uv(comp.cyl(r0, L + 0.01, at=(pos.x, pos.y, pos.z), seg=7, r2=r1))
        o = comp.mesh(col, root, f"{name}_stipe_{i + 1:02d}", st, stipe_m, parent=p, smooth=True)
        bl, bu = [], []
        top = pos + Vector((0, 0, L))
        for k in range(blades + (1 if i == segs - 1 else 0)):
            az = rnd.uniform(0, 360)
            up = rnd.uniform(18, 50)                        # how far the blade lifts off level
            ln = blade_len * rnd.uniform(0.75, 1.25) * (1.25 if i == segs - 1 else 1.0)
            at = top - Vector((0, 0, rnd.uniform(0, L * 0.5)))
            m = Matrix.Translation(at) @ Matrix.Rotation(math.radians(az), 4, "Z") @ Matrix.Rotation(math.radians(up), 4, "X")
            b = blade(ln, 0.085 * rnd.uniform(0.8, 1.3), rnd, droop=rnd.uniform(0.15, 0.4))
            xf(b, T(0, 0.085, 0))
            bl.append(xf(b, m))
            bu.append(xf(with_uv(ball(0.015, (0, 0.05, 0), sub=1, squash=(1, 2.4, 1))), m))
            bu.append(xf(with_uv(comp.cyl(0.004, 0.03, at=(0, 0, 0), seg=4, axis="Y")), m))
        if bl:
            comp.mesh(col, root, f"{name}_blades_{i + 1:02d}", comp.merge(*bl), blade_m, parent=p, smooth=True)
            comp.mesh(col, root, f"{name}_bladders_{i + 1:02d}", comp.merge(*bu), bulb_m, parent=p, smooth=True)
        a = math.radians(lean) * weights[i] / tot
        w1, w2 = math.radians(rnd.uniform(-1.6, 1.6)), math.radians(rnd.uniform(-1.6, 1.6))
        # lean toward the heading: a turn about the level axis square to it
        keys.append((p, "rotation_euler", 0, -a * math.sin(hd) + math.radians(rnd.uniform(-1.5, 1.5)), w1))
        keys.append((p, "rotation_euler", 1, a * math.cos(hd) + math.radians(rnd.uniform(-1.5, 1.5)), w2))
        prev = p
        pos = top
    return keys


def holdfast(base, r=0.16, seed=0):
    """The holdfast: a mound of branching haptera gripping the rock."""
    rnd = random.Random(seed)
    parts = [lathe([(r * 0.9, 0.0), (r * 0.75, r * 0.4), (r * 0.4, r * 0.8), (0.03, r * 1.15), (0.0, r * 1.2)], seg=10)]
    for i in range(22):
        a = rnd.uniform(0, 6.28)
        rr = r * rnd.uniform(0.9, 1.5)
        z = rnd.uniform(0.2, 0.9) * r
        parts.append(comp.tube([(0.03 * math.cos(a), 0.03 * math.sin(a), z + r * 0.3), (rr * 0.55 * math.cos(a), rr * 0.55 * math.sin(a), z * 0.9), (rr * math.cos(a + 0.2), rr * math.sin(a + 0.2), 0.0)], 0.011, res=5, sides=1))
    return xf(comp.merge(*parts), T(*base))


def kelp(place_name, stipes, source_note, turn_blades=2):
    """A whole plant: `stipes` is a list of (dx, dy, height, segs, lean, heading). Writes media/models/kelp/NAME.glb."""
    col, root = comp.fresh(place_name)
    mats = kelp_mats()
    hf = comp.mesh(col, root, f"{place_name}_holdfast", holdfast((0, 0, 0), 0.17, seed=len(stipes)), mats[1], smooth=True)
    keys = []
    for n, (dx, dy, h, segs, lean, heading) in enumerate(stipes):
        keys += stipe(col, root, f"{place_name}_{n + 1}", (dx, dy, 0.1), h, segs, seed=hash((place_name, n)) % 9973 + n, mats=mats, lean=lean, heading=heading, blades=turn_blades)
    channel("stand", keys)
    return col, root


# --- fish ---------------------------------------------------------------------------------------------------------

def fish_body(length, height, width, seg=14, rings=16, snout=0.5, tail_at=0.84):
    """A fish's body lying along x with its nose at x 0 and its tail toward +x, from sections: height and width swell behind the head and fall away
    to the tail's stem. UVs are its side view: u along the length, v up."""
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    rr = []
    for k in range(rings + 1):
        t = k / rings
        x = t * length * tail_at
        prof = (math.sin(math.pi * t ** snout) ** 0.75) * (1 - 0.72 * t ** 3) + 0.035
        hh, ww = height / 2 * prof, width / 2 * (math.sin(math.pi * t ** (snout * 0.9)) ** 0.9 * (1 - 0.8 * t ** 2.2) + 0.03)
        ring = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            y, z = ww * math.sin(a), hh * math.cos(a) * (1.0 if math.cos(a) > 0 else 0.86)
            ring.append((bm.verts.new((x, y, z)), (x / length, 0.5 + z / height * 0.92)))
        rr.append(ring)
    for a, b in zip(rr, rr[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            q = (a[i], a[j], b[j], b[i])
            f = bm.faces.new([v for v, _ in q])
            for l, (_, uv) in zip(f.loops, q):
                l[uvl].uv = uv
    for ring in (rr[0], rr[-1]):
        f = bm.faces.new([v for v, _ in ring])
        for l, (_, uv) in zip(f.loops, ring):
            l[uvl].uv = uv
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def fin(outline, length, height, x0=0.0, z0=0.0, y=0.0):
    """A flat fin in the xz plane from an outline of (u, v) in 0..1 (two-sided), its UVs the fish's side view."""
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    vs = [bm.verts.new((x0 + u, y, z0 + v)) for u, v in outline]
    f = bm.faces.new(vs)
    for l, (u, v) in zip(f.loops, outline):
        l[uvl].uv = ((x0 + u) / length, 0.5 + (z0 + v) / height * 0.92)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    return bm


def fish(place_name, length, height, width, paint, about, rig_note, snout=0.5, seed=1):
    """A whole fish heading -x (its nose at the -x end), its side to the camera. paint(u, v, n) returns an (h, w, 3) picture of its
    side. Rig: "tail" beats the tail fin from one side to the other, "swim" carries it a body length and a half."""
    col, root = comp.fresh(place_name)
    h, w = 256, 512
    yy, xx = np.mgrid[0:h, 0:w]
    u, v = xx / w, yy / h
    img = paint(u, v, noise(h, w, seed, 5))
    sc = 0.5 + 0.5 * np.sin(u * 150 + np.sin(v * 70) * 1.5) * np.sin(v * 70)       # scales
    img = np.clip(img * (0.86 + 0.2 * sc[..., None]) * (0.75 + 0.5 * v[..., None]), 0, 1)
    path = save_png(os.path.join(TEX, f"{place_name}.png"), np.dstack([img, np.ones((h, w))]))
    skin = picture(f"{place_name}_skin", path, emit=75.0, rough=0.3)
    swim = comp.pivot(col, root, f"{place_name}_swim", (0, 0, 0))
    X0 = -length * 0.45
    Z0 = height * 0.9
    place = lambda bm: xf(bm, T(X0, 0, Z0))
    body = comp.mesh(col, root, f"{place_name}_body", place(fish_body(length, height, width, snout=snout)), skin, parent=swim, smooth=True)
    H, Lh = height, length
    fins = [
        fin([(0.0, 0.0), (0.06 * Lh, 0.2 * H), (0.2 * Lh, 0.26 * H), (0.36 * Lh, 0.2 * H), (0.42 * Lh, 0.07 * H), (0.42 * Lh, -0.05 * H), (0.0, -0.08 * H)], Lh, H, x0=0.3 * Lh, z0=0.43 * H),       # dorsal
        fin([(0.0, 0.05 * H), (0.2 * Lh, 0.05 * H), (0.2 * Lh, -0.06 * H), (0.14 * Lh, -0.2 * H), (0.03 * Lh, -0.14 * H)], Lh, H, x0=0.5 * Lh, z0=-0.36 * H),                                  # anal
        fin([(0.0, 0.03 * H), (0.1 * Lh, 0.02 * H), (0.12 * Lh, -0.18 * H), (0.04 * Lh, -0.16 * H)], Lh, H, x0=0.3 * Lh, z0=-0.4 * H, y=0.02),                                                   # pelvic
    ]
    comp.mesh(col, root, f"{place_name}_fins", place(comp.merge(*fins)), skin, parent=swim)
    pect = []
    for s in (-1, 1):
        p = fin([(0.0, 0.03 * H), (0.13 * Lh, 0.1 * H), (0.17 * Lh, 0.0), (0.12 * Lh, -0.1 * H), (0.0, -0.03 * H)], Lh, H, x0=0.0, z0=0.0)
        xf(p, R(s * 32, "Z"))
        xf(p, T(0.27 * Lh, s * width * 0.5, -0.1 * H))
        pect.append(p)
    comp.mesh(col, root, f"{place_name}_pectorals", place(comp.merge(*pect)), skin, parent=swim)
    eyes = []
    pup = []
    for s in (-1, 1):
        eyes.append(ball(0.05 * H, (0.085 * Lh, s * width * 0.3, 0.14 * H), squash=(1, 0.45, 1)))
        pup.append(ball(0.026 * H, (0.085 * Lh, s * (width * 0.3 + 0.016 * H), 0.14 * H), squash=(1, 0.4, 1)))
    comp.mesh(col, root, f"{place_name}_eyes", place(comp.merge(*eyes)), ambient(comp.mat("fish_eye", (0.85, 0.8, 0.5), rough=0.15), 45.0), parent=swim, smooth=True)
    comp.mesh(col, root, f"{place_name}_pupils", place(comp.merge(*pup)), comp.mat("fish_pupil", (0.01, 0.01, 0.012), rough=0.1), parent=swim, smooth=True)
    stem = (X0 + Lh * 0.82, 0, Z0)
    tp = comp.pivot(col, root, f"{place_name}_tail", stem, parent=swim)
    tail = fin([(0.0, 0.05 * H), (0.1 * Lh, 0.2 * H), (0.2 * Lh, 0.36 * H), (0.17 * Lh, 0.12 * H), (0.15 * Lh, 0.0), (0.17 * Lh, -0.12 * H), (0.2 * Lh, -0.36 * H), (0.1 * Lh, -0.2 * H), (0.0, -0.05 * H)], Lh, H, x0=0.8 * Lh, z0=0.0)
    comp.mesh(col, root, f"{place_name}_tail_fin", place(tail), skin, parent=tp)
    # "swim" first, "tail" last, so the tail's rest (swept to one side) is the pose the file holds
    channel("swim", [(swim, "location", 0, 0.0, -length * 1.5)])
    channel("tail", [(tp, "rotation_euler", 2, math.radians(-24), math.radians(24))])
    comp.export(col, root, "kelp", place_name, made=f"blender/components/kelp/{place_name}.py", source=about, license="ours", credit="",
                rig={"tail": f"the tail fin ({place_name}_tail) beats from 24 degrees one side to 24 the other about the tail's stem",
                     "swim": f"the fish ({place_name}_swim) moves {length * 1.5:.2f} m ahead (-x, the way it faces)", **rig_note})
    return col, root


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


def ambient(m, strength=50.0):
    """Let a material glow with its own colour, as the water's scattered light on it: the forest stands under a
    surface that shuts the scene's sun out, and with no fill its floor renders black. (Its picture, or its plain
    colour, drives the glow; set the strength to 0 in a scene with its own fill light.)"""
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    src = b.inputs["Base Color"]
    if src.is_linked:
        m.node_tree.links.new(src.links[0].from_socket, b.inputs["Emission Color"])
    else:
        b.inputs["Emission Color"].default_value = src.default_value
    b.inputs["Emission Strength"].default_value = strength
    return m


def tint_picture(m, tint, name, shade=None):
    """Multiply a material's colour picture by a tint in the picture itself (saved under _tex), so its glow, which
    the glTF export takes straight from the picture, carries the tint too."""
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    node = b.inputs["Base Color"].links[0].from_node
    im = node.image
    w, h = im.size
    px = np.empty(w * h * 4, dtype=np.float32)
    im.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    px[..., :3] *= np.array(tint, dtype=np.float32)
    if shade is not None:                 # light and shade painted in: shade(h, w) is a multiplier a pixel
        px[..., :3] *= shade(h, w)[..., None].astype(np.float32)
    node.image = bpy.data.images.load(save_png(os.path.join(TEX, name), px), check_existing=False)
    return m
