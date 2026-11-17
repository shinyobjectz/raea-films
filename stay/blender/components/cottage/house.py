# cottage/house: the Craftsman cottage the garden's path leads to (blender/components/cottage/_lib.py has its plan and
# every size). Everything of the house but its door's leaf (cottage/door), its ivy (cottage/ivy) and its flowers
# (cottage/blooms):
#   - walls of cedar shingles, every one its own piece (a wedge, its butt 14 mm thick), in courses 17 cm to the weather,
#     random widths with keyways between them, in three stains of sage, over a stacked-stone base with a water table;
#   - cream trim: corner boards, a frieze under the eaves, Craftsman casings (a head with a drip cap that runs past the
#     side casings, a sloped sill and an apron), the door's casing, jambs and stop, and an oak threshold;
#   - oxblood 3-over-1 double-hung sashes, singly and in pairs, their glass dark and reflecting the sky;
#   - window boxes on brackets under the front pairs and the right side's pair;
#   - a side-gabled roof at 25 degrees, deep eaves on exposed rafter tails, purlins and knee braces under the rakes,
#     barge boards and a ridge cap; a front-gabled porch at 30 degrees over two tapered columns on stacked-stone piers,
#     box beams, a beadboard ceiling, board-and-batten in its gable with a louvred vent, a brick floor;
#   - a stone chimney on the left side with clay pots; a bronze lantern beside the door (its glass `cottage_lamp`).
# The origin is the door's sill on the wall's line; the front faces -y (raea +z). No rig: the door is cottage/door.
import os, sys, math, json, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "lib"))
sys.path.insert(0, HERE)
import comp, bpy, bmesh
from mathutils import Vector
import _lib as C

rnd = random.Random(11)

# ---- materials
from _mats import brightened

SHINGLES = [brightened(comp.ph_texture(f"cottage_shingle_{i}", "weathered_brown_planks", tile=1.0, res="2k", tint=t, grey=True), 0.62)
            for i, t in enumerate([(0.50, 0.60, 0.42), (0.45, 0.55, 0.38), (0.56, 0.64, 0.45)])]
TRIM = comp.mat("cottage_trim", (0.72, 0.66, 0.52), rough=0.82)                # (old paint, matte: a gloss sparkled)
SASH = comp.mat("cottage_sash", (0.34, 0.085, 0.065), rough=0.38)
GLASS = comp.mat("cottage_glass", (0.03, 0.04, 0.045), rough=0.04)
STONE = comp.ph_texture("cottage_stone", "stacked_stone_wall", tile=1.3, res="2k")
ROOF = comp.ph_texture("cottage_roof", "grey_roof_01", tile=1.8, res="2k", tint=(0.6, 0.56, 0.52))
WOOD = brightened(comp.ph_texture("cottage_wood", "weathered_brown_planks", tile=1.2, res="2k", tint=(0.55, 0.38, 0.24), grey=True), 0.55)
SOFFIT = brightened(comp.ph_texture("cottage_soffit", "weathered_brown_planks", tile=0.9, res="2k", tint=(0.86, 0.80, 0.66), grey=True), 0.75)
BRICK = comp.ph_texture("cottage_brick", "brick_floor", tile=1.1, res="2k")
OAK = comp.ph_texture("cottage_oak", "weathered_planks", tile=1.0, res="2k", tint=(0.8, 0.66, 0.5))
FLOOR = comp.ph_texture("cottage_floor", "old_wood_floor", tile=1.6, res="1k")
PLASTER = comp.mat("cottage_plaster", (0.80, 0.76, 0.68), rough=0.85)
DARK = comp.mat("cottage_backing", (0.06, 0.05, 0.04), rough=0.9)
BRONZE = comp.mat("cottage_bronze", (0.16, 0.11, 0.075), rough=0.42, metal=1.0)
LAMP = comp.mat("cottage_lamp", (1.0, 0.8, 0.5), rough=0.3, emit=(1.0, 0.72, 0.42), strength=6.0)
CAP = comp.mat("cottage_cap", (0.55, 0.53, 0.50), rough=0.85)
POT = comp.mat("cottage_pot", (0.62, 0.30, 0.18), rough=0.8)
SOIL = comp.mat("cottage_soil", (0.12, 0.08, 0.05), rough=1.0)
BOXWOOD = comp.mat("cottage_box_paint", (0.26, 0.07, 0.05), rough=0.7)        # the window boxes: oxblood, as the sashes
MAT_COIR = comp.mat("cottage_mat", (0.42, 0.30, 0.17), rough=1.0)

col, root = comp.fresh("cottage_house")
V = Vector


# ---- shapes ------------------------------------------------------------------------------------------------------
def hexa(bm, pts, mi=0):
    """a six-faced solid from 8 points: 0-3 one quad, 4-7 the quad opposite (4 over 0 and so on)"""
    vs = [bm.verts.new(V(p)) for p in pts]
    for q in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        try:
            f = bm.faces.new([vs[i] for i in q])
            f.material_index = mi
        except ValueError:
            pass
    return vs


def wall_pt(wall):
    o, a, n, L = C.wall_frame(wall)
    return lambda u, z, out=0.0: (o[0] + a[0] * u + n[0] * out, o[1] + a[1] * u + n[1] * out, z)


def wbox(bm, wall, u0, u1, z0, z1, o0, o1, mi=0):
    """a box on a wall's frame: u0..u1 along it, z0..z1 up, o0..o1 out from its shingle face"""
    p = wall_pt(wall)
    hexa(bm, [p(u0, z0, o0), p(u1, z0, o0), p(u1, z1, o0), p(u0, z1, o0), p(u0, z0, o1), p(u1, z0, o1), p(u1, z1, o1), p(u0, z1, o1)], mi)


def wquad(bm, wall, q, o0, o1, mi=0):
    """a prism on a wall: the quad q (four (u, z), counter-clockwise from outside) from o0 to o1 out"""
    p = wall_pt(wall)
    hexa(bm, [p(u, z, o0) for u, z in q] + [p(u, z, o1) for u, z in q], mi)


