# The glade: a dense forest floor from scanned things (Poly Haven, CC0) and modelled mushrooms, for the shots in the
# road's old slot (song 56.63-63.16). the director, 11-12: "forest logs fauna moss mushrooms ferns maybe then a close up of
# water droplets form the edge of the fern. maybe start with the ferm and then cut to the wider shot and then an even
# wider shot then the dock", "should be a super dense scene". v3/glade.tsx stands them.
# Components in media/models/glade (Blender's z up; raea's y up):
#   fern-hero   Fern 02's frond A at 4k (the close-up's fern); fern-b, fern-c, fern-d the others at 2k
#   log         Dead Tree Trunk (a fallen log 3 m long) at 4k     stump  Tree Stump 02 at 4k
#   rocks       Rock Moss Set 02 at 4k                             roots  Root Cluster 01 at 2k
#   branches    Dry Branches Medium 01 at 2k
#   moss-1..3   Moss 01's scanned clumps, four to a patch (its alpha clipped, not blended, so thousands sort)
#   floor       8 x 8 m of Forest Leaves 02 (moss, needles and twigs) at 4k, pushed up by its own height map
#   tuft, bonnets, shelves   modelled mushrooms: a tuft of sulphur-tuft caps, a few thin bonnets, bracket shelves
# Beside them, data for the scene (raea's axes, metres, in each component's own space):
#   NAME-skin.json   points on the log, stump and rocks: "up" (facing up: moss, bonnets), "side" (shelves), each
#                    [x, y, z, nx, ny, nz]
#   fern-hero-tips.json   where water gathers on the hero frond: its leaflets' lowest tips, [x, y, z] each
#   bash: raea blender run blender/glade.py
import os, sys, math, json, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp, bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix, noise
from mathutils.kdtree import KDTree

MADE = "blender/glade.py"
PLACE = "glade"
OUT = os.path.join(comp.PROJECT, "media", "models", PLACE)
os.makedirs(OUT, exist_ok=True)


def raea(v):
    """Blender's (x, y, z) to raea's (x, z, -y)"""
    return [round(float(v[0]), 5), round(float(v[2]), 5), round(float(-v[1]), 5)]


def clip_alpha(objs):
    """Alpha through a > 0.5 step, which the glTF exporter writes as MASK (cutoff 0.5) instead of BLEND"""
    seen = set()
    for o in objs:
        for s in o.material_slots:
            m = s.material
            if m is None or m.name in seen or not m.use_nodes:
                continue
            seen.add(m.name)
            nt = m.node_tree
            b = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
            if b is None or not b.inputs["Alpha"].links:
                continue
            src = b.inputs["Alpha"].links[0].from_socket
            if src.node.type == "MATH":
                continue
            g = nt.nodes.new("ShaderNodeMath")
            g.operation = "GREATER_THAN"
            g.inputs[1].default_value = 0.5
            nt.links.new(src, g.inputs[0])
            nt.links.new(g.outputs[0], b.inputs["Alpha"])


def opaque(objs):
    """no alpha at all (a set without an Alpha map: its glTF's alpha from a JPEG is noise, and BLEND isn't instanced)"""
    for o in objs:
        for sl in o.material_slots:
            m = sl.material
            if m is None or not m.use_nodes:
                continue
            b = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
            if b is not None:
                for l in list(b.inputs["Alpha"].links):
                    m.node_tree.links.remove(l)
                b.inputs["Alpha"].default_value = 1.0
            try:
                m.surface_render_method = "DITHERED"
                m.blend_method = "OPAQUE"
            except (AttributeError, TypeError):
                pass


def done(col, root, name, source, credit, license="CC0", notes=None):
    bpy.context.view_layer.update()
    comp.export(col, root, PLACE, name, made=MADE, source=source, license=license, credit=credit, notes=notes)
    for o in list(col.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)
    comp.purge()


def tris(objs):
    """Every triangle of the meshes in world space: (A, B, C, normals, uvs or None)"""
    dg = bpy.context.evaluated_depsgraph_get()
    P, N, UV = [], [], []
    for o in objs:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        me.calc_loop_triangles()
        mw = o.matrix_world
        co = np.array([mw @ v.co for v in me.vertices])
        lt = np.array([t.vertices[:] for t in me.loop_triangles])
        P.append(co[lt])
        uvl = me.uv_layers.active
        if uvl is not None:
            uvs = np.array([d.uv[:] for d in uvl.data])
            UV.append(uvs[np.array([t.loops[:] for t in me.loop_triangles])])
        ev.to_mesh_clear()
    T = np.concatenate(P)
    n = np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0])
    area = np.linalg.norm(n, axis=1) / 2
    n = n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
    return T, n, area, (np.concatenate(UV) if UV else None)


