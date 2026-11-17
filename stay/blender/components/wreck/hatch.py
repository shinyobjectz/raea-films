# wreck/hatch: the kelp world's door (the director, 11-11: "i like revampped cathedral and kelp"; "i really do want every time
# that door opens its a whole new world"). The side of a sunken steel ship standing out of the sand at the end of a kelp
# forest: a wall of riveted, lapped plates, rusted and crusted with barnacles, its top torn ragged, and in it a
# watertight door: a rounded opening in a heavy coaming, a plate leaf on two hinges with dogs round its edge, and a
# hand wheel in its middle (its own component, wreck/hatch-wheel, which the scene sets on the leaf and turns).
# The origin is the sill's middle on the hull's face, the hull facing -y (toward the lens). The door opens toward us:
# rig "open", the leaf swinging out 100 degrees on its left side.
import os, sys, math, random, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from mathutils import Vector, Matrix, noise

rnd = random.Random(11)
OW, OBOT, OTOP, OR = 0.56, 0.06, 2.16, 0.28       # the opening: half-width, sill, top, corner radius
CO = 0.13                                         # the coaming's width round the opening
CY0, CY1 = -0.11, 0.06                            # the coaming's front and back
HT = 0.24                                         # the hull plating's thickness
X0, X1, ZB = -9.0, 8.0, -0.9                      # the hull's ends and its foot (in the sand)
LEAF_T = 0.06
LEAF_Y = CY0 - 0.004                              # the leaf's back face
HX, HY = -(OW + 0.07) - 0.035, LEAF_Y - LEAF_T / 2   # the hinge's line
WHEEL = (0.0, LEAF_Y - LEAF_T - 0.075, 1.12)      # the wheel's hub (hatch-wheel's origin)


def rust(name, tint, tile):
    for asset in ("rust_coarse_01", "rusty_metal_02", "metal_plate"):
        try:
            return comp.ph_texture(name, asset, tile=tile, res="2k", tint=tint)
        except BaseException as e:      # (comp.fail raises SystemExit)
            print("hatch: no", asset, e)
    return comp.mat(name, tint, rough=0.8, metal=0.4)


HULL = rust("hatch_hull", (0.5, 0.5, 0.43), 1.7)
PLATE = rust("hatch_plate", (0.58, 0.52, 0.43), 1.3)
DOOR = rust("hatch_door", (0.72, 0.6, 0.48), 0.9)
IRON = comp.mat("hatch_iron", (0.07, 0.055, 0.045), rough=0.72, metal=0.8)
BARN = comp.mat("hatch_barnacle", (0.34, 0.33, 0.29), rough=0.9)

col, root = comp.fresh("hatch")


def front(x, z):
    """the hull's face (y): flat about the door, falling away toward its ends and its top"""
    return 0.011 * x * x + 0.01 * (z - 1.1) ** 2 - 0.0121 + 0.006 * noise.noise(Vector((x * 0.9, z * 0.9, 0.5)))


def top(x):
    """the torn top edge"""
    t = 4.5 + 0.25 * math.sin(x * 0.7 + 0.4) + 0.16 * noise.noise(Vector((x * 1.7, 3.1, 0.0)))
    if 2.4 < x < 5.6:
        k = math.sin((x - 2.4) / 3.2 * math.pi)
        t -= 1.7 * k + 0.35 * k * abs(noise.noise(Vector((x * 5.0, 1.0, 2.0))))
    for e, s in ((X0, 1), (X1, -1)):                 # (torn down toward both ends)
        d = (x - e) * s
        if d < 2.2:
            t -= (2.2 - d) * 1.2 + 0.3 * abs(noise.noise(Vector((x * 4.0, 5.0, 1.0))))
    return max(t, 0.9)


