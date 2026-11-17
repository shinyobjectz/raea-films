# The mothership, fitted out: the solid's parts (raea solid export solids/mothership.ts --part hull|steel|lens|stripe)
# bevelled so their edges catch the sun, mapped in metres and plated with ambientCG's CC0 plate textures, a tone per
# panel, and the decks and the keel crowded with machinery: bevelled boxes, tanks, vents, pipe runs, radiator fins,
# domes and small towers, scattered by ray casts so each piece sits flat on one deck and none overlap.
#
#   raea blender run blender/mothership.py out/ship assets/textures/hull assets/models/mothership/mothership.glb
#
# Blender is z up: the ship's space (x, y up, z) imports as (x, -z, y), so here h is z and the tip points to +y.
import bpy, bmesh, json, math, os, random, sys
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree


def fail(why):
    print(f"FAILED  mothership.py: {why}")
    sys.exit(1)


args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(args) != 3:
    fail("usage: mothership.py PARTS_DIR TEXTURE_DIR OUT.glb")
SRC, TEX, OUT = args
PARTS = ["hull", "steel", "lens", "stripe"]
for p in PARTS:
    if not os.path.exists(os.path.join(SRC, p + ".glb.json")):
        fail(f"no licence sidecar beside {p}.glb")
for t in ["MetalPlates007", "MetalPlates005"]:
    if not os.path.exists(os.path.join(TEX, t + ".json")):
        fail(f"no licence sidecar for {t}")

bpy.ops.wm.read_factory_settings(use_empty=True)
rng = random.Random(7)

# ---- materials: three plate tones for what faces up, the larger panels for the sides, darker under; steel, dark and
# light machinery, the stripe
def image(name, colour):
    im = bpy.data.images.load(os.path.join(TEX, name), check_existing=True)
    im.colorspace_settings.name = "sRGB" if colour else "Non-Color"
    return im


def new_material(name):
    m = bpy.data.materials.new(name)
    if m.node_tree is None or "Principled BSDF" not in m.node_tree.nodes:
        m.use_nodes = True
    return m


def plated(name, tex, tint):
    m = new_material(name)
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    c = nt.nodes.new("ShaderNodeTexImage"); c.image = image(tex + "_color.png", True)
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    a_in = next(i for i in mix.inputs if i.name == "A" and i.type == "RGBA")
    b_in = next(i for i in mix.inputs if i.name == "B" and i.type == "RGBA")
    out = next(o for o in mix.outputs if o.type == "RGBA")
    nt.links.new(c.outputs["Color"], a_in)
    b_in.default_value = (*tint, 1.0)
    nt.links.new(out, b.inputs["Base Color"])
    mr = nt.nodes.new("ShaderNodeTexImage"); mr.image = image(tex + "_mr.png", False)
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(mr.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Green"], b.inputs["Roughness"])
    nt.links.new(sep.outputs["Blue"], b.inputs["Metallic"])
    n = nt.nodes.new("ShaderNodeTexImage"); n.image = image(tex + "_normal.png", False)
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(n.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


def plain(name, rgb, metal, rough):
    m = new_material(name)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    return m


def lin(hexs):
    def c(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return tuple(c(int(hexs[i:i + 2], 16)) for i in (1, 3, 5))


MATS = [
    plated("plate-a", "MetalPlates007", (1.0, 1.0, 1.0)),
    plated("plate-b", "MetalPlates007", (0.80, 0.78, 0.74)),
    plated("plate-c", "MetalPlates007", (0.62, 0.65, 0.68)),
    plated("side", "MetalPlates005", (0.78, 0.79, 0.80)),
    plated("under", "MetalPlates005", (0.52, 0.53, 0.55)),
    plain("steel", lin("#9a9ea2"), 1.0, 0.32),
    plain("dark", lin("#2b2e31"), 0.6, 0.55),
    plain("light", lin("#b4b6b3"), 0.2, 0.6),
    plain("stripe", lin("#b8582a"), 0.0, 0.6),
]
PLATE_A, PLATE_B, PLATE_C, SIDE, UNDER, STEEL, DARK, LIGHT, STRIPE = range(len(MATS))
TILE = {PLATE_A: 16.0, PLATE_B: 16.0, PLATE_C: 16.0, SIDE: 20.0, UNDER: 20.0}


# ---- the parts
def load(part):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, part + ".glb"))
    new = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
    if len(new) != 1:
        fail(f"{part}.glb: expected one mesh, found {len(new)}")
    o = new[0]
    o.name = part
    o.data.name = part
    # bake its transform into the mesh, so every part is in the same space
    mw = o.matrix_world.copy()
    o.parent = None
    o.data.transform(mw)
    o.matrix_world = Matrix()
    o.data.materials.clear()
    for m in MATS:
        o.data.materials.append(m)
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(1.0), use_dissolve_boundaries=False, verts=bm.verts, edges=bm.edges)
    bm.to_mesh(o.data); bm.free()
    for p in o.data.polygons:
        p.use_smooth = False
    return o


