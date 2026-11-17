# subway/tunnel: the tunnel mouth at the platform's end and 20 m of tunnel behind it, modelled by hand: a concrete
# headwall across the whole station with a segmental-arched opening over the track, a dressed arch ring and a
# hazard-striped end panel with a NO ENTRY board where the platform stops; behind it the tube's two walls and roof
# with ribs every 2.5 m, cables on the left wall, a caged tunnel light at every second rib (their glass is
# tunnel_light) and a black stop at the far end. Origin: the track's centre on the bed at the headwall's face; the
# tunnel runs back along +y. A shell part: subway/track carries on inside it, and the train waits in it.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, slab, bolt, prism, sphere, XL, XE, XB, CEIL, PLAT

col, root = comp.fresh("tunnel")
conc = comp.ph_texture("tunnel_headwall", "dirty_concrete", tile=3.0, tint=(0.62, 0.6, 0.56))
dark = comp.ph_texture("tunnel_lining", "dirty_concrete", tile=3.0, res="1k", tint=(0.22, 0.21, 0.2))
ring_m = comp.mat("tunnel_arch", (0.5, 0.49, 0.45), rough=0.8)
black = comp.mat("tunnel_stop", (0.0, 0.0, 0.0), rough=1.0)
yellow = comp.mat("tunnel_hazard", (0.85, 0.6, 0.03), rough=0.5)
ink = comp.mat("tunnel_hazard_black", (0.02, 0.02, 0.02), rough=0.5)
red = comp.mat("tunnel_board", (0.6, 0.04, 0.03), rough=0.4)
white = comp.mat("tunnel_board_letters", (0.92, 0.92, 0.88), rough=0.4)
cable = comp.mat("tunnel_cable", (0.02, 0.02, 0.022), rough=0.6)
steel = comp.mat("tunnel_steel", (0.3, 0.3, 0.31), rough=0.5, metal=0.9)
light = comp.mat("tunnel_light", (0.7, 0.85, 1.0), rough=0.3, emit=(0.6, 0.8, 1.0), strength=8000.0)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
X0, X1, SPR, RISE, DEEP, TH = XL + 0.1, XE - 0.05, 3.55, 0.5, 20.0, 0.4
NA = 24
arc = [(X1 + (X0 - X1) * k / NA, SPR + RISE * math.sin(math.pi * k / NA)) for k in range(NA + 1)]
outline = [(XL - 0.15, 0.0), (X0, 0.0)] + list(reversed(arc)) + [(X1, 0.0), (XB + 0.15, 0.0), (XB + 0.15, CEIL + 0.3), (XL - 0.15, CEIL + 0.3)]
bm = bmesh.new()
vs = [bm.verts.new((x, 0.0, z)) for x, z in outline]
for i in range(len(vs)):
    bm.edges.new((vs[i], vs[(i + 1) % len(vs)]))