def sheet(fy, x0, x1, zb, ztop, nx, nz, thick):
    """a solid plate whose face follows fy(x, z) from x0 to x1 and zb up to ztop(x), `thick` behind it"""
    bm = bmesh.new()
    F, B = {}, {}
    for i in range(nx + 1):
        x = x0 + (x1 - x0) * i / nx
        zt = ztop(x)
        for j in range(nz + 1):
            z = zb + (zt - zb) * j / nz
            y = fy(x, z)
            F[i, j] = bm.verts.new((x, y, z))
            B[i, j] = bm.verts.new((x, y + thick, z))
    for i in range(nx):
        for j in range(nz):
            bm.faces.new((F[i, j], F[i + 1, j], F[i + 1, j + 1], F[i, j + 1]))
            bm.faces.new((B[i, j], B[i, j + 1], B[i + 1, j + 1], B[i + 1, j]))
    for i in range(nx):
        for j in (0, nz):
            bm.faces.new((F[i, j], B[i, j], B[i + 1, j], F[i + 1, j]) if j == 0 else (F[i, j], F[i + 1, j], B[i + 1, j], B[i, j]))
    for j in range(nz):
        for i in (0, nx):
            bm.faces.new((F[i, j], F[i, j + 1], B[i, j + 1], B[i, j]) if i == 0 else (F[i, j], B[i, j], B[i, j + 1], F[i, j + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def rrect(hw, z0, z1, r, n=8):
    pts = []
    for cx, cz, a0 in ((hw - r, z0 + r, -90), (hw - r, z1 - r, 0), (-hw + r, z1 - r, 90), (-hw + r, z0 + r, 180)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    return pts


def prism(poly, y0, y1):
    bm = bmesh.new()
    f = [bm.verts.new((x, y0, z)) for x, z in poly]
    b = [bm.verts.new((x, y1, z)) for x, z in poly]
    bm.faces.new(f)
    bm.faces.new(list(reversed(b)))
    n = len(poly)
    for i in range(n):
        bm.faces.new((f[i], b[i], b[(i + 1) % n], f[(i + 1) % n]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def ring(outer, inner, y0, y1):
    bm = bmesh.new()
    n = len(outer)
    of = [bm.verts.new((x, y0, z)) for x, z in outer]
    ob = [bm.verts.new((x, y1, z)) for x, z in outer]
    inf = [bm.verts.new((x, y0, z)) for x, z in inner]
    inb = [bm.verts.new((x, y1, z)) for x, z in inner]
    for i in range(n):
        k = (i + 1) % n
        bm.faces.new((of[i], of[k], inf[k], inf[i]))
        bm.faces.new((ob[i], inb[i], inb[k], ob[k]))
        bm.faces.new((of[i], ob[i], ob[k], of[k]))
        bm.faces.new((inf[i], inf[k], inb[k], inb[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def cut(o, cutter):
    m = o.modifiers.new("cut", "BOOLEAN")
    m.operation = "DIFFERENCE"
    m.solver = "EXACT"
    m.object = cutter
    for k, val in (("material_mode", "TRANSFER"), ("use_hole_tolerant", True)):
        try:
            setattr(m, k, val)
        except (AttributeError, TypeError):
            pass
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=m.name)


def scene_obj(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


cutter = scene_obj("hatch_cutter", prism(rrect(OW, OBOT, OTOP, OR, 10), -1.0, 1.0))
near_door = lambda x, z, m=0.0: abs(x) < OW + CO + m and z < OTOP + CO + m


# ---- the hull's plating behind the plates
hull = comp.mesh(col, root, "hatch_hull", sheet(lambda x, z: front(x, z) + 0.022, X0, X1, ZB, top, 85, 28, HT), HULL)
cut(hull, cutter)
comp.uv_box(hull, 1.0)

# ---- the plates: strakes 1.15 m high of plates 2.4 m long, staggered, each lapped (its lower edge stands proud of the
# one below), dented a little, with a row of rivets round its edge
plates, rivets = [], []
STRAKE, PL = 1.15, 2.4
for si in range(6):
    z0 = ZB + si * STRAKE
    off = (si % 2) * PL / 2 + rnd.uniform(-0.1, 0.1)
    x = X0 - off
    while x < X1:
        xa, xb = max(X0, x + 0.004), min(X1, x + PL - 0.004)
        x += PL
        if xb - xa < 0.3:
            continue
        zt = lambda xx, z0=z0: min(z0 + STRAKE - 0.004, top(xx) - 0.03)
        if min(zt(xa), zt(xb), zt((xa + xb) / 2)) < z0 + 0.25:
            continue
        seed = rnd.uniform(0, 100)
        fy = lambda xx, z, z0=z0, seed=seed: front(xx, z) - 0.018 * (1 - (z - z0) / STRAKE) + 0.007 * noise.noise(Vector((xx * 1.6 + seed, z * 1.6, seed)))
        plates.append(sheet(fy, xa, xb, z0 + 0.004, zt, 8, 4, 0.03))
        # rivets: a row 5 cm in from each edge, 10 cm apart
        def rivet(xx, z):
            if near_door(xx, z, 0.06) or z > top(xx) - 0.08:
                return
            r = 0.011 + rnd.uniform(-0.002, 0.002)
            # (comp.cyl(axis="Y") runs from `at` toward +y, into the plate: its narrow end is the head's top, toward the lens)
            rivets.append(comp.cyl(r * 0.55, 0.011, at=(xx, fy(xx, z) - 0.008, z), seg=6, r2=r, axis="Y"))
        for k in range(int((xb - xa - 0.1) / 0.1) + 1):
            xx = xa + 0.05 + k * 0.1
            rivet(xx, z0 + 0.05)
            rivet(xx, min(z0 + STRAKE - 0.05, zt(xx) - 0.05))
        for k in range(int((STRAKE - 0.1) / 0.1) + 1):
            z = z0 + 0.05 + k * 0.1
            rivet(xa + 0.05, z)
            rivet(xb - 0.05, z)
o = comp.mesh(col, root, "hatch_plates", comp.merge(*plates), PLATE)
cut(o, cutter)
comp.uv_box(o, 1.0)

o = comp.mesh(col, root, "hatch_rivets", comp.merge(*rivets), IRON, smooth=True)

# ---- barnacles, thickest low down and along the seams
barn = []
for _ in range(950):
    x = rnd.uniform(X0 + 0.3, X1 - 0.3)
    z = ZB + 0.4 + (top(x) - ZB - 0.5) * rnd.random() ** 1.9
    if near_door(x, z, 0.03):
        continue
    r = rnd.uniform(0.008, 0.026)
    barn.append(comp.cyl(r * 0.4, r * 1.2 + 0.01, at=(x, front(x, z) - 0.02 - r * 1.2, z), seg=7, r2=r, axis="Y"))
for x, z in ((rnd.uniform(-OW - CO, OW + CO), rnd.uniform(-0.05, 0.2)) for _ in range(40)):
    r = rnd.uniform(0.01, 0.022)
    barn.append(comp.cyl(r * 0.4, r * 1.2 + 0.01, at=(x, CY0 - r * 1.2, z), seg=7, r2=r, axis="Y"))
o = comp.mesh(col, root, "hatch_barnacles", comp.merge(*barn), BARN, smooth=True)

# ---- the coaming round the opening
o = comp.mesh(col, root, "hatch_coaming", ring(rrect(OW + CO, OBOT - CO, OTOP + CO, OR + CO, 10), rrect(OW, OBOT, OTOP, OR, 10), CY0, CY1), DOOR)
comp.bevel(o, 0.008, 2)
comp.uv_box(o, 1.0)

# ---- the leaf on its hinge: a plate with a beaded rim and two stiffeners, dogs round its edge
hinge = comp.pivot(col, root, "hatch_hinge", (HX, HY, 0.0))
lp = rrect(OW + 0.07, OBOT - 0.05, OTOP + 0.07, OR + 0.07, 10)
leaf = prism(lp, LEAF_Y - LEAF_T, LEAF_Y)
bars = [comp.box((2 * OW, 0.022, 0.07), (0, LEAF_Y - LEAF_T - 0.011, z)) for z in (0.5, 1.75)]
bars.append(comp.box((0.07, 0.022, OTOP - 0.3), (0.0, LEAF_Y - LEAF_T - 0.011, OTOP / 2 + 0.02)))
o = comp.mesh(col, root, "hatch_leaf", comp.merge(leaf, *bars), DOOR, parent=hinge)
comp.bevel(o, 0.006, 2)
comp.uv_box(o, 1.0)
iron = []
rim = ring(rrect(OW + 0.07, OBOT - 0.05, OTOP + 0.07, OR + 0.07, 10), rrect(OW + 0.035, OBOT - 0.015, OTOP + 0.035, OR + 0.035, 10), LEAF_Y - LEAF_T - 0.012, LEAF_Y - LEAF_T + 0.002)
iron.append(rim)
for a in (0.18, 0.5, 0.82):                         # dogs: wedge handles on the right edge and top and foot
    z = OBOT + (OTOP - OBOT) * a
    iron.append(comp.box((0.13, 0.035, 0.04), (OW + 0.02, LEAF_Y - LEAF_T - 0.02, z)))
for x in (-0.25, 0.25):
    iron.append(comp.box((0.04, 0.035, 0.12), (x, LEAF_Y - LEAF_T - 0.02, OTOP + 0.02)))
    iron.append(comp.box((0.04, 0.035, 0.12), (x, LEAF_Y - LEAF_T - 0.02, OBOT + 0.0)))
for z in (0.42, 1.72):                              # the hinges' arms, on the leaf
    iron.append(comp.box((0.3, 0.03, 0.12), (HX + 0.15, LEAF_Y - LEAF_T - 0.015, z)))
iron.append(comp.cyl(0.03, 0.06, at=(WHEEL[0], LEAF_Y - LEAF_T - 0.03, WHEEL[2]), seg=14, axis="Y"))   # the wheel's boss
o = comp.mesh(col, root, "hatch_leaf_iron", comp.merge(*iron), IRON, parent=hinge)
comp.bevel(o, 0.004, 1)
knuckles = [comp.cyl(0.04, 0.24, at=(HX, HY, z - 0.12), seg=14) for z in (0.42, 1.72)]
knuckles += [comp.box((0.1, 0.05, 0.2), (HX - 0.05, CY0 + 0.0, z)) for z in (0.42, 1.72)]
o = comp.mesh(col, root, "hatch_knuckles", comp.merge(*knuckles), IRON, smooth=True)

comp.channel("open", [(hinge, "rotation_euler", 2, 0.0, -math.radians(100))])
bpy.data.objects.remove(cutter, do_unlink=True)

comp.export(col, root, "wreck", "hatch", made="blender/components/wreck/hatch.py",
            source="own geometry; Poly Haven's rust_coarse_01 (CC0) on its plates", license="ours (textures CC0)", credit="Poly Haven (polyhaven.com)",
            rig={"open": "the leaf (hatch_hinge) swings out 100 degrees toward the lens on its left side"},
            notes=json.dumps({"hinge": [HX, HY, 0.0], "wheel": list(WHEEL), "opening": {"half_width": OW, "sill": OBOT, "top": OTOP}, "face_y": CY0}))

# ---- the wheel: its own component, its origin the hub, its face toward -y; the scene sets it on the leaf and turns it
col, root = comp.fresh("hatch_wheel")
R, TR = 0.3, 0.02
pts = [(R * math.cos(2 * math.pi * i / 24), 0.0, R * math.sin(2 * math.pi * i / 24)) for i in range(25)]
parts = [comp.tube(pts, TR, res=4, sides=3)]
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2
    sp = comp.box((R - 0.03, 0.022, 0.03), ((R - 0.03) / 2 * math.cos(a), 0.0, (R - 0.03) / 2 * math.sin(a)))
    bmesh.ops.rotate(sp, verts=sp.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(-a, 3, "Y"))
    parts.append(sp)
parts.append(comp.cyl(0.045, 0.07, at=(0, -0.035, 0), seg=16, axis="Y"))            # the hub
parts.append(comp.cyl(0.02, 0.075, at=(0, 0.0, 0), seg=10, axis="Y"))                # the stem into the leaf
parts.append(comp.cyl(0.019, 0.085, at=(R, -0.085, 0), seg=10, axis="Y"))            # the spinner knob on the rim
o = comp.mesh(col, root, "hatch_wheel_iron", comp.merge(*parts), IRON, smooth=True)
comp.export(col, root, "wreck", "hatch_wheel", made="blender/components/wreck/hatch.py", source="own geometry", license="ours", credit="",
            notes="Its origin is the hub; it turns about its axle, Blender's y (raea's z, toward the lens). The spinner knob stands on the rim at +x.")
