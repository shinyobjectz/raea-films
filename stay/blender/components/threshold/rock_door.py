# threshold/rock-door: the door in the rock, the opening's second world (the director, 11-11: "the cool ocean we worked on on
# the rock and the door is in the rock we pass over the ocean ... the door int he rock idea is cool"). The sea's great
# rock (media/models/sea/crag-a.glb, read, not changed) with a doorway hewn into its foot: a rough-cut passage that
# flares toward the sea, a timber frame bedded in it under a heavy lintel, and in the frame a door of six salt-bleached
# planks on three iron strap hinges, with a ring to pull it by. Below the rock's face where it falls back from the
# door, a shelf of rock fills the foot, and the doorway is cut through that too. Three wet slabs step down from the
# sill to the water.
# The origin is the sill's middle on the door's plane, the door facing -y (toward the sea and the lens); the sea stands
# 1.1 m below it. The door opens toward us: rig "open", the leaf swinging out 88 degrees on its left side.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bpy, bmesh
from comp import T, R, S, xf
from mathutils import Vector, noise

rnd = random.Random(23)
col, root = comp.fresh("rock_door")
smooth = lambda a, b, x: (lambda k: k * k * (3 - 2 * k))(min(1.0, max(0.0, (x - a) / (b - a))))

# where the sea's crag stands from the door: as the ocean world placed it, and 0.45 m nearer the sea, so its face is in
# front of the door's plane all round the doorway's head (probed: before, it fell 0.2-0.7 m behind it low down)
CRAG = Vector((0.4, 1.30, -1.7))
W = 0.52            # the frame's opening's half-width (the leaf is 1.02 m)
HEAD = 2.18         # the lintel's underside
CUT_W, CUT_TOP, CUT_BACK = 0.67, 2.34, 0.32

ROCK_CUT = comp.ph_texture("rockdoor_hewn", "seaside_rock", tile=1.3, res="2k", tint=(0.72, 0.66, 0.58))
SHELF = comp.ph_texture("rockdoor_shelf", "seaside_rock", tile=1.6, res="2k", tint=(0.66, 0.6, 0.53))
WET = comp.ph_texture("rockdoor_wet", "seaside_rock", tile=1.1, res="2k", tint=(0.36, 0.38, 0.33))
PLANK = comp.ph_texture("rockdoor_planks", "weathered_planks", tile=1.4, res="2k", tint=(0.86, 0.84, 0.8))
FRAME = comp.ph_texture("rockdoor_frame", "weathered_brown_planks", tile=1.2, res="2k", tint=(0.55, 0.5, 0.45))
IRON = comp.mat("rockdoor_iron", (0.06, 0.035, 0.022), rough=0.78, metal=0.7)


def scene_obj(name, bm, mat):
    """a working object in the scene (not the component): a cutter, or a part before its cut"""
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    if mat is not None:
        me.materials.append(mat)
    return o


def lumpy(size, at, seed, amp, freq, cuts=14, rounds=4, flat_top=None):
    """a rough block: a box rounded off and pushed about along its normals by fractal noise; `flat_top` keeps its top
    a worn tread at that height"""
    bm = comp.box(size, at)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=cuts, use_grid_fill=True)
    for _ in range(rounds):
        bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update()
    off = Vector((seed * 7.31, seed * 3.17, seed * 5.53))
    for v in bm.verts:
        n = noise.fractal(v.co * freq + off, 0.7, 2.1, 4)
        v.co += v.normal * amp * n
    if flat_top is not None:
        zmax = max(v.co.z for v in bm.verts)
        for v in bm.verts:
            if v.co.z > zmax - 0.07:
                v.co.z = flat_top + 0.012 * noise.noise(v.co * 6 + off) - 0.02 * smooth(0.0, 1.0, abs(v.co.x) / (size[0] / 2))
    bm.normal_update()
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
            print("boolean: no", k)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=m.name)


# ---- the crag, brought in whole and put where it stands from the door
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(comp.PROJECT, "media", "models", "sea", "crag-a.glb"))
new = [o for o in bpy.data.objects if o not in before]
for o in new:
    if o.parent is None:
        o.location = o.location + CRAG
bpy.context.view_layer.update()
meshes = [o for o in new if o.type == "MESH"]
for o in meshes:
    mw = o.matrix_world.copy()
    o.parent = None
    o.matrix_world = mw