def wpoly(bm, wall, poly, o0, o1, mi=0):
    """a flat prism on a wall from a convex polygon of (u, z) points"""
    p = wall_pt(wall)
    a = [bm.verts.new(V(p(u, z, o0))) for u, z in poly]
    b = [bm.verts.new(V(p(u, z, o1))) for u, z in poly]
    for f in (bm.faces.new(a), bm.faces.new(b[::-1])):
        f.material_index = mi
    n = len(poly)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([a[i], b[i], b[j], a[j]]).material_index = mi


def finish(bm, name, mats, bev=None, uv=1.0, smooth=False, parent=None):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = comp.mesh(col, root, name, bm, mats, parent=parent, smooth=smooth)
    if bev:
        comp.bevel(o, bev, 1, angle=40)
    if uv:
        comp.uv_box(o, uv)
    return o


def interval_minus(a, b, cuts):
    """[a, b] with the (c0, c1) cut out of it, as a list of intervals"""
    out = [(a, b)]
    for c0, c1 in sorted(cuts):
        nxt = []
        for x0, x1 in out:
            if c1 <= x0 or c0 >= x1:
                nxt.append((x0, x1))
                continue
            if c0 > x0:
                nxt.append((x0, c0))
            if c1 < x1:
                nxt.append((c1, x1))
        out = nxt
    return [(x0, x1) for x0, x1 in out if x1 - x0 > 1e-4]


WALLS = ("front", "back", "left", "right")
LEN = {w: C.wall_frame(w)[3] for w in WALLS}
BEHIND = -0.016                                       # the shingles' backs, and the core's outside face


def chimney_cut():
    """the chimney's place on the left wall, as a (u0, u1) along it"""
    a, b = C.along("left", C.CHIM_Y[1]), C.along("left", C.CHIM_Y[0])
    return (min(a, b), max(a, b))


def covered(wall):
    """what covers a wall's shingles: each opening with its casings round it (from the apron's foot to the drip cap's
    top; the door's from the ground), and the chimney"""
    out = []
    for u0, u1, z0, z1 in C.holes(wall):
        door = z0 <= 0
        out.append((u0 - C.CASE + 0.012, u1 + C.CASE - 0.012, -1 if door else z0 - 0.18, z1 + (0.23 if door else 0.205)))
    if wall == "left":
        c0, c1 = chimney_cut()
        out.append((c0 + 0.01, c1 - 0.01, -1, 99))
    return out


def top_at(wall, u):
    return C.gable_top(wall, u)


# ---- the walls' cores: behind the shingles, a dark backing outside and plaster inside -------------------------------
def core(wall):
    bm = bmesh.new()
    L = LEN[wall]
    hs = [(u0, u1, z0, z1) for u0, u1, z0, z1 in C.holes(wall)]
    edges = sorted({0.0, L} | {u for h in hs for u in h[:2]} | ({C.along(wall, C.RIDGE_Y)} if wall in ("left", "right") else set()))
    for ua, ub in zip(edges, edges[1:]):
        if ub - ua < 1e-4:
            continue
        um = (ua + ub) / 2
        cuts = [(z0, z1) for u0, u1, z0, z1 in hs if u0 < um < u1]
        # (on the gable ends the core goes up to the roof's underside; on the front and back to the plate, and the
        # blocking between the rafters closes the rest)
        ta = C.PLATE if wall in ("front", "back") else C.roof_z(wall_pt(wall)(ua, 0)[1]) - C.ROOF_DZ + 0.01
        tb = C.PLATE if wall in ("front", "back") else C.roof_z(wall_pt(wall)(ub, 0)[1]) - C.ROOF_DZ + 0.01
        for z0, z1 in interval_minus(0.0, 99.0, cuts):
            za0, zb0 = z0, z0
            za1, zb1 = min(z1, ta), min(z1, tb)
            if za1 <= za0 + 1e-4 and zb1 <= zb0 + 1e-4:
                continue
            wquad(bm, wall, [(ua, za0), (ub, zb0), (ub, zb1), (ua, za1)], BEHIND, BEHIND - C.CORE)
    # the outside face dark (what shows between shingles), the rest plaster
    n = V(C.wall_frame(wall)[2])
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.material_index = 1 if f.normal.dot(n) > 0.5 else 0
    return finish(bm, f"core_{wall}", [PLASTER, DARK], uv=1.0)


for w in WALLS:
    core(w)


# ---- shingles ------------------------------------------------------------------------------------------------------
EXPO, LAP, BUTT, TIP = 0.17, 0.07, 0.014, 0.003
TEX = 1.0


def shingles(wall):
    L = LEN[wall]
    return shingled(f"shingles_{wall}", wall_pt(wall), L, lambda u: top_at(wall, u), covered(wall), C.BASE + 0.085)


def shingled(name, p, L, top_at_u, cov, z_start):
    """courses of shingles on a plane: p(u, z, out) its frame, L its length, top_at_u its top along it, cov what covers it"""
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    top_at = lambda _w, u: top_at_u(u)
    wall = None
    z = z_start
    row = 0
    tmax = max(top_at_u(u) for u in [L * k / 16 for k in range(17)])
    while z < tmax - 0.02:
        zb, zt = z, z + EXPO + LAP
        covs = [c for c in cov if zb < c[3] and zt > c[2]]
        # the course is split where a casing's edge crosses it; where a casing covers it, a shingle that starts below
        # the casing is cut off at the apron's foot, and one that starts inside it starts again on the drip cap
        edges = sorted({0.0, L} | {min(L, max(0.0, e)) for c in covs for e in c[:2]})
        for a, b in zip(edges, edges[1:]):
            if b - a < 0.02:
                continue
            mid = (a + b) / 2
            za, ztop = zb, zt
            for c in covs:
                if c[0] < mid < c[1]:
                    if za >= c[2] - 1e-6:
                        za = max(za, c[3])
                    else:
                        ztop = min(ztop, c[2])
            if ztop - za < 0.025:
                continue
            u = a + (0.0 if a <= 1e-3 else 0.004)
            while u < b - 0.02:
                w = rnd.uniform(0.11, 0.30)
                u1 = min(b, u + w)
                if b - u1 < 0.07:
                    u1 = b
                gap = rnd.uniform(0.003, 0.008)
                ue = u1 - (gap if u1 < b - 1e-4 else 0.0)
                top = min(top_at(wall, u), top_at(wall, ue), ztop)
                if za < top - 0.025:
                    z0 = za + (rnd.uniform(-0.004, 0.004) if za == zb else 0.002)
                    z1 = top
                    tb = BUTT * rnd.uniform(0.8, 1.15)
                    ob, ot = BEHIND + tb + 0.002, BEHIND + TIP + (tb - TIP) * max(0.0, 1 - (z1 - z0) / (EXPO + LAP))
                    pts = [p(u, z0, BEHIND), p(ue, z0, BEHIND), p(ue, z1, BEHIND), p(u, z1, BEHIND),
                           p(u, z0, ob), p(ue, z0, ob), p(ue, z1, ot), p(u, z1, ot)]
                    vs = hexa(bm, pts, rnd.randrange(3))
                    ou, ov = rnd.random() * 4, rnd.random() * 4
                    # (the grain runs up the shingle: the texture's length along z, each shingle from its own patch)
                    uvs = {id(v): (zz / TEX + ou, uu / TEX + ov) for v, (uu, zz) in zip(vs, [(u, z0), (ue, z0), (ue, z1), (u, z1)] * 2)}
                    for f in set(f for v in vs for f in v.link_faces):
                        for l in f.loops:
                            l[uvl].uv = uvs[id(l.vert)]
                u = u1
        z += EXPO
        row += 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return comp.mesh(col, root, name, bm, SHINGLES)


