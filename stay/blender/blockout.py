# The graybox's places, blocked out in grey (the director 11-11: "Yes, graybox it"; 11-10: model the scene and props in
# Blender). Each place is a set of named boxes and simple solids in raea's frame (metres, y up, z toward the camera),
# exported as one .glb a place; what moves or lights up on the song (the tubes, the sun, the plant's turn, the car, the
# water) stays in raea. The detailed models replace these one by one, from the same layouts.
#   raea blender run blender/blockout.py OUT.glb PLACE [VARIANT]
#   PLACE: pool (VARIANT a..e, the generator's rerolls; e is the one the film holds), canyon (VARIANT a, b: seeds),
#          glasshouse, plant, road (VARIANT a, b), car, screen
# raea's frame to Blender's: (x, y, z) -> (x, -z, y).
import bpy, bmesh, sys, json, os, math, random
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1:]
out, place = argv[0], argv[1]
variant = argv[2] if len(argv) > 2 else "a"

def B(p):
    return Vector((p[0], -p[2], p[1]))

MATS = {}
def mat(name, grey, rough=0.8):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    c = (grey, grey, grey, 1) if isinstance(grey, float) else (*grey, 1)
    bsdf.inputs["Base Color"].default_value = c
    bsdf.inputs["Roughness"].default_value = rough
    MATS[name] = m
    return m

def obj(name, bm, m):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o

def box(name, lo, hi, m):
    """an axis-aligned box from lo to hi (raea frame)"""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    c = [(lo[i] + hi[i]) / 2 for i in range(3)]
    s = [abs(hi[i] - lo[i]) for i in range(3)]
    for v in bm.verts:
        p = [c[i] + v.co[i] * s[i] for i in range(3)]  # create_cube's verts are at +-0.5 in its own x, y, z
        v.co = B(p)
    return obj(name, bm, m)

def cyl(name, base, r, h, m, seg=24, r_top=None):
    """an upright cylinder (or cone, r_top) standing on `base` (raea frame)"""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r_top is None else r_top, depth=h)
    for v in bm.verts:
        v.co = B((base[0] + v.co.x, base[1] + h / 2 + v.co.z, base[2] - v.co.y))
    return obj(name, bm, m)

def sphere(name, c, r, m, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r)
    for v in bm.verts:
        v.co = B((c[0] + v.co.x * scale[0], c[1] + v.co.z * scale[1], c[2] - v.co.y * scale[2]))
    return obj(name, bm, m)

# ---- the pool hall: the generator's place, rerolled ----------------------------------------------------------------
# a hall 14 m wide (x -7..7), 26 long (z 0..-26), its pool 8 by 18, its high windows along the left wall. Each variant
# is a reroll: the same request, everything different and slightly wrong. e is the one the film holds and relights.
POOL = {
    "a": dict(h=6.0, tile=0.62, water=-0.3, pool=(-4, 4, -3, -21), ladder=(4, -5), boards=1, sign="EXTI", door=False, chair=None, lanes=False, columns=False, skylight=False),
    "b": dict(h=6.4, tile=0.78, water=-0.1, pool=(-4.5, 3.5, -3, -21), ladder=(-4.5, -6), boards=2, sign="EXIT", door=False, chair=None, lanes=True, columns=False, skylight=False),
    "c": dict(h=5.2, tile=0.55, water=-0.4, pool=(-3.5, 3.5, -5, -18), ladder=(3.5, -16), boards=0, sign="EXT", door=True, chair=None, lanes=True, columns=True, skylight=False),
    "d": dict(h=7.0, tile=0.7, water=-0.25, pool=(-2.5, 2.5, -3, -23), ladder=(2.5, -20), boards=1, sign="EIXT", door=False, chair=(5, -12, 0.0), lanes=False, columns=False, skylight=True),
    "e": dict(h=4.6, tile=0.6, water=-0.3, pool=(-4, 4, -4, -20), ladder=(4, -6), boards=1, sign="EXTI", door=True, chair=(5.5, -9, math.pi), lanes=False, columns=False, skylight=False),
}
POOL_W, POOL_L, WALL = 7.0, 26.0, 0.3