objs = {p: load(p) for p in PARTS}
# the empties the importer made
for o in list(bpy.data.objects):
    if o.type != "MESH":
        bpy.data.objects.remove(o)


def assign(o, pick):
    me = o.data
    n = np.zeros(len(me.polygons) * 3); me.polygons.foreach_get("normal", n); n = n.reshape(-1, 3)
    c = np.zeros(len(me.polygons) * 3); me.polygons.foreach_get("center", c); c = c.reshape(-1, 3)
    mi = np.array([pick(i, n[i], c[i]) for i in range(len(n))], dtype=np.int32)
    me.polygons.foreach_set("material_index", mi)


def hull_mat(i, n, c):
    if n[2] > 0.7:
        # a tone per panel, from where the panel is
        return [PLATE_A, PLATE_A, PLATE_B, PLATE_C][hash((round(c[0] / 3), round(c[1] / 3), round(c[2]))) % 4]
    return SIDE if n[2] > -0.7 else UNDER


assign(objs["hull"], hull_mat)
assign(objs["steel"], lambda i, n, c: STEEL)
# the lens pod: steel, its recessed face dark where the glass sits
assign(objs["lens"], lambda i, n, c: DARK if (n[2] < -0.7 and c[2] > -48.5) else STEEL)
assign(objs["stripe"], lambda i, n, c: STRIPE)


def cube_uvs(me):
    """UVs in metres over each face's main axis, divided by its material's tile"""
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    nP = len(me.polygons)
    n = np.zeros(nP * 3); me.polygons.foreach_get("normal", n); n = n.reshape(-1, 3)
    ls = np.zeros(nP, dtype=np.int32); me.polygons.foreach_get("loop_start", ls)
    lt = np.zeros(nP, dtype=np.int32); me.polygons.foreach_get("loop_total", lt)
    mi = np.zeros(nP, dtype=np.int32); me.polygons.foreach_get("material_index", mi)
    vi = np.zeros(len(me.loops), dtype=np.int32); me.loops.foreach_get("vertex_index", vi)
    co = np.zeros(len(me.vertices) * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
    axis = np.argmax(np.abs(n), axis=1)
    tile = np.array([TILE.get(int(m), 8.0) for m in mi])
    la = np.repeat(axis, lt); lti = np.repeat(tile, lt)
    p = co[vi]
    u = np.where(la == 0, p[:, 1], p[:, 0])
    v = np.where(la == 2, p[:, 1], p[:, 2])
    uv = np.stack([u / lti, v / lti], 1).astype(np.float32).ravel()
    me.uv_layers[0].data.foreach_set("uv", uv)


# ---- the machinery: pieces at unit size, their origin at the middle of their base
def piece(build):
    bm = bmesh.new()
    build(bm)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.verts.index_update(); bm.verts.ensure_lookup_table()
    v = np.array([x.co[:] for x in bm.verts], dtype=np.float64)
    f = [[x.index for x in face.verts] for face in bm.faces]
    bm.free()
    return v, f


def box(bm, sx, sy, sz, x=0.0, y=0.0, z=0.0, bevel=0.06):
    r = bmesh.ops.create_cube(bm, size=1.0)
    vs = r["verts"]
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=vs)
    bmesh.ops.translate(bm, vec=(x, y, z + sz / 2), verts=vs)
    if bevel > 0:
        es = list({e for v in vs for e in v.link_edges})
        bmesh.ops.bevel(bm, geom=list(vs) + es, offset=bevel * min(sx, sy, sz), segments=1, affect="EDGES", profile=0.5)