for w in WALLS:
    shingles(w)


# ---- the stone base, its water table, the corner boards, the frieze and the side walls' belt -----------------------
bm = bmesh.new()
for w in WALLS:
    L = LEN[w]
    cuts = []
    if w == "front":
        u = C.along("front", 0.0)
        cuts.append((u - C.DOOR_W / 2 - C.CASE, u + C.DOOR_W / 2 + C.CASE))
    if w == "left":
        cuts.append(chimney_cut())
    for a, b in interval_minus(-C.STONE_OUT, L + C.STONE_OUT, cuts):
        wbox(bm, w, a, b, -0.05, C.BASE, BEHIND - 0.02, C.STONE_OUT)
# the chimney: its base, the shoulder's slope in to the stack, the stack, out of the left wall
cx0, cx1 = C.XL - C.CHIM_OUT, C.XL - BEHIND
hexa(bm, [(cx0, C.CHIM_Y[0], -0.05), (cx1, C.CHIM_Y[0], -0.05), (cx1, C.CHIM_Y[1], -0.05), (cx0, C.CHIM_Y[1], -0.05),
          (cx0, C.CHIM_Y[0], C.CHIM_SHOULDER), (cx1, C.CHIM_Y[0], C.CHIM_SHOULDER), (cx1, C.CHIM_Y[1], C.CHIM_SHOULDER), (cx0, C.CHIM_Y[1], C.CHIM_SHOULDER)])
sx0, sx1 = cx0 + 0.04, cx0 + 0.04 + 0.62
hexa(bm, [(cx0, C.CHIM_Y[0], C.CHIM_SHOULDER), (cx1, C.CHIM_Y[0], C.CHIM_SHOULDER), (cx1, C.CHIM_Y[1], C.CHIM_SHOULDER), (cx0, C.CHIM_Y[1], C.CHIM_SHOULDER),
          (sx0, C.CHIM_STACK[0], C.CHIM_SHOULDER + 0.5), (sx1, C.CHIM_STACK[0], C.CHIM_SHOULDER + 0.5), (sx1, C.CHIM_STACK[1], C.CHIM_SHOULDER + 0.5), (sx0, C.CHIM_STACK[1], C.CHIM_SHOULDER + 0.5)])
bm2 = comp.box((sx1 - sx0, C.CHIM_STACK[1] - C.CHIM_STACK[0], C.CHIM_TOP - C.CHIM_SHOULDER - 0.5),
               ((sx0 + sx1) / 2, (C.CHIM_STACK[0] + C.CHIM_STACK[1]) / 2, (C.CHIM_SHOULDER + 0.5 + C.CHIM_TOP) / 2))
bm = comp.merge(bm, bm2)
finish(bm, "stone", STONE, uv=1.0)

bm = bmesh.new()
for w in WALLS:
    L = LEN[w]
    cuts = []
    if w == "front":
        u = C.along("front", 0.0)
        cuts.append((u - C.DOOR_W / 2 - C.CASE, u + C.DOOR_W / 2 + C.CASE))
    if w == "left":
        cuts.append(chimney_cut())
    for a, b in interval_minus(-C.STONE_OUT - 0.02, L + C.STONE_OUT + 0.02, cuts):
        # the water table: a board on the stone's top, its cap sloped to shed the rain
        wquad(bm, w, [(a, C.BASE), (b, C.BASE), (b, C.BASE + 0.09), (a, C.BASE + 0.09)], BEHIND, 0.012)
        p = wall_pt(w)
        hexa(bm, [p(a, C.BASE, 0.012), p(b, C.BASE, 0.012), p(b, C.BASE, C.STONE_OUT + 0.025), p(a, C.BASE, C.STONE_OUT + 0.025),
                  p(a, C.BASE + 0.09, 0.012), p(b, C.BASE + 0.09, 0.012), p(b, C.BASE + 0.045, C.STONE_OUT + 0.025), p(a, C.BASE + 0.045, C.STONE_OUT + 0.025)])
    if w in ("front", "back"):
        wbox(bm, w, -0.02, L + 0.02, C.PLATE - C.FRIEZE, C.PLATE + 0.02, BEHIND, 0.02)            # the frieze board
        # the blocking between the rafters, from the plate up to the roof's underside at the wall's line
        wbox(bm, w, -0.02, L + 0.02, C.PLATE, C.PLATE + C.HEEL - C.ROOF_DZ + 0.01, BEHIND - C.CORE, 0.0)
    else:
        wbox(bm, w, -0.02, L + 0.02, C.PLATE - 0.05, C.PLATE + 0.05, BEHIND, 0.03)               # the belt at the plate
