# blender/trees_build.py: the swamp's trees, ours, built the way anime backgrounds paint them: a few soft masses
# with leafy edges. Each tree's foliage is a smooth union of ellipsoids (an analytic hull); leaf cards are laid on
# and just under its surface, each card's corner normals taken from the hull, so under the paint look's two bands a
# canopy shades as one soft volume (lit side, shade side, a crisp terminator) while the cards' cut-outs make the
# silhouette leafy. Every card has a back face carrying the same normals, so it shades alike from either side. A
# core inside the hull (the ellipsoids shrunk, the hull's normals) keeps the sky from showing through the middle.
#   willow-K-leaves.glb / willow-K-wood.glb  weeping willows: a dome, curtains of hanging strands, a gnarled trunk
#   tree-K.glb                               round broadleaf trees for the hills
#   bush-K.glb                               shore bushes, the broadleaf recipe small
# usage: raea blender run blender/trees_build.py OUT_DIR WILLOW_CARD.png LEAF_CLUMP.png
import bpy, sys, math, random
from mathutils import Vector
out, willow_png, clump_png = sys.argv[-3:]
def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]; return [((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c]
def reset(): bpy.ops.wm.read_factory_settings(use_empty=True)
def material(name, png=None, rgb=None, vcol=True):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bs = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bs.inputs["Roughness"].default_value = 1
    for k in ("Specular IOR Level", "Coat Weight", "Sheen Weight"):
        if k in bs.inputs: bs.inputs[k].default_value = 0
    if png:
        tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(png)
        nt.links.new(tex.outputs["Color"], bs.inputs["Base Color"])
        rnd = nt.nodes.new("ShaderNodeMath"); rnd.operation = "ROUND"; nt.links.new(tex.outputs["Alpha"], rnd.inputs[0]); nt.links.new(rnd.outputs[0], bs.inputs["Alpha"])
    elif rgb:
        bs.inputs["Base Color"].default_value = (*rgb, 1)
    else:
        vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Col"; nt.links.new(vc.outputs["Color"], bs.inputs["Base Color"])
    m.use_backface_culling = True
    return m

class Hull:
    """A smooth union of ellipsoids: f(p) < 0 inside. Its gradient is the foliage's normal."""
    def __init__(self, ells, k=0.9): self.e = ells; self.k = k
    def f(self, p):
        d = None
        for c, r in self.e:
            q = p - c; a = Vector((q.x / r.x, q.y / r.y, q.z / r.z)); b = Vector((q.x / r.x ** 2, q.y / r.y ** 2, q.z / r.z ** 2))
            k0, k1 = a.length, max(b.length, 1e-6); dd = k0 * (k0 - 1) / k1
            if d is None: d = dd
            else: h = max(self.k - abs(d - dd), 0) / self.k; d = min(d, dd) - h * h * self.k * 0.25
        return d
    def n(self, p):
        e = 0.04; X, Y, Z = Vector((e, 0, 0)), Vector((0, e, 0)), Vector((0, 0, e))
        g = Vector((self.f(p + X) - self.f(p - X), self.f(p + Y) - self.f(p - Y), self.f(p + Z) - self.f(p - Z)))
        return g.normalized() if g.length > 1e-9 else Vector((0, 0, 1))
    def onto(self, p):
        for _ in range(8): p = p - self.n(p) * self.f(p)
        return p
    def sample(self, rng):
        w = [r.x * r.y + r.y * r.z + r.x * r.z for _, r in self.e]; c, r = rng.choices(self.e, weights=w)[0]
        u = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))).normalized()
        return self.onto(c + Vector((u.x * r.x, u.y * r.y, u.z * r.z)))

