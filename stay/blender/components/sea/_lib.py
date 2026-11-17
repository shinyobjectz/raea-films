# sea/_lib: the sea's shared steps on top of blender/lib/comp.py: a lathe, value noise for rock and cloud lumps, a
# textured glow material, a Poly Haven model brought in as parts of a larger component, and a decimate that keeps UVs.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from comp import T, R, S, xf
from mathutils import Vector, Matrix, noise

PLACE = "sea"
SRC = os.path.join(comp.CACHE, "sea")


def maker(col, root):
    return lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)


def turn(prof, z0=0.0, seg=32, at=(0, 0)):
    """A lathe: the profile [(r, z)] spun about z, standing at `at`."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z0 + z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.translate(bm, vec=(at[0], at[1], 0), verts=bm.verts)
    return bm


def sphere(r, at=(0, 0, 0), u=16, v=10, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    xf(bm, S(*scale))
    xf(bm, T(*at))
    return bm


def ico(r, at=(0, 0, 0), sub=2, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    xf(bm, S(*scale))
    xf(bm, T(*at))
    return bm


def fbm(p, octaves=4, scale=1.0):
    v, a, f = 0.0, 1.0, 1.0 / scale
    for _ in range(octaves):
        v += a * noise.noise(Vector(p) * f)
        a *= 0.5
        f *= 2.0
    return v


def lump(bm, amount, scale, octaves=4, seed=0.0):
    """Push every vertex along its normal by fractal noise (rock, cloud)."""
    bm.normal_update()
    for v in bm.verts:
        v.co += v.normal * amount * fbm(v.co + Vector((seed, seed * 1.7, seed * 0.3)), octaves, scale)
    return bm


def glow_tex(name, path, strength=1.0, alpha=False):
    """A material that only glows with an image (a sky, a lit sign): black base, the picture as its emission."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL"):
            nt.nodes.remove(n)
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(path, check_existing=True)
    b.inputs["Base Color"].default_value = (0, 0, 0, 1)
    b.inputs["Roughness"].default_value = 1.0
    b.inputs["Specular IOR Level"].default_value = 0.0
    nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = strength
    if alpha:
        nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
        m.blend_method = "BLEND"
    return m


def bring(col, root, asset, prefix, res="1k", m=None, keep=None, parent=None):
    """A Poly Haven model's meshes brought into this component under `prefix`, moved by the matrix m. Returns
    ({part: object}, credit)."""
    objs = comp.ph_model(asset, res)
    credit, _ = comp.ph_credit(asset)
    out = {}
    for o in objs:
        if o.type != "MESH" or (keep is not None and not keep(o.name)):
            continue
        o.parent = None
    bpy.context.view_layer.update()
    for o in objs:
        if o.type != "MESH" or (keep is not None and not keep(o.name)):
            bpy.data.objects.remove(o, do_unlink=True)
            continue
        if m is not None:
            o.matrix_world = m @ o.matrix_world
        bpy.context.view_layer.update()
        base = o.name.split(".")[0]
        part = base[len(asset):].strip("_") if base.lower().startswith(asset.lower()) else base
        comp.link(col, root, o, name=f"{prefix}_{part}" if part else prefix, parent=parent)
        out[part or "body"] = o
    bpy.context.view_layer.update()
    return out, credit


def copy_of(col, root, o, name, m, parent=None):
    """A linked copy of a mesh object (the same mesh data) placed by the world matrix m."""
    c = bpy.data.objects.new(name, o.data)
    col.objects.link(c)
    c.matrix_world = m
    bpy.context.view_layer.update()
    return comp.link(col, root, c, parent=parent)


def decimate(o, ratio):
    m = o.modifiers.new("decimate", "DECIMATE")
    m.ratio = ratio
    return m


def apply_all(o):
    """Apply an object's modifiers now (so what follows sees the real mesh)."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    old = o.data
    o.modifiers.clear()
    o.data = me
    me.name = o.name
    return o


def rope(points, r=0.012, sides=4):
    return comp.tube(points, r, res=8, sides=sides)


# --- the sky's picture: where a direction falls on it (sky.py's dome and sea.py's reflection share this) --------------
SKY_CROP = (0.475, 0.945)                      # the panorama's sea-facing span of u
SKY_LOW = -8.0                                 # the picture's bottom row, degrees under the horizon
SKY_SUN_U = (0.667 - SKY_CROP[0]) / (SKY_CROP[1] - SKY_CROP[0])
SKY_JPG = os.path.join(SRC, "sky_the_sky_is_on_fire.jpg")


def sky_uv(az, elev):
    """The picture's (u, v) for a direction: az degrees from dead ahead (+y), positive toward +x; elev degrees up."""
    side = 1 if az >= 0 else -1
    k = abs(az) / 90.0
    k = k if k <= 1 else 2 - k
    half = min(SKY_SUN_U, 1 - SKY_SUN_U)
    return (SKY_SUN_U + side * half * k * 0.98, (elev - SKY_LOW) / (90 - SKY_LOW))