# corner boards (each corner's two boards, lapped)
for x, y, sx, sy in ((C.XL, C.FRONT, -1, -1), (C.XR, C.FRONT, 1, -1), (C.XL, C.BACK, -1, 1), (C.XR, C.BACK, 1, 1)):
    for z0, z1 in ((C.BASE + 0.09, C.PLATE - C.FRIEZE),):
        bm = comp.merge(bm, comp.box((0.11, 0.022, z1 - z0), (x - sx * 0.055 + sx * 0.022, y + sy * 0.011, (z0 + z1) / 2)))
        bm = comp.merge(bm, comp.box((0.022, 0.11, z1 - z0), (x + sx * 0.011, y - sy * 0.055 + sy * 0.022, (z0 + z1) / 2)))
finish(bm, "trim", TRIM, bev=0.004, uv=1.0)


# ---- windows -------------------------------------------------------------------------------------------------------
trim, sash, glass, boxes, soil, brackets = (bmesh.new() for _ in range(6))
SASH_T = 0.04
for wall, c, wd, s, h, panes in C.WINDOWS:
    u = C.along(wall, c)
    u0, u1 = u - wd / 2, u + wd / 2
    O = C.CASE_OUT
    # casings: sides, the head with its drip cap running past them, a sloped sill and an apron
    wbox(trim, wall, u0 - C.CASE, u0, s, h, BEHIND, O)
    wbox(trim, wall, u1, u1 + C.CASE, s, h, BEHIND, O)
    wbox(trim, wall, u0 - C.CASE - 0.03, u1 + C.CASE + 0.03, h, h + 0.17, BEHIND, O)
    wbox(trim, wall, u0 - C.CASE - 0.06, u1 + C.CASE + 0.06, h + 0.17, h + 0.205, BEHIND, O + 0.035)
    p = wall_pt(wall)
    a, b = u0 - C.CASE - 0.045, u1 + C.CASE + 0.045
    hexa(trim, [p(a, s - 0.045, -0.12), p(b, s - 0.045, -0.12), p(b, s - 0.045, O + 0.06), p(a, s - 0.045, O + 0.06),
                p(a, s + 0.01, -0.12), p(b, s + 0.01, -0.12), p(b, s - 0.012, O + 0.06), p(a, s - 0.012, O + 0.06)])
    wbox(trim, wall, u0 - 0.02, u1 + 0.02, s - 0.18, s - 0.045, BEHIND, O)
    # the jambs' linings, through the wall
    wbox(trim, wall, u0, u0 + 0.02, s, h, BEHIND - C.CORE, BEHIND)
    wbox(trim, wall, u1 - 0.02, u1, s, h, BEHIND - C.CORE, BEHIND)
    wbox(trim, wall, u0, u1, h - 0.02, h, BEHIND - C.CORE, BEHIND)
    # sashes: a pair has a mullion between them
    mull = 0.12
    pw = (wd - (panes - 1) * mull) / panes
    for k in range(panes):
        a = u0 + k * (pw + mull)
        if k:
            wbox(trim, wall, a - mull, a, s, h, -0.10, O)
        m = s + 0.56 * (h - s)
        for (z0, z1, face, upper) in ((s + 0.005, m + 0.02, -0.075, False), (m - 0.02, h - 0.005, -0.035, True)):
            st, tr, br = 0.055, 0.055 if upper else 0.035, 0.035 if upper else 0.085
            o0, o1 = face - SASH_T, face
            wbox(sash, wall, a + 0.01, a + 0.01 + st, z0, z1, o0, o1)
            wbox(sash, wall, a + pw - 0.01 - st, a + pw - 0.01, z0, z1, o0, o1)
            wbox(sash, wall, a + 0.01 + st, a + pw - 0.01 - st, z1 - tr, z1, o0, o1)
            wbox(sash, wall, a + 0.01 + st, a + pw - 0.01 - st, z0, z0 + br, o0, o1)
            wbox(glass, wall, a + 0.01 + st, a + pw - 0.01 - st, z0 + br, z1 - tr, o0 + 0.012, o0 + 0.016)
            if upper:   # three lights over one
                gw = pw - 0.02 - 2 * st
                for j in (1, 2):
                    x = a + 0.01 + st + gw * j / 3
                    wbox(sash, wall, x - 0.011, x + 0.011, z0 + br, z1 - tr, o0 + 0.004, o1 - 0.004)
    # a window box under the front pairs and the right side's pair, on two brackets
    if (wall == "front" and panes == 2) or (wall == "right" and panes == 2):
        b0, b1 = u0 - 0.10, u1 + 0.10
        z0, z1 = C.BOX_Z
        wbox(boxes, wall, b0, b1, z0, z1, 0.035, 0.275)
        wbox(boxes, wall, b0 - 0.015, b1 + 0.015, z1 - 0.03, z1 + 0.01, 0.03, 0.29)               # its rim
        for j in range(1, 6):                                                                      # board joints, proud
            x = b0 + (b1 - b0) * j / 6
            wbox(boxes, wall, x - 0.006, x + 0.006, z0 + 0.01, z1 - 0.03, 0.275, 0.282)
        wbox(soil, wall, b0 + 0.02, b1 - 0.02, z1 - 0.06, z1 - 0.035, 0.055, 0.255)
        for x in (b0 + 0.18, b1 - 0.18):
            wquad(brackets, wall, [(x - 0.02, z0 - 0.26), (x + 0.02, z0 - 0.26), (x + 0.02, z0), (x - 0.02, z0)], BEHIND, 0.02)
            q = [(z0 - 0.24, 0.0), (z0, 0.0), (z0, 0.2)]
            pa = [p(x - 0.02, zz, oo) for zz, oo in q]
            pb = [p(x + 0.02, zz, oo) for zz, oo in q]
            va = [brackets.verts.new(V(v)) for v in pa]
            vb = [brackets.verts.new(V(v)) for v in pb]
            brackets.faces.new(va)
            brackets.faces.new(vb[::-1])
            for i in range(3):
                j = (i + 1) % 3
                brackets.faces.new([va[i], va[j], vb[j], vb[i]])