class Build:
    """Vertices, faces, uvs, colours and custom normals, made into one mesh object."""
    def __init__(self): self.v, self.f, self.uv, self.col, self.n = [], [], [], [], []
    def strip(self, pts, side, uvs_v, normals, colours, front, u=(0, 1), vr=(0, 1)):
        """A card along pts (top to bottom), `side` its half width; front is the way its face looks; u and vr the
        part of the atlas it shows."""
        for back in (False, True):
            base = len(self.v)
            for p, v, nn, cc in zip(pts, uvs_v, normals, colours):
                self.v += [p - side, p + side]; vv = vr[0] + (vr[1] - vr[0]) * v; self.uv += [(u[0], vv), (u[1], vv)]; self.n += [nn, nn]; self.col += [cc, cc]
            for i in range(len(pts) - 1):
                a, b, c, d = base + 2 * i, base + 2 * i + 1, base + 2 * i + 3, base + 2 * i + 2
                face = (a, b, c, d)
                g = (self.v[b] - self.v[a]).cross(self.v[d] - self.v[a])
                if (g.dot(front) < 0) != back: face = face[::-1]
                self.f.append(face)
    def blob(self, c, r, normal_of, colour, sub=3):
        bm = __import__("bmesh"); b = bm.new(); bm.ops.create_icosphere(b, subdivisions=sub, radius=1)
        base = len(self.v)
        for vv in b.verts:
            p = c + Vector((vv.co.x * r.x, vv.co.y * r.y, vv.co.z * r.z)); self.v.append(p); self.uv.append((0.5, 0.5)); self.n.append(normal_of(p)); self.col.append(colour)
        for face in b.faces: self.f.append(tuple(base + vv.index for vv in face.verts))
        b.free()
    def object(self, name, mat):
        me = bpy.data.meshes.new(name); me.from_pydata([tuple(p) for p in self.v], [], self.f); me.update()
        uvl = me.uv_layers.new(name="UVMap")
        for li, lp in enumerate(me.loops): uvl.data[li].uv = self.uv[lp.vertex_index]
        ca = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
        for i, c in enumerate(self.col): ca.data[i].color = (*c, 1)
        me.color_attributes.active_color = ca
        for p in me.polygons: p.use_smooth = True
        me.normals_split_custom_set_from_vertices([tuple(n) for n in self.n])
        ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob); me.materials.append(mat); return ob

def wood(edges, radius, name):
    me = bpy.data.meshes.new(name); verts, idx = [], {}
    key = lambda p: tuple(round(x, 4) for x in p)
    for a, b in edges:
        for p in (a, b):
            if key(p) not in idx: idx[key(p)] = len(verts); verts.append(p)
    me.from_pydata([tuple(v) for v in verts], [(idx[key(a)], idx[key(b)]) for a, b in edges], [])
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    ob.modifiers.new("skin", "SKIN"); ob.modifiers.new("sub", "SUBSURF").levels = 2
    for i, v in enumerate(verts): r = radius(Vector(v)); ob.data.skin_vertices[0].data[i].radius = (r, r)
    ob.data.skin_vertices[0].data[0].use_root = True
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.modifier_apply(modifier="skin"); bpy.ops.object.modifier_apply(modifier="sub")
    for v in ob.data.vertices: v.co += Vector((0, 0, 0)) + v.normal * 0.0
    ca = ob.data.color_attributes.new("Col", "FLOAT_COLOR", "POINT"); bark, dark = lin("#8a6545"), lin("#5a3f2b")
    for i, v in enumerate(ob.data.vertices):
        u = 0.5 + 0.5 * math.sin(v.co.x * 9 + v.co.z * 3) * math.sin(v.co.y * 7 - v.co.z * 2)
        ca.data[i].color = (*[bark[j] * (1 - u * 0.35) + dark[j] * u * 0.35 for j in range(3)], 1)
    ob.data.color_attributes.active_color = ca
    for p in ob.data.polygons: p.use_smooth = True
    return ob
def bez(p0, p1, p2, n): return [p0 * (1 - t) ** 2 + p1 * 2 * t * (1 - t) + p2 * t * t for t in [i / n for i in range(n + 1)]]
def export(path, objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_yup=True, use_selection=True, export_vertex_color="ACTIVE", export_normals=True)

