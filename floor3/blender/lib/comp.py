# (copied from projects/stay/blender/lib/comp.py for AFK: exports to assets/models)
# The component library's shared steps (parts/places.ts: "Every prop should be a component. Every component has
# props that we animate. Those are rigs."). One component is one collection, built standing on the floor at the origin
# in Blender's frame (z up, its front toward -y, which is raea's +z, toward the camera), under one empty named after
# it, and exported as media/models/PLACE/NAME.glb with NAME.glb.json beside it: where it came from, its licence and
# credit, its nodes, and its rig.
#
# A rig is a set of channels, each a glTF clip named for the channel. A channel's clip runs from rest at 0 s to its
# whole travel at 1 s, linear, so a shot sets how far it has gone with <Model animation="swivel" time={t}> (t from 0
# to 1; a spin's 1 is one whole turn and loops). Timing stays in raea; Blender holds only the shape and the travel.
#
# Run a component live (the MCP's execute_blender_code: exec the file with __file__ set) to look at it, or headless
# with `raea blender run blender/components/PLACE/NAME.py`. Either way it rebuilds its collection and exports.
import bpy, bmesh, os, sys, json, math, urllib.request
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = HERE
while PROJECT != "/" and not os.path.isfile(os.path.join(PROJECT, "brief.ts")):
    PROJECT = os.path.dirname(PROJECT)
CACHE = os.path.join(PROJECT, "blender", "src")
FPS = 30
UA = {"User-Agent": "asset-fetch"}


def fail(why):
    print(f"FAILED  comp: {why}", file=sys.stderr)
    raise SystemExit(1)


# --- the component's collection -------------------------------------------------------------------------------

def fresh(name):
    """An empty collection NAME (its old objects removed) and the empty every part hangs from."""
    sc = bpy.context.scene
    sc.render.fps = FPS
    sc.frame_set(0)
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        sc.collection.children.link(col)
    for o in list(col.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)
    root = bpy.data.objects.new(name, None)
    root.empty_display_type = "PLAIN_AXES"
    root.empty_display_size = 0.2
    col.objects.link(root)
    return col, root


def link(col, root, obj, name=None, parent=None):
    """Put obj in the collection, named, under parent (the root by default), keeping where it is in the world."""
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)
    if name:
        obj.name = name
        if obj.data is not None and hasattr(obj.data, "name"):
            obj.data.name = name
    p = parent or root
    mw = obj.matrix_world.copy()
    obj.parent = p
    obj.matrix_parent_inverse = p.matrix_world.inverted()
    obj.matrix_world = mw
    return obj


def pivot(col, root, name, at, parent=None):
    """An empty at `at` (world) that a moving part hangs from: its hinge, axle or slide."""
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "ARROWS"
    e.empty_display_size = 0.08
    col.objects.link(e)
    # set the world matrix itself: a new object's matrix_world is stale until the depsgraph runs, and link() reads it
    e.matrix_world = Matrix.Translation(Vector(at))
    link(col, root, e, parent=parent)
    bpy.context.view_layer.update()
    return e