for o in new:
    if o.type != "MESH":
        bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
crag = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
uvname = crag.data.uv_layers.active.name if crag.data.uv_layers else "UVMap"

# ---- the shelf at the rock's foot, where its face falls back: from the water up to 0.8 m over the sill
shelf_bm = lumpy((3.4, 1.7, 2.3), (0.1, 0.6, -0.4), 3, 0.11, 1.5, cuts=22, rounds=3)
# (laid in beds like the crag's: the face stepped back a little at each, leaning with them)
for v in shelf_bm.verts:
    if v.co.y < 0.3:
        bed = (v.co.z + 0.12 * v.co.x) / 0.31
        v.co.y += 0.045 * (bed - math.floor(bed))
shelf = scene_obj("rock_door_shelf", shelf_bm, SHELF)
comp.uv_box(shelf, 1.0)

# ---- the doorway: a box through the rock to just behind the door's plane, rough-hewn, flaring toward the sea
cb = comp.box((CUT_W * 2, 3.6, CUT_TOP + 0.75), (0, CUT_BACK - 1.8, (CUT_TOP - 0.75) / 2))
bmesh.ops.subdivide_edges(cb, edges=cb.edges[:], cuts=26, use_grid_fill=True)
for v in cb.verts:
    p = v.co
    flare = smooth(-0.12, -1.1, p.y)                       # 0 at the frame, 1 a metre out
    n = noise.fractal(Vector((p.x * 3.1, p.y * 2.3, p.z * 3.1)) + Vector((4.1, 2.2, 7.7)), 0.6, 2.0, 3)
    if abs(p.x) > CUT_W - 0.01:
        p.x += math.copysign(0.035 * n + 0.28 * flare, p.x)
    if p.z > CUT_TOP - 0.01:
        p.z += 0.035 * n + 0.22 * flare
        p.z += 0.1 * (1.0 - (p.x / (CUT_W + 0.3)) ** 2) * flare   # (a rough round head to the mouth)
cutter = scene_obj("rock_door_cutter", cb, ROCK_CUT)
cutter.data.uv_layers.new(name=uvname)
comp.uv_box(cutter, 1.0)
for o in (crag, shelf):
    cut(o, cutter)
bpy.data.objects.remove(cutter, do_unlink=True)
for o, name in ((crag, "rock_door_crag"), (shelf, "rock_door_shelf")):
    comp.link(col, root, o, name=name)

# ---- the frame: two posts and a lintel bedded in the rock either side, and a sill beam
FY0, FY1 = -0.06, 0.1
posts = [comp.box((0.15, FY1 - FY0, HEAD + 0.02), (s * (W + 0.075), (FY0 + FY1) / 2, HEAD / 2 - 0.01)) for s in (-1, 1)]
lintel = comp.box((1.9, FY1 - FY0 + 0.04, 0.2), (0, (FY0 + FY1) / 2, HEAD + 0.1))
sillbeam = comp.box((W * 2 + 0.3, FY1 - FY0, 0.07), (0, (FY0 + FY1) / 2, -0.02))
for bm, sd in ((lintel, 1), (sillbeam, 2)):
    for v in bm.verts:
        v.co.z += 0.008 * noise.noise(v.co * 5 + Vector((sd, 0, 0)))
o = comp.mesh(col, root, "rock_door_frame", comp.merge(*posts, lintel, sillbeam), FRAME)
comp.bevel(o, 0.008, 2)
L.finish(o, 1.0)

# ---- the leaf, on its hinge pivot (its left edge, at its front face): six planks with their gaps, its straps and ring
HX, HY = -(W - 0.005), -0.045
hinge = comp.pivot(col, root, "rock_door_hinge", (HX, HY, 0.0))
leaf_w, leaf_h, th = 2 * W - 0.012, HEAD - 0.012, 0.055
planks = []
pw = leaf_w / 6
for i in range(6):
    x0 = HX + 0.004 + i * pw
    h = leaf_h - rnd.uniform(0.0, 0.012)
    t = th + rnd.uniform(-0.003, 0.003)
    b = comp.box((pw - 0.005, t, h), (x0 + pw / 2, HY + t / 2, 0.006 + h / 2))
    for v in b.verts:
        if v.co.z > 0.5:
            v.co.y += rnd.uniform(-0.002, 0.002)          # (each board a little proud or shy of its neighbours)
    planks.append(b)