def pool(v):
    P = POOL[v]
    h = P["h"]
    deck = mat("deck", P["tile"] * 0.9, 0.55)
    wall = mat("wall", P["tile"], 0.7)
    dark = mat("trim", 0.12, 0.6)
    x0, x1, z0, z1 = P["pool"]
    depth = 1.8
    # the deck around the basin, as four boxes, and the basin's floor and walls
    box("deck-near", (-POOL_W, -0.3, z0), (POOL_W, 0, 0), deck)
    box("deck-far", (-POOL_W, -0.3, -POOL_L), (POOL_W, 0, z1), deck)
    box("deck-left", (-POOL_W, -0.3, z1), (x0, 0, z0), deck)
    box("deck-right", (x1, -0.3, z1), (POOL_W, 0, z0), deck)
    box("basin-floor", (x0, -depth - 0.3, z1), (x1, -depth, z0), wall)
    for name, lo, hi in (("basin-l", (x0 - 0.3, -depth, z1), (x0, 0, z0)), ("basin-r", (x1, -depth, z1), (x1 + 0.3, 0, z0)),
                         ("basin-near", (x0, -depth, z0), (x1, 0, z0 + 0.3)), ("basin-far", (x0, -depth, z1 - 0.3), (x1, 0, z1))):
        box(name, lo, hi, wall)
    # the walls, closed and thick (Solari leaks through thin ones); the left one with its high windows
    box("wall-right", (POOL_W, 0, -POOL_L - WALL), (POOL_W + WALL, h, WALL), wall)
    box("wall-far", (-POOL_W - WALL, 0, -POOL_L - WALL), (POOL_W + WALL, h, -POOL_L), wall)
    box("wall-near", (-POOL_W - WALL, 0, 0), (POOL_W + WALL, h, WALL), wall)
    wy0, wy1 = h - 1.6, h - 0.4
    box("wall-left-low", (-POOL_W - WALL, 0, -POOL_L - WALL), (-POOL_W, wy0, WALL), wall)
    box("wall-left-high", (-POOL_W - WALL, wy1, -POOL_L - WALL), (-POOL_W, h, WALL), wall)
    zs = [-2, -7, -12, -17, -22]
    edges = [0.3] + [z + 0.1 for z in zs[1:]] + [-POOL_L - WALL]
    for k in range(len(zs)):
        # a pier between windows; the windows are the gaps, 4 m each
        a, b = zs[k] + 0.0, zs[k] - 1.0
        box(f"wall-left-pier-{k}", (-POOL_W - WALL, wy0, b), (-POOL_W, wy1, a + (0.3 if k == 0 else 0)), wall)
    box("wall-left-end", (-POOL_W - WALL, wy0, -POOL_L - WALL), (-POOL_W, wy1, -22 - 1.0), wall)
    # the ceiling, a skylight's frame instead in one reroll
    if P["skylight"]:
        for k in range(6):
            box(f"skylight-{k}", (-POOL_W, h, -1 - k * 4.2 - 0.3), (POOL_W, h + 0.3, -1 - k * 4.2), dark)
        # its frame's rails along the long walls; the roof between them is open (the glass is the build's)
        for x in (-POOL_W, POOL_W - 0.4):
            box(f"skylight-rail-{x}", (x, h, -POOL_L - WALL), (x + 0.4, h + 0.3, WALL), dark)
    else:
        box("ceiling", (-POOL_W - WALL, h, -POOL_L - WALL), (POOL_W + WALL, h + 0.3, WALL), wall)
        # the tube fixtures' housings, three rows of five (the tubes themselves glow in raea)
        for i, x in enumerate((-3, 0, 3)):
            for j in range(5):
                z = -3 - j * 5
                box(f"fixture-{i}-{j}", (x - 0.12, h - 0.08, z - 1.25), (x + 0.12, h, z + 1.25), dark)
    # the ladder: two rails and three rungs, at the pool's edge (or into the wall)
    lx, lz = P["ladder"]
    side = 1 if lx > 0 else -1
    for k, dz in enumerate((-0.25, 0.25)):
        cyl(f"ladder-rail-{k}", (lx - side * 0.15, -1.2, lz + dz), 0.025, 2.2, dark, seg=10)
    for k in range(3):
        box(f"ladder-rung-{k}", (lx - side * 0.25, -0.3 - k * 0.35, lz - 0.25), (lx - side * 0.05, -0.27 - k * 0.35, lz + 0.25), dark)
    # diving boards at the far end
    for k in range(P["boards"]):
        bx = -1.5 + k * 3
        box(f"board-{k}-stand", (bx - 0.3, 0, z1 - 1.6), (bx + 0.3, 0.9 + k * 2, z1 - 0.6), dark)
        box(f"board-{k}", (bx - 0.25, 0.9 + k * 2, z1 - 1.4), (bx + 0.25, 0.97 + k * 2, z1 + 2.2), mat("board", 0.85, 0.5))
    # the exit sign over the far door (its letters in raea), a door the reroll forgot to put in
    box("exit-sign", (2.4, 2.5, -POOL_L + 0.01), (3.6, 2.85, -POOL_L + 0.12), mat("sign", 0.2, 0.4))
    if P["door"]:
        box("door", (2.4, 0, -POOL_L + 0.01), (3.6, 2.2, -POOL_L + 0.06), dark)
    if P["lanes"]:
        for k in range(1, 4):
            x = x0 + (x1 - x0) * k / 4
            cyl(f"lane-{k}", (x, P["water"] - 0.02, z0), 0.05, z0 - z1, mat("rope", 0.9, 0.4), seg=8)
    if P["columns"]:
        for x in (-5.5, 5.5):
            for z in (-6, -13, -20):
                box(f"column-{x}-{z}", (x - 0.3, 0, z - 0.3), (x + 0.3, h, z + 0.3), wall)
    if P["chair"]:
        cx, cz, yaw = P["chair"]
        box("chair-seat", (cx - 0.35, 1.6, cz - 0.3), (cx + 0.35, 1.7, cz + 0.3), mat("board", 0.85, 0.5))
        for k, (dx, dz) in enumerate(((-0.3, -0.25), (0.3, -0.25), (-0.3, 0.25), (0.3, 0.25))):
            cyl(f"chair-leg-{k}", (cx + dx, 0, cz + dz), 0.03, 1.6, dark, seg=8)
        # its back toward the pool: it faces the wall
        box("chair-back", (cx - 0.35, 1.7, cz - math.cos(yaw) * 0.3 - 0.05), (cx + 0.35, 2.4, cz - math.cos(yaw) * 0.3 + 0.05), mat("board", 0.85, 0.5))
    return {"water": P["water"], "h": h, "pool": P["pool"], "sign": P["sign"], "windows": {"y": [wy0, wy1], "z": [[z, z - 1.0] for z in zs]}}