def cyl(bm, r1, r2, h, x=0.0, y=0.0, z=0.0, seg=14, axis="z"):
    res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=h)
    vs = res["verts"]
    bmesh.ops.translate(bm, vec=(0, 0, h / 2), verts=vs)
    if axis == "x":
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, "Y"), verts=vs)
    bmesh.ops.translate(bm, vec=(x, y, z), verts=vs)


def b_box(bm): box(bm, 1, 1, 1)
def b_step(bm): box(bm, 1, 1, 0.55); box(bm, 0.6, 0.7, 0.45, 0.12, -0.08, 0.55)
def b_tank(bm): cyl(bm, 0.5, 0.5, 0.8); cyl(bm, 0.5, 0.32, 0.2, z=0.8); box(bm, 1.06, 0.2, 0.12, bevel=0)
def b_htank(bm):
    cyl(bm, 0.36, 0.36, 1.0, x=-0.5, z=0.5, axis="x")
    for x in (-0.3, 0.3):
        box(bm, 0.12, 0.8, 0.3, x=x, bevel=0)
def b_vent(bm):
    box(bm, 1, 1, 0.3)
    for k in range(6):
        box(bm, 0.07, 0.86, 0.22, x=-0.36 + k * 0.144, z=0.3, bevel=0)
def b_pipes(bm):
    for y in (-0.3, 0.0, 0.3):
        cyl(bm, 0.11, 0.11, 1.0, x=-0.5, y=y, z=0.2, seg=10, axis="x")
    for x in (-0.38, 0.38):
        box(bm, 0.08, 0.9, 0.2, x=x, bevel=0)
def b_fins(bm):
    box(bm, 1, 1, 0.14)
    for k in range(8):
        box(bm, 0.035, 0.92, 0.86, x=-0.42 + k * 0.12, z=0.14, bevel=0)
def b_dome(bm):
    cyl(bm, 0.5, 0.5, 0.18, seg=20)
    r = bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=10, radius=0.44)
    lower = [v for v in r["verts"] if v.co.z < -1e-4]
    bmesh.ops.delete(bm, geom=lower, context="VERTS")
    bmesh.ops.translate(bm, vec=(0, 0, 0.18), verts=[v for v in r["verts"] if v.is_valid])
def b_tower(bm):
    box(bm, 1, 1, 0.45); box(bm, 0.7, 0.62, 0.3, z=0.45); box(bm, 0.42, 0.36, 0.17, z=0.75)
    cyl(bm, 0.025, 0.02, 0.25, x=0.1, z=0.75 + 0.17 * 0.5, seg=6)
def b_dish(bm):
    cyl(bm, 0.06, 0.06, 0.45, seg=8); cyl(bm, 0.12, 0.5, 0.18, z=0.45, seg=20)


LIB = {k: piece(b) for k, b in [("box", b_box), ("step", b_step), ("tank", b_tank), ("htank", b_htank), ("vent", b_vent), ("pipes", b_pipes), ("fins", b_fins), ("dome", b_dome), ("tower", b_tower), ("dish", b_dish)]}