def mesh(col, root, name, bm, mat=None, parent=None, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    if mat is not None:
        for m in (mat if isinstance(mat, list) else [mat]):
            me.materials.append(m)
    return link(col, root, o, parent=parent)


def bevel(o, width=0.003, segments=2, angle=40):
    m = o.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(angle)
    m.harden_normals = False
    return m


def subsurf(o, levels=2):
    m = o.modifiers.new("subsurf", "SUBSURF")
    m.levels = levels
    m.render_levels = levels
    return m


# --- shapes (bmesh) ---------------------------------------------------------------------------------------------

def box(size, at=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


def cyl(r, h, at=(0, 0, 0), seg=32, r2=None, axis="Z"):
    """A cylinder (a cone with r2) standing on `at` along +axis."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    bmesh.ops.translate(bm, vec=Vector((0, 0, h / 2)), verts=bm.verts)
    if axis == "X":
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, "Y"))
    elif axis == "Y":
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(-90), 3, "X"))
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


def xf(bm, m):
    """Transform a bmesh by a 4x4 (or 3x3) matrix."""
    m = m.to_4x4() if len(m) == 3 else m
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    return bm


def T(x, y, z):
    return Matrix.Translation((x, y, z))


def R(deg, axis):
    return Matrix.Rotation(math.radians(deg), 4, axis)


def S(x, y=None, z=None):
    return Matrix.Diagonal((x, x if y is None else y, x if z is None else z, 1))


def taper(a, b, wa, wb, ha, hb):
    """A tapered beam from point a to point b (in the xy plane's direction, z its own), widths wa to wb across and
    heights ha to hb, its top edge running from a to b. For chair legs, brackets, arms."""
    a, b = Vector(a), Vector(b)
    d = (b - a)
    d2 = Vector((d.x, d.y, 0)).normalized()
    side = Vector((-d2.y, d2.x, 0))
    bm = bmesh.new()
    vs = []
    for p, w, h in ((a, wa, ha), (b, wb, hb)):
        for sx, sz in ((-1, 0), (1, 0), (1, -1), (-1, -1)):
            vs.append(bm.verts.new(p + side * (w / 2 * sx) + Vector((0, 0, h * sz))))
    f = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    for q in f:
        bm.faces.new([vs[i] for i in q])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def grid(w, h, nx, ny):
    """A flat grid w x h in the xz plane (facing -y), centred, nx by ny quads."""
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=nx, y_segments=ny, size=0.5)
    xf(bm, S(w, h, 1))
    xf(bm, R(90, "X"))
    return bm


def solidify(o, t, offset=0.0):
    m = o.modifiers.new("solidify", "SOLIDIFY")
    m.thickness = t
    m.offset = offset
    return m


def merge(*bms):
    out = bmesh.new()
    for b in bms:
        me = bpy.data.meshes.new("_tmp")
        b.to_mesh(me)
        b.free()
        out.from_mesh(me)
        bpy.data.meshes.remove(me)
    return out


# --- materials --------------------------------------------------------------------------------------------------

def mat(name, color, rough=0.5, metal=0.0, emit=None, strength=1.0, alpha=None, transmission=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if transmission:
        b.inputs["Transmission Weight"].default_value = transmission
    if emit is not None:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    if alpha is not None:
        b.inputs["Alpha"].default_value = alpha
        if hasattr(m, "blend_method"):
            m.blend_method = "BLEND"
    return m


def fetch(url, path):
    if os.path.isfile(path) and os.path.getsize(path) > 0:
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req) as r, open(path + ".part", "wb") as f:
        f.write(r.read())
    os.replace(path + ".part", path)
    return path


def api(path):
    req = urllib.request.Request("https://api.polyhaven.com/" + path, headers=UA)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def ph_credit(asset):
    info = api("info/" + asset)
    return ", ".join(info.get("authors", {}).keys()), info


def _grey(path):
    """A desaturated copy of an image beside it (the glTF export carries a tint, not a saturation node)."""
    out = os.path.splitext(path)[0] + "_grey.png"
    if os.path.isfile(out):
        return out
    import numpy as np
    im = bpy.data.images.load(path)
    px = np.empty(im.size[0] * im.size[1] * 4, dtype=np.float32)
    im.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    l = px[:, 0] * 0.2126 + px[:, 1] * 0.7152 + px[:, 2] * 0.0722
    px[:, 0] = px[:, 1] = px[:, 2] = l
    im.pixels.foreach_set(px.ravel())
    im.filepath_raw = out
    im.file_format = "PNG"
    im.save()
    bpy.data.images.remove(im)
    return out


def ph_texture(name, asset, tile=1.0, res="2k", tint=None, metal=None, grey=False):
    """A material from a Poly Haven texture set (CC0), tiled every `tile` metres on the part's UVs (box-projected
    UVs from uv_box)."""
    files = api("files/" + asset)
    d = os.path.join(CACHE, "polyhaven", "tex", asset)
    got = {}
    for key in ("Diffuse", "nor_gl", "Rough", "Metal", "AO"):
        if key in files and res in files[key]:
            f = files[key][res].get("jpg") or files[key][res].get("png")
            got[key] = fetch(f["url"], os.path.join(d, os.path.basename(f["url"])))
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL"):
            nt.nodes.remove(n)
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    uv = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / tile, 1 / tile, 1)
    nt.links.new(uv.outputs["UV"], mp.inputs["Vector"])

    def img(path, colour):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(path, check_existing=True)
        t.image.colorspace_settings.name = "sRGB" if colour else "Non-Color"
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        return t

    if "Diffuse" in got:
        t = img(_grey(got["Diffuse"]) if grey else got["Diffuse"], True)
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
    if "Rough" in got:
        nt.links.new(img(got["Rough"], False).outputs["Color"], b.inputs["Roughness"])
    if "Metal" in got and metal is None:
        nt.links.new(img(got["Metal"], False).outputs["Color"], b.inputs["Metallic"])
    elif metal is not None:
        b.inputs["Metallic"].default_value = metal
    if "nor_gl" in got:
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(img(got["nor_gl"], False).outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    m["source"] = f"https://polyhaven.com/a/{asset}"
    return m


def uv_box(o, size=1.0):
    """Cube-project UVs in world metres, so a tiled texture keeps its real scale on every face."""
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.active
    mw = o.matrix_world
    for f in bm.faces:
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            p = mw @ l.vert.co
            u, v = [(p.y, p.z), (p.x, p.z), (p.x, p.y)][ax]
            l[uv].uv = (u / size, v / size)
    bm.to_mesh(me)
    bm.free()


# --- Poly Haven models ------------------------------------------------------------------------------------------

def ph_model(asset, res="2k"):
    """Import a Poly Haven model's glTF (CC0), cached under blender/src/polyhaven/models. Returns its objects."""
    files = api("files/" + asset)
    g = files["gltf"][res]["gltf"]
    d = os.path.join(CACHE, "polyhaven", "models", asset, res)
    main = fetch(g["url"], os.path.join(d, os.path.basename(g["url"])))
    for rel, f in g.get("include", {}).items():
        fetch(f["url"], os.path.join(d, rel))
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=main)
    return [o for o in bpy.data.objects if o not in before]


def ph_component(place, name, asset, res="2k", origin="floor", turn=0.0, scale=1.0, keep=None):
    """A component from one Poly Haven model: its parts renamed NAME_PART (the asset's prefix dropped), moved so the
    origin sits at the bottom centre (origin "floor"), the top centre (a ceiling fitting: "top") or the back centre (a
    wall item: "back", its back at y 0 and its front toward -y). `turn` degrees about z first, so its front faces -y;
    `keep` filters the asset's parts by name (a collection asset holding several variants). Returns (col, root, parts,
    credit)."""
    col, root = fresh(name)
    objs = ph_model(asset, res)
    credit, _ = ph_credit(asset)
    meshes = [o for o in objs if o.type == "MESH" and (keep is None or keep(o.name))]
    for o in objs:
        if o not in meshes:
            bpy.data.objects.remove(o, do_unlink=True)
    for o in meshes:
        o.parent = None
    rot = Matrix.Rotation(math.radians(turn), 4, "Z") @ Matrix.Scale(scale, 4)
    for o in meshes:
        o.matrix_world = rot @ o.matrix_world
    bpy.context.view_layer.update()
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for o in meshes:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo, hi = Vector(map(min, lo, w)), Vector(map(max, hi, w))
    mid = (lo + hi) / 2
    at = {"floor": Vector((mid.x, mid.y, lo.z)), "top": Vector((mid.x, mid.y, hi.z)), "back": Vector((mid.x, hi.y, mid.z))}[origin]
    for o in meshes:
        o.matrix_world = Matrix.Translation(-at) @ o.matrix_world
    parts = {}
    for o in meshes:
        base = o.name.split(".")[0]
        part = base[len(asset):].strip("_") if base.lower().startswith(asset.lower()) else base
        link(col, root, o, name=f"{name}_{part}" if part else name.replace(" ", "_") + "_body")
        parts[part or "body"] = o
    return col, root, parts, credit


def box_of(objs):
    bpy.context.view_layer.update()
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for o in (objs if isinstance(objs, (list, tuple)) else [objs]):
        if o.type != "MESH":
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo, hi = Vector(map(min, lo, w)), Vector(map(max, hi, w))
    return lo, hi


def hang(col, root, objs, name, at=None, parent=None):
    """A pivot empty NAME at `at` (default: the parts' box centre) with the parts re-hung from it, so a rotation or a
    scale of the pivot turns them about that point."""
    objs = objs if isinstance(objs, (list, tuple)) else [objs]
    if at is None:
        lo, hi = box_of(objs)
        at = (lo + hi) / 2
    p = pivot(col, root, name, at, parent=parent)
    bpy.context.view_layer.update()
    for o in objs:
        link(col, root, o, parent=p)
    return p


def purge():
    """Drop data nothing uses any more (a rebuild's old meshes, materials and images)."""
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)