def sample(T, area, k, rng):
    """k points spread over the triangles by area: (index of the triangle, barycentric weights)"""
    i = rng.choice(len(T), size=k, p=area / area.sum())
    a, b = rng.random(k), rng.random(k)
    flip = a + b > 1
    a[flip], b[flip] = 1 - a[flip], 1 - b[flip]
    w = np.stack([1 - a - b, a, b], 1)
    return i, w


def skin(name, objs, k=6000, seed=1):
    """NAME-skin.json: points over the component, "up" where it faces up (moss, bonnets), "side" where it faces out
    sideways (shelves), in raea's axes"""
    rng = np.random.default_rng(seed)
    T, n, area, _ = tris(objs)
    i, w = sample(T, area, k, rng)
    p = (T[i] * w[:, :, None]).sum(1)
    nn = n[i]
    # (a scan's normals can face in: turn each to point away from the part's middle axis)
    mid = T.reshape(-1, 3).mean(0)
    out = p - mid
    out[:, 2] = np.maximum(out[:, 2], 0) + 0.2 * np.abs(out[:, 2])
    nn[(nn * out).sum(1) < 0] *= -1
    up = nn[:, 2] > 0.55
    side = (np.abs(nn[:, 2]) < 0.35)
    def pack(m):
        return [raea(q) + raea(v)[:3] for q, v in zip(p[m], nn[m])]
    data = {"up": pack(up), "side": pack(side)}
    with open(os.path.join(OUT, f"{name}-skin.json"), "w") as f:
        json.dump(data, f, separators=(",", ":"))
    print("skin", name, "up", int(up.sum()), "side", int(side.sum()))


def tips(name, objs, tex, ch=3, k=400000, seed=2):
    """NAME-tips.json: the frond's lowest leaflet tips (where water runs to and hangs): points the alpha says are leaf,
    lower than every other leaf point within 7 mm, at a leaf's edge"""
    rng = np.random.default_rng(seed)
    im = bpy.data.images.load(tex, check_existing=True)
    w_, h_ = im.size
    px = np.empty(w_ * h_ * im.channels, dtype=np.float32)
    im.pixels.foreach_get(px)
    alpha = px.reshape(h_, w_, im.channels)[:, :, min(ch, im.channels - 1)]
    print("tips alpha", tex, im.size[:], im.channels, "mean", float(alpha.mean()))
    T, n, area, UV = tris(objs)
    i, w = sample(T, area, k, rng)
    p = (T[i] * w[:, :, None]).sum(1)
    uv = (UV[i] * w[:, :, None]).sum(1)
    def a_at(u):
        x = np.clip((u[:, 0] % 1.0) * w_, 0, w_ - 1).astype(int)
        y = np.clip((u[:, 1] % 1.0) * h_, 0, h_ - 1).astype(int)
        return alpha[y, x]
    leaf = a_at(uv) > 0.5
    p, uv = p[leaf], uv[leaf]
    # at an edge: some nearby texel (a few texels away in uv) is clear
    e = 3.0 / w_
    edge = np.zeros(len(p), dtype=bool)
    for du, dv in ((e, 0), (-e, 0), (0, e), (0, -e)):
        edge |= a_at(uv + np.array([du, dv])) < 0.5
    kd = KDTree(len(p))
    for j, q in enumerate(p):
        kd.insert(q, j)
    kd.balance()
    out = []
    for j in np.nonzero(edge)[0]:
        q = p[j]
        lower = False
        for (c, _, _) in kd.find_range(q, 0.007):
            if c.z < q[2] - 1e-5:
                lower = True
                break
        if not lower:
            out.append(raea(q))
    # one a leaflet: drop tips within 4 mm of one already kept
    keep = []
    for q in sorted(out, key=lambda q: q[1]):
        if all((q[0] - r[0]) ** 2 + (q[1] - r[1]) ** 2 + (q[2] - r[2]) ** 2 > 0.004 ** 2 for r in keep):
            keep.append(q)
    with open(os.path.join(OUT, f"{name}-tips.json"), "w") as f:
        json.dump(keep, f, separators=(",", ":"))
    print("tips", name, len(keep), "of", len(p), "leaf points")