o = comp.mesh(col, root, "rock_door_leaf", comp.merge(*planks), PLANK, parent=hinge)
comp.bevel(o, 0.004, 2)
L.finish(o, 1.0)

# straps: from the hinge side across most of the leaf, ending in a spear point, with a row of nail heads
fy = HY - 0.006
straps, nails = [], []
for z in (0.32, 1.86):
    L_ = leaf_w * 0.82
    poly = [(HX - 0.02, z - 0.03), (HX + L_ - 0.07, z - 0.03), (HX + L_ - 0.07, z - 0.045), (HX + L_, z), (HX + L_ - 0.07, z + 0.045), (HX + L_ - 0.07, z + 0.03), (HX - 0.02, z + 0.03)]
    straps.append(L.prism(poly, fy, HY + 0.001))
    for k in range(7):
        x = HX + 0.06 + k * (L_ - 0.14) / 6
        n = comp.cyl(0.011, 0.008, at=(x, fy, z), seg=10, r2=0.007, axis="Y")
        xf(n, T(0, -0.008, 0))
        nails.append(n)
# (the hinge's knuckles at the left edge, a short pintle bar into the post)
knuckles = [comp.cyl(0.018, 0.12, at=(HX - 0.012, HY + 0.01, z - 0.06), seg=12) for z in (0.32, 1.86)]
# the ring: a square back plate, a staple, and the ring hanging from it; a keyhole plate below
RING = (HX + 0.88, 1.05)
plate = comp.box((0.095, 0.006, 0.095), (RING[0], fy - 0.003, RING[1]))
staple = comp.cyl(0.009, 0.026, at=(RING[0], fy - 0.026, RING[1]), seg=10, axis="Y")
ring_pts = []
for k in range(17):
    a = k * 2 * math.pi / 16
    ring_pts.append((RING[0] + 0.058 * math.sin(a), fy - 0.03 - 0.004 * math.cos(a), RING[1] - 0.058 + 0.058 * math.cos(a)))
ring = comp.tube(ring_pts, 0.008, res=4, sides=2)
key = comp.box((0.05, 0.006, 0.09), (RING[0], fy - 0.003, RING[1] - 0.2))
o = comp.mesh(col, root, "rock_door_iron", comp.merge(*straps, *nails, *knuckles, plate, staple, ring, key), IRON, parent=hinge)
comp.channel("open", [(hinge, "rotation_euler", 2, 0.0, -math.radians(88))])

# ---- the steps down to the water: the sill stone, and two slabs below it, the lowest awash
steps = [
    ((1.75, 0.92, 0.42), (0.0, -0.36, -0.2), 0.0, SHELF),
    ((1.95, 0.62, 0.5), (0.06, -1.06, -0.62), -0.37, WET),
    ((2.1, 0.66, 0.6), (-0.04, -1.62, -1.04), -0.76, WET),
]
for i, (size, at, top, m) in enumerate(steps):
    bm = lumpy(size, at, 11 + i, 0.035, 2.2, cuts=10, rounds=2, flat_top=top)
    xf(bm, T(*at) @ R(rnd.uniform(-4, 4), "Z") @ T(*(-Vector(at))))
    o = comp.mesh(col, root, f"rock_door_step_{i}", bm, m, smooth=True)
    L.finish(o, 1.0)

for o in (crag, shelf):
    for p in o.data.polygons:
        p.use_smooth = True

ring_world = (RING[0], RING[1], -(fy - 0.03))
comp.export(col, root, "threshold", "rock_door", made="blender/components/threshold/rock_door.py",
            source="the sea's crag (media/models/sea/crag-a.glb: https://polyhaven.com/a/mountainside) cut; textures https://polyhaven.com/a/seaside_rock, https://polyhaven.com/a/weathered_planks, https://polyhaven.com/a/weathered_brown_planks",
            license="CC0", credit="Poly Haven",
            rig={"open": "the leaf swings out toward the sea on its left side, 88 degrees"},
            notes=f"in raea's frame: the hinge at ({HX:.3f}, 0, {-HY:.3f}); the ring, shut, at ({RING[0]:.3f}, {RING[1]:.3f}, {ring_world[2]:.3f}), {0.88:.2f} m from the hinge; the opening x +-{W}, y 0..{HEAD}; the crag at ({CRAG.x}, {CRAG.z}, {-CRAG.y}) from the origin")
