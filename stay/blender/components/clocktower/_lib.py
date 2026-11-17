# clocktower's shared shapes: turned (lathe) parts, spur gears that mesh, an escape wheel. Gears lie in the xz plane
# (their axle along y, so their faces look at the camera) centred on the origin; a tooth centre sits at angle `phase`.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh, bpy
from comp import T, R, S, xf
from mathutils import Vector, Matrix

PLACE = "clocktower"


def lathe(prof, seg=32, at=(0, 0, 0), axis="Z"):
    """Turn a profile [(r, z), ...] about z (then lay it along `axis`), moved to `at`."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if axis == "X":
        xf(bm, R(90, "Y"))
    elif axis == "Y":
        xf(bm, R(-90, "X"))
    xf(bm, T(*at))
    return bm


def _ring(outer, ri, thick):
    """A flat ring between an outer outline [(x, z)] and a circle of radius ri, `thick` along y."""
    bm = bmesh.new()
    n = len(outer)
    h = thick / 2
    fo, bo, fi, bi = [], [], [], []
    for x, z in outer:
        a = math.atan2(z, x)
        fo.append(bm.verts.new((x, -h, z)))
        bo.append(bm.verts.new((x, h, z)))
        fi.append(bm.verts.new((ri * math.cos(a), -h, ri * math.sin(a))))
        bi.append(bm.verts.new((ri * math.cos(a), h, ri * math.sin(a))))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((fo[i], fo[j], fi[j], fi[i]))
        bm.faces.new((bo[j], bo[i], bi[i], bi[j]))
        bm.faces.new((fo[j], fo[i], bo[i], bo[j]))
        bm.faces.new((fi[i], fi[j], bi[j], bi[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def radius(n, m):
    return n * m / 2


def gear(n, m, thick, phase=0.0, spokes=5, rim=None, hub=None, bore=0.012, kind="spur"):
    """A spur gear of n teeth, module m (pitch radius n*m/2): a toothed rim, tapered spokes and a hub (spokes=0 is a
    solid pinion). kind "escape" cuts the raked, pointed teeth of a recoil escape wheel."""
    rp = n * m / 2
    p = 2 * math.pi / n
    out = []
    if kind == "escape":
        rr, ra = rp - 2.2 * m, rp + 0.6 * m
        for k in range(n):
            a = phase + k * p
            for da, r in ((-0.5, rr), (-0.08, ra), (0.0, ra), (0.12, rr + 0.5 * m)):
                out.append((r * math.cos(a + da * p), r * math.sin(a + da * p)))
    else:
        rr, ra = rp - 1.25 * m, rp + m
        for k in range(n):
            a = phase + k * p
            for da, r in ((-0.5, rr), (-0.31, rr), (-0.25, rp), (-0.13, ra), (0.13, ra), (0.25, rp), (0.31, rr)):
                out.append((r * math.cos(a + da * p), r * math.sin(a + da * p)))
    if not spokes:
        return _ring(out, bore, thick)
    rim = rim or 2.6 * m
    hub = hub or max(0.03, rp * 0.16)
    ri = rr - rim
    parts = [_ring(out, ri, thick)]
    parts.append(_ring([(hub * math.cos(2 * math.pi * k / 32), hub * math.sin(2 * math.pi * k / 32)) for k in range(32)], bore, thick * 1.7))
    w0, w1 = hub * 0.9, hub * 0.5
    for k in range(spokes):
        a = phase + 2 * math.pi * (k + 0.5) / spokes
        sp = comp.taper((hub * 0.85, 0, 0), (ri + rim * 0.3, 0, 0), w0, w1, 1, 1)
        # taper lies in xy with z its height: stand it in the xz plane, thick*0.55 through y
        xf(sp, T(0, 0, 0.5))
        xf(sp, S(1, 1, thick * 0.55))
        xf(sp, R(90, "X"))
        xf(sp, Matrix.Rotation(-a, 4, "Y"))
        parts.append(sp)
    return comp.merge(*parts)


def mesh_phase(n_a, phase_a, theta, n_b):
    """The phase of gear B (n_b teeth) so its gaps take gear A's teeth, B standing at angle theta from A's centre."""
    pa, pb = 2 * math.pi / n_a, 2 * math.pi / n_b
    da = ((theta - phase_a) / pa) % 1.0
    return theta + math.pi - (0.5 - da) * pb


def bolt(at, r=0.008, h=0.006, axis="Z"):
    """A hex bolt head."""
    return comp.cyl(r, h, at=at, seg=6, axis=axis)


def bevel_gear(n, m, thick, phase=0.0, bore=0.012, cone=0.7):
    """A bevel wheel: a solid spur wheel whose +y face is drawn in toward the axle (its cone's point toward +y)."""
    bm = gear(n, m, thick, phase, spokes=0, bore=bore)
    for v in bm.verts:
        if v.co.y > 0:
            v.co.x *= cone
            v.co.z *= cone
    return bm


def flip(bm):
    """Mirror a mesh in x (letters read from behind) and turn its faces back out."""
    xf(bm, S(-1, 1, 1))
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return bm


def torus(r, t, seg=64, sides=12, axis="Y"):
    bm = bmesh.new()
    vs = [bm.verts.new((r + t * math.cos(2 * math.pi * k / sides), 0, t * math.sin(2 * math.pi * k / sides))) for k in range(sides)]
    es = [bm.edges.new((vs[k], vs[(k + 1) % sides])) for k in range(sides)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=seg, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if axis == "Y":
        xf(bm, R(-90, "X"))
    elif axis == "X":
        xf(bm, R(90, "Y"))
    return bm


def sphere(r, at=(0, 0, 0), scale=(1, 1, 1), u=20, v=12):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    xf(bm, S(*scale))
    xf(bm, T(*at))
    return bm
