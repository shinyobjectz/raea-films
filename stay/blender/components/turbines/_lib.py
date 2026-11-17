# turbines/_lib: the shapes this place's components share (comp.py has the rest): a lathe, a ring, a sphere, a
# height field, cylinder UVs, a noise, a painted sky image.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh, bpy
from comp import T, R, S, xf
from mathutils import Vector, noise


def lathe(prof, seg=48, z0=0.0, at=(0, 0)):
    """Turn a profile [(r, z), ...] about z. A profile that starts or ends on the axis closes there."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z0 + z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if at != (0, 0):
        xf(bm, T(at[0], at[1], 0))
    return bm


def ring(r_in, r_out, z0, z1, seg=48):
    """A flat-sectioned ring (a washer with height) between two radii and two heights."""
    return lathe([(r_in, z0), (r_out, z0), (r_out, z1), (r_in, z1), (r_in, z0)], seg=seg)


def sphere(r, at=(0, 0, 0), u=24, v=14, squash=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    xf(bm, S(*squash))
    xf(bm, T(*at))
    return bm


def ico(r, sub=3, at=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    xf(bm, T(*at))
    return bm


def fbm(x, y, z=0.0, scale=1.0, octaves=4, seed=0.0):
    """A noise in about -1..1, `scale` metres across its largest features."""
    v, a, f, tot = 0.0, 1.0, 1.0 / scale, 0.0
    for _ in range(octaves):
        v += a * noise.noise(Vector((x * f + seed, y * f - seed * 0.7, z * f + seed * 1.3)))
        tot += a
        a *= 0.5
        f *= 2.0
    return v / tot


def field(w, d, nx, ny, f, at=(0, 0)):
    """A height field w by d metres (nx by ny quads) centred on `at`: f(x, y) gives (dx, dy, z), a vertex's sideways
    push and its height."""
    bm = bmesh.new()
    rows = []
    for j in range(ny + 1):
        row = []
        for i in range(nx + 1):
            x = at[0] - w / 2 + w * i / nx
            y = at[1] - d / 2 + d * j / ny
            dx, dy, z = f(x, y)
            row.append(bm.verts.new((x + dx, y + dy, z)))
        rows.append(row)
    for j in range(ny):
        for i in range(nx):
            bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.faces.ensure_lookup_table()
    if sum(f.normal.z for f in bm.faces) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return bm


def uv_cyl(o, tile=1.0, r_ref=None):
    """UVs wrapped round the z axis in metres (u along the girth at r_ref, v up), so brick courses run level."""
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.active
    mw = o.matrix_world
    for f in bm.faces:
        ps = [mw @ l.vert.co for l in f.loops]
        an = [math.atan2(p.y, p.x) for p in ps]
        if max(an) - min(an) > math.pi:
            an = [a + 2 * math.pi if a < 0 else a for a in an]
        for l, p, a in zip(f.loops, ps, an):
            rr = r_ref if r_ref is not None else math.hypot(p.x, p.y)
            if abs(f.normal.z) > 0.8:
                l[uv].uv = (p.x / tile, p.y / tile)
            else:
                l[uv].uv = (a * rr / tile, p.z / tile)
    bm.to_mesh(me)
    bm.free()


def paint_by(o, pick):
    """Give each face the material slot pick(face normal, face centre) returns."""
    for p in o.data.polygons:
        p.material_index = pick(p.normal, p.center)


def apply_mods(o):
    """Bake an object's modifiers into its mesh (so UVs can be laid on the bevelled shape)."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    old = o.data
    o.modifiers.clear()
    o.data = me
    bpy.data.meshes.remove(old)
    return o


def glow_image(name, place, w, h, f, strength=1.0, rough=1.0):
    """A material lit by its own picture: f(u, v) gives (r, g, b) in linear light for u, v in 0..1 (v up). The picture
    is saved under blender/src/own/PLACE/."""
    import numpy as np
    path = os.path.join(comp.CACHE, "own", place, name + ".png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im = bpy.data.images.new(name, w, h, alpha=False)
    px = np.ones((h, w, 4), dtype=np.float32)
    for j in range(h):
        for i in range(w):
            c = f((i + 0.5) / w, (j + 0.5) / h)
            px[j, i, 0:3] = [max(0.0, min(1.0, x)) ** (1 / 2.2) for x in c]
    im.pixels.foreach_set(px.ravel())
    im.filepath_raw = path
    im.file_format = "PNG"
    im.save()
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL"):
            nt.nodes.remove(n)
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(path, check_existing=False)
    b.inputs["Base Color"].default_value = (0, 0, 0, 1)
    nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = strength
    b.inputs["Roughness"].default_value = rough
    return m


def maker(col, root):
    return lambda name, bm, m, parent=None, smooth=False: comp.mesh(col, root, name, bm, m, parent=parent, smooth=smooth)