def moss_shell(name, objs, up=0.3, thick=0.012, seed=0, tile=1.2):
    """NAME-moss.glb: a moss blanket over the part's upward faces, its own surface pushed out up to `thick` (thickest
    where it faces most up, thinning to nothing at its ragged edges) and covered by Forest Leaves 02's moss"""
    dg = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new()
    me = bpy.data.meshes.new("tmp")
    for o in objs:
        ev = o.evaluated_get(dg)
        m = ev.to_mesh()
        m2 = m.copy()
        m2.transform(o.matrix_world)
        bm.from_mesh(m2)
        bpy.data.meshes.remove(m2)
        ev.to_mesh_clear()
    bm.normal_update()
    mid = sum((v.co for v in bm.verts), Vector()) / max(1, len(bm.verts))
    # (scans' normals can face in: judge each face by its normal turned away from the part's middle)
    def outward(f):
        n = f.normal.copy()
        if n.dot(f.calc_center_median() - mid) < 0 and abs(n.z) < 0.9:
            n = -n
        return n
    def mask(p):
        return 0.55 + 0.6 * noise.noise(p * 3.1 + Vector((seed, 0, 0))) + 0.35 * noise.noise(p * 11.0)
    drop = [f for f in bm.faces if outward(f).z < up or mask(f.calc_center_median()) < 0.15]
    bmesh.ops.delete(bm, geom=drop, context="FACES")
    bm.verts.ensure_lookup_table()
    bm.normal_update()
    for v in bm.verts:
        n = v.normal
        if n.z < 0:
            n = -n
        k = max(0.0, min(1.0, (mask(v.co) - 0.15) / 0.5)) * max(0.0, min(1.0, (n.z - up) / 0.3))
        edge = 0.0 if v.is_boundary else 1.0
        v.co += n * (0.0015 + thick * k * edge * (0.7 + 0.3 * noise.noise(v.co * 40.0)))
    col, root = comp.fresh(name + "_moss")
    me = bpy.data.meshes.new(name + "_moss")
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name + "_moss", me)
    col.objects.link(o)
    for p in me.polygons:
        p.use_smooth = True
    comp.uv_box(o, 1.0)
    me.materials.append(comp.ph_texture("glade_moss", "forest_leaves_02", tile=tile, res="4k"))
    comp.link(col, root, o, name=name + "_moss")
    print("moss shell", name, len(me.polygons))
    return col, root


# --- the scans -----------------------------------------------------------------------------------------------

def with_alpha(objs, asset, res):
    """Poly Haven's glTFs for the alpha-cut plants point at a JPEG diffuse with no alpha (every leaf a solid card): the
    diffuse with the set's own Alpha map in its alpha, as an RGBA PNG, in the base colour's place"""
    import subprocess
    files = comp.api("files/" + asset)
    d = os.path.join(comp.CACHE, "polyhaven", "models", asset, res, "textures")
    diff = comp.fetch(files["Diffuse"][res]["jpg"]["url"], os.path.join(d, f"{asset}_diff_{res}.jpg"))
    alpha = comp.fetch(files["Alpha"][res]["png"]["url"], os.path.join(d, f"{asset}_alpha_{res}.png"))
    out = os.path.join(d, f"{asset}_diffalpha_{res}.png")
    if not os.path.isfile(out):
        subprocess.run(["magick", diff, "(", alpha, "-colorspace", "gray", ")", "-alpha", "off", "-compose", "CopyOpacity", "-composite", "PNG32:" + out], check=True)
    im = bpy.data.images.load(out, check_existing=True)
    for o in objs:
        for s in o.material_slots:
            for n in s.material.node_tree.nodes:
                if n.type == "TEX_IMAGE" and n.image is not None and "_diff_" in os.path.basename(n.image.filepath):
                    n.image = im
    return out