bmesh.ops.triangle_fill(bm, use_beauty=True, use_dissolve=False, edges=bm.edges[:])
ext = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
bmesh.ops.translate(bm, vec=(0, TH, 0), verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
h = M("tunnel_headwall", bm, conc)
comp.uv_box(h)
# the arch ring and jambs, 4 cm proud
rp = [(x, z) for x, z in arc]
ring = []
for k in range(NA):
    (xa, za), (xb, zb) = rp[k], rp[k + 1]
    v = bmesh.new()
    pts = []
    for y in (-0.04, 0.0):
        for x, z in ((xa, za), (xb, zb), (xb, zb + 0.28), (xa, za + 0.28)):
            pts.append(v.verts.new((x, y, z)))
    for q in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        v.faces.new([pts[i] for i in q])
    bmesh.ops.recalc_face_normals(v, faces=v.faces)
    ring.append(v)
ring += [slab(X0 - 0.28, X0, -0.04, 0, 0.0, SPR), slab(X1, X1 + 0.28, -0.04, 0, PLAT, SPR)]
M("tunnel_arch", comp.merge(*ring), ring_m)
# the platform's end: a hazard panel and a board
stripes = []
for i in range(9):
    b = comp.box((0.11, 0.006, 1.6), at=(0, 0, 0))
    xf(b, R(40, "Y")); xf(b, T(2.1 + i * 0.36, -0.005, PLAT + 0.6))
    stripes.append(b)
pn = comp.merge(*stripes)
bmesh.ops.bisect_plane(pn, geom=pn.verts[:] + pn.edges[:] + pn.faces[:], plane_co=(0, 0, PLAT + 0.1), plane_no=(0, 0, -1), clear_outer=True)
bmesh.ops.bisect_plane(pn, geom=pn.verts[:] + pn.edges[:] + pn.faces[:], plane_co=(0, 0, PLAT + 1.1), plane_no=(0, 0, 1), clear_outer=True)
bmesh.ops.bisect_plane(pn, geom=pn.verts[:] + pn.edges[:] + pn.faces[:], plane_co=(1.85, 0, 0), plane_no=(-1, 0, 0), clear_outer=True)
bmesh.ops.bisect_plane(pn, geom=pn.verts[:] + pn.edges[:] + pn.faces[:], plane_co=(5.2, 0, 0), plane_no=(1, 0, 0), clear_outer=True)
M("tunnel_hazard_black", pn, ink)
M("tunnel_hazard", slab(1.85, 5.2, -0.004, 0, PLAT + 0.1, PLAT + 1.1), yellow)
M("tunnel_board", slab(2.6, 4.4, -0.012, 0, PLAT + 1.5, PLAT + 1.95), red)
M("tunnel_board_letters", xf(comp.text("NO ENTRY  STAFF ONLY", 0.13, depth=0.003), T(3.5, -0.013, PLAT + 1.725)), white)
# the tube
tube = [slab(X0 - 0.3, X0, TH, DEEP, 0.0, SPR + RISE + 0.3), slab(X1, X1 + 0.3, TH, DEEP, 0.0, SPR + RISE + 0.3), slab(X0 - 0.3, X1 + 0.3, TH, DEEP, SPR + RISE - 0.02, SPR + RISE + 0.3)]
ribs = []
for i in range(1, 8):
    y = i * 2.5
    ribs += [slab(X0, X0 + 0.12, y - 0.15, y + 0.15, 0.0, SPR + RISE), slab(X1 - 0.12, X1, y - 0.15, y + 0.15, 0.0, SPR + RISE), slab(X0, X1, y - 0.15, y + 0.15, SPR + RISE - 0.2, SPR + RISE)]
t = M("tunnel_lining", comp.merge(*tube, *ribs), dark)
comp.uv_box(t)
M("tunnel_stop", slab(X0 - 0.3, X1 + 0.3, DEEP, DEEP + 0.05, 0.0, SPR + RISE + 0.3), black)
cs = [comp.tube([(X0 + 0.14 + 0.004 * (k % 2), TH + i * (DEEP - TH) / 16, z - 0.03 * math.sin(math.pi * ((i * (DEEP - TH) / 16) % 2.5) / 2.5)) for i in range(17)], 0.022, res=3, sides=2) for k, z in enumerate((0.9, 1.05, 1.2))]
M("tunnel_cables", comp.merge(*cs), cable, smooth=True)
lamps, cages = [], []
for i in (1, 3, 5, 7):
    y = i * 2.5
    lamps.append(sphere(0.05, at=(X1 - 0.2, y - 0.17, 2.6), scale=(1, 1, 1.3), u=12, v=8))
    cages += [comp.box((0.1, 0.03, 0.1), at=(X1 - 0.17, y - 0.17, 2.72)), *[comp.tube([(X1 - 0.2 + 0.07 * math.cos(a), y - 0.17 + 0.07 * math.sin(a), 2.7), (X1 - 0.2 + 0.075 * math.cos(a), y - 0.17 + 0.075 * math.sin(a), 2.56), (X1 - 0.2, y - 0.17, 2.5)], 0.004, res=2, sides=1) for a in (0, 1.57, 3.14, 4.71)]]
M("tunnel_lights", comp.merge(*lamps), light, smooth=True)
M("tunnel_light_cages", comp.merge(*cages), steel)
comp.export(col, root, "subway", "tunnel", made="blender/components/subway/tunnel.py", source="own geometry; texture https://polyhaven.com/a/dirty_concrete; letters in Blender's built-in font", license="ours; texture CC0", credit="texture: Poly Haven",
            rig={"lights": "in the scene: the material tunnel_light's glow, a key per state"},
            notes="Shell part: origin at the track's centre on the bed, at the headwall's face; the opening (3.55 m wide, 4.05 m to the arch's crown) is the shot's vanishing point, the train's headlight in it.")
