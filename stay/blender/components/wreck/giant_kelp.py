# wreck/giant-kelp-a, -b, -c: giant kelp (Macrocystis) for the kelp world, in place of the old set's thin stalks. From a
# holdfast of tangled roots, seven to nine stipes rise 7 to 11 m, swaying a little as they go; along each, every 20-26
# cm, a gas bladder holds out a blade: 45-80 cm long, narrow at its foot, widest a third of the way up, tapering to a
# point, its edges ruffled, floating up and out and streaming down-current (+x). The blades are painted here
# (media/models/wreck/kelp-blade.png: a dark midrib, fine striations along it, lighter edges, a few blotches).
# One mesh, two shape keys for the scene to sway it by: "sway" bends the whole plant down-current (+x), more the higher,
# and "lean" bends it across (+y, raea's -z).
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
import numpy as np
from mathutils import Vector

OUT = os.path.join(comp.PROJECT, "media", "models", "wreck")
os.makedirs(OUT, exist_ok=True)


def blade_texture():
    """the blade's picture: v along it (its foot at 0), u across it"""
    W, H = 256, 1024
    rng = np.random.default_rng(5)
    u = np.linspace(0, 1, W)[None, :].repeat(H, 0)
    v = np.linspace(0, 1, H)[:, None].repeat(W, 1)
    base = np.array([0.50, 0.36, 0.10])
    tip = np.array([0.66, 0.52, 0.18])
    c = base[None, None, :] * (1 - v[..., None]) + tip[None, None, :] * v[..., None]
    rib = np.exp(-((u - 0.5) / 0.035) ** 2) * (1 - 0.6 * v)                 # the midrib, fading toward the tip
    edge = np.clip((np.abs(u - 0.5) - 0.38) / 0.12, 0, 1)                   # thin, lighter edges
    stri = rng.normal(0, 1, (1, W)).repeat(H, 0)                             # striations along the blade
    stri = np.convolve(stri[0], np.ones(5) / 5, mode="same")[None, :].repeat(H, 0)
    blot = np.zeros((H, W))
    for _ in range(14):
        cy, cx, r = rng.uniform(0.1, 0.95) * H, rng.uniform(0.15, 0.85) * W, rng.uniform(10, 40)
        yy, xx = np.ogrid[:H, :W]
        blot += np.exp(-(((yy - cy) / (r * 2.2)) ** 2 + ((xx - cx) / r) ** 2)) * rng.uniform(0.1, 0.25)
    k = 1 - 0.45 * rib + 0.35 * edge + 0.05 * stri - blot
    c = np.clip(c * k[..., None], 0, 1)
    img = bpy.data.images.get("kelp_blade_tex") or bpy.data.images.new("kelp_blade_tex", W, H)
    rgba = np.concatenate([c, np.ones((H, W, 1))], axis=2).astype(np.float32)
    img.pixels.foreach_set(rgba.ravel())
    path = os.path.join(OUT, "kelp-blade.png")
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    return img


def blade_material(img):
    m = bpy.data.materials.get("giant_kelp_blade") or bpy.data.materials.new("giant_kelp_blade")
    m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    t = next((n for n in nt.nodes if n.type == "TEX_IMAGE"), None) or nt.nodes.new("ShaderNodeTexImage")
    t.image = img
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.5
    m.use_backface_culling = False
    return m


IMG = blade_texture()
BLADE = blade_material(IMG)
BLADDER = comp.mat("giant_kelp_bladder", (0.42, 0.33, 0.1), rough=0.32)
STIPE = comp.mat("giant_kelp_stipe", (0.26, 0.19, 0.06), rough=0.65)


def stipe_curve(rng, h, lean):
    """the stipe's line: from the holdfast, leaning out, swaying gently, up to h"""
    a, ph = rng.uniform(0, 2 * math.pi), rng.uniform(0, 6.3)
    pts = []
    n = int(h / 0.25)
    for i in range(n + 1):
        z = h * i / n
        out = lean * min(1.0, z / 1.5) + 0.12 * math.sin(z * 0.7 + ph)
        pts.append(Vector((math.cos(a) * out + 0.18 * (z / h) ** 1.5, math.sin(a) * out + 0.08 * math.sin(z * 0.5 + ph), z)))
    return pts