# --- the rig: one clip a channel --------------------------------------------------------------------------------

def channel(name, keys):
    """A clip NAME: for each (object, data_path, index, rest, full), the value goes linearly from rest at 0 s to full
    at 1 s. All of one object's keys go in one action on one NLA track of the clip's name (the glTF export joins the
    objects' tracks of that name into one clip; two same-named tracks on one object would lose all but one). A key that
    holds still (rest equal to full) gets a hair of travel, or the export drops it."""
    by = {}
    for obj, path, index, rest, full in keys:
        by.setdefault(obj.name, (obj, []))[1].append((path, index, rest, full))
    for obj, ks in by.values():
        act = bpy.data.actions.new(f"{name}|{obj.name}")
        obj.animation_data_create()
        obj.animation_data.action = act
        for path, index, rest, full in ks:
            if full == rest:
                full = rest + 1e-4
            cur = getattr(obj, path)
            cur[index] = rest
            obj.keyframe_insert(path, index=index, frame=0)
            cur[index] = full
            obj.keyframe_insert(path, index=index, frame=FPS)
            cur[index] = rest
        for fc in _fcurves(act):
            for k in fc.keyframe_points:
                k.interpolation = "LINEAR"
        tr = obj.animation_data.nla_tracks.new()
        tr.name = name
        st = tr.strips.new(name, 0, act)
        st.name = name
        obj.animation_data.action = None