# the front door's casing, jambs, stop and threshold
u = C.along("front", 0.0)
u0, u1 = u - C.DOOR_W / 2, u + C.DOOR_W / 2
O = C.CASE_OUT
wbox(trim, "front", u0 - C.CASE - 0.01, u0, 0.0, C.DOOR_H, BEHIND, O + 0.005)
wbox(trim, "front", u1, u1 + C.CASE + 0.01, 0.0, C.DOOR_H, BEHIND, O + 0.005)
wbox(trim, "front", u0 - C.CASE - 0.04, u1 + C.CASE + 0.04, C.DOOR_H, C.DOOR_H + 0.19, BEHIND, O + 0.005)
wbox(trim, "front", u0 - C.CASE - 0.07, u1 + C.CASE + 0.07, C.DOOR_H + 0.19, C.DOOR_H + 0.23, BEHIND, O + 0.045)
for (a, b) in ((u0 - 0.025, u0), (u1, u1 + 0.025)):
    wbox(trim, "front", a, b, 0.0, C.DOOR_H, BEHIND - C.CORE, BEHIND)
wbox(trim, "front", u0 - 0.025, u1 + 0.025, C.DOOR_H, C.DOOR_H + 0.025, BEHIND - C.CORE, BEHIND)
# (the stop: on the outside of the leaf, which swings in and closes against it. The leaf is 45 mm thick on the hinge's
# line, so its outer face is LEAF_OUT off the shingles' face, measured outward)
LEAF_OUT = C.FRONT - (C.HINGE[1] - 0.0225)
for (a, b) in ((u0, u0 + 0.014), (u1 - 0.014, u1)):
    wbox(trim, "front", a, b, 0.0, C.DOOR_H, LEAF_OUT + 0.001, LEAF_OUT + 0.017)
wbox(trim, "front", u0, u1, C.DOOR_H - 0.014, C.DOOR_H, LEAF_OUT + 0.001, LEAF_OUT + 0.017)
finish(trim, "casings", TRIM, bev=0.003, uv=1.0)
finish(sash, "sashes", SASH, bev=0.002, uv=1.0)
finish(glass, "glass", GLASS, uv=1.0)
finish(boxes, "window_boxes", BOXWOOD, bev=0.003, uv=1.0)
finish(soil, "window_soil", SOIL, uv=1.0)
finish(brackets, "box_brackets", WOOD, bev=0.003, uv=1.0)
o = finish(comp.box((C.DOOR_W + 0.06, 0.34, 0.035), (0.0, -0.03, 0.004 - 0.0175)), "threshold", OAK, bev=0.004, uv=1.0)


# ---- the main roof -------------------------------------------------------------------------------------------------
def slope_slab(bm, x0, x1, ya, yb, mi_top=0, mi_bot=1, mi_edge=2):
    """a piece of the main roof from x0 to x1, between ya and yb on one slope: its top on roof_z, ROOF_T thick
    (measured square to the slope)"""
    dz = C.ROOF_T / math.cos(C.PITCH)
    top = [(x0, ya, C.roof_z(ya)), (x1, ya, C.roof_z(ya)), (x1, yb, C.roof_z(yb)), (x0, yb, C.roof_z(yb))]
    bot = [(x, y, z - dz) for x, y, z in top]
    vs = hexa(bm, bot + top)
    return vs


def roof_uv(o, ridge_y, tile):
    """the roof's own UVs: across along x, up the slope from the eave (so the texture's courses lap the right way)"""
    me = o.data
    bm = bmesh.new()
    bm.from_mesh(me)
    uvl = bm.loops.layers.uv.verify()
    for f in bm.faces:
        for l in f.loops:
            p = l.vert.co
            s = (abs(p.y - ridge_y)) / math.cos(C.PITCH)
            l[uvl].uv = (p.x / tile, -s / tile)
    bm.to_mesh(me)
    bm.free()


XE = C.XR + C.RAKE
FE = C.FRONT - C.EAVE
BE = C.BACK + C.EAVE
bm = bmesh.new()
# the front slope: over the porch it starts at the wall's line (the porch's own roof is in front of it there)
slope_slab(bm, -XE, -C.P_EAVE, FE, C.RIDGE_Y)
slope_slab(bm, -C.P_EAVE, C.P_EAVE, C.FRONT - 0.02, C.RIDGE_Y)
slope_slab(bm, C.P_EAVE, XE, FE, C.RIDGE_Y)
slope_slab(bm, -XE, XE, C.RIDGE_Y, BE)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
for f in bm.faces:
    f.material_index = 0 if f.normal.z > 0.5 else (1 if f.normal.z < -0.5 else 2)
o = comp.mesh(col, root, "roof", bm, [ROOF, SOFFIT, WOOD])
roof_uv(o, C.RIDGE_Y, 1.8)

# the ridge cap: a rolled cap along the ridge
cap = comp.cyl(0.075, 2 * XE + 0.04, at=(-XE - 0.02, C.RIDGE_Y, C.RIDGE_Z - 0.025), seg=6, axis="X")
comp.xf(cap, comp.T(0, 0, 0))
o = finish(cap, "ridge_cap", ROOF, uv=0.5)

# rafter tails under the eaves, front and back, every 60 cm; purlins and knee braces under the rakes; barge boards
wood = bmesh.new()
dz = C.ROOF_T / math.cos(C.PITCH)


def rafter(x, y_wall, y_end, sgn):
    """a rafter tail from inside the wall's line out to the eave, its top under the roof, 15 cm deep, its end cut
    plumb with its foot swept back"""
    D, Wd = 0.15, 0.055
    ya, yb = y_wall - sgn * 0.05, y_end
    za, zb = C.roof_z(ya) - dz, C.roof_z(yb) - dz
    foot = 0.07
    pts = [(x - Wd / 2, ya, za - D), (x + Wd / 2, ya, za - D), (x + Wd / 2, yb - sgn * foot, zb - D), (x - Wd / 2, yb - sgn * foot, zb - D),
           (x - Wd / 2, ya, za), (x + Wd / 2, ya, za), (x + Wd / 2, yb, zb), (x - Wd / 2, yb, zb)]
    hexa(wood, pts)


xs = [x / 100 for x in range(-360, 361, 60)]
for x in xs:
    if abs(x) > C.P_EAVE + 0.05:
        rafter(x, C.FRONT, FE, -1)
    rafter(x, C.BACK, BE, 1)
# (the outermost rafters, the fly rafters, under the rakes' edges)
for x in (-XE + 0.03, XE - 0.03):
    rafter(x, C.FRONT, FE, -1)
    rafter(x, C.BACK, BE, 1)
