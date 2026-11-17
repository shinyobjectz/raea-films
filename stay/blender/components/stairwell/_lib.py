# stairwell/_lib: the stairwell's sizes and the shapes its parts share. The well is round: an open eye 1.2 m in
# radius, stone treads cantilevered from the wall at 2.4 m, one whole turn a storey. A storey is 19 rises of 17 cm
# (3.23 m): 18 treads over 300 degrees, then a 60 degree landing centred on the front (-y), where the door is.
# The flight climbs anticlockwise seen from above. Every storey part has its origin on the well's axis at its own
# landing's level, so a storey is the same parts again 3.23 m up.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from mathutils import Vector, Matrix

R_IN, R_WALL = 1.2, 2.4
RISE, N = 0.17, 18
H = RISE * (N + 1)
LAND0, LAND1 = -120.0, -60.0          # the landing's arc, degrees (centred on -y)
STEP = 300.0 / N                      # a tread's arc


def tread_arc(i):
    """Tread i's arc (degrees) and its top's height."""
    a0 = LAND1 + i * STEP
    return a0, a0 + STEP, (i + 1) * RISE


def pol(r, deg, z=0.0):
    a = math.radians(deg)
    return Vector((r * math.cos(a), r * math.sin(a), z))


def arc_block(r0, r1, a0, a1, z0, z1, seg=None):
    """A solid ring sector: radii r0..r1, angles a0..a1 (degrees), heights z0..z1."""
    seg = seg or max(1, int(abs(a1 - a0) / 4))
    bm = bmesh.new()
    ring = []
    for k in range(seg + 1):
        a = a0 + (a1 - a0) * k / seg
        ring.append([bm.verts.new(pol(r, a, z)) for r, z in ((r0, z0), (r1, z0), (r1, z1), (r0, z1))])
    for k in range(seg):
        p, q = ring[k], ring[k + 1]
        for j in range(4):
            bm.faces.new((p[j], p[(j + 1) % 4], q[(j + 1) % 4], q[j]))
    bm.faces.new(ring[0][::-1])
    bm.faces.new(ring[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def helix_height(deg):
    """The nosing line's height at an angle around the storey (the landing flat at 0, then the flight)."""
    d = (deg - LAND1) % 360.0
    if d >= 300.0:
        return H
    return RISE + d / 300.0 * (H - RISE)


def sphere(r, at=(0, 0, 0), u=16, v=10):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


def clip(name, obj, curves):
    """A clip NAME on obj with whole key lists in ONE action: curves = {(data_path, index): [(seconds, value), ...]},
    linear. comp.channel keys only rest and full, and two of its channels of one name on one object (a turn and a
    drop, say) lose all but one in the glTF export; this keeps them together."""
    act = bpy.data.actions.new(f"{name}|{obj.name}")
    obj.animation_data_create()
    obj.animation_data.action = act
    rest = {(p, i): getattr(obj, p)[i] for p, i in curves}
    for (p, i), keys in curves.items():
        for t, v in keys:
            getattr(obj, p)[i] = v
            obj.keyframe_insert(p, index=i, frame=t * comp.FPS)
    for (p, i), v in rest.items():
        getattr(obj, p)[i] = v
    for fc in comp._fcurves(act):
        for k in fc.keyframe_points:
            k.interpolation = "LINEAR"
    tr = obj.animation_data.nla_tracks.new()
    tr.name = name
    st = tr.strips.new(name, 0, act)
    st.name = name
    obj.animation_data.action = None


def on_clip(name, obj, t0=0.0, t1=1.0):
    """A lit part that is nothing at rest (scale 0.001) and whole from t1: how a lamp comes on with a clip."""
    lo = 0.001
    keys = [(0.0, lo)] + ([(t0, lo)] if t0 > 0 else []) + [(t1, 1.0)] + ([(1.0, 1.0)] if t1 < 1 else [])
    clip(name, obj, {("scale", 0): keys, ("scale", 1): keys, ("scale", 2): keys})
    obj.scale = (lo, lo, lo)


RAIL = 1.0   # the handrail's height over the landing and over the nosing line


def rail_z(u):
    """The handrail's height u degrees round from the landing's start (0..360): level over the landing, easing up a
    rise into the flight, then climbing with it to the next landing."""
    if u <= 60.0:
        s = u / 60.0
        return RAIL + RISE * s * s * (3 - 2 * s)
    return RAIL + RISE + (u - 60.0) / 300.0 * (H - RISE)


def uv_cyl(o, size=1.0):
    """UVs wrapped round the well's axis in metres (the angle times the radius across, the height up)."""
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.active
    for f in bm.faces:
        c = f.calc_center_median()
        ac = math.atan2(c.y, c.x)
        for l in f.loops:
            p = l.vert.co
            a = math.atan2(p.y, p.x)
            while a - ac > math.pi:
                a -= 2 * math.pi
            while a - ac < -math.pi:
                a += 2 * math.pi
            r = math.hypot(p.x, p.y)
            if abs(f.normal.z) > 0.7:
                l[uv].uv = (p.x / size, p.y / size)
            else:
                l[uv].uv = (a * R_WALL / size, (p.z + (r - R_WALL)) / size)
    bm.to_mesh(me)
    bm.free()


def torus(R, r, seg=32, sides=10, axis="Z", at=(0, 0, 0)):
    bm = bmesh.new()
    vs = [bm.verts.new((R + r * math.cos(2 * math.pi * k / sides), 0, r * math.sin(2 * math.pi * k / sides))) for k in range(sides)]
    es = [bm.edges.new((vs[k], vs[(k + 1) % sides])) for k in range(sides)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if axis == "Y":
        comp.xf(bm, comp.R(90, "X"))
    elif axis == "X":
        comp.xf(bm, comp.R(90, "Y"))
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


def balusters(us, foot, radius=None):
    """Iron balusters at the angles us (degrees from the landing's start), each from foot(u) up to the handrail: a
    round bar, a shoe at its foot, a turned knop at mid height. Returns (bars, knops) as bmeshes."""
    radius = radius or R_IN + 0.07
    bars, knops = [], []
    for u in us:
        p = pol(radius, LAND0 + u)
        z0, z1 = foot(u), rail_z(u) - 0.02
        bars.append(comp.cyl(0.008, z1 - z0, at=(p.x, p.y, z0), seg=8))
        bars.append(comp.cyl(0.017, 0.014, at=(p.x, p.y, z0), seg=10, r2=0.011))
        knops.append(sphere(0.019, at=(p.x, p.y, z0 + (z1 - z0) * 0.5), u=10, v=6))
        knops.append(sphere(0.012, at=(p.x, p.y, z0 + (z1 - z0) * 0.5 + 0.035), u=8, v=4))
        knops.append(sphere(0.012, at=(p.x, p.y, z0 + (z1 - z0) * 0.5 - 0.035), u=8, v=4))
    return bars, knops


def handrail(u0, u1, radius=None, drop=0.0, r=0.027, step=4.0):
    radius = radius or R_IN + 0.07
    n = int(round((u1 - u0) / step))
    pts = [tuple(pol(radius, LAND0 + u0 + (u1 - u0) * k / n, rail_z(u0 + (u1 - u0) * k / n) - drop)) for k in range(n + 1)]
    return comp.tube(pts, r, res=3, sides=4)
