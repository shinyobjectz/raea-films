# sky/dove: one white dove of the flock the clouds world's click bursts out of the cloud (v3/clouds.tsx). 30 cm long,
# 60 cm across the wings: a plump body, a small head and pinkish beak, a fanned tail, and long wings whose outer
# feathers stand apart at their tips. One mesh, no rig: two shape keys beat its wings, "up" (raised high, the hands
# bent further up) and "down" (swept down below the body); the scene drives them (morphs) and moves each bird itself.
# Its nose is +x, its back +z (raea: nose +x, back +y).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from mathutils import Vector


def m(name, colour, rough):
    x = comp.mat(name, colour, rough=rough)
    x.use_backface_culling = False
    return x


WHITE = m("dove_white", (0.93, 0.93, 0.91), 0.62)
GREY = m("dove_primaries", (0.74, 0.75, 0.78), 0.6)
BEAK = m("dove_beak", (0.62, 0.42, 0.42), 0.4)
EYE = m("dove_eye", (0.015, 0.01, 0.01), 0.1)

col, root = comp.fresh("dove")
bm = bmesh.new()


def add(src, mi):
    """put bmesh src's faces into the bird's mesh with material index mi"""
    vs = {v: bm.verts.new(v.co) for v in src.verts}
    for f in src.faces:
        bm.faces.new([vs[v] for v in f.verts]).material_index = mi
    src.free()


# the body: an egg, plump at the chest, tapering under the tail
b = bmesh.new()
bmesh.ops.create_uvsphere(b, u_segments=20, v_segments=12, radius=1.0)
for v in b.verts:
    x, y, z = v.co
    k = 1.0 if x > -0.2 else 1.0 - 0.55 * ((-x - 0.2) / 0.8) ** 1.3
    v.co = Vector((0.115 * x + 0.01, 0.036 * y * k, 0.038 * z * k + 0.006 * x))
add(b, 0)
# the head and its neck
h = bmesh.new()
bmesh.ops.create_uvsphere(h, u_segments=14, v_segments=10, radius=0.026)
bmesh.ops.scale(h, vec=(1.15, 0.95, 1.0), verts=h.verts)
bmesh.ops.translate(h, vec=(0.122, 0.0, 0.03), verts=h.verts)
add(h, 0)
bk = comp.cyl(0.0075, 0.03, at=(0.156, 0.0, 0.026), seg=10, r2=0.0015, axis="X")
add(bk, 2)
for s in (-1, 1):
    e = bmesh.new()
    bmesh.ops.create_uvsphere(e, u_segments=8, v_segments=6, radius=0.0042)
    bmesh.ops.translate(e, vec=(0.133, s * 0.0215, 0.036), verts=e.verts)
    add(e, 3)
# the tail: a fan of two layers, its end square
t = bmesh.new()
for lift in (0.0, 0.004):
    a = [t.verts.new(c) for c in ((-0.08, -0.022, 0.0 + lift), (-0.2, -0.05, -0.012 + lift), (-0.205, 0.0, -0.014 + lift), (-0.2, 0.05, -0.012 + lift), (-0.08, 0.022, 0.0 + lift))]
    t.faces.new(a)
add(t, 0)

# the wings: a grid along the span (u) and back along the chord (c); the hand's long feathers stand apart at the tip
SHOULDER, HALF = 0.024, 0.29
NU, NC = 10, 3
wing_verts = []
for s in (-1, 1):
    w = bmesh.new()
    grid = {}
    for i in range(NU + 1):
        u = i / NU
        le = 0.045 - 0.035 * u - 0.03 * max(0.0, u - 0.7) / 0.3                        # the leading edge, swept back at the hand
        chord = 0.115 * (1 - u) ** 0.35 * (1 - 0.55 * u) + 0.03
        notch = 0.016 if (u > 0.5 and i % 2 == 0) else 0.0                              # the primaries apart
        for j in range(NC + 1):
            c = j / NC
            x = le - chord * c - (notch * c ** 3)
            y = s * (SHOULDER + HALF * u)
            z = 0.012 + 0.035 * u - 0.006 * math.sin(math.pi * c)                       # a little dihedral; cambered
            grid[i, j] = w.verts.new((x, y, z))
    for i in range(NU):
        for j in range(NC):
            q = [grid[i, j], grid[i + 1, j], grid[i + 1, j + 1], grid[i, j + 1]]
            w.faces.new(q if s > 0 else list(reversed(q)))
    for f in w.faces:
        f.material_index = 1 if f.calc_center_median().y * s > SHOULDER + HALF * 0.62 else 0
    vs = {v: bm.verts.new(v.co) for v in w.verts}
    for f in w.faces:
        bm.faces.new([vs[v] for v in f.verts]).material_index = f.material_index
    w.free()
bm.normal_update()
o = comp.mesh(col, root, "dove", bm, [WHITE, GREY, BEAK, EYE], smooth=True)

# the two shape keys: each wing turned about its shoulder (the body's long axis), the hand turned further
o.shape_key_add(name="Basis")
up = o.shape_key_add(name="up")
down = o.shape_key_add(name="down")


def beat(co, shoulder_deg, hand_deg, sweep):
    s = 1 if co.y > 0 else -1
    span = abs(co.y) - SHOULDER
    if span <= 0.0:                                     # (the body: it rides down as the wings go up, and up on the downstroke)
        return co + Vector((0.0, 0.0, -0.004 if shoulder_deg > 0 else 0.004))
    p = Vector((co.x, abs(co.y) - SHOULDER, co.z - 0.012))
    def turn(p, deg, at):
        a = math.radians(deg)
        y, z = p.y - at, p.z
        return Vector((p.x, at + y * math.cos(a) - z * math.sin(a), y * math.sin(a) + z * math.cos(a)))
    hand = HALF * 0.55
    q = turn(p, hand_deg, hand) if p.y > hand else p
    q = turn(q, shoulder_deg, 0.0)
    q.x += sweep * span
    return Vector((q.x, s * (q.y + SHOULDER), q.z + 0.012))


for v in o.data.vertices:
    up.data[v.index].co = beat(v.co, 62.0, 28.0, -0.12)
    down.data[v.index].co = beat(v.co, -48.0, -22.0, 0.18)

comp.export(col, root, "sky", "dove", made="blender/components/sky/dove.py", source="own geometry", license="ours", credit="",
            notes="30 cm, wings 60 cm; nose +x, back +z. Shape keys (morph targets, in order): up (wings raised), down (wings swept down). Beat it as up = max(0, sin), down = max(0, -sin).")