def scan(name, asset, res, keep=None, turn=0.0, after=None, alpha=False, moss=None):
    col, root, parts, credit = comp.ph_component(PLACE, name.replace("-", "_"), asset, res=res, keep=keep, turn=turn)
    objs = [o for o in col.all_objects if o.type == "MESH"]
    if alpha:
        with_alpha(objs, asset, res)
    clip_alpha(objs)
    if after:
        after(objs)
    if moss:
        mcol, mroot = moss_shell(name, objs, **moss)
        mcol_objs = list(mcol.all_objects)
        comp.export(mcol, mroot, PLACE, name + "-moss", made=MADE, source=f"own geometry over https://polyhaven.com/a/{asset}; moss: https://polyhaven.com/a/forest_leaves_02", license="ours; CC0 parts", credit=credit)
        for ob in mcol_objs:
            bpy.data.objects.remove(ob, do_unlink=True)
    done(col, root, name, f"https://polyhaven.com/a/{asset}", credit)


def fern_tips(objs):
    """the hero frond's tips, from its diffuse-with-alpha"""
    tips("fern-hero", objs, os.path.join(comp.CACHE, "polyhaven", "models", "fern_02", "4k", "textures", "fern_02_diffalpha_4k.png"), 3)


scan("fern-hero", "fern_02", "4k", keep=lambda n: n.startswith("fern_02_a"), after=fern_tips, alpha=True)
for v in "bcd":
    scan(f"fern-{v}", "fern_02", "2k", keep=lambda n, v=v: n.startswith(f"fern_02_{v}"), alpha=True)
scan("log", "dead_tree_trunk", "4k", after=lambda objs: skin("log", objs), moss=dict(up=0.25, thick=0.014, seed=1))
scan("stump", "tree_stump_02", "4k", after=lambda objs: skin("stump", objs), moss=dict(up=0.35, thick=0.012, seed=2))
scan("rocks", "rock_moss_set_02", "4k", after=lambda objs: skin("rocks", objs), moss=dict(up=0.4, thick=0.02, seed=3, tile=2.0))
scan("roots", "root_cluster_01", "2k")
scan("branches", "dry_branches_medium_01", "2k")


# the moss: Moss 01's twelve clumps, four to a patch, drawn together round the patch's middle
def moss_patch(i, names):
    def keep(n):
        return any(n.startswith(f"moss_01_{c}_") or n == f"moss_01_{c}" for c in names)
    col, root, parts, credit = comp.ph_component(PLACE, f"moss_{i}", "moss_01", res="2k", keep=keep)
    objs = [o for o in col.all_objects if o.type == "MESH"]
    with_alpha(objs, "moss_01", "2k")
    clip_alpha(objs)
    rng = random.Random(i)
    for j, o in enumerate(objs):
        lo, hi = comp.box_of(o)
        c = (lo + hi) / 2
        a = 2 * math.pi * j / len(objs) + rng.random()
        r = 0.035 + 0.03 * rng.random()
        o.matrix_world = Matrix.Translation(Vector((r * math.cos(a) - c.x, r * math.sin(a) - c.y, -lo.z))) @ o.matrix_world
    done(col, root, f"moss-{i}", "https://polyhaven.com/a/moss_01 (its clumps, four to a patch)", credit)


for i, names in enumerate((("a", "b", "c", "d"), ("e", "f", "g", "h"), ("i", "j", "tall_a", "tall_b")), 1):
    moss_patch(i, names)


# --- the floor ---------------------------------------------------------------------------------------------

