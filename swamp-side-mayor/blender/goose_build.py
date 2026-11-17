# The goose, made ready and performed: the supplied model smoothed, given wings (ours), and one long clip "show" that
# is the whole song: its bill opens on the voice (compositions/voice.json), it dances on the beat in patterns that
# change every bar, stretches to summon, flies with tucked feet to type, flails in the trip. The film places, turns,
# hops and squashes it; this clip is only the body. Also writes where its head and bill are each frame.
# usage: raea blender run blender/goose_build.py SRC.glb SHOW.json VOICE.json OUT.glb TRACKS.json
import bpy, bmesh, sys, json, math, os
from mathutils import Matrix, Vector, Quaternion
src, showp, voicep, outp, trackp = sys.argv[-5:]
show = json.load(open(showp)); voice = json.load(open(voicep))["open"]
FPS, N = show["fps"], show["frames"]; BEAT = 60 / show["bpm"]; G0 = show["g0"]
SEC = {s["name"]: (s["from"], s["to"]) for s in show["sections"]}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE"); mesh = next(o for o in bpy.data.objects if o.type == "MESH")
for a in list(bpy.data.actions): bpy.data.actions.remove(a)
arm.animation_data_clear(); arm.name = "Goose"
# its skin is opaque: the file marks it alpha-blended, which draws its far side through its near side
for m in bpy.data.materials:
    if m.use_nodes:
        bs = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if bs:
            for l in list(bs.inputs["Alpha"].links): m.node_tree.links.remove(l)
            bs.inputs["Alpha"].default_value = 1; bs.inputs["Roughness"].default_value = 0.9
    if hasattr(m, "surface_render_method"): m.surface_render_method = "DITHERED"
    if hasattr(m, "blend_method"): m.blend_method = "OPAQUE"
    # the flat cel skin (tools/cel.py) in place of the photo, and no bump: the reference is flat colour
    if m.use_nodes and bs:
        for l in list(bs.inputs["Base Color"].links):
            if l.from_node.type == "TEX_IMAGE": l.from_node.image = bpy.data.images.load(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(outp))), "goose", "cel.png"))
        for l in list(bs.inputs["Normal"].links): m.node_tree.links.remove(l)
        for inp in ("Specular IOR Level", "Coat Weight", "Sheen Weight"):
            if inp in bs.inputs: bs.inputs[inp].default_value = 0
bpy.context.view_layer.objects.active = mesh; mesh.select_set(True)
# smooth: two levels of subdivision under the skin, so the silhouette is a curve and the paint's line is clean
sub = mesh.modifiers.new("sub", "SUBSURF"); sub.levels = 2
while mesh.modifiers[0] != sub: bpy.ops.object.modifier_move_up(modifier="sub")
bpy.ops.object.modifier_apply(modifier="sub"); bpy.ops.object.shade_smooth()

# wings: a tapered fan each side, two bones, folded to nothing inside the body until they're wanted
bpy.ops.object.select_all(action="DESELECT"); bpy.context.view_layer.objects.active = arm; arm.select_set(True)
bpy.ops.object.mode_set(mode="EDIT"); eb = arm.data.edit_bones
# v9 (the director 11-16: "the wings are still consistently disconnected. you have to rebuild the mesh to make it impossible
# for the wings to disconnect"): each wing is rooted 5.5 cm inside the body (it was on its surface, so a lift or a flap
# swung the root edge out of it) and thickens into a rounded shoulder where it goes in, so whatever the bones do, the
# body's surface cuts through the wing and never opens a gap
ROOT = {1: Vector((0.045, 0.0, 0.36)), -1: Vector((-0.045, 0.0, 0.36))}; SPAN = 0.675
for s, nm in ((1, "L"), (-1, "R")):
    a = eb.new(f"Wing_{nm}"); a.head = ROOT[s]; a.tail = ROOT[s] + Vector((s * SPAN * 0.5, 0, 0)); a.parent = eb["Spine1"]
    b = eb.new(f"Wing_{nm}1"); b.head = a.tail; b.tail = ROOT[s] + Vector((s * SPAN, 0, 0)); b.parent = a; b.use_connect = True
bpy.ops.object.mode_set(mode="OBJECT")
wm = bpy.data.meshes.new("Wings"); bm = bmesh.new(); groups = {}
sm = lambda x: 0 if x <= 0 else 1 if x >= 1 else x * x * (3 - 2 * x)
def _station(u):   # a goose's wing as drawn: the arm bulges forward to the wrist (u = W), the hand sweeps back; the
    # trailing edge is a row of rounded feather ends, seven secondaries on the arm, then five long primaries fanned at the tip
    W = 0.45; h = max(0.0, (u - W) / (1 - W))
    lead = -0.10 - 0.05 * math.sin(0.5 * math.pi * min(1.0, u / W)) + 0.2 * h ** 1.6
    chord = (0.25 + 0.07 * u / W) if u < W else (0.32 - 0.07 * h)
    if u < W: f = (u / W * 7) % 1; feather = 0.04 * math.sqrt(max(0.0, 1 - (2 * f - 1) ** 2))
    else: f = (h * 5) % 1; feather = (0.06 + 0.07 * h) * math.sqrt(max(0.0, 1 - (2 * f - 1) ** 2)) - 0.03 * h
    tip = math.sqrt(max(0.0, 1 - max(0.0, (u - 0.93) / 0.07) ** 2))   # round the very end off
    return (u, lead, lead + max(0.03, (chord + feather) * (0.35 + 0.65 * tip)))
OUT = [_station(k / 140) for k in range(141)]
for s, nm in ((1, "L"), (-1, "R")):
    rows = []
    for u, lead, trail in OUT:
        row = []
        for q in range(5):
            v = q / 4; y = lead + (trail - lead) * v; scallop = 0.035 * math.sin(math.pi * v) * 0
            th = 0.012 + 0.035 * (1 - sm(u / 0.22)) * math.sin(math.pi * (0.15 + 0.7 * v))   # the shoulder
            for dz in (th * (1 - v * 0.6), -th * (1 - v * 0.6)):
                vert = bm.verts.new(ROOT[s] + Vector((s * u * SPAN, y + scallop, dz + 0.035 * math.sin(math.pi * v) * (1 - u * 0.6)))); row.append(vert); groups[vert] = (nm, u)
        rows.append(row)
    for i in range(len(rows) - 1):
        for q in range(4):
            for k in (0, 1):
                a, b, c, d = rows[i][q * 2 + k], rows[i + 1][q * 2 + k], rows[i + 1][q * 2 + 2 + k], rows[i][q * 2 + 2 + k]
                bm.faces.new((a, b, c, d) if (k == 0) == (s == 1) else (d, c, b, a))
    for i in range(len(rows) - 1):   # close the leading and trailing edges
        for q in (0, 4):
            a, b, c, d = rows[i][q * 2], rows[i + 1][q * 2], rows[i + 1][q * 2 + 1], rows[i][q * 2 + 1]
            bm.faces.new((a, b, c, d) if (q == 4) == (s == 1) else (d, c, b, a))