def willow(seed):
    reset(); rng = random.Random(seed)
    R = rng.uniform(3.8, 4.4); Hc = rng.uniform(5.6, 6.2); lean = Vector((rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), 0))
    top = Vector((0, 0, Hc)) + lean * 0.6
    nl = rng.randint(6, 7); limbs = []
    for i in range(nl):   # each limb: a lump of leaves over its tip and a skirt hung under it
        a = i / nl * math.tau + rng.uniform(-0.2, 0.2); rr = R * rng.uniform(0.5, 0.72); tipz = Hc + rng.uniform(-0.2, 1.0)
        tipp = Vector((math.cos(a) * rr, math.sin(a) * rr, tipz)) + lean * 0.5
        lump = (tipp + Vector((0, 0, 0.35)), Vector((1, 1, 0.8)) * rng.uniform(1.35, 1.7))
        skirt = (Vector((math.cos(a) * R * 0.84, math.sin(a) * R * 0.84, tipz - 2.2)) + lean * 0.4, Vector((0.95, 0.95, 2.1)))
        limbs.append((a, tipp, lump, skirt, rng.uniform(0.5, 3.0)))
    crown = (top + Vector((0, 0, 1.5)), Vector((R * 0.5, R * 0.5, 2.1)))
    ells = [crown] + [l[2] for l in limbs] + [l[3] for l in limbs]
    hull = Hull(ells, 1.0)
    B = Build(); W = (1, 1, 1)
    axis = lambda p: Vector((p.x - lean.x * 0.45, p.y - lean.y * 0.45, 0))
    n_cards = 0
    for a, tipp, lump, skirt, bottom0 in limbs:
        part = Hull([lump, skirt], 0.8); col = rng.randrange(4)
        for _ in range(85):   # this limb's curtain
            p = hull.onto(part.sample(rng)); h = axis(p)
            if h.length < R * 0.45 or hull.n(p).z < -0.35: continue
            out_ = h.normalized(); nA = hull.n(p); a0 = p - nA * rng.uniform(0.05, 0.5)
            bottom = max(0.5, bottom0 + rng.uniform(-0.9, 0.9) + (1 - min(1, h.length / R)) * 2.0); L = a0.z - bottom
            if L < 0.8: continue
            yaw = rng.uniform(-0.7, 0.7); f = Vector((out_.x * math.cos(yaw) - out_.y * math.sin(yaw), out_.x * math.sin(yaw) + out_.y * math.cos(yaw), 0))
            side = f.cross(Vector((0, 0, 1))).normalized() * min(0.5, max(0.2, L / 8.0))
            ts = [i / 4 for i in range(5)]
            pts = [a0 + out_ * (0.35 * math.sin(math.pi * min(1, t * 2.2)) + 0.12 * t) * min(1, L / 2.5) + Vector((0, 0, -L * t)) for t in ts]   # a fountain: out over the arch, then straight down
            ns = [(nA * (1 - t) + Vector((axis(q).normalized().x, axis(q).normalized().y, 0.2)).normalized() * t).normalized() for q, t in zip(pts, ts)]
            k = (col + rng.choice((0, 0, 1))) % 4
            B.strip(pts, side, [1 - t for t in ts], ns, [W] * 5, f, u=(k / 4, (k + 1) / 4)); n_cards += 1
    for _ in range(520):    # strands draped over the lumps, running downhill
        p = hull.sample(rng); nn = hull.n(p)
        if nn.z < 0.25: continue
        down = (Vector((0, 0, -1)) + nn * nn.z).normalized(); down = (down + Vector((rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), 0))).normalized()
        L = rng.uniform(1.2, 2.0); a0 = p - nn * rng.uniform(0.0, 0.3) - down * L * 0.3; ts = [i / 3 for i in range(4)]
        pts = [hull.onto(a0 + down * L * t) + nn * 0.1 * math.sin(math.pi * t) for t in ts]
        side = down.cross(nn).normalized() * L / 6; k = rng.randrange(4)
        B.strip(pts, side, [1 - t for t in ts], [hull.n(q) for q in pts], [W] * 4, nn, u=(k / 4, (k + 1) / 4), vr=(0.35, 1)); n_cards += 1
    leaves = B.object("leaves", material("willow", willow_png))
    C = Build()
    for c, r in [crown] + [l[2] for l in limbs]: C.blob(c, Vector((max(0.3, r.x - 1.0), max(0.3, r.y - 1.0), max(0.3, r.z - 0.8))), hull.n, W)
    core = C.object("core", material("willow-core", rgb=lin("#6f9c40")))
    edges = []; bole = bez(Vector((0, 0, -0.2)), Vector((0, 0, 1.1)) + lean * 0.2, Vector((0, 0, 2.2)) + lean * 0.5, 4); edges += list(zip(bole[:-1], bole[1:]))
    fork = bole[-1]
    for i in range(6):
        a = i / 6 * math.tau + rng.uniform(-0.3, 0.3); r = rng.uniform(0.9, 1.5)
        pts = bez(Vector((0, 0, 0.5)), Vector((math.cos(a) * r * 0.5, math.sin(a) * r * 0.5, 0.1)), Vector((math.cos(a) * r, math.sin(a) * r, -0.25)), 3); edges += list(zip(pts[:-1], pts[1:]))
    for a, tipp, *_ in limbs:
        mid = fork.lerp(tipp, 0.45) + Vector((0, 0, 1.0)); pts = bez(fork, mid, tipp, 6); edges += list(zip(pts[:-1], pts[1:]))
    def rad(v):
        if v.z < 0.6 and Vector((v.x, v.y, 0)).length > 0.5: return 0.12
        if v.z < 2.3: return 0.42 + 0.18 * max(0, 0.6 - v.z)
        return max(0.06, 0.26 * (1 - (v - fork).length / (R * 0.9)))
    trunk = wood(edges, rad, "trunk"); trunk.data.materials.append(material("bark"))
    export(f"{out}/willow-{seed}-leaves.glb", [leaves, core]); export(f"{out}/willow-{seed}-wood.glb", [trunk])
    print("willow", seed, n_cards, "cards", len(B.f), "faces")

