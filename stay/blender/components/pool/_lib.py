# pool/_lib: what the pool hall's components share: the hall's sizes, its tile and steel materials, and a few shapes
# comp.py doesn't have (a lathe, a straight pipe with rounded bends, a wall with openings, faces painted by where they are).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import bpy, bmesh, comp
from comp import T, R, S, xf
from mathutils import Vector, Matrix

PLACE = "pool"
# the hall: 16 x 30 m, 6.5 m to the soffit; the pool 8 x 20 m in its middle, its shallow end toward the camera (-y)
HALL_W, HALL_L, HALL_H = 16.0, 30.0, 6.5
POOL_W, POOL_L = 8.0, 20.0
SHALLOW, DEEP, WATER = 1.1, 3.0, -0.15
FLOOR = [(-10.0, -SHALLOW), (-2.0, -SHALLOW), (4.0, -DEEP), (10.0, -DEEP)]  # the basin floor's profile along y
WALL_T, DADO = 0.3, 2.1
DOOR = (5.0, 1.9, 2.15)          # the far door's centre x in the end wall, its opening's width and height
WIN = (3.2, 1.8, 3.6)            # a clerestory window's width, height and sill height
WIN_X = [-11.25 + 4.5 * i for i in range(6)]


def floor_z(y):
    for (y0, z0), (y1, z1) in zip(FLOOR, FLOOR[1:]):
        if y0 <= y <= y1:
            return z0 + (z1 - z0) * (y - y0) / (y1 - y0)
    return FLOOR[0][1] if y < FLOOR[0][0] else FLOOR[-1][1]


def done(col, root, name, source, license="ours", credit="", rig=None, notes=None):
    comp.purge()
    return comp.export(col, root, PLACE, name, made=f"blender/components/pool/{name}.py", source=source, license=license, credit=credit, rig=rig, notes=notes)


# --- materials ------------------------------------------------------------------------------------------------------

def relevel(m, lo, hi, tag):
    """Swap a ph_texture material's colour image for a copy stretched to run from lo to hi (the grey copies of Poly
    Haven's brown tiles are too dark to tint into white or aqua tiles: the glTF tint can only darken)."""
    import numpy as np
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    n = b.inputs["Base Color"].links[0].from_node
    if n.type != "TEX_IMAGE":
        n = n.inputs[6].links[0].from_node
    src = bpy.path.abspath(n.image.filepath)
    out = os.path.splitext(src)[0] + f"_{tag}.jpg"
    if not os.path.isfile(out):
        im = bpy.data.images.load(src)
        px = np.empty(im.size[0] * im.size[1] * 4, dtype=np.float32)
        im.pixels.foreach_get(px)
        px = px.reshape(-1, 4)
        l = px[:, 0] * 0.2126 + px[:, 1] * 0.7152 + px[:, 2] * 0.0722
        a, z = np.percentile(l, 4), np.percentile(l, 90)
        l = np.clip((l - a) / max(z - a, 1e-4), 0, 1) * (hi - lo) + lo
        px[:, 0] = px[:, 1] = px[:, 2] = l
        im.pixels.foreach_set(px.ravel())
        im.filepath_raw = out + ".part.jpg"
        im.file_format = "JPEG"
        im.save()
        bpy.data.images.remove(im)
        os.replace(out + ".part.jpg", out)
    n.image = bpy.data.images.load(out, check_existing=True)
    n.image.colorspace_settings.name = "sRGB"
    return m


def wall_tiles(res="1k"):
    return relevel(comp.ph_texture("pool_wall_tiles", "long_white_tiles", tile=1.27, res=res, grey=True, tint=(0.93, 0.95, 0.94)), 0.5, 1.0, "pool_white2")


def trim_tiles(res="1k"):
    return relevel(comp.ph_texture("pool_trim_tiles", "long_white_tiles", tile=1.27, res=res, grey=True, tint=(0.05, 0.22, 0.5)), 0.5, 1.0, "pool_white2")


def deck_tiles(res="1k"):
    return relevel(comp.ph_texture("pool_deck_tiles", "anti_skid_tiles", tile=1.8, res=res, grey=True, tint=(0.82, 0.8, 0.74)), 0.74, 1.0, "pool_deck2")


def basin_tiles(res="1k"):
    return relevel(comp.ph_texture("pool_basin_tiles", "rounded_square_tiled_wall", tile=2.0, res=res, grey=True, tint=(0.5, 0.86, 0.94)), 0.4, 1.0, "pool_basin")


def band_tiles(res="1k"):
    return relevel(comp.ph_texture("pool_band_tiles", "rounded_square_tiled_wall", tile=2.0, res=res, grey=True, tint=(0.04, 0.16, 0.46)), 0.4, 1.0, "pool_basin")


