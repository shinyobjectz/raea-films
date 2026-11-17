# canyon/_lib: the slot's shape, shared by every canyon component so the walls, the rim, the sand and what stands on
# them agree. Blender frame: the slot runs along +y (raea's -z, away from the camera) from Y0 (its mouth, behind the
# camera) to Y1 (where it has turned right out of sight), x across it, z up, the sand at z 0 and the rim at z H.
#   centre(y, z)   the slot's middle at height z: a slow meander, a swirl that leans both walls together (the
#                  overhangs that interlock), and the far end's turn to the right
#   half(y, z)     half the slot's width: 2.6 m across at the sand (undercut wider right at the floor), 4.8 m at the rim
#   wall_x(side, y, z)   a wall's face (side -1 left, +1 right): the flutes, scallops and strata ledges on top of that
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh, bpy
from comp import T, R, S, xf
from mathutils import Vector, Matrix, noise

Y0, Y1, H = -8.0, 30.0, 12.0
PLACE = "canyon"


def _bend(y):
    return 0.10 * max(0.0, y - 21.0) ** 2


def centre(y, z):
    c = 0.45 * math.sin(y * 0.21 + 0.4) + 0.2 * math.sin(y * 0.47 + 1.7) + _bend(y) + 0.45
    sw = 0.5 * math.sin(z * 0.55 + y * 0.2) + 0.25 * math.sin(z * 1.15 - y * 0.3 + 1.0)
    return c + sw


def half(y, z):
    slope = 0.2 * max(0.0, y - 21.0)
    w = 1.3 + 0.22 * math.sin(y * 0.55 + z * 0.4) + 0.3 * math.exp(-z / 0.5) + 0.018 * z ** 1.7
    return w * math.sqrt(1 + slope * slope)


def relief(side, y, z):
    s = side * 1.3
    f = 0.16 * math.sin(y * 1.1 + 1.8 * math.sin(z * 0.7 + s) + 2 * s) * math.sin(z * 0.9 + y * 0.2 + s)
    led = math.sin(z * 5.2 + 1.2 * math.sin(y * 0.5) + s)
    f += 0.075 * math.copysign(abs(led) ** 0.45, led)     # strata ledges, 1.2 m apart, their edges crisp
    fine = math.sin(z * 17 + 2 * math.sin(y * 0.3 + 3 * s))
    f += 0.028 * math.copysign(abs(fine) ** 0.6, fine)
    f += 0.10 * noise.noise(Vector((y * 0.45, z * 0.8, side * 10.0)))
    f += 0.03 * noise.noise(Vector((y * 1.9, z * 3.1, side * 20.0)))
    return f


def wall_x(side, y, z):
    return centre(y, z) + side * (half(y, z) + relief(side, y, z))


def floor_mid(y):
    """The middle of the sand at y and its half width (wall to wall, at ankle height)."""
    a, b = wall_x(-1, y, 0.15), wall_x(1, y, 0.15)
    return (a + b) / 2, (b - a) / 2


def rock(size, seed, sub=3, rough=0.18, flat=0.0):
    """A stone as a bmesh: a subdivided cube pushed round and then roughened by noise, `size` (x, y, z) metres across,
    sitting on z 0. `flat` squares it off (a slab, a rim block) instead of rounding it."""
    rnd = random.Random(seed)
    off = Vector((rnd.uniform(-50, 50), rnd.uniform(-50, 50), rnd.uniform(-50, 50)))
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=2 ** sub - 1, use_grid_fill=True)
    for v in bm.verts:
        p = v.co.copy()
        ball = p.normalized() * 0.5
        p = ball.lerp(p, flat)
        n = noise.noise(p * 2.2 + off) * rough + noise.noise(p * 6.0 + off) * rough * 0.35
        v.co = p * (1 + n)
    lo = min(v.co.z for v in bm.verts)
    bmesh.ops.translate(bm, vec=(0, 0, -lo), verts=bm.verts)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def tint(m, rgb):
    """Multiply a Poly Haven model's base colour texture by rgb (the glTF export carries a multiply as a factor)."""
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    sock = b.inputs["Base Color"]
    if not sock.links:
        c = sock.default_value
        sock.default_value = (c[0] * rgb[0], c[1] * rgb[1], c[2] * rgb[2], 1)
        return m
    src = sock.links[0].from_socket
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    mix.inputs[7].default_value = (*rgb, 1)
    nt.links.new(src, mix.inputs[6])
    nt.links.new(mix.outputs[2], sock)
    return m