# ---- the slot canyon -------------------------------------------------------------------------------------------------
def canyon(v):
    rnd = random.Random(7 if v == "a" else 23)
    stone = mat("stone", (0.62, 0.5, 0.42), 0.9)
    # two walls 9 m tall following one winding centre line along z, 1.6 to 3.4 m apart, as slabs 2 m long
    for side in (-1, 1):
        for k in range(36):
            z = 4 - k * 2
            cx = 1.4 * math.sin(k * 0.23 + (0 if v == "a" else 1.7)) + 0.6 * math.sin(k * 0.61)
            half = 0.8 + 0.9 * (0.5 + 0.5 * math.sin(k * 0.37 + 0.6)) + 0.15 * rnd.random()
            # the chamber: the left wall stands back up to 3.4 m more between z -22 and -40, eased in and out
            u = min(1.0, max(0.0, (-z - 20) / 4)) * min(1.0, max(0.0, (42 + z) / 4))
            if side < 0: half += 3.4 * u * u * (3 - 2 * u)
            x = cx + side * half
            box(f"wall-{'l' if side < 0 else 'r'}-{k}", (x if side > 0 else x - 3, -0.5, z - 2.05), (x + 3 if side > 0 else x, 9, z), stone)
    box("floor", (-8, -0.6, -70), (8, 0, 6), mat("sand", (0.7, 0.62, 0.52), 0.95))
    return {}

# ---- the glasshouse --------------------------------------------------------------------------------------------------
def glasshouse(v):
    frame = mat("frame", 0.3, 0.5)
    box("floor", (-5, -0.2, -16), (5, 0, 2), mat("floor", 0.5, 0.9))
    # mullions every 1.5 m along both long walls and the gable, a ridge at 5 m; the glass is raea's (traced as clear)
    for k in range(13):
        z = 1 - k * 1.4
        for x in (-4, 4):
            box(f"mullion-{x}-{k}", (x - 0.04, 0, z - 0.04), (x + 0.04, 3.2, z + 0.04), frame)
        for s in (-1, 1):
            # the roof's rafters, from the eave (x +-4, y 3.2) to the ridge (0, 5)
            n = 8
            for j in range(n):
                a, b = j / n, (j + 1) / n
                x0, y0 = s * 4 * (1 - a), 3.2 + 1.8 * a
                box(f"rafter-{s}-{k}-{j}", (min(x0, s * 4 * (1 - b)) - 0.03, y0 - 0.03, z - 0.03), (max(x0, s * 4 * (1 - b)) + 0.03, y0 + 0.25, z + 0.03), frame)
    for x in (-4, 4):
        box(f"sill-{x}", (x - 0.06, 0, -16), (x + 0.06, 0.8, 2), frame)
    box("ridge", (-0.05, 4.95, -16), (0.05, 5.05, 2), frame)
    box("gable", (-4, 0, -16.1), (4, 3.2, -16), mat("gable", 0.55, 0.9))
    # the bench the plant stands on, and two more down the aisle
    for k, z in enumerate((-5, -9, -13)):
        box(f"bench-{k}", (-3.6, 0.85, z - 1.5), (-1.6, 0.9, z + 1.5), mat("bench", 0.45, 0.8))
        for dx in (-3.5, -1.7):
            for dz in (-1.4, 1.4):
                box(f"bench-{k}-leg-{dx}-{dz}", (dx - 0.04, 0, z + dz - 0.04), (dx + 0.04, 0.85, z + dz + 0.04), frame)
    return {"bench": [-2.6, 0.9, -5]}

