# blender/willow_build.py: weeping willows and round far trees, ours, built from code.
# A willow: a trunk that leans and flares into roots, five to seven limbs that rise and arch outward, a crown of leaf
# masses over them, and curtains of hanging strands (cut-out leaf ribbons, tools/leaves.py) falling from the arch,
# longest at the outside, so it reads as a dome with skirts. A far tree: a trunk and a heap of lumpy leaf balls.
# usage: raea blender run blender/willow_build.py OUT_DIR LEAVES.png
import bpy, bmesh, sys, math, random
from mathutils import Vector, noise
out, leavesp = sys.argv[-2:]
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name, rgb, tex=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; bs = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bs.inputs["Base Color"].default_value = (*rgb, 1); bs.inputs["Roughness"].default_value = 1
    if "Specular IOR Level" in bs.inputs: bs.inputs["Specular IOR Level"].default_value = 0
    if tex:
        t = m.node_tree.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(tex)
        vc = m.node_tree.nodes.new("ShaderNodeVertexColor"); mix = m.node_tree.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs["Factor"].default_value = 1
        m.node_tree.links.new(t.outputs["Color"], mix.inputs[6]); m.node_tree.links.new(vc.outputs["Color"], mix.inputs[7]); m.node_tree.links.new(mix.outputs[2], bs.inputs["Base Color"])
        m.node_tree.links.new(t.outputs["Alpha"], bs.inputs["Alpha"])
        if hasattr(m, "blend_method"): m.blend_method = "CLIP"
        if hasattr(m, "surface_render_method"): m.surface_render_method = "DITHERED"
        m.use_backface_culling = False
    return m
def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]; return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)
def skin_tree(edges, radii, name):
    me = bpy.data.meshes.new(name); verts = []; idx = {}
    for a, b in edges:
        for p in (a, b):
            k = tuple(round(x, 4) for x in p)
            if k not in idx: idx[k] = len(verts); verts.append(p)
    me.from_pydata(verts, [(idx[tuple(round(x, 4) for x in a)], idx[tuple(round(x, 4) for x in b)]) for a, b in edges], [])
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    sk = ob.modifiers.new("skin", "SKIN"); ob.modifiers.new("sub", "SUBSURF").levels = 1
    for i, v in enumerate(verts): ob.data.skin_vertices[0].data[i].radius = radii(Vector(v))
    ob.data.skin_vertices[0].data[0].use_root = True
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.modifier_apply(modifier="skin"); bpy.ops.object.modifier_apply(modifier="sub"); bpy.ops.object.shade_smooth()
    return ob
def curve_pts(p0, p1, p2, n):
    return [p0 * (1 - t) ** 2 + p1 * 2 * t * (1 - t) + p2 * t * t for t in [i / n for i in range(n + 1)]]

def willow(seed, H=7.5, R=5.0):
    reset(); random.seed(seed)
    bark = mat("bark", lin("#7d5a3c")); leaf = mat("willow", lin("#ffffff"), leavesp); crownm = mat("crown", lin("#8cc84c"))
    lean = Vector((random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), 0))
    top = Vector((0, 0, H * 0.42)) + lean
    edges = []
    trunk = curve_pts(Vector((0, 0, 0)), Vector((0, 0, H * 0.2)) + lean * 0.3, top, 5)
    edges += list(zip(trunk[:-1], trunk[1:]))
    for i in range(6):   # roots
        a = i / 6 * math.tau + random.uniform(-0.3, 0.3); r = random.uniform(0.9, 1.5)
        pts = curve_pts(Vector((0, 0, 0.35)), Vector((math.cos(a) * r * 0.5, math.sin(a) * r * 0.5, 0.15)), Vector((math.cos(a) * r, math.sin(a) * r, -0.15)), 3)
        edges += list(zip(pts[:-1], pts[1:]))
    tips = []
    nl = random.randint(5, 7)
    for i in range(nl):   # limbs: up and out, then arching over
        a = i / nl * math.tau + random.uniform(-0.35, 0.35); r = R * random.uniform(0.55, 0.85)
        mid = top + Vector((math.cos(a) * r * 0.35, math.sin(a) * r * 0.35, H * random.uniform(0.3, 0.42)))
        end = top + Vector((math.cos(a) * r, math.sin(a) * r, H * random.uniform(0.32, 0.45)))
        pts = curve_pts(top, mid, end, 6); edges += list(zip(pts[:-1], pts[1:])); tips.append(pts)
    def rad(v):
        h = v.z / H; r0 = 0.42 * max(0.25, 1 - h * 1.25)
        if v.z < 0.4: r0 = 0.42 + 0.12 * (0.4 - max(v.z, -0.15)) / 0.55
        if Vector((v.x, v.y, 0)).length > 0.8 and v.z < 0.3: r0 = 0.16
        if (v - top).length > 0.6 and v.z > top.z: r0 = max(0.06, 0.22 * (1 - (v - top).length / R))
        return (r0, r0)
    t = skin_tree(edges, rad, "trunk"); t.data.materials.append(bark)
    # the crown: leaf masses over the arches
    bm = bmesh.new()
    for pts in tips:
        for p in pts[1:]:
            for _ in range(3):
                c = p + Vector((random.uniform(-0.55, 0.55), random.uniform(-0.55, 0.55), random.uniform(0.0, 0.45)))
                s = random.uniform(0.5, 0.85)
                g = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=s)
                for v in g["verts"]:
                    v.co = c + Vector((v.co.x, v.co.y, v.co.z * 0.92))
                    v.co += v.co.normalized() * 0.0 + Vector((0, 0, 0)) * 0 + (noise.noise(v.co * 1.3) * 0.25) * (v.co - c).normalized()
    me = bpy.data.meshes.new("crown"); bm.to_mesh(me); bm.free(); cr = bpy.data.objects.new("crown", me); bpy.context.scene.collection.objects.link(cr); cr.data.materials.append(crownm)
    for p in me.polygons: p.use_smooth = True
    # the curtains: strands hung from the arch and the crown's underside, longest outside
    bm = bmesh.new(); col = bm.loops.layers.color.new("Col"); strands = 0
    hangs = []
    for pts in tips:
        for k in range(1, len(pts) - 1):
            p, q = pts[k], pts[k + 1]
            for j in range(16):
                u = random.random(); c = p.lerp(q, u) + Vector((random.uniform(-0.9, 0.9), random.uniform(-0.9, 0.9), random.uniform(-0.3, 0.3)))
                hangs.append(c)
    for _ in range(260):   # fill the dome
        a = random.uniform(0, math.tau); rr = R * math.sqrt(random.uniform(0.1, 1)) * 0.95
        hangs.append(top + Vector((math.cos(a) * rr, math.sin(a) * rr, H * 0.42 * (1 - (rr / R) ** 2 * 0.4) - 0.3)))
    for c in hangs:
        out_r = Vector((c.x, c.y, 0)).length / R
        L = max(0.6, (c.z - 0.25) * random.uniform(0.45, 0.95) * (0.55 + 0.45 * out_r))
        w = random.uniform(0.16, 0.26); ang = math.atan2(c.y, c.x) + random.uniform(-0.6, 0.6)
        side = Vector((-math.sin(ang), math.cos(ang), 0)) * w / 2; outv = Vector((math.cos(ang), math.sin(ang), 0))
        n = 6; prev = None
        for i in range(n + 1):
            t_ = i / n; pos = c + Vector((0, 0, -L * t_)) + outv * (0.25 * math.sin(t_ * math.pi * 0.8) * L * 0.15)
            a_ = bm.verts.new(pos - side); b_ = bm.verts.new(pos + side)
            if prev:
                f = bm.faces.new((prev[0], prev[1], b_, a_))
                for lp in f.loops:
                    z = lp.vert.co.z; g = 0.72 + 0.28 * min(1, max(0, (c.z - z) / max(L, 0.1)))   # lighter toward the tip
                    lp[col] = (g * 0.95, g, g * 0.9, 1)
            prev = (a_, b_)
        strands += 1
    me = bpy.data.meshes.new("strands"); bm.to_mesh(me); bm.free()
    uv = me.uv_layers.new(name="UVMap")
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index]
    # uv: u across (0/1 by vertex order), v down the strand
    for poly in me.polygons:
        lis = list(poly.loop_indices); zs = [me.vertices[me.loops[l].vertex_index].co.z for l in lis]; zmax = max(zs)
        for n_, l in enumerate(lis):
            uv.data[l].uv = (0 if n_ in (0, 3) else 1, 0)
    # v by height within each strand: approximate with world z (the texture repeats every 1.6 m)
    for l in me.loops:
        uv.data[l.index].uv = (uv.data[l.index].uv[0], me.vertices[l.vertex_index].co.z / 1.6)
    st = bpy.data.objects.new("strands", me); bpy.context.scene.collection.objects.link(st); st.data.materials.append(leaf)
    bpy.ops.export_scene.gltf(filepath=f"{out}/willow-{seed}.glb", export_format="GLB", export_yup=True, export_vertex_color="ACTIVE", export_all_vertex_colors=True)
    print("willow", seed, strands, "strands")

def far_tree(seed):
    reset(); random.seed(seed + 100)
    bark = mat("bark", lin("#6b4a30")); leafm = mat("leaf", lin("#4f9a3a"))
    H = random.uniform(5, 8)
    t = skin_tree([(Vector((0, 0, 0)), Vector((0, 0, H * 0.55)))], lambda v: (0.25, 0.25), "trunk"); t.data.materials.append(bark)
    bm = bmesh.new()
    for i in range(7):
        c = Vector((random.uniform(-1.4, 1.4), random.uniform(-1.4, 1.4), H * random.uniform(0.6, 0.95)))
        s = random.uniform(1.2, 2.0)
        g = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=s)
        for v in g["verts"]: v.co = c + v.co + v.co.normalized() * noise.noise(v.co * 0.9 + Vector((seed, 0, 0))) * 0.35
    me = bpy.data.meshes.new("leaves"); bm.to_mesh(me); bm.free(); ob = bpy.data.objects.new("leaves", me); bpy.context.scene.collection.objects.link(ob); ob.data.materials.append(leafm)
    for p in me.polygons: p.use_smooth = True
    bpy.ops.export_scene.gltf(filepath=f"{out}/tree-{seed}.glb", export_format="GLB", export_yup=True)

for s in (0, 1, 2): willow(s)
for s in (0, 1, 2): far_tree(s)
print("done")