def _fcurves(act):
    if hasattr(act, "fcurves") and len(getattr(act, "fcurves", [])):
        return list(act.fcurves)
    out = []
    for layer in getattr(act, "layers", []):
        for strip in layer.strips:
            for bag in getattr(strip, "channelbags", []):
                out.extend(bag.fcurves)
    return out


# --- export -----------------------------------------------------------------------------------------------------

def export(col, root, place, name, made, source, license, credit, rig=None, notes=None):
    """Write media/models/PLACE/NAME.glb and its sidecar; print its box, faces and nodes."""
    out = os.path.join(PROJECT, "assets", "models", place, name.replace("_", "-") + ".glb")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for o in col.all_objects:
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=out, export_format="GLB", use_selection=True, export_yup=True, export_apply=True,
        export_animations=bool(rig), export_animation_mode="NLA_TRACKS", export_force_sampling=False,
        export_image_format="AUTO", export_extras=False, export_cameras=False, export_lights=False,
    )
    faces, lo, hi = 0, Vector((1e9,) * 3), Vector((-1e9,) * 3)
    dg = bpy.context.evaluated_depsgraph_get()
    for o in col.all_objects:
        if o.type == "MESH":
            ev = o.evaluated_get(dg)
            faces += sum(len(p.vertices) - 2 for p in ev.data.polygons)
            for c in o.bound_box:
                w = o.matrix_world @ Vector(c)
                lo = Vector(map(min, lo, w))
                hi = Vector(map(max, hi, w))
    side = {
        "made": made, "source": source, "license": license, "credit": credit,
        "triangles": faces,
        "size_m": [round(hi.x - lo.x, 3), round(hi.z - lo.z, 3), round(hi.y - lo.y, 3)],
        "nodes": sorted(o.name for o in col.all_objects),
        "rig": rig or {},
        "steps": [os.path.basename(made)],
    }
    if notes:
        side["notes"] = notes
    json.dump(side, open(out + ".json", "w"), indent=1)
    print(f"wrote {out}: {faces} triangles, {side['size_m']} m (w, h, d), rig {list((rig or {}).keys())}")
    return out


# --- curves and text as meshes ----------------------------------------------------------------------------------

def _to_mesh_bm(obj):
    bpy.context.scene.collection.objects.link(obj)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    bm = bmesh.new()
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)
    data = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.curves.remove(data)
    return bm


def tube(points, r, res=6, sides=3):
    """A round cable through the points (a smooth curve), radius r."""
    cu = bpy.data.curves.new("_tube", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = sides
    cu.resolution_u = res
    cu.use_fill_caps = True
    sp = cu.splines.new("NURBS")
    sp.points.add(len(points) - 1)
    for p, co in zip(sp.points, points):
        p.co = (*co, 1)
    sp.use_endpoint_u = True
    sp.order_u = min(4, len(points))
    return _to_mesh_bm(bpy.data.objects.new("_tube", cu))


def text(body, size, depth=0.002, align="CENTER"):
    """Letters as a mesh in the xz plane, facing -y, centred on the origin."""
    cu = bpy.data.curves.new("_text", "FONT")
    cu.body = body
    cu.size = size
    cu.extrude = depth / 2
    cu.align_x = align
    cu.align_y = "CENTER"
    bm = _to_mesh_bm(bpy.data.objects.new("_text", cu))
    xf(bm, R(90, "X"))
    return bm