# what each scatter places: kind, how many, footprint range (m), height as a range of the footprint, materials
TOP = [
    ("tower", 26, (14, 26), (0.9, 1.6), [DARK, PLATE_B, LIGHT]),
    ("htank", 40, (14, 30), (0.35, 0.45), [LIGHT, PLATE_A, STEEL]),
    ("tank", 60, (8, 16), (0.55, 0.9), [LIGHT, PLATE_A, PLATE_C]),
    ("fins", 50, (8, 16), (0.35, 0.5), [STEEL, DARK]),
    ("dome", 24, (8, 14), (0.5, 0.6), [LIGHT, PLATE_A]),
    ("dish", 18, (6, 10), (0.6, 0.8), [LIGHT, STEEL]),
    ("step", 260, (5, 12), (0.2, 0.45), [PLATE_A, PLATE_B, PLATE_C, DARK]),
    ("vent", 260, (4, 9), (0.15, 0.25), [DARK, PLATE_C, STEEL]),
    ("pipes", 220, (4, 14), (0.18, 0.24), [STEEL, DARK, LIGHT]),
    ("box", 900, (2, 6), (0.2, 0.7), [PLATE_A, PLATE_B, PLATE_C, DARK, LIGHT]),
    ("box", 2600, (0.8, 2.4), (0.25, 0.9), [PLATE_A, PLATE_B, PLATE_C, DARK, LIGHT, STEEL]),
]
UNDER_SET = [
    ("htank", 30, (12, 26), (0.35, 0.45), [UNDER, STEEL, DARK]),
    ("fins", 30, (8, 14), (0.3, 0.45), [DARK, STEEL]),
    ("step", 160, (5, 12), (0.2, 0.4), [UNDER, DARK]),
    ("pipes", 160, (4, 14), (0.18, 0.24), [STEEL, DARK]),
    ("box", 1200, (1, 4), (0.25, 0.6), [UNDER, DARK, STEEL]),
]