def plaster(res="1k"):
    return relevel(comp.ph_texture("pool_plaster", "painted_plaster_wall", tile=2.0, res=res, grey=True, tint=(0.93, 0.95, 0.9)), 0.88, 1.0, "pool_plaster2")


def steel(name="pool_steel", rough=0.2):
    return comp.mat(name, (0.82, 0.83, 0.84), rough=rough, metal=1.0)


def paint_m(name, rgb, rough=0.45):
    return comp.mat(name, rgb, rough=rough)


# --- shapes ---------------------------------------------------------------------------------------------------------

def turn(prof, z0=0.0, seg=32, axis="Z", at=(0, 0, 0)):
    """A lathe: the (radius, height) profile turned about z (or laid along x or y), then moved to `at`."""
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


def bend(points, radius, n=6):
    """A polyline with every inside corner rounded to about `radius`."""
    pts = [Vector(p) for p in points]
    out = [pts[0]]
    for a, b, c in zip(pts, pts[1:], pts[2:]):
        d1, d2 = (a - b), (c - b)
        tl = min(radius, d1.length * 0.45, d2.length * 0.45)
        p1, p2 = b + d1.normalized() * tl, b + d2.normalized() * tl
        for i in range(n + 1):
            s = i / n
            out.append(p1 * (1 - s) ** 2 + b * (2 * s * (1 - s)) + p2 * s ** 2)
    out.append(pts[-1])
    return out


def pipe(points, r, sides=3, cyclic=False):
    """A round tube straight through the points (round the corners first with bend)."""
    cu = bpy.data.curves.new("_pipe", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = sides
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, co in zip(sp.points, points):
        p.co = (*co, 1)
    sp.use_cyclic_u = cyclic
    return comp._to_mesh_bm(bpy.data.objects.new("_pipe", cu))


def wall(w, h, t, holes=(), zs=(), xs=()):
    """A wall w x h, its room face at y 0 facing -y and t thick behind it, with rectangular openings
    (x0, x1, z0, z1) cut through. Extra break lines at zs and xs."""
    X = sorted(set([-w / 2, w / 2] + [v for a in holes for v in a[:2]] + list(xs)))
    Z = sorted(set([0.0, h] + [v for a in holes for v in a[2:]] + list(zs)))
    bm = bmesh.new()
    cells = []
    for x0, x1 in zip(X, X[1:]):
        for z0, z1 in zip(Z, Z[1:]):
            cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
            if any(a[0] < cx < a[1] and a[2] < cz < a[3] for a in holes):
                continue
            cells.append((x0, x1, z0, z1))
    for y in (0.0, t):
        for x0, x1, z0, z1 in cells:
            f = bm.faces.new([bm.verts.new((x0, y, z0)), bm.verts.new((x1, y, z0)), bm.verts.new((x1, y, z1)), bm.verts.new((x0, y, z1))])
            if y > 0:
                f.normal_flip()
    # the edges: the outside and every opening's reveal
    def side(p, q, n):
        f = bm.faces.new([bm.verts.new((p[0], 0, p[1])), bm.verts.new((q[0], 0, q[1])), bm.verts.new((q[0], t, q[1])), bm.verts.new((p[0], t, p[1]))])
        f.normal_update()
        if f.normal.dot(Vector(n)) < 0:
            f.normal_flip()
    side((-w / 2, 0), (-w / 2, h), (-1, 0, 0)); side((w / 2, 0), (w / 2, h), (1, 0, 0)); side((-w / 2, h), (w / 2, h), (0, 0, 1)); side((-w / 2, 0), (w / 2, 0), (0, 0, -1))
    for x0, x1, z0, z1 in holes:
        side((x0, z0), (x0, z1), (1, 0, 0)); side((x1, z0), (x1, z1), (-1, 0, 0)); side((x0, z1), (x1, z1), (0, 0, -1))
        if z0 > 0:
            side((x0, z0), (x1, z0), (0, 0, 1))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    return bm


def face(bm, pts, n):
    """A face through pts whose normal points along n."""
    f = bm.faces.new([bm.verts.new(p) for p in pts])
    f.normal_update()
    if f.normal.dot(Vector(n)) < 0:
        f.normal_flip()
    return f


def paint(o, fn):
    """Give each face of o the material slot fn(centre, normal) returns."""
    for p in o.data.polygons:
        p.material_index = fn(p.center, p.normal)
    return o


def sphere(r, at=(0, 0, 0), u=24, v=14):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    xf(bm, T(*at))
    return bm


def flat(bm):
    """Lay a comp.text (standing, facing -y) flat on the floor, to be read from the camera's side (-y)."""
    return xf(bm, R(-90, "X"))


def rod(a, b, r, sides=3):
    return pipe([a, b], r, sides=sides)