def decimate(o, ratio):
    m = o.modifiers.new("decimate", "DECIMATE")
    m.ratio = ratio
    return m


def tris(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)


def copy_of(col, root, o, name, m, parent=None):
    """A copy of mesh object o (sharing its mesh) placed by the 4x4 m."""
    c = bpy.data.objects.new(name, o.data)
    col.objects.link(c)
    c.matrix_world = m
    bpy.context.view_layer.update()
    return comp.link(col, root, c, parent=parent)


def bake(o):
    """Apply o's modifiers into its mesh now (a decimated scan that copies then share)."""
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    old = o.data
    o.modifiers.clear()
    o.data = me
    me.name = o.name
    if old.users == 0:
        bpy.data.meshes.remove(old)
    return o


def scatter(src, places):
    """One bmesh holding a copy of mesh object src's mesh (its own space) for each 4x4 in places."""
    out = bmesh.new()
    for m in places:
        tmp = bmesh.new()
        tmp.from_mesh(src.data)
        bmesh.ops.transform(tmp, matrix=m, verts=tmp.verts)
        me = bpy.data.meshes.new("_tmp")
        tmp.to_mesh(me)
        tmp.free()
        out.from_mesh(me)
        bpy.data.meshes.remove(me)
    return out


def take(col, root, asset, res, keep=None, scale=1.0):
    """A Poly Haven model's mesh parts, unparented, scaled about the origin, and the asset's credit."""
    objs = comp.ph_model(asset, res)
    credit, _ = comp.ph_credit(asset)
    out = {}
    for o in objs:
        if o.type == "MESH" and (keep is None or keep(o.name)):
            mw = o.matrix_world.copy()
            o.parent = None
            o.matrix_world = Matrix.Scale(scale, 4) @ mw
            out[o.name.split(".")[0]] = o
        else:
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.context.view_layer.update()
    return out, credit


def place(o, m):
    """Move object o by the 4x4 m (world)."""
    o.matrix_world = m @ o.matrix_world
    bpy.context.view_layer.update()
    return o


def drop(o, x=0.0, y=0.0, z=0.0):
    """Put o's box centre over (x, y) with its lowest point at z."""
    lo, hi = comp.box_of(o)
    return place(o, T(x - (lo.x + hi.x) / 2, y - (lo.y + hi.y) / 2, z - lo.z))


def twig(points, r, sides=5):
    """A thin straight-sided stick through the points (cheap: `sides` faces round, no caps worth the name)."""
    bm = bmesh.new()
    rings = []
    n = len(points)
    for i, p in enumerate(points):
        p = Vector(p)
        d = (Vector(points[min(i + 1, n - 1)]) - Vector(points[max(i - 1, 0)])).normalized()
        a = d.orthogonal().normalized()
        b = d.cross(a)
        rr = r * (1 - 0.6 * i / max(1, n - 1))
        rings.append([bm.verts.new(p + (a * math.cos(2 * math.pi * k / sides) + b * math.sin(2 * math.pi * k / sides)) * rr) for k in range(sides)])
    for i in range(n - 1):
        # keep the rings from twisting against each other: start each at the vertex nearest the last ring's first
        k0 = min(range(sides), key=lambda k: (rings[i + 1][k].co - rings[i][0].co).length)
        rings[i + 1] = rings[i + 1][k0:] + rings[i + 1][:k0]
        for k in range(sides):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % sides], rings[i + 1][(k + 1) % sides], rings[i + 1][k]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm
