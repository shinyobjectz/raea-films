# FLOOR3's own furniture and dressing: every model here is made by us (no downloaded models). It replaces the library
# pieces the office used (desk, bookcase, clock, pull station, wet-floor sign, clipboard, papers, stapler, pen cup, desk
# lamp, framed prints, extinguisher, two plants) and adds what dresses the floor (a poster, a calendar, desk photos).
# Printed surfaces come from tools/tex.sh (blender/src/tex) and tools/art.sh (assets/art, drawn by an image model to
# our prompts). Each piece is one component (blender/lib/comp.py): standing on its base at the origin, front toward
# Blender -y (raea +z), exported to assets/models/f3/NAME.glb.
#   raea blender run blender/ours.py [NAME ...]
import bpy, bmesh, sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp as C
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
PLACE, MADE = "f3", "blender/ours.py"
TEX = os.path.join(C.PROJECT, "blender", "src", "tex")
ART = os.path.join(C.PROJECT, "assets", "art")
PI = math.pi


def hexc(h):
    h = h.lstrip("#")
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4))


def art(name):
    for ext in (".png", ".jpg"):
        p = os.path.join(ART, name + ext)
        if os.path.isfile(p):
            return p
    C.fail(f"no art {name} in assets/art (tools/art.sh {name}, then pick a take)")


# --- materials ----------------------------------------------------------------------------------------------------

def img(name, path, rough=0.6, metal=0.0, tint=None):
    """A material whose base colour is an image (on the part's first UV map), optionally multiplied by a tint."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL"):
            nt.nodes.remove(n)
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(path, check_existing=True)
    if tint:
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        mix.inputs[7].default_value = (*tint, 1)
        nt.links.new(t.outputs["Color"], mix.inputs[6])
        nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    else:
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


def paint(name, h, rough=0.45, metal=0.0, **kw):
    return C.mat(name, hexc(h), rough, metal, **kw)


# --- shapes -------------------------------------------------------------------------------------------------------

def uvl(bm):
    return bm.loops.layers.uv.verify()


def planar(bm, faces, axes=(0, 2), rect=None, region=(0, 0, 1, 1), flip_u=False):
    """UVs for these faces, projected on two axes (0 x, 1 y, 2 z): rect (in metres; default the faces' bounds) maps onto
    region of the image (u0, v0, u1, v1). Coordinates past the rect tile."""
    uv = uvl(bm)
    if rect is None:
        xs = [v.co[axes[0]] for f in faces for v in f.verts]
        ys = [v.co[axes[1]] for f in faces for v in f.verts]
        rect = (min(xs), min(ys), max(xs), max(ys))
    for f in faces:
        for l in f.loops:
            a = (l.vert.co[axes[0]] - rect[0]) / max(1e-9, rect[2] - rect[0])
            b = (l.vert.co[axes[1]] - rect[1]) / max(1e-9, rect[3] - rect[1])
            if flip_u:
                a = 1 - a
            l[uv].uv = (region[0] + a * (region[2] - region[0]), region[1] + b * (region[3] - region[1]))


def facing(bm, axis, sign):
    bm.normal_update()
    return [f for f in bm.faces if f.normal[axis] * sign > 0.9]


def quad(w, h, region=(0, 0, 1, 1)):
    """A w x h card in the xz plane facing -y, centred, its image upright as seen from the front."""
    bm = bmesh.new()
    uv = uvl(bm)
    vs = [bm.verts.new(p) for p in ((-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2))]
    f = bm.faces.new(vs)
    for l, (a, b) in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
        l[uv].uv = (region[0] + a * (region[2] - region[0]), region[1] + b * (region[3] - region[1]))
    return bm


def flat(bm):
    """Turn a card made facing -y to lie face up (its image's top toward +y)."""
    return C.xf(bm, C.R(-90, "X"))


def lathe(profile, seg=48, phase=0.0, uv=False):
    """A surface of revolution about z: profile [(r, z), ...] traced so the surface's outside is on its right as it
    runs (up the outside, over a rim, down an inside). A point at r 0 closes it there. With uv, u runs round (0 at
    `phase`) and v along the profile."""
    bm = bmesh.new()
    lay = uvl(bm) if uv else None
    rings = []
    for r, z in profile:
        if r < 1e-7:
            rings.append([bm.verts.new((0, 0, z))] * (seg + 1))
        else:
            rings.append([bm.verts.new((r * math.cos(phase + 2 * PI * i / seg), r * math.sin(phase + 2 * PI * i / seg), z)) for i in range(seg + 1)])
    L = [0.0]
    for (r0, z0), (r1, z1) in zip(profile, profile[1:]):
        L.append(L[-1] + math.hypot(r1 - r0, z1 - z0))
    for k, (a, b) in enumerate(zip(rings, rings[1:])):
        for i in range(seg):
            vs = [a[i], a[i + 1], b[i + 1], b[i]]
            uvs = [(i / seg, L[k]), ((i + 1) / seg, L[k]), ((i + 1) / seg, L[k + 1]), (i / seg, L[k + 1])]
            keep = [(v, t) for j, (v, t) in enumerate(zip(vs, uvs)) if v not in [x for x, _ in zip(vs[:j], uvs[:j])]]
            if len(keep) < 3:
                continue
            f = bm.faces.new([v for v, _ in keep])
            if lay:
                for l, (_, t) in zip(f.loops, keep):
                    l[lay].uv = (t[0], t[1] / max(L[-1], 1e-9))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    return bm


def smooth(bm, deg=35):
    """Smooth shading with edges sharper than `deg` kept sharp."""
    bm.normal_update()
    for f in bm.faces:
        f.smooth = True
    lim = math.radians(deg)
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.calc_face_angle(0) > lim:
            e.smooth = False
    return bm


def mats(bm, index):
    for f in bm.faces:
        f.material_index = index
    return bm


def part(col, root, name, bm, material, bevel=None, sharp=35, parent=None):
    """One mesh object from a bmesh (a material or a list; faces keep their material_index)."""
    smooth(bm, sharp)
    o = C.mesh(col, root, name, bm, material, parent=parent)
    if bevel:
        C.bevel(o, bevel, 2, 50)
    return o


def ship(col, root, name, what, notes=None):
    C.export(col, root, PLACE, name, MADE, f"own geometry ({what})", "ours", "", notes=notes)


# --- the desk: a 1990s steel desk, laminate top, two pedestals --------------------------------------------------

STEEL, STEEL_D, CHROME = "#a29c8d", "#5f5c55", "#cfd1d2"


def desk():
    col, root = C.fresh("desk")
    W, D, TOP = 2.0, 0.947, 0.787
    steel, dark = paint("desk_steel", STEEL, 0.38), paint("desk_kick", STEEL_D, 0.6)
    chrome = paint("desk_chrome", CHROME, 0.18, 1.0)
    lam = img("desk_laminate", os.path.join(TEX, "laminate.png"), 0.5)
    vinyl = paint("desk_vinyl", "#2a2927", 0.55)
    card = paint("desk_card", "#ece8dc", 0.8)
    top = C.box((W, D, 0.03), (0, 0, TOP - 0.015))
    for f in top.faces:
        f.material_index = 1
    up = facing(top, 2, 1)
    for f in up:
        f.material_index = 0
    planar(top, up, (0, 1), rect=(0, 0, 0.6, 0.6))
    part(col, root, "desk_top", top, [lam, vinyl], bevel=0.003)
    PW, inset, Db = 0.42, 0.015, D - 0.05
    front = -Db / 2
    body_z0, body_z1 = 0.06, TOP - 0.03
    for s, drawers, side in ((-1, (0.16, 0.16, 0.365), "l"), (1, (0.345, 0.34), "r")):
        cx = s * (W / 2 - inset - PW / 2)
        part(col, root, f"desk_ped_{side}", C.box((PW, Db, body_z1 - body_z0), (cx, 0, (body_z0 + body_z1) / 2)), steel, bevel=0.002)
        part(col, root, f"desk_kick_{side}", C.box((PW - 0.04, Db - 0.08, body_z0), (cx, 0.03, body_z0 / 2)), dark)
        z = body_z1
        for k, h in enumerate(drawers):
            zc = z - h / 2 - 0.003
            part(col, root, f"desk_drawer_{side}{k}", C.box((PW - 0.012, 0.016, h - 0.006), (cx, front - 0.008, zc)), steel, bevel=0.003)
            pz = z - 0.045
            bar = C.cyl(0.0055, 0.12, (cx - 0.06, front - 0.030, pz), seg=16, axis="X")
            posts = [C.cyl(0.004, 0.016, (cx + dx, front - 0.016, pz), seg=10, axis="Y") for dx in (-0.05, 0.05)]
            for p in posts:
                C.xf(p, Matrix.Translation((0, -0.016, 0)))
            part(col, root, f"desk_pull_{side}{k}", C.merge(bar, *posts), chrome)
            if h > 0.3:
                part(col, root, f"desk_tag_{side}{k}", C.box((0.075, 0.003, 0.032), (cx, front - 0.0175, z - 0.09)), chrome)
                part(col, root, f"desk_card_{side}{k}", mats(C.box((0.066, 0.002, 0.024), (cx, front - 0.0185, z - 0.09)), 0), card)
            z -= h + 0.006
    kw = W - 2 * (PW + inset)
    part(col, root, "desk_pencil", C.box((kw - 0.01, 0.016, 0.07), (0, front - 0.008, body_z1 - 0.04)), steel, bevel=0.003)
    part(col, root, "desk_pencil_pull", C.cyl(0.005, 0.14, (-0.07, front - 0.03, body_z1 - 0.045), seg=16, axis="X"), chrome)
    part(col, root, "desk_modesty", C.box((kw, 0.012, body_z1 - 0.25), (0, Db / 2 - 0.006, (body_z1 + 0.25) / 2)), steel)
    part(col, root, "desk_apron", C.box((kw, Db - 0.02, 0.012), (0, 0, body_z1 - 0.004)), steel)
    ship(col, root, "desk", "a 1990s steel office desk with a laminate top")


# --- the bookcase: steel shelving filled with binders, records boxes and paper ----------------------------------

def bookcase(name="bookcase", seed=1):
    col, root = C.fresh(name)
    W, H, D, t = 1.14, 1.88, 0.45, 0.018
    rnd = random.Random(seed)
    steel, dark = paint("case_steel", STEEL, 0.4), paint("case_kick", STEEL_D, 0.6)
    binders = img("case_binders", os.path.join(TEX, "binder-spines.png"), 0.45)
    box_m = img("case_records", os.path.join(TEX, "records-box.png"), 0.8)
    memo = img("case_memo", os.path.join(TEX, "memo-1.png"), 0.85)
    parts = [C.box((t, D, H), (s * (W / 2 - t / 2), 0, H / 2)) for s in (-1, 1)]
    parts += [C.box((W - 2 * t, 0.01, H - 0.07), (0, D / 2 - 0.005, 0.07 + (H - 0.07) / 2)), C.box((W, D, t), (0, 0, H - t / 2))]
    shelves = [0.07, 0.43, 0.79, 1.15, 1.51]
    for z in shelves:
        parts += [C.box((W - 2 * t, D - 0.012, 0.02), (0, -0.004, z + 0.01)), C.box((W - 2 * t, 0.012, 0.035), (0, -D / 2 + 0.008, z + 0.0025))]
    part(col, root, f"{name}_frame", C.merge(*parts), steel, bevel=0.002)
    part(col, root, f"{name}_kick", C.box((W - 2 * t, D - 0.06, 0.07), (0, 0.02, 0.035)), dark)
    fill_b, fill_r, fill_p = [], [], []
    for si, z in enumerate(shelves):
        z0, x = z + 0.02, -W / 2 + t + 0.01
        x1 = W / 2 - t - 0.01
        while x < x1 - 0.05:
            kind = rnd.choices(["binders", "box", "paper", "gap"], [0.55, 0.2, 0.15, 0.1])[0]
            if kind == "binders":
                n = rnd.randint(4, 11)
                for k in range(n):
                    w = rnd.choice((0.04, 0.05, 0.06, 0.075))
                    if x + w > x1:
                        break
                    i = rnd.randrange(8)
                    h = 0.29 + rnd.uniform(-0.004, 0.004)
                    b = C.box((w, 0.27, h), (x + w / 2, -D / 2 + 0.03 + 0.135 + rnd.uniform(0, 0.02), z0 + h / 2))
                    planar(b, b.faces[:], (0, 2), region=(i / 8 + 0.02, 0.02, i / 8 + 0.1, 0.06))
                    planar(b, facing(b, 1, -1), (0, 2), region=(i / 8, 0, (i + 1) / 8, 1))
                    fill_b.append(b)
                    x += w + rnd.uniform(0.0, 0.004)
                if x < x1 - 0.1 and rnd.random() < 0.6:   # the run's last binder leans on it
                    w, i = 0.05, rnd.randrange(8)
                    lean = rnd.uniform(14, 26)
                    b = C.box((w, 0.27, 0.29), (w / 2, 0, 0.145))
                    planar(b, b.faces[:], (0, 2), region=(i / 8 + 0.02, 0.02, i / 8 + 0.1, 0.06))
                    planar(b, facing(b, 1, -1), (0, 2), region=(i / 8, 0, (i + 1) / 8, 1))
                    C.xf(b, C.R(-lean, "Y"))
                    reach = 0.29 * math.sin(math.radians(lean)) + w * math.cos(math.radians(lean))
                    C.xf(b, Matrix.Translation((x + reach - w * math.cos(math.radians(lean)) + 0.002, -D / 2 + 0.165, z0)))
                    fill_b.append(b)
                    x += reach + 0.01
            elif kind == "box" and x + 0.32 < x1:
                b = C.box((0.31, 0.38, 0.25), (x + 0.155, -D / 2 + 0.03 + 0.19, z0 + 0.125))
                lid = C.box((0.318, 0.388, 0.05), (x + 0.155, -D / 2 + 0.03 + 0.19, z0 + 0.25 - 0.022))
                for bb in (b, lid):
                    planar(bb, bb.faces[:], (0, 2), region=(0.02, 0.96, 0.08, 0.99))
                planar(b, facing(b, 1, -1), (0, 2), region=(0, 0.25, 1, 1))
                fill_r += [b, lid]
                x += 0.32
            elif kind == "paper" and x + 0.23 < x1:
                h = rnd.uniform(0.02, 0.12)
                b = C.box((0.215, 0.28, h), (x + 0.11, -D / 2 + 0.04 + 0.14, z0 + h / 2))
                planar(b, b.faces[:], (0, 2), region=(0.01, 0.01, 0.05, 0.05))
                planar(b, facing(b, 2, 1), (0, 1), region=(0, 0, 1, 1))
                C.xf(b, Matrix.Translation((-(x + 0.11), -(-D / 2 + 0.18), 0)) if False else Matrix.Identity(4))
                fill_p.append(b)
                x += 0.235
            else:
                x += rnd.uniform(0.05, 0.14)
    if fill_b:
        part(col, root, f"{name}_binders", C.merge(*fill_b), binders, bevel=0.0015)
    if fill_r:
        part(col, root, f"{name}_boxes", C.merge(*fill_r), box_m, bevel=0.002)
    if fill_p:
        part(col, root, f"{name}_paper", C.merge(*fill_p), memo)
    ship(col, root, name, "a steel bookcase filled with binders, records boxes and paper")


# --- the wall clock: black case, printed dial, hands stopped at 11:52 -------------------------------------------

def clock():
    col, root = C.fresh("clock")
    case = paint("clock_case", "#1c1c1d", 0.35)
    dial = img("clock_dial", os.path.join(TEX, "clock-dial.png"), 0.55)
    hand = paint("clock_hand", "#101010", 0.4)
    red = paint("clock_second", "#b01818", 0.4)
    face = lambda bm: C.xf(bm, C.R(90, "X"))       # the lathe's +z becomes the front (-y)
    part(col, root, "clock_case", face(lathe([(0, 0), (0.155, 0), (0.16, 0.004), (0.161, 0.03), (0.159, 0.043), (0.153, 0.047), (0.147, 0.045), (0.146, 0.036)], 64)), case)
    d = face(lathe([(0.146, 0.036), (0, 0.036)], 64))
    planar(d, d.faces[:], (0, 2), rect=(-0.146, -0.146, 0.146, 0.146))
    part(col, root, "clock_dial", d, dial)
    for nm, L, tail, w, y, ang, m in (("hour", 0.082, 0.018, 0.009, 0.038, (11 + 52 / 60) * 30, hand), ("minute", 0.124, 0.022, 0.006, 0.040, 52 * 6 + 4, hand),
                                       ("second", 0.13, 0.035, 0.0022, 0.042, 240, red)):
        bm = C.box((w, 0.0015, L + tail), (0, 0, (L - tail) / 2))
        C.xf(bm, C.R(ang, "Y"))
        C.xf(bm, Matrix.Translation((0, -y, 0)))
        pv = C.pivot(col, root, f"clock_{nm}", (0, -y, 0))
        part(col, root, f"clock_{nm}_hand", bm, m, parent=pv)
    part(col, root, "clock_cap", face(lathe([(0, 0.044), (0.006, 0.044), (0.006, 0.036)][::-1] if False else [(0.006, 0.036), (0.006, 0.044), (0, 0.044)], 16)), red)
    ship(col, root, "clock", "a black office wall clock, stopped at 11:52")


# --- the fire-alarm pull station ----------------------------------------------------------------------------------

def alarm():
    col, root = C.fresh("alarm")
    red, red_d = paint("alarm_red", "#b3171b", 0.3), paint("alarm_back", "#7d1013", 0.5)
    face = img("alarm_face", os.path.join(TEX, "alarm-face.png"), 0.3)
    white = paint("alarm_handle", "#efeae0", 0.25)
    part(col, root, "alarm_back", C.box((0.112, 0.004, 0.152), (0, -0.002, 0)), red_d)
    part(col, root, "alarm_body", C.box((0.1, 0.026, 0.142), (0, -0.017, 0)), red, bevel=0.005)
    q = quad(0.094, 0.136)
    C.xf(q, Matrix.Translation((0, -0.0302, 0)))
    part(col, root, "alarm_face", q, face)
    part(col, root, "alarm_handle", C.box((0.066, 0.014, 0.026), (0, -0.037, 0.003)), white, bevel=0.004)
    ship(col, root, "alarm", "a red fire-alarm pull station")


# --- the wet-floor sign: a yellow A-frame -------------------------------------------------------------------------

def wet_sign():
    col, root = C.fresh("wet_sign")
    yel = paint("wet_plastic", "#e8b90c", 0.45)
    face = img("wet_print", art("sign-wet"), 0.45)
    foot = paint("wet_foot", "#222222", 0.8)
    HT, A = 0.62, math.radians(13)
    for s, nm in ((-1, "front"), (1, "back")):
        p = C.box((0.30, 0.008, HT), (0, 0, -HT / 2))
        q = quad(0.27, 0.48)
        C.xf(q, Matrix.Translation((0, -0.0045, -HT / 2 - 0.02)))
        if s > 0:
            C.xf(q, C.R(180, "Z"))
        m = Matrix.Translation((0, 0, HT + 0.02)) @ C.R(-s * math.degrees(A), "X")
        C.xf(p, m)
        C.xf(q, m)
        part(col, root, f"wet_panel_{nm}", p, yel, bevel=0.003)
        part(col, root, f"wet_print_{nm}", q, face)
        fy = s * (HT * math.sin(A))
        part(col, root, f"wet_foot_{nm}", C.box((0.28, 0.02, 0.012), (0, fy, 0.006)), foot)
    head = C.box((0.30, 0.03, 0.07), (0, 0, HT + 0.05))
    hole = C.box((0.12, 0.04, 0.03), (0, 0, HT + 0.06))
    bmesh.ops.delete(hole, geom=hole.verts[:], context="VERTS")
    part(col, root, "wet_head", head, yel, bevel=0.008)
    ship(col, root, "wet_sign", "a yellow A-frame wet-floor sign")


# --- the clipboard: hardboard, a sprung clip, the after-hours sign-out log --------------------------------------

def clipboard():
    col, root = C.fresh("clipboard")
    board = paint("clip_board", "#6a4a2f", 0.65)
    chrome = paint("clip_chrome", CHROME, 0.2, 1.0)
    log = img("clip_log", os.path.join(TEX, "clip-log.png"), 0.85)
    blank = paint("clip_paper", "#efede6", 0.85)
    part(col, root, "clip_board", C.box((0.229, 0.32, 0.003), (0, 0, 0.0015)), board, bevel=0.001)
    for k, (dx, dy, a) in enumerate(((0.004, -0.006, 2.0), (-0.003, -0.004, -1.2))):
        q = flat(quad(0.216, 0.279))
        C.xf(q, C.R(a, "Z"))
        C.xf(q, Matrix.Translation((dx, dy, 0.0033 + 0.0003 * k)))
        part(col, root, f"clip_sheet_{k}", q, blank)
    q = flat(quad(0.216, 0.279))
    C.xf(q, Matrix.Translation((0, -0.008, 0.0039)))
    part(col, root, "clip_log", q, log)
    part(col, root, "clip_plate", C.box((0.12, 0.035, 0.0015), (0, 0.135, 0.005)), chrome, bevel=0.0005)
    part(col, root, "clip_roll", C.cyl(0.0065, 0.1, (-0.05, 0.148, 0.0105), seg=20, axis="X"), chrome)
    part(col, root, "clip_lever", C.tube([(-0.035, 0.15, 0.016), (-0.03, 0.125, 0.02), (0.03, 0.125, 0.02), (0.035, 0.15, 0.016)], 0.0016), chrome)
    ship(col, root, "clipboard", "a clipboard holding an after-hours sign-out log")


# --- papers: a legal pad, a message slip, loose memos -------------------------------------------------------------

def papers():
    col, root = C.fresh("papers")
    pad_side = paint("papers_pad_side", "#efe39a", 0.85)
    pad = img("papers_pad", os.path.join(TEX, "legal-pad.png"), 0.85)
    bind = paint("papers_binding", "#6b1f1f", 0.6)
    slip_side = paint("papers_slip_side", "#f0b6c4", 0.85)
    slip = img("papers_slip", os.path.join(TEX, "message-slip.png"), 0.85)
    memos = [img(f"papers_memo{v}", os.path.join(TEX, f"memo-{v}.png"), 0.85) for v in (2, 3)]
    m = Matrix.Translation((0.05, 0.0, 0)) @ C.R(-6, "Z")
    b = C.box((0.216, 0.33, 0.009), (0, 0, 0.0045))
    C.xf(b, m)
    part(col, root, "papers_pad_block", b, pad_side)
    q = flat(quad(0.216, 0.33))
    C.xf(q, Matrix.Translation((0, 0, 0.0092)))
    C.xf(q, m)
    part(col, root, "papers_pad", q, pad)
    s = C.box((0.22, 0.03, 0.0107), (0, 0.165, 0.00565))   # 2 mm wider than the pad, wrapping it, its foot 0.3 mm up
    C.xf(s, m)
    part(col, root, "papers_binding", s, bind, bevel=0.001)
    for k, (x, y, a) in enumerate(((-0.17, 0.02, 9.0), (-0.15, -0.03, -4.0))):
        q = flat(quad(0.216, 0.279))
        C.xf(q, C.R(a, "Z"))
        C.xf(q, Matrix.Translation((x, y, 0.0004 + 0.0004 * k)))
        part(col, root, f"papers_memo_{k}", q, memos[k])
    ms = Matrix.Translation((0.21, 0.06, 0)) @ C.R(18, "Z")
    b = C.box((0.13, 0.08, 0.012), (0, 0, 0.006))
    C.xf(b, ms)
    part(col, root, "papers_slip_block", b, slip_side)
    q = flat(quad(0.13, 0.08))
    C.xf(q, Matrix.Translation((0, 0, 0.0122)))
    C.xf(q, ms)
    part(col, root, "papers_slip", q, slip)
    ship(col, root, "papers", "a legal pad, a While You Were Out slip and memos")


# --- the stapler --------------------------------------------------------------------------------------------------

def stapler():
    col, root = C.fresh("stapler")
    black, metal = paint("stapler_black", "#1f1f21", 0.4), paint("stapler_metal", "#55575a", 0.35, 1.0)
    chrome, rub = paint("stapler_chrome", CHROME, 0.2, 1.0), paint("stapler_rubber", "#141414", 0.9)
    part(col, root, "stapler_foot", C.box((0.17, 0.036, 0.003), (0, 0, 0.0015)), rub)
    part(col, root, "stapler_base", C.box((0.19, 0.042, 0.011), (0, 0, 0.0085)), black, bevel=0.004)
    part(col, root, "stapler_anvil", C.box((0.032, 0.026, 0.0012), (-0.072, 0, 0.0146)), chrome)
    part(col, root, "stapler_hinge", C.cyl(0.0085, 0.036, (0.082, -0.018, 0.024), seg=20, axis="Y"), metal)
    arm = C.box((0.168, 0.028, 0.017), (-0.004, 0, 0.0255))
    C.xf(arm, Matrix.Translation((-0.082, 0, -0.024)))
    C.xf(arm, C.R(-2.5, "Y"))
    C.xf(arm, Matrix.Translation((0.082, 0, 0.024)))
    part(col, root, "stapler_magazine", arm, metal, bevel=0.002)
    cap = C.box((0.176, 0.036, 0.016), (-0.004, 0, 0.042))
    C.xf(cap, Matrix.Translation((-0.082, 0, -0.024)))
    C.xf(cap, C.R(-3.5, "Y"))
    C.xf(cap, Matrix.Translation((0.082, 0, 0.024)))
    part(col, root, "stapler_cap", cap, black, bevel=0.007)
    strip = C.box((0.11, 0.02, 0.002), (-0.01, 0, 0.0505))
    C.xf(strip, Matrix.Translation((-0.082, 0, -0.024)))
    C.xf(strip, C.R(-3.5, "Y"))
    C.xf(strip, Matrix.Translation((0.082, 0, 0.024)))
    part(col, root, "stapler_strip", strip, chrome, bevel=0.0008)
    ship(col, root, "stapler", "a desk stapler")


# --- the pen cup, tape dispenser and sticky notes -----------------------------------------------------------------

def pencup():
    col, root = C.fresh("pencup")
    rnd = random.Random(4)
    cup = paint("pencup_cup", "#1d1d1f", 0.5)
    part(col, root, "pencup_cup", lathe([(0, 0), (0.036, 0), (0.038, 0.003), (0.039, 0.1), (0.035, 0.1), (0.034, 0.006), (0, 0.006)], 40), cup)
    pens = []
    for k in range(7):
        a, r = rnd.uniform(0, 2 * PI), rnd.uniform(0.004, 0.022)
        tilt, dirn = rnd.uniform(4, 14), math.degrees(a) + rnd.uniform(-30, 30)
        kind = ["blue", "black", "red", "pencil", "pencil", "blue", "black"][k]
        L = 0.15 if kind != "pencil" else 0.17
        body = C.cyl(0.0045 if kind != "pencil" else 0.0038, L, seg=6 if kind == "pencil" else 12)
        tip = C.cyl(0.0048 if kind != "pencil" else 0.0042, 0.03, (0, 0, L - 0.012), seg=12)
        m = Matrix.Translation((r * math.cos(a), r * math.sin(a), 0.006)) @ C.R(dirn, "Z") @ C.R(tilt, "Y")
        C.xf(body, m)
        C.xf(tip, m)
        pens.append((kind, body, tip))
    cols = {"blue": ("#e8e6df", "#1f3f9a"), "black": ("#e8e6df", "#151515"), "red": ("#e8e6df", "#b51b1b"), "pencil": ("#e2b324", "#d98c9b")}
    for k, (kind, body, tip) in enumerate(pens):
        b, t = cols[kind]
        part(col, root, f"pencup_pen{k}", C.merge(mats(body, 0), mats(tip, 1)), [paint(f"pen_{kind}_body", b, 0.35), paint(f"pen_{kind}_cap", t, 0.35)])
    tape = paint("pencup_tape_base", "#202022", 0.45)
    part(col, root, "pencup_tape_base", C.box((0.115, 0.05, 0.045), (0.12, 0.01, 0.0225)), tape, bevel=0.012)
    roll = C.xf(lathe([(0.019, -0.0095), (0.032, -0.0095), (0.032, 0.0095), (0.019, 0.0095), (0.019, -0.0095)], 32), C.R(90, "X"))
    C.xf(roll, Matrix.Translation((0.12, 0.01, 0.06)))
    part(col, root, "pencup_tape", roll, paint("pencup_tape_roll", "#d9cfa7", 0.25))
    part(col, root, "pencup_notes", C.box((0.076, 0.076, 0.045), (-0.1, 0.0, 0.0225)), paint("pencup_notes", "#f2e27a", 0.85), bevel=0.0008)
    ship(col, root, "pencup", "a pen cup, a tape dispenser and a cube of sticky notes")


# --- the desk lamp: a swing-arm architect's lamp, off ------------------------------------------------------------

def lamp():
    col, root = C.fresh("lamp")
    blk, chrome = paint("lamp_black", "#1c1d1c", 0.4), paint("lamp_chrome", CHROME, 0.2, 1.0)
    shade_m, inner = paint("lamp_shade", "#29433a", 0.35), paint("lamp_inner", "#e9e6dc", 0.4)
    part(col, root, "lamp_base", lathe([(0, 0), (0.085, 0), (0.086, 0.012), (0.07, 0.03), (0.02, 0.035), (0, 0.035)], 48), blk)
    p0, p1, p2 = Vector((0, 0.0, 0.085)), Vector((0, 0.17, 0.5)), Vector((0, -0.27, 0.6))
    part(col, root, "lamp_post", C.cyl(0.011, 0.06, (0, 0, 0.03), seg=20), blk)
    rods = []
    for a, b in ((p0, p1), (p1, p2)):
        for dx in (-0.012, 0.012):
            rods.append(C.tube([tuple(a + Vector((dx, 0, 0))), tuple((a + b) / 2 + Vector((dx, 0, 0))), tuple(b + Vector((dx, 0, 0)))], 0.0035, sides=2))
    part(col, root, "lamp_arms", C.merge(*rods), chrome)
    for nm, a, b in (("lower", p0, p1), ("upper", p1, p2)):
        d = (b - a)
        n = 80
        side = Vector((0.02, 0, 0))
        perp = d.cross(Vector((1, 0, 0))).normalized()
        pts = [tuple(a + d * (0.15 + 0.5 * k / n) + side + (Vector((1, 0, 0)) * math.cos(k * 1.2) + perp * math.sin(k * 1.2)) * 0.005) for k in range(n + 1)]
        part(col, root, f"lamp_spring_{nm}", C.tube(pts, 0.001, res=2, sides=1), chrome)
    for nm, p in (("j0", p0), ("j1", p1), ("j2", p2)):
        part(col, root, f"lamp_{nm}", C.cyl(0.011, 0.04, (p.x - 0.02, p.y, p.z), seg=20, axis="X"), blk)
    head = Matrix.Translation(p2) @ C.R(150, "X") @ Matrix.Translation((0, 0, 0.0))
    sh = lathe([(0.012, -0.02), (0.022, 0.0), (0.032, 0.035), (0.075, 0.13), (0.078, 0.136)], 48)
    C.xf(sh, head)
    part(col, root, "lamp_shade", sh, shade_m)
    inn = lathe([(0.0745, 0.134), (0.03, 0.037), (0.019, 0.004), (0, 0.004)], 48)
    C.xf(inn, head)
    part(col, root, "lamp_shade_inner", inn, inner)
    bulb = bmesh.new()
    bmesh.ops.create_uvsphere(bulb, u_segments=20, v_segments=12, radius=0.028)
    C.xf(bulb, head @ Matrix.Translation((0, 0, 0.07)))
    part(col, root, "lamp_bulb", bulb, paint("lamp_bulb", "#f1efe8", 0.15))
    ship(col, root, "lamp", "a swing-arm desk lamp")


# --- framed art, a poster, a calendar, desk photos ----------------------------------------------------------------

def frame_parts(w, h, pic, moulding=0.016, depth=0.022, colour="#151515", rough=0.35):
    """A picture frame hanging on its back face (the origin at its back centre), front toward -y: moulding, backing,
    and the print under glass (its sheen in the print's roughness)."""
    m = moulding
    ring = [C.box((w, depth, m), (0, -depth / 2, s * (h / 2 - m / 2))) for s in (-1, 1)]
    ring += [C.box((m, depth, h - 2 * m), (s * (w / 2 - m / 2), -depth / 2, 0)) for s in (-1, 1)]
    q = quad(w - 2 * m + 0.002, h - 2 * m + 0.002)
    C.xf(q, Matrix.Translation((0, -depth + 0.006, 0)))
    back = C.box((w - 0.004, 0.004, h - 0.004), (0, -0.0025, 0))   # half a millimetre in from the moulding's back
    return [("moulding", C.merge(*ring), paint(f"frame_{colour}", colour, 0.4), 0.0025), ("print", q, pic, None),
            ("backing", back, paint("frame_backing", "#6b5a43", 0.9), None)]


def framed(name, art_name, w, h, colour="#151515", what="a framed print"):
    col, root = C.fresh(name)
    for nm, bm, mat, bev in frame_parts(w, h, img(f"{name}_print", art(art_name), 0.3), colour=colour):
        part(col, root, f"{name}_{nm}", bm, mat, bevel=bev)
    ship(col, root, name, what)


def poster():
    col, root = C.fresh("poster_exits")
    q = quad(0.45, 0.6)
    C.xf(q, Matrix.Translation((0, -0.0006, 0)))
    part(col, root, "poster_print", q, img("poster_print", art("poster-exits"), 0.6))
    tape = paint("poster_tape", "#d8cba2", 0.35)
    for sx in (-1, 1):
        for sz in (-1, 1):
            t = quad(0.05, 0.022)
            C.xf(t, C.R(sx * sz * 40, "Y"))
            C.xf(t, Matrix.Translation((sx * 0.215, -0.0011, sz * 0.29)))
            part(col, root, f"poster_tape_{sx}{sz}", t, tape)
    ship(col, root, "poster_exits", "a fire-safety poster taped to the wall")


def calendar():
    col, root = C.fresh("calendar")
    pages = C.box((0.3, 0.005, 0.45), (0, -0.0025, -0.235))
    planar(pages, pages.faces[:], (0, 2), region=(0.02, 0.02, 0.05, 0.05))
    planar(pages, facing(pages, 1, -1), (0, 2), region=(0, 0, 1, 1))
    part(col, root, "calendar_pages", pages, img("calendar_page", art("calendar"), 0.8))
    part(col, root, "calendar_nail", C.cyl(0.003, 0.012, (0, 0, -0.012), seg=10, axis="Y"), paint("calendar_nail", "#8a8a88", 0.3, 1.0))
    ship(col, root, "calendar", "a 1997 wall calendar, open at November")


def desk_photo(name, art_name):
    col, root = C.fresh(name)
    w, h = 0.178, 0.128
    tilt = Matrix.Translation((0, 0, 0)) @ C.R(-14, "X") @ Matrix.Translation((0, 0.0, h / 2))
    for nm, bm, mat, bev in frame_parts(w, h, img(f"{name}_print", art(art_name), 0.3), moulding=0.014, depth=0.014, colour="#4a3324"):
        C.xf(bm, tilt)
        part(col, root, f"{name}_{nm}", bm, mat, bevel=bev)
    strut = C.box((0.03, 0.004, 0.11), (0, 0.0, 0.055))
    C.xf(strut, C.R(22, "X"))
    C.xf(strut, Matrix.Translation((0, 0.004, 0)))
    part(col, root, f"{name}_strut", strut, paint("frame_backing", "#6b5a43", 0.9))
    ship(col, root, name, "a snapshot in a desk frame")


# --- the extinguisher: a US 5 lb ABC unit in a floor stand -------------------------------------------------------

def extinguisher():
    col, root = C.fresh("extinguisher")
    red = paint("ext_red", "#b5161b", 0.28)
    label = img("ext_label", os.path.join(TEX, "ext-label.png"), 0.35)
    blk, chrome = paint("ext_black", "#161616", 0.45), paint("ext_chrome", CHROME, 0.18, 1.0)
    white, tagm = paint("ext_gauge_face", "#f0eee6", 0.3), img("ext_tag", os.path.join(TEX, "ext-tag.png"), 0.85)
    Z = 0.008
    body = [(0, 0.012), (0.05, 0.012), (0.06, 0.016), (0.0635, 0.03), (0.0635, 0.34), (0.06, 0.37), (0.048, 0.395), (0.03, 0.41), (0.02, 0.415), (0.02, 0.428), (0, 0.428)]
    part(col, root, "ext_body", lathe([(r, z + Z) for r, z in body], 48), red)
    band = lathe([(0.0641, 0.1 + Z), (0.0641, 0.3 + Z)], 48, phase=PI / 2, uv=True)
    part(col, root, "ext_label", band, label)
    part(col, root, "ext_collar", C.cyl(0.021, 0.014, (0, 0, 0.428 + Z), seg=24), blk)
    part(col, root, "ext_valve", C.box((0.032, 0.036, 0.038), (0, 0, 0.461 + Z)), chrome, bevel=0.004)
    carry = C.box((0.12, 0.022, 0.006), (0.06, 0, 0))
    C.xf(carry, C.R(4, "Y"))
    C.xf(carry, Matrix.Translation((0.0, 0, 0.452 + Z)))
    part(col, root, "ext_carry", carry, blk, bevel=0.002)
    lever = C.box((0.11, 0.02, 0.006), (0.055, 0, 0))
    C.xf(lever, C.R(-12, "Y"))
    C.xf(lever, Matrix.Translation((0.0, 0, 0.482 + Z)))
    part(col, root, "ext_lever", lever, blk, bevel=0.002)
    ring = C.xf(lathe([(0.009, -0.0015), (0.012, -0.0015), (0.012, 0.0015), (0.009, 0.0015), (0.009, -0.0015)], 20), C.R(90, "X"))
    C.xf(ring, Matrix.Translation((0.032, -0.012, 0.468 + Z)))
    part(col, root, "ext_pin_ring", ring, chrome)
    part(col, root, "ext_seal", C.box((0.006, 0.003, 0.01), (0.022, -0.02, 0.462 + Z)), paint("ext_seal", "#e6c400", 0.4))
    g = C.xf(C.cyl(0.016, 0.012), C.R(90, "X"))
    C.xf(g, Matrix.Translation((-0.012, -0.018, 0.462 + Z)))
    part(col, root, "ext_gauge", g, chrome)
    gf = C.xf(lathe([(0.0135, 0.0124), (0, 0.0124)], 24), C.R(90, "X"))
    C.xf(gf, Matrix.Translation((-0.012, -0.018, 0.462 + Z)))
    part(col, root, "ext_gauge_face", gf, white)
    part(col, root, "ext_gauge_band", C.box((0.012, 0.001, 0.003), (-0.012, -0.0312, 0.468 + Z)), paint("ext_gauge_green", "#2c9a3c", 0.3))
    hose = [(-0.016, 0, 0.452 + Z), (-0.055, 0, 0.445 + Z), (-0.076, 0, 0.39 + Z), (-0.074, 0, 0.22 + Z), (-0.07, -0.004, 0.11 + Z)]
    part(col, root, "ext_hose", C.tube(hose, 0.0065, res=8, sides=3), blk)
    noz = C.cyl(0.009, 0.05, (0, 0, 0), seg=16, r2=0.006)
    C.xf(noz, C.R(180, "X"))
    C.xf(noz, Matrix.Translation((-0.07, -0.004, 0.115 + Z)))
    part(col, root, "ext_nozzle", noz, blk)
    tag = quad(0.05, 0.07)
    C.xf(tag, C.R(25, "Z"))
    C.xf(tag, Matrix.Translation((0.05, -0.04, 0.425 + Z)))
    part(col, root, "ext_tag", tag, tagm)
    stand = paint("ext_stand", "#1d1d1d", 0.55)
    tray = [C.box((0.2, 0.2, 0.006), (0, 0.0, 0.003))]
    tray += [C.box((0.2, 0.004, 0.04), (0, s * 0.098, 0.02)) for s in (-1, 1)] + [C.box((0.004, 0.2, 0.04), (s * 0.098, 0, 0.02)) for s in (-1, 1)]
    tray += [C.box((0.03, 0.012, 0.38), (0, 0.093, 0.19))]
    part(col, root, "ext_stand", C.merge(*tray), stand, bevel=0.0015)
    part(col, root, "ext_strap", lathe([(0.0645, 0.3), (0.069, 0.3), (0.069, 0.322), (0.0645, 0.322), (0.0645, 0.3)], 48), stand)
    ship(col, root, "extinguisher", "a 5 lb ABC fire extinguisher in a floor stand")


# --- plants: a corn plant (dracaena) and a snake plant ------------------------------------------------------------

def leaf(bm, base, yaw, pitch, L, W, droop, fold, width, n=12):
    """A strap leaf from `base`: heading `yaw`, rising at `pitch`, arching down by droop * L at its tip; a V fold of
    `fold` (a share of its width) along the midrib; width(t) its outline. UVs: u across, v along."""
    uv = uvl(bm)
    dirh, up = Vector((math.cos(yaw), math.sin(yaw), 0)), Vector((0, 0, 1))
    side = Vector((-math.sin(yaw), math.cos(yaw), 0))
    rows, prev = [], None
    for k in range(n + 1):
        t = k / n
        p = base + dirh * (L * t * math.cos(pitch)) + up * (L * t * math.sin(pitch) - droop * L * t * t)
        tang = (dirh * math.cos(pitch) + up * (math.sin(pitch) - 2 * droop * t)).normalized()
        nrm = tang.cross(side).normalized()
        w = W * width(t)
        rows.append([p - side * w / 2 - nrm * fold * w, p + nrm * 0.0, p + side * w / 2 - nrm * fold * w])
    vs = [[bm.verts.new(q) for q in r] for r in rows]
    for k in range(n):
        for j in range(2):
            f = bm.faces.new((vs[k][j], vs[k][j + 1], vs[k + 1][j + 1], vs[k + 1][j]))
            for l, (a, b) in zip(f.loops, ((j / 2, k / n), ((j + 1) / 2, k / n), ((j + 1) / 2, (k + 1) / n), (j / 2, (k + 1) / n))):
                l[uv].uv = (a, b)


def plant_corn():
    col, root = C.fresh("plant_corn")
    rnd = random.Random(7)
    pot = paint("corn_pot", "#c9bda6", 0.45)
    soil = paint("corn_soil", "#2a2018", 0.95)
    bark = paint("corn_bark", "#6f624e", 0.85)
    green = img("corn_leaf", os.path.join(TEX, "leaf-dracaena.png"), 0.5)
    dead = img("corn_leaf_dead", os.path.join(TEX, "leaf-dracaena.png"), 0.7, tint=hexc("#c9a46a"))
    part(col, root, "corn_pot", lathe([(0, 0), (0.13, 0), (0.135, 0.01), (0.165, 0.27), (0.176, 0.28), (0.176, 0.302), (0.166, 0.302), (0.158, 0.276)], 48), pot)
    part(col, root, "corn_soil", lathe([(0.158, 0.276), (0, 0.272)], 48), soil)
    live, brown, canes = bmesh.new(), bmesh.new(), []
    for k, (h, dx, dy) in enumerate(((0.44, 0.03, 0.02), (0.62, -0.04, 0.01), (0.78, 0.005, -0.04))):
        lean = Vector((rnd.uniform(-0.05, 0.05), rnd.uniform(-0.05, 0.05), 1)).normalized()
        b0 = Vector((dx, dy, 0.27))
        top = b0 + lean * h
        r = 0.026 - 0.003 * k
        cane = C.cyl(r, h, seg=10)
        q = Vector((0, 0, 1)).rotation_difference(lean).to_matrix().to_4x4()
        C.xf(cane, Matrix.Translation(b0) @ q)
        canes.append(cane)
        nleaf = 16
        for i in range(nleaf):
            yaw = i * 2.39996 + rnd.uniform(-0.2, 0.2)
            outer = i / nleaf
            pitch = math.radians(78 - 48 * outer + rnd.uniform(-6, 6))
            L = rnd.uniform(0.3, 0.38) + 0.08 * outer
            leaf(live, top + Vector((0, 0, -0.06 * outer)), yaw, pitch, L, rnd.uniform(0.05, 0.068), rnd.uniform(0.12, 0.3) + 0.35 * outer, 0.12,
                 lambda t: math.sin(PI * min(1.0, 0.04 + t)) ** 0.6 * (1 - 0.15 * t))
        for i in range(2):
            leaf(brown, top + Vector((0, 0, -0.1)), rnd.uniform(0, 2 * PI), math.radians(-25), rnd.uniform(0.24, 0.32), 0.045, 0.5, 0.08,
                 lambda t: math.sin(PI * min(1.0, 0.04 + t)) ** 0.6)
    for i in range(2):
        a = rnd.uniform(0, 2 * PI)
        leaf(brown, Vector((0.06 * math.cos(a), 0.06 * math.sin(a), 0.279)), a, math.radians(1), 0.26, 0.045, 0.0, 0.05, lambda t: math.sin(PI * min(1.0, 0.04 + t)) ** 0.6)
    part(col, root, "corn_canes", C.merge(*canes), bark)
    part(col, root, "corn_leaves", live, green, sharp=80)
    part(col, root, "corn_dead", brown, dead, sharp=80)
    ship(col, root, "plant_corn", "a corn plant (dracaena) in a plastic planter, its lower leaves dying")


def plant_snake():
    col, root = C.fresh("plant_snake")
    rnd = random.Random(8)
    pot = paint("snake_pot", "#e6e1d6", 0.22)
    soil = paint("snake_soil", "#2b2119", 0.95)
    green = img("snake_leaf", os.path.join(TEX, "leaf-snake.png"), 0.45)
    s = math.sqrt(2)
    part(col, root, "snake_pot", lathe([(0, 0), (0.1 * s, 0), (0.104 * s, 0.006), (0.128 * s, 0.24), (0.118 * s, 0.24), (0.11 * s, 0.215)], 4, phase=PI / 4), pot, sharp=30)
    part(col, root, "snake_soil", lathe([(0.11 * s, 0.215), (0, 0.212)], 4, phase=PI / 4), soil)
    lv = bmesh.new()
    for i in range(15):
        a = rnd.uniform(0, 2 * PI)
        rr = rnd.uniform(0.0, 0.07)
        base = Vector((rr * math.cos(a), rr * math.sin(a), 0.205))
        yaw = a + rnd.uniform(-0.6, 0.6)
        pitch = math.radians(rnd.uniform(70, 88) - 10 * rr / 0.07)
        leaf(lv, base, yaw, pitch, rnd.uniform(0.32, 0.58), rnd.uniform(0.042, 0.065), rnd.uniform(-0.02, 0.06), 0.22,
             lambda t: math.sin(PI * (0.14 + 0.86 * t)) ** 0.75, n=14)
    part(col, root, "snake_leaves", lv, green, sharp=80)
    ship(col, root, "plant_snake", "a snake plant in a white glazed pot")


BUILD = {
    "desk": desk, "bookcase": bookcase, "clock": clock, "alarm": alarm, "wet_sign": wet_sign, "clipboard": clipboard,
    "papers": papers, "stapler": stapler, "pencup": pencup, "lamp": lamp, "extinguisher": extinguisher,
    "plant_corn": plant_corn, "plant_snake": plant_snake, "poster_exits": poster, "calendar": calendar,
    "frame_lake": lambda: framed("frame_lake", "print-lake", 0.40, 0.50, "#1b1b1b", "a framed lake print"),
    "frame_teamwork": lambda: framed("frame_teamwork", "print-teamwork", 0.60, 0.80, "#121212", "a framed TEAMWORK poster"),
    "photo_dog": lambda: desk_photo("photo_dog", "snap-dog"), "photo_beach": lambda: desk_photo("photo_beach", "snap-beach"),
}
for n in (argv or list(BUILD)):
    BUILD[n]()
C.purge()
