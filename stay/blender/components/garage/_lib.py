# garage/_lib: the garage components' shared steps on top of blender/lib/comp.py: a part maker, lathes and sweeps,
# sharp edges by angle, stencil lettering laid on a floor or a wall, hazard stripes as geometry, and `look`, which
# renders the component from Blender itself to a PNG when GARAGE_LOOK is set (a quick check before raea's render).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import bpy, bmesh
import comp
from comp import T, R, S, xf
from mathutils import Vector, Matrix

PLACE = "garage"


def maker(col, root):
    return lambda name, bm, m, parent=None, smooth=False: comp.mesh(col, root, name, bm, m, parent=parent, smooth=smooth)


def sharp(o, deg=35):
    """Smooth shading with the edges sharper than `deg` kept hard."""
    me = o.data
    for p in me.polygons:
        p.use_smooth = True
    if hasattr(me, "set_sharp_from_angle"):
        me.set_sharp_from_angle(angle=math.radians(deg))
    return o


def lathe(prof, seg=32, z0=0.0, at=(0, 0, 0), axis="Z"):
    """Turn a profile [(r, z)] about z (then lay it along `axis`), standing at `at`."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z0 + z)) for r, z in prof]
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


def sweep(path, prof, closed=False, cap=True, up=(0, 0, 1)):
    """Sweep a closed profile [(n, u)] (n across the path, u along `up`) along a path of 3D points."""
    path = [Vector(p) for p in path]
    up = Vector(up)
    bm = bmesh.new()
    rings = []
    n = len(path)
    for i, p in enumerate(path):
        a = path[(i - 1) % n] if (closed or i > 0) else p
        b = path[(i + 1) % n] if (closed or i < n - 1) else p
        t = (b - a).normalized()
        side = t.cross(up).normalized()
        u2 = side.cross(t).normalized()
        rings.append([bm.verts.new(p + side * q[0] + u2 * q[1]) for q in prof])
    m = len(prof)
    for i in range(n - (0 if closed else 1)):
        r0, r1 = rings[i], rings[(i + 1) % n]
        for j in range(m):
            bm.faces.new((r0[j], r0[(j + 1) % m], r1[(j + 1) % m], r1[j]))
    if cap and not closed:
        bm.faces.new(rings[0])
        bm.faces.new(list(reversed(rings[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def rrect(w, h, r, seg=4):
    """A rounded rectangle's outline [(x, y)], centred, w by h, corner radius r."""
    r = min(r, w / 2 - 1e-5, h / 2 - 1e-5)
    out = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for k in range(seg + 1):
            a = math.radians(a0 + 90 * k / seg)
            out.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return out


def circle(r, seg=12):
    return [(r * math.cos(2 * math.pi * k / seg), r * math.sin(2 * math.pi * k / seg)) for k in range(seg)]


def plate(outline, t, at=(0, 0, 0)):
    """A flat plate from an outline [(x, y)] in the xy plane, t thick upward from `at`."""
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, 0)) for x, y in outline]
    f = bm.faces.new(vs)
    if t > 0:
        r = bmesh.ops.extrude_face_region(bm, geom=[f])
        bmesh.ops.translate(bm, vec=(0, 0, t), verts=[v for v in r["geom"] if isinstance(v, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    xf(bm, T(*at))
    return bm


def wall_text(body, size, depth=0.002):
    """Letters standing in the xz plane facing -y (comp.text)."""
    return comp.text(body, size, depth)


def floor_text(body, size, depth=0.002, turn=0.0):
    """Letters lying on the floor, read from the front (-y), turned `turn` degrees about z."""
    bm = comp.text(body, size, depth)
    xf(bm, R(-90, "X"))
    if turn:
        xf(bm, R(turn, "Z"))
    return bm


def stripes(w, h, n, t=0.001, lean=0.5):
    """Leaning hazard stripes filling a w by h panel in the xz plane (facing -y), as two meshes: (a, b)."""
    out = [bmesh.new(), bmesh.new()]
    step = (w + h * lean) / n
    for k in range(n):
        x0 = -w / 2 - h * lean + k * step
        pts = [(x0, -h / 2), (x0 + step, -h / 2), (x0 + step + h * lean, h / 2), (x0 + h * lean, h / 2)]
        # clip to the panel
        def clip(poly, lo, hi):
            for sgn, lim in ((1, hi), (-1, -lo)):
                res = []
                for i in range(len(poly)):
                    a, b = poly[i], poly[(i + 1) % len(poly)]
                    ia, ib = sgn * a[0] <= lim, sgn * b[0] <= lim
                    if ia:
                        res.append(a)
                    if ia != ib:
                        tt = (sgn * lim - a[0]) / (b[0] - a[0])
                        res.append((sgn * lim, a[1] + tt * (b[1] - a[1])))
                poly = res
                if len(poly) < 3:
                    return []
            return poly
        pts = clip(pts, -w / 2, w / 2)
        if len(pts) < 3:
            continue
        bm = out[k % 2]
        vs = [bm.verts.new((x, -t, z)) for x, z in pts]
        bm.faces.new(vs)
    for bm in out:
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        for f in bm.faces:
            if f.normal.y > 0:
                f.normal_flip()
    return out


def look(col, name, eye=None, target=None, lens=50, size=(1100, 800), frame=0, tag=""):
    """Render the component from Blender (no raea) to $GARAGE_LOOK/NAME.png, when that is set."""
    d = os.environ.get("GARAGE_LOOK")
    if not d:
        return
    sc = bpy.context.scene
    lo, hi = comp.box_of([o for o in col.all_objects if o.type == "MESH"])
    mid = (lo + hi) / 2
    span = max((hi - lo).length, 0.2)
    eye = Vector(eye) if eye else mid + Vector((0.55, -0.75, 0.38)).normalized() * span * 1.25
    target = Vector(target) if target else mid
    cam = bpy.data.objects.new("_look", bpy.data.cameras.new("_look"))
    sc.collection.objects.link(cam)
    cam.data.lens = lens
    cam.data.clip_start = 0.01
    cam.data.clip_end = 500
    cam.location = eye
    cam.rotation_euler = (target - eye).to_track_quat("-Z", "Y").to_euler()
    sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", "SUN"))
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(50), 0, math.radians(-30))
    sc.collection.objects.link(sun)
    if sc.world is None:
        sc.world = bpy.data.worlds.new("_w")
    sc.world.use_nodes = True
    bg = next((n for n in sc.world.node_tree.nodes if n.type == "BACKGROUND"), None)
    if bg:
        bg.inputs[0].default_value = (0.55, 0.57, 0.6, 1)
        bg.inputs[1].default_value = 0.7
    sc.camera = cam
    keep = set(col.all_objects) | {cam, sun}
    for o in sc.objects:
        if o not in keep:
            o.hide_render = True
    for e in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT", "BLENDER_WORKBENCH"):
        try:
            sc.render.engine = e
            break
        except TypeError:
            continue
    sc.render.resolution_x, sc.render.resolution_y = size
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    for fr, sfx in ((0, ""), (comp.FPS, "-full")) if frame is None else ((frame, tag),):
        # a rig's clips live in NLA tracks; solo nothing, so every track plays at once
        sc.frame_set(fr)
        sc.render.filepath = os.path.join(d, f"{name}{sfx}.png")
        bpy.ops.render.render(write_still=True)
        print("look", sc.render.filepath)
    bpy.data.objects.remove(cam, do_unlink=True)
    bpy.data.objects.remove(sun, do_unlink=True)
    sc.frame_set(0)