def ring(R_, r, at=(0, 0, 0), n=16, sides=3, axis="Z"):
    """A torus (a tyre, a rail's hoop, a coil): major radius R_, tube radius r, lying in the plane across `axis`."""
    pts = [(R_ * math.cos(2 * math.pi * i / n), R_ * math.sin(2 * math.pi * i / n), 0) for i in range(n + 1)]
    bm = comp.tube(pts + [pts[1]], r, res=4, sides=sides)
    if axis == "X":
        xf(bm, R(90, "Y"))
    elif axis == "Y":
        xf(bm, R(90, "X"))
    xf(bm, T(*at))
    return bm


def by_height(bm, levels):
    """Give each face the material index of the first level its centre is under: levels = [z1, z2, ...] -> 0, 1, 2 ..."""
    for f in bm.faces:
        z = f.calc_center_median().z
        f.material_index = next((i for i, l in enumerate(levels) if z < l), len(levels))
    return bm


def uv_missing(col, size=1.0):
    """Box-project UVs onto every mesh that has a textured material and no UVs: without them the glTF export writes
    texCoord -1 and raea refuses the file."""
    for o in col.all_objects:
        if o.type == "MESH" and not o.data.uv_layers and any(m and m.use_nodes and any(n.type == "TEX_IMAGE" for n in m.node_tree.nodes) for m in o.data.materials):
            comp.uv_box(o, size)


def channel(name, keys):
    """comp.channel, but an object's keys in one clip share ONE action and one NLA track. comp.channel makes a track
    a key, and the glTF export keeps only one of an object's same-named tracks, so a clip that moves two axes of one
    object (a scale in x, y and z; a lift up and out) lost all but one."""
    by = {}
    for k in keys:
        by.setdefault(k[0], []).append(k)
    for obj, ks in by.items():
        act = bpy.data.actions.new(f"{name}|{obj.name}")
        obj.animation_data_create()
        obj.animation_data.action = act
        for _, path, index, rest, full in ks:
            cur = getattr(obj, path)
            cur[index] = rest
            obj.keyframe_insert(path, index=index, frame=0)
            cur[index] = full
            obj.keyframe_insert(path, index=index, frame=comp.FPS)
            cur[index] = rest
        for fc in comp._fcurves(act):
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"
        tr = obj.animation_data.nla_tracks.new()
        tr.name = name
        st = tr.strips.new(name, 0, act)
        st.name = name
        obj.animation_data.action = None


def tint(mat, rgb):
    """Multiply a material's colour picture by rgb (wet rock, weathered paint): the glTF export carries it as the
    base colour factor."""
    nt = mat.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    links = list(b.inputs["Base Color"].links)
    if not links:
        b.inputs["Base Color"].default_value = (*rgb, 1)
        return mat
    src = links[0].from_socket
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    mix.inputs[7].default_value = (*rgb, 1)
    nt.links.new(src, mix.inputs[6])
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    return mat


def boulders(col, root, prefix, pieces, res=("1k", "1k"), keep=(0.14, 0.13), wet=(0.5, 0.47, 0.45)):
    """Closed boulders from Poly Haven's namaqualand_boulder_04 ("a") and _03 ("b"), cut to a share of their faces and
    darkened as sea-wet rock. pieces = [(which, x, y, sink, turn z, tip x, tip y, (sx, sy, sz))]. Returns the credit."""
    src, credit = {}, []
    for w, asset, r, k in (("a", "namaqualand_boulder_04", res[0], keep[0]), ("b", "namaqualand_boulder_03", res[1], keep[1])):
        parts, c = bring(col, root, asset, f"{prefix}_{w}", res=r)
        o = max(parts.values(), key=lambda o: len(o.data.polygons))
        for other in parts.values():
            if other is not o:
                bpy.data.objects.remove(other, do_unlink=True)
        decimate(o, k)
        apply_all(o)
        for m in o.data.materials:
            m.name = f"{prefix}_rock_{w}"
            tint(m, wet)
        lo, hi = comp.box_of(o)
        src[w] = (o, T(-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -(lo.z + hi.z) / 2) @ o.matrix_world, (hi.z - lo.z) / 2)
        credit.append(f"{c} ({asset})")
    for i, (w, x, y, sink, rz, rx, ry, sc) in enumerate(pieces):
        o, c0, half = src[w]
        sc = sc if isinstance(sc, tuple) else (sc, sc, sc)
        m = T(x, y, half * sc[2] - sink) @ R(rz, "Z") @ R(rx, "X") @ R(ry, "Y") @ S(*sc)
        copy_of(col, root, o, f"{prefix}_{i + 1}", m @ c0)
    for o, _, _ in src.values():
        bpy.data.objects.remove(o, do_unlink=True)
    return "; ".join(credit)