def floor(size=8.0, step=0.01, tile=3.0, depth=0.045, asset="forest_leaves_02"):
    files = comp.api("files/" + asset)
    f = files["Displacement"]["4k"]["png"]
    path = comp.fetch(f["url"], os.path.join(comp.CACHE, "polyhaven", "tex", asset, os.path.basename(f["url"])))
    im = bpy.data.images.load(path, check_existing=True)
    w_, h_ = im.size
    px = np.empty(w_ * h_ * im.channels, dtype=np.float32)
    im.pixels.foreach_get(px)
    d = px.reshape(h_, w_, im.channels)[:, :, 0]
    n = int(size / step) + 1
    xs = np.linspace(-size / 2, size / 2, n)
    X, Y = np.meshgrid(xs, xs)
    u = ((X / tile) % 1.0 * (w_ - 1)).astype(int)
    v = ((Y / tile) % 1.0 * (h_ - 1)).astype(int)
    hgt = d[v, u]
    Z = (hgt - np.median(hgt)) * depth
    # (a soft swell under the log and round the glade, so it isn't a table top)
    Z += 0.06 * np.sin(X * 0.9 + 0.4) * np.cos(Y * 0.7) + 0.04 * np.sin(X * 2.3 - Y * 1.7)
    verts = np.stack([X, Y, Z], -1).reshape(-1, 3)
    i = (np.arange(n - 1)[:, None] * n + np.arange(n - 1)[None, :]).reshape(-1)
    faces = np.stack([i, i + 1, i + n + 1, i + n], -1)
    col, root = comp.fresh("floor")
    me = bpy.data.meshes.new("floor")
    me.from_pydata(verts.tolist(), [], faces.tolist())
    uvl = me.uv_layers.new(name="UVMap")
    U = np.stack([X / tile, Y / tile], -1).reshape(-1, 2)
    uvl.data.foreach_set("uv", U[faces.reshape(-1)].ravel())
    me.polygons.foreach_set("use_smooth", np.ones(len(me.polygons), dtype=bool))
    me.validate()
    me.materials.append(comp.ph_texture("glade_floor", asset, tile=1.0, res="4k"))
    o = bpy.data.objects.new("floor", me)
    col.objects.link(o)
    comp.link(col, root, o, name="floor")
    # the height the scene stands things on: the same surface every 5 cm, raea's axes (x, z -> y)
    k = 5
    hf = {"size": size, "n": len(xs[::k]), "step": step * k, "y": np.round(Z[::k, ::k][::-1].reshape(-1), 4).tolist()}
    # (rows from raea's -z (Blender's +y) first, so row r, column c is x = -size/2 + c*step, z = -size/2 + r*step)
    with open(os.path.join(OUT, "floor-height.json"), "w") as fh:
        json.dump(hf, fh, separators=(",", ":"))
    done(col, root, "floor", f"own geometry; texture and heights: https://polyhaven.com/a/{asset}", "Poly Haven (Rob Tuytel)", license="ours; texture CC0")


floor()


# --- the ground cover: every plant, stone and stick of each set its own component, cut to a budget of triangles -------

def cover(name, asset, res, parts=6, cap=6000, alpha=None):
    """media/models/glade/NAME-1..N.glb: up to `parts` of the set's plants (its LOD0s), each standing at its own bottom
    centre and thinned to `cap` triangles"""
    files = comp.api("files/" + asset)
    if alpha is None:
        alpha = "Alpha" in files
    objs = comp.ph_model(asset, res)
    names = sorted({o.name.split(".")[0] for o in objs if o.type == "MESH" and ("LOD" not in o.name or "LOD0" in o.name)})
    for o in objs:
        bpy.data.objects.remove(o, do_unlink=True)
    comp.purge()
    pick = [names[round(i * (len(names) - 1) / max(1, min(parts, len(names)) - 1))] for i in range(min(parts, len(names)))] if len(names) > 1 else names
    for i, nm in enumerate(dict.fromkeys(pick), 1):
        col, root, _, credit = comp.ph_component(PLACE, f"{name}_{i}", asset, res=res, keep=lambda n, nm=nm: n.split(".")[0] == nm)
        ms = [o for o in col.all_objects if o.type == "MESH"]
        if alpha:
            with_alpha(ms, asset, res)
            clip_alpha(ms)
        else:
            opaque(ms)
        for o in ms:
            t = sum(len(p.vertices) - 2 for p in o.data.polygons)
            if t > cap:
                d = o.modifiers.new("thin", "DECIMATE")
                d.ratio = cap / t
        done(col, root, f"{name}-{i}", f"https://polyhaven.com/a/{asset} ({nm})", credit)


cover("sorrel", "shrub_sorrel_01", "2k", parts=4)
cover("celandine", "celandine_01", "2k", parts=6, cap=8000)
cover("periwinkle", "periwinkle_plant", "2k", parts=4)
cover("nettle", "nettle_plant", "1k", parts=3)
cover("weed", "weed_plant_02", "1k", parts=4)
cover("grass", "grass_medium_01", "1k", parts=8, cap=3000)
cover("grass2", "grass_medium_02", "1k", parts=6, cap=3000)
cover("dandelion", "dandelion_01", "1k", parts=3)
cover("pine-small", "pine_sapling_small", "1k", parts=3, cap=30000)
cover("fir-small", "fir_sapling", "1k", parts=2, cap=30000)
cover("stone", "stone_01", "2k", parts=1, cap=8000)
cover("rock7", "rock_07", "2k", parts=1, cap=8000)
cover("rock9", "rock_09", "2k", parts=1, cap=8000)
cover("debris", "bark_debris_01", "1k", parts=4, cap=8000)
cover("root", "single_root", "2k", parts=1, cap=20000)
print("glade done")