bm.verts.index_update(); info = {v.index: groups[v] for v in bm.verts}
bm.normal_update(); bm.to_mesh(wm); bm.free()
wings = bpy.data.objects.new("Wings", wm); bpy.context.scene.collection.objects.link(wings)
wmat = bpy.data.materials.new("Wing"); wmat.use_nodes = True
bsdf = next(n for n in wmat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"); bsdf.inputs["Base Color"].default_value = (0.93, 0.92, 0.88, 1); bsdf.inputs["Roughness"].default_value = 1
wm.materials.append(wmat)
for nm in ("L", "R"):
    for suffix in ("", "1"): wings.vertex_groups.new(name=f"Wing_{nm}{suffix}")
for i, (nm, u) in info.items():
    w1 = min(1, max(0, (u - 0.35) / 0.3)); wings.vertex_groups[f"Wing_{nm}"].add([i], 1 - w1, "REPLACE"); wings.vertex_groups[f"Wing_{nm}1"].add([i], w1, "REPLACE")
for p in wm.polygons: p.use_smooth = True
bpy.ops.object.select_all(action="DESELECT"); wings.select_set(True); mesh.select_set(True); bpy.context.view_layer.objects.active = mesh; bpy.ops.object.join()

# ---- the performance
B = {b.name: b.matrix_local.to_3x3() for b in arm.data.bones}
def rot(name, pitch=0.0, yaw=0.0, roll=0.0):   # world axes: pitch + nods down (it faces -Y), yaw + turns to its left, roll + leans to its left
    R = Matrix.Rotation(yaw, 3, "Z") @ Matrix.Rotation(roll, 3, "Y") @ Matrix.Rotation(pitch, 3, "X")
    return (B[name].inverted() @ R @ B[name]).to_quaternion()
def loc(name, v): return B[name].inverted() @ Vector(v)
sm = lambda x: 0 if x <= 0 else 1 if x >= 1 else x * x * (3 - 2 * x)
def pattern(name, b):   # one dance pattern at beat b: a dict of numbers
    ph = b % 1; hit = (0.5 + 0.5 * math.cos(2 * math.pi * ph)) ** 2; side = 1 if int(b) % 2 == 0 else -1; s2 = math.sin(math.pi * b)
    d = dict(crouch=0, pitch=0, roll=0, neckP=0, neckY=0, neckR=0, headP=0, headY=0, headR=0, tail=0, liftL=0, liftR=0, wing=0, flap=0, tailP=0)
    if name == "bob":
        d.update(crouch=0.05 * hit, neckP=-0.18 * hit, headP=0.38 * hit, tail=0.5 * math.sin(4 * math.pi * b), tailP=-0.3 * hit)
    elif name == "sway":
        d.update(roll=0.13 * s2, neckR=-0.2 * s2, neckY=0.45 * s2, headR=-0.25 * s2, headY=0.3 * s2, crouch=0.03 * hit, liftL=0.07 * max(0, -s2) ** 2, liftR=0.07 * max(0, s2) ** 2, tail=0.7 * s2)
    elif name == "strut":
        pump = math.sin(2 * math.pi * b)
        d.update(neckP=0.38 * pump, headP=-0.38 * pump + 0.1, pitch=0.06 * pump, liftL=0.09 * max(0, math.sin(math.pi * b)) ** 3, liftR=0.09 * max(0, -math.sin(math.pi * b)) ** 3, crouch=0.02, tail=0.4 * math.sin(2 * math.pi * b), wing=0.35, flap=0.25 * math.sin(4 * math.pi * b))
    elif name == "wings":
        d.update(wing=1, flap=0.75 * math.cos(2 * math.pi * ph), crouch=0.06 * hit, neckP=-0.35 + 0.15 * hit, headP=0.2 - 0.3 * hit, headR=0.2 * s2, tail=0.6 * math.sin(4 * math.pi * b), pitch=-0.1)
    return d
PAT = show["patterns"]
MOVES = [(m["name"], m["from"], m["to"]) for m in show["moves"]]
WORDS = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(showp))), "out", "lyr", "words.json")))
WB = [((w[1] - G0) / BEAT) for w in WORDS]   # each sung word's start, in beats
def enter_spring(b):   # plan.ts enterSpring: (how far ENTER is down, the goose's height off it, how flat it's pressed)
    d = b - 92.0; L = 0.6
    if d < 0: return (0.0, 0.0, 0.0)
    if d < 0.2: u = d / 0.2; pr = math.sin(math.pi * min(1, u * 1.15)) * (1 if u < 0.87 else 0); return (max(0.0, pr), 0.0, max(0.0, math.sin(math.pi * u)))
    if d < 0.46: u = (d - 0.2) / 0.26; return (-0.22 * math.sin(math.pi * u) * math.exp(-u), 0.42 * 4 * u * (1 - u), -0.12 * math.sin(math.pi * u))
    if d < L: u = (d - 0.46) / (L - 0.46); v = math.sin(math.pi / 2 * min(1, u * 1.1)); return (v, 0.0, v * 1.15)
    return (0.0, 0.0, 0.0)
def jab(b, width=0.12):   # a peak on each word the goose sings
    return max([math.exp(-((b - w) / width) ** 2) for w in WB if abs(b - w) < 0.6] or [0])
def moveAt(b):
    for n, a, c in MOVES:
        if a <= b < c: return n, a, c
    return MOVES[0] if b < MOVES[0][1] else MOVES[-1]
def mix(a, b, u): return {k: a.get(k, 0) * (1 - u) + b.get(k, 0) * u for k in set(a) | set(b)}
# v9: the sticky move's kicks, one every half beat over its walk, left foot first (the legs and the body both read this)
KICK0, NKICK = 44.1, 7
def kick_at(b):
    if b < KICK0: return None
    k = int((b - KICK0) / 0.5)
    return None if k >= NKICK else (k, (b - KICK0 - 0.5 * k) / 0.5, 1 if k % 2 == 0 else -1)