def scatter(sets, down):
    """ray casts from above (or below) onto the hull; a piece goes where its whole footprint is one flat face"""
    bm = bmesh.new()
    for o in objs.values():
        bm.from_mesh(o.data)
    tree = BVHTree.FromBMesh(bm)
    bm.free()
    hull_bm = bmesh.new(); hull_bm.from_mesh(objs["hull"].data)
    hull_tree = BVHTree.FromBMesh(hull_bm); hull_bm.free()
    xs = [v.co.x for v in objs["hull"].data.vertices]; ys = [v.co.y for v in objs["hull"].data.vertices]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    start = 400.0 if down else -400.0
    d = Vector((0, 0, -1)) if down else Vector((0, 0, 1))
    taken = set()
    verts, faces, mats = [], [], []
    nv = 0
    placed = {}

    def hit(x, y):
        h = tree.ray_cast(Vector((x, y, start)), d, 900)
        if h[0] is None:
            return None
        hh = hull_tree.ray_cast(Vector((x, y, start)), d, 900)
        if hh[0] is None or abs(hh[0].z - h[0].z) > 1e-3:
            return None  # the first thing there is steel or the lens, not the hull
        n = h[1]
        if (n.z < 0.985) if down else (n.z > -0.985):
            return None
        return h[0].z

    for kind, count, (f0, f1), (h0, h1), mlist in sets:
        got, tries = 0, 0
        lv, lf = LIB[kind]
        while got < count and tries < count * 200:
            tries += 1
            x, y = rng.uniform(x0, x1), rng.uniform(y0, y1)
            w = rng.uniform(f0, f1); dd = w * rng.uniform(0.6, 1.0)
            if kind in ("htank", "pipes"):
                dd = w * rng.uniform(0.3, 0.5)
            turn = rng.choice([0, 1, 2, 3])
            hw, hd = (w, dd) if turn % 2 == 0 else (dd, w)
            z = hit(x, y)
            if z is None:
                continue
            ok = True
            for cx, cy in ((-0.5, -0.5), (0.5, -0.5), (-0.5, 0.5), (0.5, 0.5), (0, -0.5), (0, 0.5), (-0.5, 0), (0.5, 0)):
                zz = hit(x + cx * hw, y + cy * hd)
                if zz is None or abs(zz - z) > 0.05:
                    ok = False
                    break
            if not ok:
                continue
            cells = {(i, j) for i in range(math.floor((x - hw / 2 - 0.6) / 1.0), math.floor((x + hw / 2 + 0.6) / 1.0) + 1) for j in range(math.floor((y - hd / 2 - 0.6) / 1.0), math.floor((y + hd / 2 + 0.6) / 1.0) + 1)}
            if cells & taken:
                continue
            taken |= cells
            h = w * rng.uniform(h0, h1)
            rot = np.array(Matrix.Rotation(turn * math.pi / 2, 3, "Z"))
            v = lv * np.array([w, dd, h])
            v = v @ rot.T
            if not down:
                v[:, 2] *= -1  # hung under the keel: reflected, its faces turned back below
            v += np.array([x, y, z + (-0.02 if down else 0.02)])
            verts.append(v)
            faces.extend([[i + nv for i in (f if down else f[::-1])] for f in lf])
            m = rng.choice(mlist)
            mats.extend([m] * len(lf))
            nv += len(v)
            got += 1
        placed[kind] = placed.get(kind, 0) + got
    me = bpy.data.meshes.new("greebles-" + ("top" if down else "under"))
    me.from_pydata(np.concatenate(verts).tolist(), [], faces)
    me.update()
    for m in MATS:
        me.materials.append(m)
    me.polygons.foreach_set("material_index", np.array(mats, dtype=np.int32))
    for p in me.polygons:
        p.use_smooth = False
    o = bpy.data.objects.new(me.name, me)
    bpy.context.scene.collection.objects.link(o)
    print(("top" if down else "under"), "placed", placed)
    return o


top = scatter(TOP, True)
under = scatter(UNDER_SET, False)

# ---- bevels on the parts (the pieces have their own); UVs on everything
for name, width in [("hull", 0.35), ("steel", 0.25), ("lens", 0.3), ("stripe", 0.08)]:
    o = objs[name]
    bv = o.modifiers.new("bevel", "BEVEL")
    bv.width = width; bv.segments = 2; bv.limit_method = "ANGLE"; bv.angle_limit = math.radians(35)
    bv.use_clamp_overlap = True; bv.harden_normals = True
    for p in o.data.polygons:
        p.use_smooth = True
    # apply it here, so the UVs are made on the bevelled mesh
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.modifier_apply(modifier="bevel")
    o.select_set(False)
for o in list(objs.values()) + [top, under]:
    cube_uvs(o.data)

# triangles for the exporter's tangents (the normal maps need them), the bevels' hardened normals kept
for o in bpy.data.objects:
    if o.type == "MESH":
        t = o.modifiers.new("tri", "TRIANGULATE")
        if hasattr(t, "keep_custom_normals"):
            t.keep_custom_normals = True
tris = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == "MESH"}
print("triangles", tris, "total", sum(tris.values()))
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_tangents=True, export_normals=True,
                          export_texcoords=True, export_materials="EXPORT", export_image_format="AUTO", export_yup=True,
                          export_cameras=False, export_lights=False)
side = {
    "source": "solids/mothership.ts (raea solid export), fitted out by blender/mothership.py; plate textures ambientCG MetalPlates007 and MetalPlates005",
    "license": "built in code for this project; textures CC0",
    "credit": "ambientCG.com",
    "steps": [{"step": "mothership.py", "parts": PARTS, "triangles": sum(tris.values())}],
}
json.dump(side, open(OUT + ".json", "w"), indent=2)
print("WROTE", OUT)
