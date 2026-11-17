# The hand's skeleton and skin weights. The scan has no rig, so this builds one: a forearm, a hand, four fingers of
# three bones each (with a metacarpal that carries the palm's share) and a thumb of three, placed from measurements of
# the scan (joint centres, in the film's units: the scan's metres x 10, y up, z elbow to fingertips). Blender's
# automatic weights (bone heat) bind the scan's 4.6k base mesh to it; the mesh is then subdivided twice, which carries
# the weights onto the 74k mesh the film draws. Writes one JSON: positions, normals, uvs, indices, four bone weights a
# vertex, and the bones (name, parent, joint). The film does the skinning itself (v2/rig.ts), a frame at a time.
# Run: blender -b --factory-startup --python blender/rig.py -- IN.OBJ OUT.json
import bpy, bmesh, sys, json, mathutils

src, out = sys.argv[sys.argv.index("--") + 1:][:2]
K = 10.0
# name: (parent, joint, end) in film units; a bone runs from its joint to its end
B = {
    "forearm": (None, (0.20, 0.33, -5.20), (0.05, -0.03, -0.78)),
    "hand": ("forearm", (0.05, -0.03, -0.78), (-0.085, 0.10, 0.24)),
    "index0": ("hand", (0.12, 0.02, -0.55), (0.215, 0.12, 0.22)),
    "index1": ("index0", (0.215, 0.12, 0.22), (0.272, 0.148, 0.66)),
    "index2": ("index1", (0.272, 0.148, 0.66), (0.277, 0.115, 0.92)),
    "index3": ("index2", (0.277, 0.115, 0.92), (0.25, 0.085, 1.20)),
    "middle0": ("hand", (0.02, 0.02, -0.55), (-0.085, 0.10, 0.24)),
    "middle1": ("middle0", (-0.085, 0.10, 0.24), (-0.092, 0.16, 0.70)),
    "middle2": ("middle1", (-0.092, 0.16, 0.70), (-0.13, 0.105, 0.975)),
    "middle3": ("middle2", (-0.13, 0.105, 0.975), (-0.17, 0.075, 1.256)),
    "ring0": ("hand", (-0.08, 0.0, -0.55), (-0.39, 0.0, 0.20)),
    "ring1": ("ring0", (-0.39, 0.0, 0.20), (-0.366, 0.025, 0.60)),
    "ring2": ("ring1", (-0.366, 0.025, 0.60), (-0.42, -0.05, 0.84)),
    "ring3": ("ring2", (-0.42, -0.05, 0.84), (-0.46, -0.10, 1.08)),
    "little0": ("hand", (-0.16, -0.03, -0.55), (-0.60, -0.09, 0.12)),
    "little1": ("little0", (-0.60, -0.09, 0.12), (-0.655, -0.15, 0.45)),
    "little2": ("little1", (-0.655, -0.15, 0.45), (-0.69, -0.195, 0.62)),
    "little3": ("little2", (-0.69, -0.195, 0.62), (-0.717, -0.2, 0.76)),
    "thumb1": ("hand", (0.40, -0.12, -0.50), (0.62, -0.17, -0.05)),
    "thumb2": ("thumb1", (0.62, -0.17, -0.05), (0.80, -0.22, 0.27)),
    "thumb3": ("thumb2", (0.80, -0.22, 0.27), (0.92, -0.25, 0.50)),
}
NAMES = list(B)
toB = lambda p: mathutils.Vector((p[0] / K, -p[2] / K, p[1] / K))  # film (y up, x10) -> Blender (z up, metres)
toF = lambda v: (v.x * K, v.z * K, -v.y * K)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=src)
o = [x for x in bpy.data.objects if x.type == "MESH"][0]
bpy.context.view_layer.objects.active = o
o.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
o.data.materials.clear()
for p in o.data.polygons:
    p.use_smooth = True

arm = bpy.data.armatures.new("rig")
ao = bpy.data.objects.new("rig", arm)
bpy.context.scene.collection.objects.link(ao)
bpy.context.view_layer.objects.active = ao
bpy.ops.object.mode_set(mode="EDIT")
for n, (parent, j, e) in B.items():
    b = arm.edit_bones.new(n)
    b.head = toB(j)
    b.tail = toB(e)
    if parent:
        b.parent = arm.edit_bones[parent]
bpy.ops.object.mode_set(mode="OBJECT")

bpy.ops.object.select_all(action="DESELECT")
o.select_set(True)
ao.select_set(True)
bpy.context.view_layer.objects.active = ao
bpy.ops.object.parent_set(type="ARMATURE_AUTO")
if not o.vertex_groups:
    print("FAILED  rig.py: automatic weights made no groups")
    sys.exit(1)

# subdivide twice, under the armature modifier, so the weights are carried onto the finer mesh
bpy.context.view_layer.objects.active = o
m = o.modifiers.new("subd", "SUBSURF")
m.levels = 2
m.uv_smooth = "PRESERVE_CORNERS"
bpy.ops.object.modifier_move_to_index(modifier="subd", index=0)
bpy.ops.object.modifier_apply(modifier="subd")
for mod in list(o.modifiers):
    o.modifiers.remove(mod)

me = o.data
bm = bmesh.new()
bm.from_mesh(me)
bmesh.ops.triangulate(bm, faces=bm.faces)
bm.to_mesh(me)
bm.free()
uv = me.uv_layers.active.data
gname = {g.index: g.name for g in o.vertex_groups}
corner_normals = me.corner_normals if hasattr(me, "corner_normals") else None

positions, normals, uvs, bones, weights, indices, rest_of = [], [], [], [], [], [], {}
unweighted = 0
for poly in me.polygons:
    for li in poly.loop_indices:
        vi = me.loops[li].vertex_index
        u = uv[li].uv
        key = (vi, round(u.x, 6), round(u.y, 6))
        idx = rest_of.get(key)
        if idx is None:
            idx = len(rest_of)
            rest_of[key] = idx
            v = me.vertices[vi]
            positions += [round(c, 5) for c in toF(v.co)]
            n = v.normal
            normals += [round(n.x, 4), round(n.z, 4), round(-n.y, 4)]
            uvs += [round(u.x, 5), round(1 - u.y, 5)]
            gs = sorted(((g.weight, NAMES.index(gname[g.group])) for g in v.groups if gname[g.group] in B), reverse=True)[:4]
            tot = sum(w for w, _ in gs)
            if tot <= 0:
                unweighted += 1
                gs, tot = [(1.0, 0)], 1.0
            gs += [(0.0, 0)] * (4 - len(gs))
            bones += [b for _, b in gs]
            weights += [round(w / tot, 4) for w, _ in gs]
        indices.append(idx)

json.dump({
    "units": "the scan's metres x 10, y up, z elbow to fingertips",
    "bones": [{"name": n, "parent": (NAMES.index(B[n][0]) if B[n][0] else -1), "joint": B[n][1], "end": B[n][2]} for n in NAMES],
    "positions": positions, "normals": normals, "uvs": uvs, "indices": indices, "bone": bones, "weight": weights,
}, open(out, "w"), separators=(",", ":"))
print("WROTE", out, len(positions) // 3, "vertices", len(indices) // 3, "triangles", unweighted, "unweighted")