def broadleaf(name, seed, H, W, n, quads, core_hex):
    reset(); rng = random.Random(seed + 50)
    crown = Vector((0, 0, H * 0.68)); ells = [(crown, Vector((W * 0.5, W * 0.5, H * 0.3)))]
    for i in range(n):
        a = rng.uniform(0, math.tau); rr = W * rng.uniform(0.15, 0.38)
        ells.append((crown + Vector((math.cos(a) * rr, math.sin(a) * rr, H * rng.uniform(-0.12, 0.2))), Vector((1, 1, 0.8)) * W * rng.uniform(0.22, 0.32)))
    hull = Hull(ells, W * 0.18)
    B = Build(); area = sum(r.x * r.y + r.y * r.z + r.x * r.z for _, r in ells) * 4.2
    s0 = max(0.5, W * 0.16)
    for _ in range(int(area / (s0 * s0) * 1.4)):
        p = hull.sample(rng); nn = hull.n(p); s = s0 * rng.uniform(0.8, 1.25); depth = rng.uniform(0, s * 0.4)
        f = (nn + Vector((rng.uniform(-0.45, 0.45), rng.uniform(-0.45, 0.45), rng.uniform(-0.45, 0.45)))).normalized()
        roll = rng.uniform(0, math.tau); t1 = f.orthogonal().normalized(); t2 = f.cross(t1)
        side = (t1 * math.cos(roll) + t2 * math.sin(roll)) * s / 2; up_ = f.cross(side).normalized() * s / 2
        c0 = p - nn * depth; pts = [c0 + up_, c0 - up_]
        k = rng.choice(quads); u0, v0 = (k % 2) / 2, 1 - (k // 2 + 1) / 2
        B.strip(pts, side, [1, 0], [hull.n(q) for q in pts], [(1, 1, 1)] * 2, f, u=(u0, u0 + 0.5), vr=(v0, v0 + 0.5))
    C = Build()
    for c, r in ells: C.blob(c, Vector((max(0.2, r.x - s0 * 0.5), max(0.2, r.y - s0 * 0.5), max(0.2, r.z - s0 * 0.5))), hull.n, (1, 1, 1), sub=2)
    objs = [B.object("leaves", material("leaf", clump_png)), C.object("core", material("leaf-core", rgb=lin(core_hex)))]
    if H > 2:
        edges = []; trunk_pts = bez(Vector((0, 0, -0.2)), Vector((0, 0, H * 0.3)), crown - Vector((0, 0, H * 0.1)), 4); edges += list(zip(trunk_pts[:-1], trunk_pts[1:]))
        for c, _ in ells[1:]: pts = bez(trunk_pts[2], trunk_pts[2].lerp(c, 0.5) + Vector((0, 0, H * 0.06)), c, 3); edges += list(zip(pts[:-1], pts[1:]))
        trunk = wood(edges, lambda v: max(0.05, H * 0.035 * (1 - v.z / (H * 0.9)) + (0.08 if v.z < 0.3 else 0)), "trunk"); trunk.data.materials.append(material("bark")); objs.append(trunk)
    export(f"{out}/{name}.glb", objs); print(name, len(B.f), "faces")

for s in (0, 1, 2): willow(s)
for s, (H, W) in enumerate([(9, 6.5), (11, 7.5), (8, 6)]): broadleaf(f"tree-{s}", s, H, W, 6, (0, 1, 2), "#4a8636")
for s in (0, 1): broadleaf(f"bush-{s}", s + 10, 1.4, 2.2, 4, (1, 2, 3), "#55923c")
print("done")