ZERO = dict(crouch=0, pitch=0, roll=0, neckP=0, neckY=0, neckR=0, headP=0, headY=0, headR=0, tail=0, liftL=0, liftR=0, wing=0, flap=0, tailP=0, look=0, lookMax=1.0, gape=0, paddle=0)
def groove(b):   # the dance patterns under the moves that are just dancing
    bar = int(max(0, b) // 4); k0, k1 = PAT[(bar * 3 + 1) % len(PAT)], PAT[((bar + 1) * 3 + 1) % len(PAT)]
    return mix(pattern(k0, b), pattern(k1, b), sm(((b % 4) - 3.6) / 0.4))
# the keys it lands on, as plan.ts's STRIKES has them (root.json): [land, leave, trick into it]
RT = json.load(open(os.path.join(os.path.dirname(trackp), "root.json")))
STR = RT["strikes"]
def typing_state(b):   # on a key (which, beats since landing, beats left before it goes, the next hop's trick) or in the air
    for i, (land, leave, trick) in enumerate(STR):
        if b < land:
            if i > 0 and b < STR[i - 1][1]: return ("on", i - 1, b - STR[i - 1][0], STR[i - 1][1] - b, trick)
            fb = STR[i - 1][1] if i > 0 else 74.0
            return ("air", i, (b - fb) / max(0.01, land - fb), trick, land - fb)
    return ("on", len(STR) - 1, b - STR[-1][0], 99.0, None)
STRIKES = [x[0] for x in STR]
KICK = RT.get("kick", {"foot": "R", "from": 129.75, "hit": 130.4, "back": 131.0, "at": [0.03, 0.31, -3.14]})
def move_pose(name, a, c, b):
    ph = b % 1; hit = (0.5 + 0.5 * math.cos(2 * math.pi * ph)) ** 2; s1 = math.sin(math.pi * b); u = (b - a) / max(0.01, c - a)
    d = dict(ZERO)
    if name in ("swim", "swimhome"):   # level and low, the head bobbing with each stroke of its feet; it eyes the lens now and then
        st = math.sin(2 * math.pi * b)
        d.update(neckP=-0.12 + 0.1 * st, headP=0.06 - 0.12 * st, roll=0.04 * s1, tail=0.3 * math.sin(2 * math.pi * b + 1), paddle=st, look=0.7 * sm((b - 6) / 1.5) * (1 - sm((b - 10) / 1.5)) if name == "swim" else 0.8)
    elif name in ("climb", "stamp") and (name == "climb" or b < 128.5):   # up the bank, wings out for balance
        k = math.sin(math.pi * min(1, (u if name == "climb" else (b - 127) / 1.5)))
        d.update(pitch=-0.22 * k, neckP=0.3 * k, headP=-0.2 * k, wing=0.55 * k, flap=0.35 * k * math.sin(4 * math.pi * b), tail=0.4 * math.sin(4 * math.pi * b))
    elif name == "stroll":   # in no hurry, smoking: the head rides each beat, a look at the lens
        d.update(neckP=0.14 * hit - 0.05, headP=-0.12 * hit, pitch=0.03, tail=0.35 * math.sin(2 * math.pi * b), look=0.6)
    elif name == "shakeoff":   # the wet dog shake, head to tail, three a beat
        e = math.sin(math.pi * min(1, u)) ** 0.5; w = 2 * math.pi * 3 * (b - a)
        d.update(roll=0.3 * math.sin(w) * e, neckY=-0.55 * math.sin(w - 0.6) * e, neckR=-0.25 * math.sin(w - 0.3) * e, headY=0.5 * math.sin(w - 1.2) * e, headR=0.3 * math.sin(w - 1.0) * e,
                 wing=0.7 * e, flap=0.6 * math.sin(w * 1.5) * e, tail=1.1 * math.sin(w + 0.8) * e, crouch=0.03 * e)
    elif name == "face":   # it squares up: chin up, eyes on the lens
        d.update(neckP=-0.18, headP=-0.12, look=1.0, tailP=-0.25 * math.sin(math.pi * u), tail=0.5 * math.sin(math.pi * 2 * u))
    elif name in ("strut", "back"):   # back from the shore it struts on the groove, eyes on the lens
        d = dict(ZERO, **groove(b)); d.update(look=0.75)
    elif name in ("stompL", "stompR"):   # the foot comes down on the beat: the whole body takes it
        imp = math.exp(-((b - (a + 0.4)) / 0.12) ** 2)
        d.update(crouch=0.07 * imp, neckP=0.42 * imp - 0.1, headP=0.25 * imp, wing=0.45 + 0.4 * imp, flap=0.5 * imp, roll=0.12 * (1 if name == "stompL" else -1) * sm(u * 3), tail=0.6 * imp, look=0.6)
    elif name == "shake":   # a shimmy, wings out
        w = 2 * math.pi * 2 * b
        d.update(roll=0.17 * math.sin(w), wing=0.85, flap=0.45 * math.sin(2 * w), neckY=-0.3 * math.sin(w), crouch=0.05, tail=1.0 * math.sin(4 * math.pi * b), look=0.5)
    elif name == "sticky":   # v9: a high-kick march (the director 11-16: "more like high kicks ... with disney animation principles")
        ks = kick_at(b)
        if ks is None:   # before the first kick: the wind-up; after the last: it settles
            a = sm((b - 43.6) / 0.45) if b < KICK0 else 1 - sm((b - KICK0 - 0.5 * NKICK) / 0.4)
            d.update(crouch=0.07 * a, pitch=0.08 * a, neckP=0.25 * a, headP=-0.12 * a, wing=0.3 + 0.2 * a, look=0.35)
        else:
            k, u, sd = ks; up = math.sin(math.pi * u ** 0.75)   # the kick: fast up, slower down (timing)
            lag = math.sin(math.pi * min(1, max(0, (u - 0.15) / 0.85)))   # follow-through: the neck and head trail it
            land = math.exp(-(((u - 0.02) / 0.09) ** 2)) + math.exp(-(((u - 1.0) / 0.09) ** 2))   # squash where a foot lands
            d.update(crouch=0.055 * land - 0.025 * up, pitch=-0.15 * up + 0.05 * land,   # stretch up and lean back as it kicks
                     roll=-0.09 * sd * up, neckP=0.26 * lag - 0.06 * up, headP=-0.2 * lag + 0.06 * land,
                     wing=0.5 + 0.38 * up, flap=0.4 * math.sin(math.pi * u - 0.5), tail=0.75 * sd * math.sin(math.pi * u - 0.6),
                     tailP=-0.2 * up, look=0.35)
    elif name == "spin":   # wings out, neck drawn up, round
        d.update(wing=1, flap=0.25 * math.sin(4 * math.pi * b), neckP=-0.3, headP=-0.1, crouch=0.05 * math.sin(math.pi * u), tail=0.8)
    elif name in ("quack2", "quack3"):   # neck up, and a jab at the lens on every quack
        j = jab(b, 0.1)
        d.update(neckP=-0.32 + 0.62 * j, headP=0.22 * j - 0.05, wing=0.4 + 0.45 * j, flap=0.55 * j, crouch=0.03 * j, gape=0.35 * j, look=1.0, tail=0.6 * j)
    elif name == "mudfoot":   # looks down at its own foot held up, puzzled; then at the lens
        k = sm((b - 52.3) / 0.6) * (1 - sm((b - 53.7) / 0.4)); l2 = sm((b - 53.6) / 0.4)
        d.update(neckP=0.55 * k, neckY=-0.45 * k, headY=-0.35 * k, headR=0.32 * k, pitch=0.1 * k, look=l2, wing=0.3 * k)
    elif name == "waddle":
        d.update(roll=0.17 * s1, wing=0.4, flap=0.2 * math.sin(2 * math.pi * b), neckY=0.3 * s1, neckR=-0.1 * s1, tail=0.6 * s1, crouch=0.02, look=0.4)
    elif name == "slide":   # it surfs the mud: leant back, wings out, cool
        k = math.sin(math.pi * min(1, u * 1.2)) ** 0.5
        d.update(pitch=-0.14 * k, roll=0.13 * k, wing=k, flap=0.08 * math.sin(4 * math.pi * b), neckP=-0.22 * k, headR=0.22 * k, look=0.8 * k, crouch=0.06 * k)
    elif name == "pop":   # every beat a pop: down, then wings and neck out
        p = hit
        d.update(crouch=0.08 * (1 - p), wing=0.2 + 0.8 * p, flap=0.55 * p, neckP=-0.3 * p + 0.1 * (1 - p), headP=0.3 * p - 0.05, look=0.6, tail=0.7 * p)
    elif name == "shuffle":
        d.update(neckP=0.16 * math.sin(4 * math.pi * b), roll=0.06 * math.sin(4 * math.pi * b), wing=0.2, crouch=0.03, tail=0.5 * math.sin(4 * math.pi * b))
    elif name == "duck":   # back to the lens, it looks over its shoulder: "you say duck?"
        d.update(look=1.0, lookMax=1.55, headR=0.32 * sm((b - 63.6) / 0.5), crouch=0.02, neckP=-0.1, tail=0.25 * math.sin(2 * math.pi * b))
    elif name == "soup":   # round, and a hard nod: "soup."
        j = jab(b, 0.12)
        d.update(neckP=0.42 * j - 0.1, headP=0.3 * j, look=0.7, crouch=0.04 * j)
    elif name == "mayor":   # chest out, chin up, elbows swinging slow: the mayor
        d.update(pitch=-0.12, neckP=-0.26, headP=-0.1, wing=0.55, flap=0.16 * s1, roll=0.06 * s1, look=1.0, tail=0.45 * s1, crouch=0.015 * hit)
    elif name == "turn":
        d.update(neckP=0.1 + 0.08 * hit, tail=0.3 * s1)
    elif name == "call":   # it calls the thing up: neck to the sky, wings beating slow, shaking with it
        k = sm((b - a - 0.4) / 1.5); sh = 0.05 * math.sin(b * 23) * sm((b - a - 1.9) / 2)
        d.update(crouch=0.02, pitch=-0.24 * k, roll=sh, neckP=-0.6 * k, neckY=sh * 2, headP=-0.55 * k, headR=sh * 3, wing=k, flap=0.55 * math.sin(math.pi * b) * k, tail=math.sin(b * 9) * 0.5 * k, tailP=-0.5 * k, gape=0.45 * k)
    elif name == "behold":   # it watches the screen come up out of the pond: a start as it breaks the water, neck up after it
        up = sm((b - a - 0.2) / 2.5) * (1 - sm((b - c + 1.2) / 1.0)); fl = math.exp(-((b - (a + 0.35)) / 0.3) ** 2)
        d.update(pitch=-0.1 * up, neckP=-0.4 * up - 0.15 * fl, headP=-0.32 * up, headR=0.25 * sm((b - a - 3) / 1) * up, wing=fl + 0.15, flap=0.6 * fl * math.sin(b * 14), crouch=0.06 * fl, look=0.6 * sm((b - c + 1.2) / 1), tail=0.8 * fl + 0.3 * s1 * up)
    elif name == "keys":   # the keys burst up out of the mud in front of it: it jumps, wings out, then crouches to fly
        fl = math.exp(-((b - (a + 0.4)) / 0.35) ** 2); ready = sm((b - c + 1.0) / 0.8)
        d.update(neckP=-0.2 * fl + 0.15 * ready, headP=-0.15 * fl + 0.1 * ready, wing=fl + 0.4 * ready, flap=0.6 * fl * math.sin(b * 14), crouch=0.06 * fl + 0.08 * ready, look=0.4 * (1 - ready), tail=0.8 * fl)
    elif name == "fly":   # key to key, to Disney's principles: a crouch to wind up, a stretch off the key, arcs, a tuck through
        # each trick, the legs reaching for the next key, the landing taken in the body, the neck and tail carrying on after
        st = typing_state(b)
        if st[0] == "air":   # v7 (the director 11-16): no spins or flips. A hard downstroke off the key, a beat or two of the wings
            # through the climb, then wings held high and wide to brake, legs reaching ahead for the key, neck drawn back
            _, i, u, trick, dur = st
            go = math.exp(-(u / 0.12) ** 2); reach = sm((u - 0.6) / 0.32); tuck = sm(u / 0.15) * (1 - reach)
            nb = 1.5 if trick == "skip" else 2.5
            beat = math.sin(2 * math.pi * (u * nb + 0.25))
            d.update(pitch=0, neckP=-0.28 * go + 0.05 * (1 - go) * (1 - reach) - 0.16 * reach, headP=0.12 * go - 0.12 * reach, wing=1, flap=0.95 * beat * (1 - reach) + 0.7 * reach - 0.4 * go,
                     liftL=0.14 * tuck, liftR=0.14 * tuck, tail=0.25 * math.sin(b * 10) * (1 - reach), tailP=0.3 * go - 0.3 * reach, look=0.3)
        else:
            _, i, since, left, nxt = st
            if STR[i][2] == "slide":   # surfing the space bar: leant back, wings out, cool, an eye on the lens
                k = math.sin(math.pi * min(1, since / 1.0)) ** 0.5
                d.update(pitch=-0.16 * k, roll=0.15 * k, wing=1.0, flap=0.1 * math.sin(4 * math.pi * b), neckP=-0.25 * k, headR=0.25 * k, look=0.9 * k, crouch=0.07 * k, tail=0.5 * math.sin(4 * math.pi * b))
            else:
                imp = math.exp(-since / 0.07); ov = math.exp(-((since - 0.09) / 0.07) ** 2); wind = math.exp(-((left - 0.07) / 0.06) ** 2) if left < 0.4 else 0.0
                d.update(crouch=0.08 * imp + 0.07 * wind, neckP=0.4 * ov - 0.15 * wind, headP=0.3 * ov + 0.1 * wind, wing=0.55 + 0.45 * imp, flap=0.6 * imp - 0.3 * wind,
                         tail=0.8 * ov * math.sin(since * 28), tailP=-0.35 * imp + 0.2 * wind, look=0.35, liftL=0.02 * wind, liftR=0.02 * wind)
    elif name == "enter":   # v7: ENTER as a trampoline (plan.ts enterSpring): driven down flat, thrown up, down harder, flung off
        e = enter_spring(b); sq = max(0.0, e[2]); fl = max(0.0, e[1]) / 0.42; k = b - a
        d.update(crouch=0.13 * sq, neckP=0.45 * sq - 0.3 * fl, headP=0.22 * sq - 0.1 * fl, wing=1, flap=-0.55 * sq + 0.9 * fl * math.sin(2 * math.pi * 1.5 * k), tail=0.6 * sq * math.sin(k * 30),
                 tailP=0.4 * sq - 0.2 * fl, liftL=0.06 * fl, liftR=0.06 * fl, gape=0.6 * math.exp(-((b - 92.1) / 0.12) ** 2), look=0.4)
    # (v9: ENTER's and the dive's wingbeats slowed from 3 a beat to 1.5: the rebuilt wings are broad and white, and at 4.5
    # beats a second they flickered past WCAG 2.3.1's flash limit over the dark screen behind)
    elif name == "dive":   # out over the water: wings beating, then folded back into a dive, neck out like a spear
        u = (b - a) / (c - a); fold = sm((u - 0.55) / 0.3)
        d.update(wing=1 - 0.75 * fold, flap=0.9 * math.sin(2 * math.pi * 1.5 * (b - a)) * (1 - fold), neckP=-0.15 - 0.2 * fold, headP=0.1 * fold, liftL=0.14, liftR=0.14, tail=0.3 * math.sin(b * 9), tailP=0.3 * fold)
    elif name == "plunge":   # under: kicking hard, wings half out to steer; it comes up shaking the water off its head
        k = b - a; sh = sm((k - 1.15) / 0.1) * (1 - sm((k - 1.65) / 0.15))
        d.update(paddle=1.25 * math.sin(2 * math.pi * 2 * b), wing=0.45 * (1 - sm((k - 1.2) / 0.4)), flap=0.2 * math.sin(2 * math.pi * 2 * b), neckP=0.15 - 0.25 * sm((k - 0.6) / 0.6), headY=0.5 * math.sin(k * 30) * sh, neckY=-0.3 * math.sin(k * 30 - 1) * sh, tail=0.4 * math.sin(b * 9))
    elif name == "circle":   # round the computer, smoking: easy strokes, a drag on the cigarette every two bars, an eye on the screen
        stv = math.sin(2 * math.pi * b); drag = math.exp(-(((b - 96) % 8 - 0.5) / 0.35) ** 2)
        d.update(neckP=-0.12 + 0.1 * stv - 0.12 * drag, headP=0.06 - 0.12 * stv - 0.25 * drag, roll=0.04 * s1, tail=0.3 * math.sin(2 * math.pi * b + 1), paddle=stv, look=0.55)
    elif name == "stamp":   # v7: up to the lens, a crouch with the wings coming up, a jump kick at the glass (the right foot is
        # reached for it below), leaning back with the wings out wide; it shouts as the foot lands, and is thrown back off it
        KF, KH, KB = KICK["from"], KICK["hit"], KICK["back"]
        wind = sm((b - (KF - 0.5)) / 0.45) * (1 - sm((b - KF) / 0.1)); air = sm((b - KF) / 0.12) * (1 - sm((b - KB + 0.08) / 0.1))
        imp = math.exp(-((b - KH) / 0.1) ** 2); land = math.exp(-((b - KB) / 0.1) ** 2)
        d.update(crouch=0.1 * wind + 0.08 * land, neckP=-0.22 * wind - 0.18 * air - 0.35 * imp + 0.3 * land, headP=0.12 * wind + 0.16 * air + 0.2 * imp, wing=0.35 + 0.65 * max(wind, air),
                 flap=-0.4 * wind + air * (0.3 - 0.4 * sm((b - KF) / 0.35)) + 0.8 * imp, tailP=-0.3 * air, tail=0.7 * imp, gape=0.55 * imp, look=1.0, liftL=0.15 * air)   # v7 check: one downstroke and a held spread (it beat 6 times a second by the lens: a flash)
    else:   # last: easy, smoking, eyes on the lens, a nod to the beat
        d.update(neckP=0.07 * hit, headP=-0.04 * hit, headR=0.15 * sm((b - 132) / 1), look=1.0, tail=0.3 * s1)
    return d
def pose(t):
    b = (t - G0) / BEAT; n, a, c = moveAt(b); d = move_pose(n, a, c, b)
    if b - a < 0.3 and n != MOVES[0][0]:   # ease out of the move before
        i = [m[0] for m in MOVES].index(n) if (n, a, c) in MOVES else 0
        if i > 0: pn, pa, pc = MOVES[i - 1]; d = mix(move_pose(pn, pa, pc, b), d, sm((b - a) / 0.3))
    # v9 (the director 11-16): the second "duck" (77.56 s, b 115.93) freezes the film as the first did (plan.ts FREEZES), on a
    # goose with its head cocked weirdly and its bill dropped open so the cigarette falls out (film.tsx). It cocks in
    # the half beat before; the frozen frame holds this pose, and it comes out of it after
    ck = sm((b - 115.45) / 0.4) * (1 - sm((b - 117.1) / 0.5))
    if ck > 0:
        d = dict(d); d["headR"] = d.get("headR", 0) + 1.05 * ck; d["headY"] = d.get("headY", 0) - 0.45 * ck; d["headP"] = d.get("headP", 0) + 0.18 * ck
        d["neckR"] = d.get("neckR", 0) - 0.3 * ck; d["neckY"] = d.get("neckY", 0) + 0.2 * ck; d["gape"] = max(d.get("gape", 0), 0.6 * ck)
    return d
LOOK = []; prev = (0.0, 0.0)
for f in range(N):   # which way the lens is from the goose's face, eased so a cut turns its head over a few frames
    r = RT["frames"][min(f, len(RT["frames"]) - 1)]; d = pose(f / FPS)
    if len(r) >= 9:
        rel = ((math.atan2(r[6] - r[0], r[8] - r[2]) - r[3] + math.pi) % (2 * math.pi)) - math.pi
        el = math.atan2(r[7] - (r[1] + 0.7 * RT["gs"] * 0.62), max(0.3, math.hypot(r[6] - r[0], r[8] - r[2])))
        want = (max(-d["lookMax"], min(d["lookMax"], rel)) * d["look"], max(-0.5, min(0.5, el)) * d["look"])
    else: want = (0.0, 0.0)
    prev = (prev[0] + (want[0] - prev[0]) * 0.28, prev[1] + (want[1] - prev[1]) * 0.28); LOOK.append(prev)
CH = {}
def key(bone, path, f, val):
    CH.setdefault((bone, path), []).append((f, tuple(val)))
for f in range(N):
    t = f / FPS; d = pose(t); la, le = LOOK[f]; d["neckY"] += 0.5 * la; d["headY"] += 0.5 * la; d["headP"] -= 0.6 * le; bt = (t - G0) / BEAT; op = voice[min(f, len(voice) - 1)] * (0.35 if (bt < 18.2 or bt >= 131.4 or 96 <= bt < 124) else 1)
    key("Pelvis", "location", f, loc("Pelvis", (0, 0, -d["crouch"]))); key("Pelvis", "rotation_quaternion", f, rot("Pelvis", d["pitch"], 0, d["roll"]))
    for nm, lift in (("L", d["liftL"]), ("R", d["liftR"])):
        pd = d["paddle"] * (1 if nm == "L" else -1)   # swimming: the legs kick under the water
        key(f"{nm}_Thigh", "location", f, loc(f"{nm}_Thigh", (0, 0, d["crouch"] + lift * 0.55))); key(f"{nm}_Thigh", "rotation_quaternion", f, rot(f"{nm}_Thigh", -lift * 6 + 0.55 * pd, 0, 0))
        key(f"Bip01_{nm}_Foot", "rotation_quaternion", f, rot(f"Bip01_{nm}_Foot", lift * 9 - 0.6 * pd, 0, 0))
    key("Spine1", "rotation_quaternion", f, rot("Spine1", -d["pitch"] * 0.5, 0, -d["roll"] * 0.6))
    key("Bip01_Neck", "rotation_quaternion", f, rot("Bip01_Neck", d["neckP"], d["neckY"] * 0.5, d["neckR"]))
    key("Bip01_Neck1", "rotation_quaternion", f, rot("Bip01_Neck1", d["neckP"] * 0.6, d["neckY"] * 0.5, d["neckR"] * 0.6))
    key("Bip01_Head", "rotation_quaternion", f, rot("Bip01_Head", d["headP"], d["headY"], d["headR"]))
    key("Bone01", "rotation_quaternion", f, rot("Bone01", 0.05 + 0.5 * op + d["gape"], 0, 0))
    key("Tail", "rotation_quaternion", f, rot("Tail", d["tailP"], d["tail"] * 0.5, 0)); key("Bip01_Tail1", "rotation_quaternion", f, rot("Bip01_Tail1", 0, d["tail"] * 0.5, 0))
    w = max(0.001, d["wing"])
    for s, nm in ((1, "L"), (-1, "R")):
        key(f"Wing_{nm}", "scale", f, (w, w, w)); key(f"Wing_{nm}", "location", f, loc(f"Wing_{nm}", (-s * 0.09 * (1 - d["wing"]), 0, -0.06 * (1 - d["wing"])))); key(f"Wing_{nm}", "rotation_quaternion", f, rot(f"Wing_{nm}", 0, -s * 0.25 * (1 - d["wing"]), -s * (0.15 + d["flap"] * 0.8)))
        key(f"Wing_{nm}1", "rotation_quaternion", f, rot(f"Wing_{nm}1", 0, 0, -s * d["flap"] * 0.5))
act = bpy.data.actions.new("show"); arm.animation_data_create(); arm.animation_data.action = act
if hasattr(act, "slots"):   # layered actions (Blender 4.4+)
    slot = act.slots.new(id_type="OBJECT", name="Goose"); arm.animation_data.action_slot = slot
    layer = act.layers.new("show"); strip = layer.strips.new(type="KEYFRAME"); bag = strip.channelbag(slot, ensure=True)
    newcurve = lambda path, i, group: bag.fcurves.new(path, index=i, group_name=group)
else:
    newcurve = lambda path, i, group: act.fcurves.new(path, index=i, action_group=group)
for pb in arm.pose.bones: pb.rotation_mode = "QUATERNION"
for (bone, path), keys in CH.items():
    for i in range(len(keys[0][1])):
        fc = newcurve(f'pose.bones["{bone}"].{path}', i, bone); fc.keyframe_points.add(len(keys))
        flat = [0.0] * (2 * len(keys))
        for k, (f, v) in enumerate(keys): flat[2 * k] = f; flat[2 * k + 1] = v[i]
        fc.keyframe_points.foreach_set("co", flat); fc.update()
sc = bpy.context.scene; sc.render.fps = FPS; sc.frame_start = 0; sc.frame_end = N - 1
# ---- its feet, planted. The film moves and turns the whole goose (compositions/root.json, from plan.ts); here each
# foot is held where it stands in the world while the body moves over it, and steps (a lifted arc to a new spot under
# the hip, ahead of the way it's going) when the body has left it behind. The legs are then solved to reach the feet
# (IK over thigh, calf and hock) and baked. Off the ground the legs keep their keyed tuck.
import os
if True:
    GS = RT["gs"]; fr = RT["frames"]   # each: [x, y, z, yaw, grounded, slide, lens x, y, z]
    LEG = {nm: [f"{nm}_Thigh", f"Bip01_{nm}_Calf", f"Bip01_{nm}_HorseLink"] for nm in ("L", "R")}
    restAnk = {nm: arm.data.bones[f"Bip01_{nm}_Foot"].head_local.copy() for nm in ("L", "R")}
    restFoot = {nm: arm.data.bones[f"Bip01_{nm}_Foot"].matrix_local.copy() for nm in ("L", "R")}
    tg = {}
    for nm in ("L", "R"):
        e = bpy.data.objects.new(f"ik_{nm}", None); sc.collection.objects.link(e); tg[nm] = e
        c = arm.pose.bones[LEG[nm][2]].constraints.new("IK"); c.name = "plant"; c.target = e; c.chain_count = 3; c.iterations = 60
    mesh.hide_viewport = True
    # model space (Blender: x to its left, -y ahead, z up) <-> the film's world (y up; at yaw 0 it faces +z)
    def to_model(w, r):
        dx, dy, dz = (w[0] - r[0]) / GS, (w[1] - r[1]) / GS, (w[2] - r[2]) / GS; c, s_ = math.cos(r[3]), math.sin(r[3])
        mx, mz = dx * c - dz * s_, dx * s_ + dz * c
        return Vector((mx, -mz, dy))
    def to_world(m, r):
        c, s_ = math.cos(r[3]), math.sin(r[3]); mx, mz = m.x * GS, -m.y * GS
        return [r[0] + mx * c + mz * s_, r[1] + m.z * GS, r[2] - mx * s_ + mz * c]
    def home(nm, r, lead):   # under its hip, a little ahead of where it's heading, on the ground there
        w = to_world(Vector((restAnk[nm].x, restAnk[nm].y, 0)), r); return [w[0] + lead[0], r[1], w[2] + lead[1]]
    LIFTS = RT.get("lifts", []); lifted = {"L": None, "R": None}; prints = []
    def lift_of(nm, b):
        return next((L for L in LIFTS if L["foot"] == nm and L["up"] <= b <= L["down"]), None)
    kicked = {}
    plant = {nm: None for nm in ("L", "R")}; step = {nm: None for nm in ("L", "R")}; last = "R"; baked = {}; infl = 0.0; steps = 0
    for f in range(N):
        r = fr[f]; r2 = fr[min(N - 1, f + 1)]; vel = [(r2[0] - r[0]) * FPS, (r2[2] - r[2]) * FPS]; sp = math.hypot(*vel)
        turn = abs(((r2[3] - r[3] + math.pi) % (2 * math.pi)) - math.pi) * FPS
        d = pose(f / FPS); grounded = bool(r[4]); bt = (f / FPS - G0) / BEAT; mv = moveAt(bt)[0]; sliding = len(r) > 5 and bool(r[5])
        hi, slow = 1.0, 1.0; ks = kick_at(bt) if mv == "sticky" and grounded else None
        infl = min(1.0, infl + 0.25) if grounded else max(0.0, infl - 0.34)
        dur = max(0.14, min(0.3, 0.3 - 0.08 * sp - 0.02 * turn)) * slow; lead = [vel[0] * dur * 0.9, vel[1] * dur * 0.9]
        for nm in ("L", "R"):
            if plant[nm] is None or not grounded: plant[nm] = home(nm, r, [0, 0]); step[nm] = None
        for nm in ("L", "R"):   # a foot lifted on purpose (a stomp, the muddy foot): up, held, slammed down ahead
            L = lift_of(nm, bt) if grounded else None
            if L:
                if not lifted[nm] or lifted[nm]["L"] is not L: step[nm] = None; lifted[nm] = {"L": L, "base": list(plant[nm]), "fwd": [math.sin(r[3]), math.cos(r[3])]}
                st = lifted[nm]; uu = sm((bt - L["up"]) / max(0.01, L["top"] - L["up"]))
                hgt = L["h"] * uu if bt < L["hold"] else L["h"] * (1 - min(1, (bt - L["hold"]) / max(0.01, L["down"] - L["hold"])) ** 2)
                plant[nm] = [st["base"][0] + st["fwd"][0] * L["fwd"] * uu, st["base"][1] + hgt, st["base"][2] + st["fwd"][1] * L["fwd"] * uu]
            elif lifted[nm]:
                lifted[nm] = None; plant[nm][1] = r[1]; prints.append({"f": f, "foot": nm, "x": round(plant[nm][0], 3), "z": round(plant[nm][2], 3), "yaw": round(r[3], 3), "stomp": 1})
        if grounded and sliding:   # sliding: the feet ride under it
            for nm in ("L", "R"): plant[nm] = home(nm, r, [0, 0]); step[nm] = None
        elif grounded and not (lifted["L"] or lifted["R"]):
            for nm in ("L", "R"):   # a step under way: its goal follows the hip, so it lands where the body will be
                if ks and nm == ("L" if ks[2] == 1 else "R") and (not step[nm] or step[nm].get("k") != ks[0]):
                    if step[nm]: plant[nm] = home(nm, r, lead)   # (a kick still out: it lands now)
                    step[nm] = {"f0": f, "n": max(3, round(0.5 * BEAT * FPS)), "from": list(plant[nm]), "k": ks[0]}; last = nm; steps += 1
                if step[nm]:
                    st = step[nm]; u = (f - st["f0"]) / (st["n"]); to = home(nm, r, lead)
                    if u >= 1: plant[nm] = to; step[nm] = None; prints.append({"f": f, "foot": nm, "x": round(to[0], 3), "z": round(to[2], 3), "yaw": round(r[3], 3)})
                    elif "k" in st:   # a high kick: thrown forward past where it lands and up (an arc), then down onto it
                        e = u * u * (3 - 2 * u); up = math.sin(math.pi * u ** 0.75); fw = [math.sin(r[3]), math.cos(r[3])]
                        plant[nm] = [st["from"][0] + (to[0] - st["from"][0]) * e + fw[0] * 0.16 * GS * up, st["from"][1] + (to[1] - st["from"][1]) * e + 0.17 * GS * up,
                                     st["from"][2] + (to[2] - st["from"][2]) * e + fw[1] * 0.16 * GS * up]
                    else:
                        e = u * u * (3 - 2 * u); plant[nm] = [st["from"][0] + (to[0] - st["from"][0]) * e, st["from"][1] + (to[1] - st["from"][1]) * e + 0.11 * GS * hi * math.sin(math.pi * u) ** 0.9, st["from"][2] + (to[2] - st["from"][2]) * e]
            if not step["L"] and not step["R"] and not ks:
                err = {nm: math.hypot(home(nm, r, [0, 0])[0] - plant[nm][0], home(nm, r, [0, 0])[2] - plant[nm][2]) for nm in ("L", "R")}
                nm = max(err, key=lambda k: err[k] + (0.02 if k != last else 0))
                if err[nm] > (0.045 if sp > 0.15 or turn > 0.5 else 0.09) * GS:
                    step[nm] = {"f0": f, "n": max(3, round(dur * FPS)), "from": list(plant[nm])}; last = nm; steps += 1
        # v7: the jump kick: the right foot leaves from under the hip, comes up (the knee raised) and out, and meets the lens at
        # KICK["hit"] (KICK["at"], just in front of it), then comes back under it for the landing
        kick = None
        if KICK["from"] <= bt < KICK["back"]:
            nm_k = KICK["foot"]
            if kicked.get("start") is None: kicked["start"] = list(plant[nm_k])
            st0 = kicked["start"]; T = KICK["at"]
            if bt < KICK["hit"]:
                u = (bt - KICK["from"]) / (KICK["hit"] - KICK["from"]); e = sm(u) ** 1.3
                ctrl = [st0[0], T[1] + 0.14, st0[2] + 0.15]
                a1 = [st0[i] + (ctrl[i] - st0[i]) * e for i in range(3)]; a2 = [ctrl[i] + (T[i] - ctrl[i]) * e for i in range(3)]
                kick = [a1[i] + (a2[i] - a1[i]) * e for i in range(3)]; sole = sm(u / 0.7)
            else:
                u = (bt - KICK["hit"]) / (KICK["back"] - KICK["hit"]); hm = home(nm_k, r, [0, 0])
                kick = [T[i] + (hm[i] - T[i]) * sm(u) for i in range(3)]; sole = 1 - sm(u)
            plant[nm_k] = kick; step[nm_k] = None
        sc.frame_set(f)
        for nm, lift in (("L", d["liftL"]), ("R", d["liftR"])):
            kk = kick is not None and nm == KICK["foot"]
            m = to_model(plant[nm], r); tg[nm].location = Vector((m.x, m.y, m.z + restAnk[nm].z + (lift * 1.2 if not step[nm] and not kk else 0)))
            arm.pose.bones[LEG[nm][2]].constraints["plant"].influence = 1.0 if kk else infl
        bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get(); ae = arm.evaluated_get(dg)
        for nm in ("L", "R"):
            for bn in LEG[nm]:
                pe = ae.pose.bones[bn]; loc_m = ae.convert_space(pose_bone=pe, matrix=pe.matrix, from_space="POSE", to_space="LOCAL")
                baked.setdefault(bn, []).append((f, loc_m.to_translation(), loc_m.to_quaternion()))
            # the foot stays flat on the ground (rolling up on its toes as it lifts), whatever the leg does
            pe = ae.pose.bones[f"Bip01_{nm}_Foot"]; want = restFoot[nm].copy(); want.translation = pe.matrix.translation
            if step[nm]:
                u = (f - step[nm]["f0"]) / step[nm]["n"]; want = Matrix.Translation(pe.matrix.translation) @ Matrix.Rotation(0.6 * math.sin(math.pi * u), 4, "X") @ restFoot[nm].to_3x3().to_4x4()
            kk = kick is not None and nm == KICK["foot"]
            if kk: want = Matrix.Translation(pe.matrix.translation) @ Matrix.Rotation(-1.25 * sole, 4, "X") @ restFoot[nm].to_3x3().to_4x4()
            cur = pe.matrix.copy(); mix_m = cur.lerp(want, 1.0 if kk else infl)
            loc_m = ae.convert_space(pose_bone=pe, matrix=mix_m, from_space="POSE", to_space="LOCAL")
            baked.setdefault(pe.name, []).append((f, loc_m.to_translation(), loc_m.to_quaternion()))
    for nm in ("L", "R"):
        pbn = arm.pose.bones[LEG[nm][2]]; pbn.constraints.remove(pbn.constraints["plant"]); bpy.data.objects.remove(tg[nm])
    mesh.hide_viewport = False
    fcs = bag.fcurves if hasattr(act, "slots") else act.fcurves
    for bn, keys in baked.items():
        for fc in [c for c in fcs if c.data_path.startswith(f'pose.bones["{bn}"].')]: fcs.remove(fc)
        prev = None
        for path, n, get in (("location", 3, lambda k: k[1]), ("rotation_quaternion", 4, lambda k: k[2])):
            vals = []
            for k in keys:
                v = get(k)
                if n == 4:
                    if prev is not None and prev.dot(v) < 0: v = -v
                    prev = v.copy()
                vals.append(v)
            for i in range(n):
                fc = newcurve(f'pose.bones["{bn}"].{path}', i, bn); fc.keyframe_points.add(len(keys)); flat = [0.0] * (2 * len(keys))
                for k, v in enumerate(vals): flat[2 * k] = keys[k][0]; flat[2 * k + 1] = v[i]
                fc.keyframe_points.foreach_set("co", flat); fc.update()
    print("feet planted:", steps, "steps,", len(prints), "footprints")
    json.dump({"fps": FPS, "prints": prints}, open(os.path.join(os.path.dirname(trackp), "steps.json"), "w"))
# where its head and bill are, model space as the film sees it (y up, it faces +z)
tr = {"fps": FPS, "n": N, "head": [], "tip": [], "jaw": [], "back": [], "lip": [], "cig": []}
conv = lambda v: [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]
# the corner of the bill on its right, at the gape, and a cigarette's lie there (forward, out to the side, drooping),
# both in the lower bill's own frame, so they open and close with it as it sings
# v7 (the director 11-16: "nail it actually being in its mouth ... it would wiggle when the goose opens its mouth"): its filter held
# between the bills 40% of the way along (the mouth line, z 0.582, between the lower bill's top and the upper's underside;
# blender/ measured), the cigarette leaving through the side of the bill, out to its right, a little ahead and drooping,
# in the lower bill's own frame so it rides the bill open and shut
JAW = arm.data.bones["Bone01"]; LIP = JAW.head_local + (arm.data.bones["Bone02"].head_local - JAW.head_local) * 0.4 + Vector((-0.005, 0, 0.004))
CIG = Vector((-0.78, -0.45, -0.32)).normalized()
RIG = ["Pelvis", "Spine", "Spine1", "Bip01_Neck", "Bip01_Neck1", "Bip01_Head", "Bone02", "Tail", "Bip01_Tail1"]
RIG = RIG + [n for s_ in ("L", "R") for n in (f"{s_}_Thigh", f"Bip01_{s_}_Calf", f"Bip01_{s_}_HorseLink", f"Bip01_{s_}_Foot", f"Bip01_{s_}_Toe1Nub")]
RIG_FROM, RIG_TO = 790, 860; tr["rig"] = {"from": RIG_FROM, "names": RIG, "pts": [], "more": []}
# v8: and under the water, where the goose is drawn as clay and wireframe with its rig over it (the plunge and the
# deep-below shot, frames 1880-1965; the orbit's dip, 2140-2215)
RIG_MORE = [(1880, 1965), (2140, 2215)]; tr["rig"]["more"] = [{"from": a, "pts": []} for a, _ in RIG_MORE]
for f in range(0, N):
    sc.frame_set(f); pb = arm.pose.bones
    tr["head"].append(conv(arm.matrix_world @ pb["Bip01_Head"].head)); tr["tip"].append(conv(arm.matrix_world @ pb["Bone02"].head)); tr["jaw"].append(conv(arm.matrix_world @ pb["Bone01"].head)); tr["back"].append(conv(arm.matrix_world @ pb["Spine1"].head))
    J = pb["Bone01"].matrix @ JAW.matrix_local.inverted()
    tr["lip"].append(conv(arm.matrix_world @ (J @ LIP))); dv = (arm.matrix_world.to_3x3() @ (J.to_3x3() @ CIG)).normalized(); tr["cig"].append(conv(dv))
    if RIG_FROM <= f < RIG_TO: tr["rig"]["pts"].append([conv(arm.matrix_world @ pb[n].head) for n in RIG])
    for (a, z), sp in zip(RIG_MORE, tr["rig"]["more"]):
        if a <= f < z: sp["pts"].append([conv(arm.matrix_world @ pb[n].head) for n in RIG])
json.dump(tr, open(trackp, "w"))
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=outp, export_format="GLB", export_animations=True, export_animation_mode="ACTIONS", export_force_sampling=True, export_optimize_animation_size=False, export_yup=True)
print("wrote", outp, len(mesh.data.vertices), "verts", N, "frames")
# (v8's clay-and-wire copy, goose-wire.glb, is gone: v9 draws the real goose under the water, the director 11-16)
# a contact sheet of the performance
sc.render.engine = "BLENDER_WORKBENCH"; sc.render.resolution_x, sc.render.resolution_y = 500, 500
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (1.1, -1.6, 0.6); cam.rotation_euler = (Vector((0, 0, 0.35)) - cam.location).to_track_quat("-Z", "Y").to_euler()
for k, b in enumerate([5, 13, 40.43, 58.5, 64.1, 76.5, 77.5, 81.9, 85.5, 90.0, 91.2, 92.05, 93.4, 95.0, 110, 130.1]):
    sc.frame_set(round((G0 + b * BEAT) * FPS)); sc.render.filepath = outp.replace(".glb", f"-{k:02d}.png"); bpy.ops.render.render(write_still=True)
