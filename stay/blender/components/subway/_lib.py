# subway's shared shapes and sizes. The station's cross-section (Blender frame, the track along y, the train coming
# toward -y): track bed at z 0, rail tops 0.3, the platform's top 1.2, the ceiling's underside 4.5; the track's
# centre at x 0, the far (track) wall's face at x -2.2, the platform's edge at x 1.5, its back wall's face at x 5.5.
# The shell parts (track, platform, ceiling, tunnel) share one origin: the track's centre on the bed.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh, bpy
from comp import T, R, S, xf
from mathutils import Vector, Matrix

PLACE = "subway"
RAIL, PLAT, CEIL = 0.3, 1.2, 4.5
XL, XE, XB = -2.2, 1.5, 5.5
LEN = 20.0
NAME = "STAY ST"


def lathe(prof, seg=32, at=(0, 0, 0), axis="Z"):
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


def sphere(r, at=(0, 0, 0), scale=(1, 1, 1), u=20, v=12):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    xf(bm, S(*scale))
    xf(bm, T(*at))
    return bm


def bolt(at, r=0.008, h=0.006, axis="Z", seg=6):
    return comp.cyl(r, h, at=at, seg=seg, axis=axis)


def prism(prof, y0, y1):
    """A profile [(x, z)] (anticlockwise seen from -y) pushed along y from y0 to y1."""
    bm = bmesh.new()
    f = [bm.verts.new((x, y0, z)) for x, z in prof]
    b = [bm.verts.new((x, y1, z)) for x, z in prof]
    bm.faces.new(f)
    bm.faces.new(list(reversed(b)))
    n = len(prof)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((f[j], f[i], b[i], b[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def slab(x0, x1, y0, y1, z0, z1):
    return comp.box((x1 - x0, y1 - y0, z1 - z0), at=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))


def tiled_wall(col, root, pre, W, H, tablets=3, posters=False):
    """A tiled station wall in a wall item's frame (W wide along x, its face toward -y, its back at y 0, standing on
    z 0): a dark base course, white glazed tile, a green tile band with black borders under a plaster top, mosaic name
    tablets, and small name tiles between them."""
    M = lambda n, bm, m: comp.mesh(col, root, f"{pre}_{n}", bm, m)
    white = comp.ph_texture(f"{pre}_tile", "long_white_tiles", tile=1.1)
    green = comp.mat(f"{pre}_band", (0.02, 0.12, 0.07), rough=0.18)
    black = comp.mat(f"{pre}_border", (0.012, 0.012, 0.014), rough=0.2)
    plaster = comp.mat(f"{pre}_plaster", (0.62, 0.6, 0.54), rough=0.9)
    letter = comp.mat(f"{pre}_letters", (0.9, 0.88, 0.8), rough=0.3)
    TH, BZ = 0.15, H - 0.95
    o = M("tiles", slab(-W / 2, W / 2, -TH, 0, 0.16, BZ), white)
    comp.uv_box(o)
    M("base", slab(-W / 2, W / 2, -TH - 0.012, 0, 0, 0.16), black)
    M("band", slab(-W / 2, W / 2, -TH - 0.004, 0, BZ + 0.03, BZ + 0.27), green)
    M("borders", comp.merge(slab(-W / 2, W / 2, -TH - 0.006, 0, BZ, BZ + 0.03), slab(-W / 2, W / 2, -TH - 0.006, 0, BZ + 0.27, BZ + 0.3)), black)
    M("plaster", slab(-W / 2, W / 2, -TH + 0.01, 0, BZ + 0.3, H), plaster)
    tabs, edges, words = [], [], []
    for i in range(tablets):
        x = -W / 2 + W * (i + 0.5) / tablets
        z = BZ - 0.75
        tabs.append(slab(x - 0.95, x + 0.95, -TH - 0.008, 0, z - 0.26, z + 0.26))
        edges.append(slab(x - 1.0, x + 1.0, -TH - 0.006, 0, z - 0.31, z + 0.31))
        words.append(xf(comp.text(NAME, 0.3, depth=0.004), T(x, -TH - 0.01, z)))
    n = int(W / 2.2)
    for i in range(n):
        x = -W / 2 + W * (i + 0.5) / n
        words.append(xf(comp.text("STAY", 0.1, depth=0.003), T(x, -TH - 0.006, BZ + 0.15)))
    M("tablet_edges", comp.merge(*edges), letter)
    M("tablets", comp.merge(*tabs), green)
    M("letters", comp.merge(*words), letter)
    return TH