# purlins: out of each gable wall to the rake, at the ridge and halfway down each slope; under the two halfway ones a
# knee brace (a post on the wall and a strut up to the purlin)
for sx, xw in ((-1, C.XL), (1, C.XR)):
    for y in (C.FRONT + 1.6, C.RIDGE_Y, C.BACK - 1.6):
        if sx < 0 and C.CHIM_Y[0] - 0.2 < y < C.CHIM_Y[1] + 0.2:
            continue
        zt = C.roof_z(y) - dz
        D = 0.2 if y == C.RIDGE_Y else 0.16
        x0, x1 = xw - sx * 0.1, sx * (XE + 0.04)
        xa, xb = min(x0, x1), max(x0, x1)
        bm2 = comp.box((xb - xa, 0.11, D), ((xa + xb) / 2, y, zt - D / 2))
        wood = comp.merge(wood, bm2)
        if y != C.RIDGE_Y:
            zp = zt - D
            post = comp.box((0.06, 0.1, 0.62), (xw + sx * 0.03, y, zp - 0.31))
            wood = comp.merge(wood, post)
            a = V((xw + sx * 0.06, y, zp - 0.56))
            b = V((xw + sx * 0.46, y, zp))
            d = (b - a).normalized()
            nrm = V((-d.z, 0, d.x)) * 0.045
            st = bmesh.new()
            hexa(st, [a - nrm + V((0, -0.04, 0)), b - nrm + V((0, -0.04, 0)), b - nrm + V((0, 0.04, 0)), a - nrm + V((0, 0.04, 0)),
                      a + nrm + V((0, -0.04, 0)), b + nrm + V((0, -0.04, 0)), b + nrm + V((0, 0.04, 0)), a + nrm + V((0, 0.04, 0))])
            wood = comp.merge(wood, st)
finish(wood, "rafters", WOOD, bev=0.006, uv=1.0)

# barge boards on the rakes' edges (the fly rafters' faces), cream
barge = bmesh.new()
for sx in (-1, 1):
    x0, x1 = sx * (XE + 0.005), sx * (XE + 0.045)
    for ya, yb in ((FE - 0.03, C.RIDGE_Y), (C.RIDGE_Y, BE + 0.03)):
        za, zb = C.roof_z(ya) + 0.012, C.roof_z(yb) + 0.012
        H = 0.24
        xa, xb = min(x0, x1), max(x0, x1)
        hexa(barge, [(xa, ya, za - H), (xa, yb, zb - H), (xa, yb, zb), (xa, ya, za), (xb, ya, za - H), (xb, yb, zb - H), (xb, yb, zb), (xb, ya, za)])
finish(barge, "barge", TRIM, bev=0.004, uv=1.0)


# ---- the porch -----------------------------------------------------------------------------------------------------
# its floor: brick in a stone border, flush with the path; the piers; the tapered columns; the box beams
fl = comp.box((2 * 2.0, C.FRONT - 0.016 - (C.PY - 0.30), 0.065), (0.0, (C.FRONT - 0.016 + C.PY - 0.30) / 2, -0.05 + 0.065 / 2))
finish(fl, "porch_floor", BRICK, uv=1.0)
edge = bmesh.new()
for sx in (-1, 1):
    edge = comp.merge(edge, comp.box((0.2, C.FRONT - 0.016 - (C.PY - 0.30), 0.075), (sx * 2.0 - sx * 0.1, (C.FRONT - 0.016 + C.PY - 0.30) / 2, -0.04 + 0.0375)))
edge = comp.merge(edge, comp.box((4.0, 0.22, 0.075), (0.0, C.PY - 0.30 + 0.11, -0.04 + 0.0375)))
piers = bmesh.new()
for sx in (-1, 1):
    piers = comp.merge(piers, comp.box((C.PIER, C.PIER, C.PIER_H + 0.04), (sx * C.PX, C.PY, (C.PIER_H - 0.04) / 2)))
bm = comp.merge(edge, piers)
finish(bm, "piers", STONE, uv=1.0)
caps = bmesh.new()
for sx in (-1, 1):
    caps = comp.merge(caps, comp.box((C.PIER + 0.07, C.PIER + 0.07, 0.07), (sx * C.PX, C.PY, C.PIER_H + 0.035)))
    caps = comp.merge(caps, comp.box((C.PIER + 0.03, C.PIER + 0.03, 0.02), (sx * C.PX, C.PY, C.PIER_H + 0.08)))
finish(caps, "pier_caps", CAP, bev=0.008, uv=1.0)

cols = bmesh.new()
z0, z1 = C.PIER_H + 0.09, C.BEAM_B
for sx in (-1, 1):
    x, y = sx * C.PX, C.PY
    b, t = C.COL_B / 2, C.COL_T / 2
    # a plinth block, the tapered shaft, a capital of two bands
    cols = comp.merge(cols, comp.box((C.COL_B + 0.06, C.COL_B + 0.06, 0.14), (x, y, z0 + 0.07)))
    sh = bmesh.new()
    hexa(sh, [(x - b, y - b, z0 + 0.14), (x + b, y - b, z0 + 0.14), (x + b, y + b, z0 + 0.14), (x - b, y + b, z0 + 0.14),
              (x - t, y - t, z1 - 0.12), (x + t, y - t, z1 - 0.12), (x + t, y + t, z1 - 0.12), (x - t, y + t, z1 - 0.12)])
    cols = comp.merge(cols, sh)
    cols = comp.merge(cols, comp.box((C.COL_T + 0.05, C.COL_T + 0.05, 0.07), (x, y, z1 - 0.085)))
    cols = comp.merge(cols, comp.box((C.COL_T + 0.09, C.COL_T + 0.09, 0.05), (x, y, z1 - 0.025)))