def build(name, seed, stipes, h0, h1):
    rng = random.Random(seed)
    col, root = comp.fresh(name)
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    mats = {"blade": 0, "bladder": 1, "stipe": 2}

    def face(vs, uvs, mat):
        f = bm.faces.new(vs)
        f.material_index = mats[mat]
        for l, uv in zip(f.loops, uvs):
            l[uvl].uv = uv
        return f

    def tube(pts, r0, r1, sides=6):
        rings = []
        for i, p in enumerate(pts):
            d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
            a = d.orthogonal().normalized()
            b = d.cross(a)
            r = r0 + (r1 - r0) * i / (len(pts) - 1)
            rings.append([bm.verts.new(p + (a * math.cos(2 * math.pi * k / sides) + b * math.sin(2 * math.pi * k / sides)) * r) for k in range(sides)])
        for i in range(len(rings) - 1):
            for k in range(sides):
                k2 = (k + 1) % sides
                face([rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]], [(k / sides, i), ((k + 1) / sides, i), ((k + 1) / sides, i + 1), (k / sides, i + 1)], "stipe")

    def blob(c, rx, ry, rz, d):
        """a gas bladder: an ellipsoid along d"""
        z = d.normalized()
        x = z.orthogonal().normalized()
        y = z.cross(x)
        rows = []
        for i in range(5):
            th = math.pi * i / 4
            rows.append([bm.verts.new(c + z * (math.cos(th) * rz) + (x * math.cos(2 * math.pi * k / 6) * rx + y * math.sin(2 * math.pi * k / 6) * ry) * math.sin(th)) for k in range(6)])
        for i in range(4):
            for k in range(6):
                k2 = (k + 1) % 6
                face([rows[i][k], rows[i][k2], rows[i + 1][k2], rows[i + 1][k]], [(0, 0), (1, 0), (1, 1), (0, 1)], "bladder")

    def blade(base, d, side, L, Wd, ph):
        """a blade from `base` along d (unit), its flat facing `side`"""
        n = 9
        rows = []
        for i in range(n + 1):
            s = i / n
            # its line: out along d, floating up, streaming down-current, curling a little
            p = base + d * (L * s) + Vector((0.22 * L * s * s, 0.0, 0.18 * L * s * s)) + side * (0.04 * L * math.sin(s * 3 + ph) * s)
            w = Wd * (math.sin(math.pi * min(1.0, s ** 0.75)) ** 0.8) * (1 - 0.15 * s) + 0.004
            across = side.cross(d).normalized()
            row = []
            for j, uu in enumerate((-1.0, -0.5, 0.0, 0.5, 1.0)):
                ruff = 0.018 * (abs(uu) ** 2) * math.sin(s * 34 + uu * 3 + ph) * min(1.0, s * 4)
                q = p + across * (w / 2 * uu) + side * (ruff + 0.006 * (1 - uu * uu))
                row.append((bm.verts.new(q), ((uu + 1) / 2, s)))
            rows.append(row)
        for i in range(n):
            for j in range(4):
                a, b2, c2, d2 = rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]
                face([a[0], b2[0], c2[0], d2[0]], [a[1], b2[1], c2[1], d2[1]], "blade")

    # the holdfast: a knot of short roots
    for k in range(22):
        a = rng.uniform(0, 2 * math.pi)
        r = rng.uniform(0.1, 0.32)
        pts = [Vector((0, 0, 0.12)), Vector((math.cos(a) * r * 0.5, math.sin(a) * r * 0.5, 0.1 + rng.uniform(-0.03, 0.04))), Vector((math.cos(a) * r, math.sin(a) * r, -0.02))]
        tube(pts, 0.016, 0.008, 5)
    blades = 0
    for si in range(stipes):
        h = rng.uniform(h0, h1)
        pts = stipe_curve(rng, h, rng.uniform(0.15, 0.55))
        tube(pts, 0.016, 0.008, 6)
        z = rng.uniform(0.35, 0.7)
        turn = rng.uniform(0, 6.3)
        while z < h - 0.15:
            i = min(len(pts) - 2, int(z / 0.25))
            f = (z / 0.25) - i
            p = pts[i].lerp(pts[i + 1], min(1.0, f))
            up = (pts[i + 1] - pts[i]).normalized()
            turn += 2.4 + rng.uniform(-0.4, 0.4)
            out = Vector((math.cos(turn), math.sin(turn), 0.0))
            d = (out * 0.75 + up * 0.62 + Vector((0.25, 0, 0))).normalized()
            side = d.cross(up).normalized()
            if side.length < 0.1:
                side = Vector((0, 1, 0))
            bp = p + out * 0.035
            blob(bp, 0.016, 0.016, 0.03, d)
            blade(bp + d * 0.03, d, side, rng.uniform(0.45, 0.8) * (0.75 + 0.25 * min(1.0, z / 2.5)), rng.uniform(0.09, 0.14), rng.uniform(0, 6.3))
            blades += 1
            z += rng.uniform(0.2, 0.26)
    bm.normal_update()
    o = comp.mesh(col, root, name, bm, [BLADE, BLADDER, STIPE], smooth=True)
    # the two shape keys
    o.shape_key_add(name="Basis")
    sw = o.shape_key_add(name="sway")
    ln = o.shape_key_add(name="lean")
    top = max(v.co.z for v in o.data.vertices)
    for v in o.data.vertices:
        k = max(0.0, v.co.z / top) ** 1.6
        sw.data[v.index].co = v.co + Vector((1.1 * k, 0.0, -0.12 * k))
        ln.data[v.index].co = v.co + Vector((0.0, 0.8 * k, -0.06 * k))
    print(f"{name}: {stipes} stipes, {blades} blades, top {top:.2f} m")
    comp.export(col, root, "wreck", name, made="blender/components/wreck/giant_kelp.py", source="own geometry and painting", license="ours", credit="",
                notes=f"{stipes} stipes up to {top:.1f} m, {blades} blades. Shape keys (morph targets, in order): sway (bends it down-current, +x, 1.1 m at the top), lean (across, +y in Blender = raea -z, 0.8 m).")


build("giant_kelp_a", 3, 8, 7.5, 11.0)
build("giant_kelp_b", 9, 7, 6.5, 10.0)
build("giant_kelp_c", 21, 9, 8.0, 11.5)
