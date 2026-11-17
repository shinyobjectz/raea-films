# ferris/_lib: the closed fair's shared shapes: straight tubes and lattice masts for the steelwork, festoon bulbs
# that come on by a clip, striped canvas, and the Ferris wheel's gondola (the wheel carries sixteen, and one stands
# alone as a component). Clips with keys between rest and full are made here (clip, on_keys).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from comp import T, R, S, xf
from mathutils import Vector, Matrix

# the wheel: its rims' radius, the axle's height, the rims' half spacing, how many spokes (a gondola each)
RW, HZ, HALF, NS = 8.0, 10.6, 0.95, 16
LO = 0.001   # an unlit lamp's lit part is this small


def seg(a, b, r, n=8, r2=None):
    """A straight round bar from a to b."""
    a, b = Vector(a), Vector(b)
    d = b - a
    bm = comp.cyl(r, d.length, seg=n, r2=r2)
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=q.to_matrix())
    bmesh.ops.translate(bm, vec=a, verts=bm.verts)
    return bm


def sphere(r, at=(0, 0, 0), u=16, v=10):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


def ico(r, at=(0, 0, 0), sub=1):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


def torus(R_, r, seg_=32, sides=10, axis="Z", at=(0, 0, 0)):
    bm = bmesh.new()
    vs = [bm.verts.new((R_ + r * math.cos(2 * math.pi * k / sides), 0, r * math.sin(2 * math.pi * k / sides))) for k in range(sides)]
    es = [bm.edges.new((vs[k], vs[(k + 1) % sides])) for k in range(sides)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg_, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if axis == "Y":
        xf(bm, R(90, "X"))
    elif axis == "X":
        xf(bm, R(90, "Y"))
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    return bm


def truss(a, b, w0, w1, bays, r=0.035, lace=0.018, up=(0, 1, 0)):
    """A square lattice mast from a to b, w0 wide at a and w1 at b: four chords and zigzag lacing on every face."""
    a, b = Vector(a), Vector(b)
    d = (b - a).normalized()
    u = Vector(up).cross(d).normalized()
    v = d.cross(u).normalized()
    out = []
    cor = lambda t, i: a + (b - a) * t + (u * (1 if i in (0, 3) else -1) + v * (1 if i < 2 else -1)) * ((w0 + (w1 - w0) * t) / 2)
    for i in range(4):
        out.append(seg(cor(0, i), cor(1, i), r, 8))
    for k in range(bays):
        t0, t1 = k / bays, (k + 1) / bays
        for i in range(4):
            j = (i + 1) % 4
            out.append(seg(cor(t0, i), cor(t1, j), lace, 6) if k % 2 == 0 else seg(cor(t0, j), cor(t1, i), lace, 6))
            out.append(seg(cor(t1, i), cor(t1, j), lace, 6))
    return comp.merge(*out)


def clip(name, obj, curves):
    """A clip NAME on obj with whole key lists in ONE action: curves = {(data_path, index): [(seconds, value), ...]},
    linear. (comp.channel keys only rest and full, and two of its channels of one name on one object lose all but
    one in the glTF export.)"""
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


def on_keys(t0, dt=1 / 30):
    """Scale keys for a lit part that is nothing until t0 and whole a frame later."""
    keys = [(0.0, LO)] + ([(t0, LO)] if t0 > 0 else []) + [(min(1.0, t0 + dt), 1.0)] + ([(1.0, 1.0)] if t0 + dt < 1 else [])
    return {("scale", 0): keys, ("scale", 1): keys, ("scale", 2): keys}


def unlit(*objs):
    for o in objs:
        o.scale = (LO, LO, LO)


def gore_canopy(r, drop, n, z=0.0, valance=0.12):
    """A round canopy of n gores (two colours, alternating) with a scalloped valance: returns (bm_a, bm_b)."""
    out = [bmesh.new(), bmesh.new()]
    for k in range(n):
        bm = out[k % 2]
        a0, a1 = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
        am = (a0 + a1) / 2
        apex = bm.verts.new((0, 0, z))
        p0 = bm.verts.new((r * math.cos(a0), r * math.sin(a0), z - drop))
        pm = bm.verts.new((r * 1.02 * math.cos(am), r * 1.02 * math.sin(am), z - drop * 0.93))
        p1 = bm.verts.new((r * math.cos(a1), r * math.sin(a1), z - drop))
        bm.faces.new((apex, p0, pm))
        bm.faces.new((apex, pm, p1))
        v0 = bm.verts.new((r * math.cos(a0), r * math.sin(a0), z - drop - valance * 0.55))
        vm = bm.verts.new((r * math.cos(am), r * math.sin(am), z - drop - valance))
        v1 = bm.verts.new((r * math.cos(a1), r * math.sin(a1), z - drop - valance * 0.55))
        bm.faces.new((p0, v0, vm, pm))
        bm.faces.new((pm, vm, v1, p1))
    return out


def gondola(M, name, at, body_m, trim_m, steel_m, seat_m, canopy_a, canopy_b, parent, number=None, ink=None):
    """A Ferris wheel gondola hung from its pivot rod at `at` (the rod runs along y): two hanger arms down to an open
    tub 1.3 m long and 1.4 m across with two benches facing each other, a doorway on its +x side with a half door,
    a lap rail, a cream trim band and a number, under an eight-gore canopy with a scalloped valance and a ball
    finial. Its parts are meshes named NAME_part under `parent` (its pivot)."""
    P = Vector(at)
    mv = lambda bm: xf(bm, T(*P))
    LX, LY, ZT, ZB, WALL = 1.3, 1.4, -1.32, -2.02, 0.035
    # hangers: the rod, an arm each side cranked out round the canopy, a ring under the rod
    hang = [seg((0, -LY / 2 - 0.05, 0), (0, LY / 2 + 0.05, 0), 0.03, 10)]
    for s in (-1, 1):
        y = s * (LY / 2 + 0.01)
        hang += [seg((0, y, 0), (0, y, ZT + 0.25), 0.026, 8), seg((0, y, ZT + 0.25), (-0.5, y, ZT), 0.022, 8), seg((0, y, ZT + 0.25), (0.5, y, ZT), 0.022, 8),
                 comp.cyl(0.055, 0.06, at=(0, y - 0.03, 0), seg=12, axis="Y")]
    M(f"{name}_hanger", mv(comp.merge(*hang)), steel_m, parent, True)
    # the tub: a floor, walls with rounded corners (a bevel), the doorway cut from the +x wall
    DW = 0.56
    walls = [comp.box((LX, LY, 0.04), at=(0, 0, ZB + 0.02)), comp.box((WALL, LY, ZT - ZB), at=(-LX / 2 + WALL / 2, 0, (ZT + ZB) / 2)),
             comp.box((LX, WALL, ZT - ZB), at=(0, -LY / 2 + WALL / 2, (ZT + ZB) / 2)), comp.box((LX, WALL, ZT - ZB), at=(0, LY / 2 - WALL / 2, (ZT + ZB) / 2)),
             comp.box((WALL, (LY - DW) / 2, ZT - ZB), at=(LX / 2 - WALL / 2, -(LY + DW) / 4, (ZT + ZB) / 2)), comp.box((WALL, (LY - DW) / 2, ZT - ZB), at=(LX / 2 - WALL / 2, (LY + DW) / 4, (ZT + ZB) / 2))]
    tub = M(f"{name}_tub", mv(comp.merge(*walls)), body_m, parent, False)
    comp.bevel(tub, 0.012, 2)
    trim = [comp.box((LX + 0.03, 0.05, 0.05), at=(0, s * (LY / 2 - 0.01), ZT)) for s in (-1, 1)] + [comp.box((0.05, LY + 0.03, 0.05), at=(-LX / 2 + 0.01, 0, ZT))]
    trim += [comp.box((0.05, (LY - DW) / 2, 0.05), at=(LX / 2 - 0.01, s * (LY + DW) / 4, ZT)) for s in (-1, 1)]
    trim += [comp.box((LX + 0.012, LY + 0.012, 0.07), at=(0, 0, ZB + 0.2))]
    tr = M(f"{name}_trim", mv(comp.merge(*trim)), trim_m, parent, False)
    comp.bevel(tr, 0.012, 3)
    seats = []
    for s in (-1, 1):
        seats += [comp.box((0.36, LY - 0.1, 0.05), at=(s * (LX / 2 - 0.22), 0, ZB + 0.42)) if s < 0 else comp.box((0.36, (LY - 0.1), 0.05), at=(s * (LX / 2 - 0.22) - 0.0, 0, ZB + 0.42)),
                  comp.box((0.05, LY - 0.1, 0.3), at=(s * (LX / 2 - 0.065), 0, ZB + 0.62))]
    st = M(f"{name}_seats", mv(comp.merge(*seats)), seat_m, parent, False)
    comp.bevel(st, 0.015, 3)
    # the half door on its hinge, and the lap rail
    door = M(f"{name}_door", mv(comp.merge(comp.box((0.025, DW - 0.02, 0.5), at=(LX / 2 - 0.012, 0, ZB + 0.3)), comp.box((0.035, DW - 0.02, 0.04), at=(LX / 2 - 0.012, 0, ZB + 0.56)))), trim_m, parent, False)
    comp.bevel(door, 0.006, 2)
    rail = [seg((-LX / 2 + 0.06, -LY / 2 + 0.06, ZT + 0.02), (-LX / 2 + 0.06, -LY / 2 + 0.06, ZT + 0.2), 0.014, 6), seg((-LX / 2 + 0.06, LY / 2 - 0.06, ZT + 0.02), (-LX / 2 + 0.06, LY / 2 - 0.06, ZT + 0.2), 0.014, 6),
            seg((-LX / 2 + 0.06, -LY / 2 + 0.06, ZT + 0.2), (-LX / 2 + 0.06, LY / 2 - 0.06, ZT + 0.2), 0.014, 6)]
    M(f"{name}_rail", mv(comp.merge(*rail)), steel_m, parent, True)
    ca, cb = gore_canopy(0.98, 0.3, 8, z=-0.16)
    for nm, bm, m in (("a", ca, canopy_a), ("b", cb, canopy_b)):
        xf(bm, R(22.5, "Z"))
        o = M(f"{name}_canopy_{nm}", mv(bm), m, parent, False)
        comp.solidify(o, 0.008)
    M(f"{name}_finial", mv(comp.merge(sphere(0.05, at=(0, 0, -0.1), u=10, v=6), comp.cyl(0.02, 0.1, at=(0, 0, -0.2), seg=8))), trim_m, parent, True)
    if number is not None and ink is not None:
        t = comp.text(str(number), 0.26, depth=0.004)
        M(f"{name}_number", mv(xf(t, T(0, -LY / 2 - 0.003, (ZT + ZB) / 2 + 0.08))), ink, parent, False)