# box beams: across the front, and back along each side to the wall
bh = C.BEAM_T - C.BEAM_B
cols = comp.merge(cols, comp.box((2 * (C.PX + 0.2), 0.24, bh), (0.0, C.PY, C.BEAM_B + bh / 2)))
for sx in (-1, 1):
    cols = comp.merge(cols, comp.box((0.22, C.FRONT - 0.016 - (C.PY - 0.12), bh), (sx * C.PX, (C.FRONT - 0.016 + C.PY - 0.12) / 2, C.BEAM_B + bh / 2)))
    # a frieze board on each side beam, up to the porch roof's underside (it closes the gable's void from the side)
    zt = C.porch_z(sx * C.PX) - C.ROOF_T / math.cos(C.PPITCH) + 0.01
    cols = comp.merge(cols, comp.box((0.03, C.FRONT - 0.016 - (C.PY - 0.12), zt - C.BEAM_T), (sx * (C.PX + 0.09), (C.FRONT - 0.016 + C.PY - 0.12) / 2, (C.BEAM_T + zt) / 2)))
finish(cols, "columns", TRIM, bev=0.006, uv=1.0)

# the beadboard ceiling between the beams
ceil = comp.box((2 * (C.PX - 0.11), (C.FRONT - 0.016) - (C.PY + 0.12), 0.02), (0.0, ((C.FRONT - 0.016) + (C.PY + 0.12)) / 2, C.BEAM_T - 0.06))
o = finish(ceil, "porch_ceiling", SOFFIT, uv=0.6)

# its roof: two slabs from the ridge down to the eaves, from the front rake back to where its ridge meets the main roof
pdz = C.ROOF_T / math.cos(C.PPITCH)
proof = bmesh.new()
for sx in (-1, 1):
    xa, xb = 0.0, sx * C.P_EAVE
    pts_top = [(xa, C.P_FRONT, C.P_RIDGE), (xb, C.P_FRONT, C.porch_z(xb)), (xb, C.P_BACK, C.porch_z(xb)), (xa, C.P_BACK, C.P_RIDGE)]
    if sx > 0:
        pts_top = [pts_top[1], pts_top[0], pts_top[3], pts_top[2]]
    hexa(proof, [(x, y, z - pdz) for x, y, z in pts_top] + pts_top)
bmesh.ops.recalc_face_normals(proof, faces=proof.faces)
for f in proof.faces:
    f.material_index = 0 if f.normal.z > 0.4 else (1 if f.normal.z < -0.4 else 2)
o = comp.mesh(col, root, "porch_roof", proof, [ROOF, SOFFIT, WOOD])
me = o.data
bm = bmesh.new()
bm.from_mesh(me)
uvl = bm.loops.layers.uv.verify()
for f in bm.faces:
    for l in f.loops:
        p = l.vert.co
        l[uvl].uv = (p.y / 1.8, -abs(p.x) / math.cos(C.PPITCH) / 1.8)
bm.to_mesh(me)
bm.free()
pcap = comp.cyl(0.07, C.P_BACK - C.P_FRONT + 0.03, at=(0.0, C.P_FRONT - 0.03, C.P_RIDGE - 0.02), seg=6, axis="Y")
finish(pcap, "porch_ridge_cap", ROOF, uv=0.5)

# the porch's gable: board-and-batten over the front beam, a louvred vent, the barge boards, the ridge beam's end and
# two purlins out to the rake, rafter tails under its eaves
gable = bmesh.new()
gy = C.PY - 0.12                                       # the beam's front face
tri_top = lambda x: C.porch_z(x) - pdz - 0.005
vz0, vz1, vw = 3.28, 3.72, 0.46
# shingled like the walls, round the vent
shingled("porch_gable_shingles", lambda u, z, out=0.0: (-1.98 + u, gy + 0.03 - out, z), 3.96, lambda u: tri_top(-1.98 + u) - 0.012,
         [(1.98 - vw / 2 - 0.06, 1.98 + vw / 2 + 0.06, vz0 - 0.06, vz1 + 0.06)], C.BEAM_T + 0.012)
# the boards behind the shingles
back = bmesh.new()
poly = [(-1.98, C.BEAM_T), (1.98, C.BEAM_T), (1.98, tri_top(1.98)), (0.0, tri_top(0.0)), (-1.98, tri_top(1.98))]
a = [back.verts.new(V((x, gy + 0.045, z))) for x, z in poly]
b = [back.verts.new(V((x, gy + 0.12, z))) for x, z in poly]
back.faces.new(a)
back.faces.new(b[::-1])
for i in range(5):
    j = (i + 1) % 5
    back.faces.new([a[i], b[i], b[j], a[j]])
gable = comp.merge(gable, back)
finish(gable, "porch_gable", DARK, uv=1.0)
vent = bmesh.new()
vent = comp.merge(vent, comp.box((vw + 0.1, 0.05, 0.05), (0.0, gy - 0.0, vz0 - 0.025)))
vent = comp.merge(vent, comp.box((vw + 0.1, 0.05, 0.05), (0.0, gy - 0.0, vz1 + 0.025)))
for sx in (-1, 1):
    vent = comp.merge(vent, comp.box((0.05, 0.05, vz1 - vz0 + 0.1), (sx * (vw / 2 + 0.025), gy, (vz0 + vz1) / 2)))
for k in range(7):
    z = vz0 + 0.03 + k * (vz1 - vz0 - 0.06) / 6
    sl = comp.box((vw, 0.012, 0.07), (0.0, gy + 0.01, z))
    comp.xf(sl, comp.T(0, gy + 0.01, z) @ comp.R(-40, "X") @ comp.T(0, -(gy + 0.01), -z))
    vent = comp.merge(vent, sl)
finish(vent, "porch_vent", TRIM, bev=0.003, uv=1.0)
vback = comp.box((vw, 0.01, vz1 - vz0), (0.0, gy + 0.035, (vz0 + vz1) / 2))
finish(vback, "porch_vent_back", DARK, uv=1.0)

pw = bmesh.new()
# barge boards along the front rake
for sx in (-1, 1):
    xa, xb = 0.0, sx * (C.P_EAVE + 0.02)
    za, zb = C.P_RIDGE + 0.01, C.porch_z(xb) + 0.01
    H = 0.22
    y0, y1 = C.P_FRONT - 0.045, C.P_FRONT - 0.005
    pts = [(xa, y0, za - H), (xb, y0, zb - H), (xb, y0, zb), (xa, y0, za), (xa, y1, za - H), (xb, y1, zb - H), (xb, y1, zb), (xa, y1, za)]
    hexa(pw, pts)