def plant(v):
    """a pot and a plant whose leaves all face one way (+x, its front): the agent turns it, so it is its own model,
    its origin at the pot's base centre"""
    clay = mat("pot", (0.55, 0.4, 0.32), 0.85)
    leaf = mat("leaf", (0.35, 0.45, 0.32), 0.6)
    cyl("pot", (0, 0, 0), 0.16, 0.3, clay, r_top=0.2)
    cyl("stem", (0, 0.28, 0), 0.012, 0.35, leaf, seg=8)
    rnd = random.Random(4)
    for k in range(7):
        # a leaf: a flattened sphere held out toward +x, spread a little up and round
        a = (k - 3) * 0.32
        y = 0.45 + 0.08 * k + 0.05 * rnd.random()
        r = 0.22
        c = (math.cos(a) * r, y, -math.sin(a) * r)
        sphere(f"leaf-{k}", c, 0.14, leaf, scale=(1.0, 0.22, 0.55))
    return {"front": "+x"}

# ---- the forest road -------------------------------------------------------------------------------------------------
def road(v):
    rnd = random.Random(11 if v == "a" else 31)
    box("road", (-3.5, -0.2, -130), (3.5, 0, 12), mat("asphalt", 0.22, 0.85))
    box("verge-l", (-14, -0.25, -130), (-3.5, 0.02, 12), mat("verge", 0.3, 0.95))
    box("verge-r", (3.5, -0.25, -130), (14, 0.02, 12), mat("verge", 0.3, 0.95))
    bark = mat("bark", 0.25, 0.9)
    crown = mat("crown", 0.3, 0.9)
    for k in range(60):
        side = -1 if k % 2 == 0 else 1
        x = side * (4.6 + 6 * rnd.random())
        z = 10 - k * 2.2 - rnd.random() * 1.5
        h = 9 + 7 * rnd.random()
        cyl(f"trunk-{k}", (x, 0, z), 0.18 + 0.12 * rnd.random(), h, bark, seg=10)
        cyl(f"crown-{k}", (x, h * 0.45, z), 1.6 + 0.8 * rnd.random(), h * 0.75, crown, seg=10, r_top=0.05)
    return {}

def car(v):
    """a car's blockout, 4.5 m long facing +z, wheels at the four corners; its origin on the ground at its centre"""
    paint = mat("paint", (0.45, 0.12, 0.1), 0.5)
    glass = mat("glass", 0.08, 0.1)
    tyre = mat("tyre", 0.06, 0.8)
    box("body", (-0.9, 0.3, -2.25), (0.9, 0.95, 2.25), paint)
    box("cabin", (-0.8, 0.95, -1.2), (0.8, 1.42, 0.9), glass)
    for k, (x, z) in enumerate(((-0.95, 1.45), (0.95, 1.45), (-0.95, -1.4), (0.95, -1.4))):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=0.34, radius2=0.34, depth=0.24)
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, "Y"))
        for vv in bm.verts:
            vv.co = B((x + vv.co.x, 0.34 + vv.co.z, z - vv.co.y))
        obj(f"wheel-{k}", bm, tyre)
    for k, x in enumerate((-0.6, 0.6)):
        box(f"headlight-{k}", (x - 0.18, 0.62, 2.24), (x + 0.18, 0.74, 2.27), mat("lamp", 0.9, 0.2))
    return {"length": 4.5}

def screen(v):
    """the app's screen: a thin dark slab 1.92 by 1.2, its face (raea's picture, a Plane in the scene) at z 0"""
    box("screen-body", (-0.98, -0.62, -0.04), (0.98, 0.62, -0.002), mat("bezel", 0.05, 0.3))
    return {"w": 1.92, "h": 1.2}

PLACES = {"pool": pool, "canyon": canyon, "glasshouse": glasshouse, "plant": plant, "road": road, "car": car, "screen": screen}

try:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    info = PLACES[place](variant)
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB")
    faces = sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type == "MESH")
    meta = {"made": f"blender/blockout.py {place} {variant}", "source": "own geometry (graybox)", "license": "ours", "credit": "",
            "faces": faces, "objects": len(bpy.context.scene.objects), "layout": info, "steps": ["blockout.py"]}
    json.dump(meta, open(out + ".json", "w"), indent=1)
    print("DONE", place, variant, faces, "faces")
except Exception as e:
    import traceback
    traceback.print_exc()
    print("FAILED", e)
    sys.exit(1)