finish(pw, "porch_barge", TRIM, bev=0.004, uv=1.0)
pwood = bmesh.new()
# the ridge beam's end, and a purlin out under each slope, from the gable to past the barge board
for x, D in ((0.0, 0.2), (-1.05, 0.15), (1.05, 0.15)):
    zt = C.porch_z(x) - pdz
    pwood = comp.merge(pwood, comp.box((0.11, gy + 0.12 - (C.P_FRONT - 0.12), D), (x, (gy + 0.12 + C.P_FRONT - 0.12) / 2, zt - D / 2)))
# rafter tails under the porch roof's eaves
for sx in (-1, 1):
    for y in [C.P_FRONT + 0.1 + 0.5 * k for k in range(5)]:
        if y > C.FRONT - 0.3:
            continue
        xa, xb = sx * (C.PX - 0.05), sx * (C.P_EAVE + 0.02)
        za, zb = C.porch_z(xa) - pdz, C.porch_z(xb) - pdz
        D, Wd = 0.13, 0.05
        foot = sx * 0.06
        hexa(pwood, [(xa, y - Wd / 2, za - D), (xb - foot, y - Wd / 2, zb - D), (xb - foot, y + Wd / 2, zb - D), (xa, y + Wd / 2, za - D),
                     (xa, y - Wd / 2, za), (xb, y - Wd / 2, zb), (xb, y + Wd / 2, zb), (xa, y + Wd / 2, za)])
# knee braces under the front rake, from the beam's face up to the purlins
for sx in (-1, 1):
    a = V((sx * 1.6, gy - 0.02, C.BEAM_T - 0.02))
    b = V((sx * 1.05, gy - 0.02, C.porch_z(1.05) - pdz - 0.15))
    d = (b - a).normalized()
    nrm = V((-d.z, 0, d.x)) * 0.04
    hexa(pwood, [a - nrm + V((0, -0.035, 0)), b - nrm + V((0, -0.035, 0)), b - nrm + V((0, 0.035, 0)), a - nrm + V((0, 0.035, 0)),
                 a + nrm + V((0, -0.035, 0)), b + nrm + V((0, -0.035, 0)), b + nrm + V((0, 0.035, 0)), a + nrm + V((0, 0.035, 0))])
finish(pwood, "porch_timbers", WOOD, bev=0.006, uv=1.0)

# ---- the chimney's cap and pots, the lantern, a coir mat at the door, the floor and ceiling inside ------------------
cc = comp.box((sx1 - sx0 + 0.1, C.CHIM_STACK[1] - C.CHIM_STACK[0] + 0.1, 0.08), ((sx0 + sx1) / 2, (C.CHIM_STACK[0] + C.CHIM_STACK[1]) / 2, C.CHIM_TOP + 0.04))
finish(cc, "chimney_cap", CAP, bev=0.01, uv=1.0)
pots = bmesh.new()
for k, y in enumerate((C.CHIM_STACK[0] + 0.22, C.CHIM_STACK[1] - 0.22)):
    h = 0.38 + 0.08 * k
    pots = comp.merge(pots, comp.cyl(0.085, h, at=((sx0 + sx1) / 2, y, C.CHIM_TOP + 0.08), seg=20, r2=0.07))
    pots = comp.merge(pots, comp.cyl(0.09, 0.05, at=((sx0 + sx1) / 2, y, C.CHIM_TOP + 0.08 + h - 0.05), seg=20))
finish(pots, "chimney_pots", POT, uv=0.5, smooth=True)

LX, LZ = 0.88, 1.86
lamp_frame = bmesh.new()
ly = C.FRONT - 0.016
lamp_frame = comp.merge(lamp_frame, comp.box((0.12, 0.03, 0.2), (LX, ly - 0.015, LZ - 0.02)))                 # the back plate
lamp_frame = comp.merge(lamp_frame, comp.box((0.03, 0.12, 0.03), (LX, ly - 0.08, LZ)))                         # the arm
for dx in (-0.075, 0.075):
    for dy in (-0.075, 0.075):
        lamp_frame = comp.merge(lamp_frame, comp.box((0.012, 0.012, 0.24), (LX + dx, ly - 0.16 + dy, LZ - 0.06)))
lamp_frame = comp.merge(lamp_frame, comp.cyl(0.115, 0.06, at=(LX, ly - 0.16, LZ + 0.06), seg=4, r2=0.02))         # the roof
lamp_frame = comp.merge(lamp_frame, comp.box((0.17, 0.17, 0.02), (LX, ly - 0.16, LZ - 0.19)))                   # the base
finish(lamp_frame, "lantern", BRONZE, bev=0.002, uv=0.5)
lg = comp.box((0.14, 0.14, 0.22), (LX, ly - 0.16, LZ - 0.07))
finish(lg, "lantern_glass", LAMP, uv=0.5)

finish(comp.box((0.85, 0.5, 0.018), (0.0, C.FRONT - 0.33, 0.016 + 0.009)), "door_mat", MAT_COIR, bev=0.004, uv=0.5)
finish(comp.box((C.XR - C.XL - 0.4, C.BACK - C.FRONT - 0.4, 0.02), (0.0, (C.FRONT + C.BACK) / 2, -0.01)), "floor", FLOOR, uv=1.0)
finish(comp.box((C.XR - C.XL - 0.4, C.BACK - C.FRONT - 0.4, 0.02), (0.0, (C.FRONT + C.BACK) / 2, C.PLATE - 0.01)), "ceiling", PLASTER, uv=1.0)

comp.export(col, root, "cottage", "house", made="blender/components/cottage/house.py",
            source="own geometry; Poly Haven textures (CC0): weathered_brown_planks, stacked_stone_wall, grey_roof_01, brick_floor, weathered_planks, old_wood_floor",
            license="ours (textures CC0)", credit="Poly Haven (polyhaven.com)",
            rig={"lantern": "in the scene: the lantern's glass (cottage_lamp) glows; give it a glow at the lantern"},
            notes=json.dumps({"door": {"hinge": list(C.HINGE), "w": C.DOOR_W, "h": C.DOOR_H}, "lantern": [LX, ly - 0.16, LZ - 0.07],
                              "ridge": C.RIDGE_Z, "porch_ridge": C.P_RIDGE, "front": C.FRONT, "walls": [C.XL, C.XR, C.FRONT, C.BACK]}))
