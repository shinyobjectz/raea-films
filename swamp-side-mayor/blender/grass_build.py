# blender/grass_build.py: meadow grass clumps, ours (assets/glb/grass-K.glb): tapered, curved blades leaning out from
# a root, coloured root to tip by grass-ramp.png (each blade a patch column), every normal straight up so a clump
# shades as the ground under it does, both windings so it reads from either side, no specular (no glare looking
# toward the sun). Alpha-masked (fully opaque) so the paint look's wind bends it like any cut-out.
# usage: raea blender run blender/grass_build.py OUT_DIR RAMP.png
import bpy, sys, math, random
from mathutils import Vector
out, ramp = sys.argv[-2:]
def material():
    m = bpy.data.materials.new("grass"); m.use_nodes = True; nt = m.node_tree; bs = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bs.inputs["Roughness"].default_value = 1
    if "Specular IOR Level" in bs.inputs: bs.inputs["Specular IOR Level"].default_value = 0
    tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(ramp); tex.interpolation = "Linear"
    nt.links.new(tex.outputs["Color"], bs.inputs["Base Color"])
    rnd = nt.nodes.new("ShaderNodeMath"); rnd.operation = "ROUND"; nt.links.new(tex.outputs["Alpha"], rnd.inputs[0]); nt.links.new(rnd.outputs[0], bs.inputs["Alpha"])
    m.use_backface_culling = True; return m
def clump(seed, blades, hmin, hmax, spread):
    bpy.ops.wm.read_factory_settings(use_empty=True); rng = random.Random(seed)
    V, F, UV = [], [], []
    for b in range(blades):
        a = rng.uniform(0, math.tau); r0 = spread * math.sqrt(rng.random()); root = Vector((math.cos(a) * r0, math.sin(a) * r0, 0))
        h = rng.uniform(hmin, hmax); lean = rng.uniform(0.15, 0.55) * h; out_ = Vector((math.cos(a + rng.uniform(-0.6, 0.6)), math.sin(a + rng.uniform(-0.6, 0.6)), 0))
        w = rng.uniform(0.012, 0.02) * (0.6 + h * 1.2); col = rng.randrange(4); u = (col + 0.5) / 4
        side = out_.cross(Vector((0, 0, 1))).normalized(); twist = rng.uniform(-0.5, 0.5)
        n = 5; pts = []
        for i in range(n + 1):
            t = i / n; p = root + out_ * lean * t * t + Vector((0, 0, h * (t - 0.12 * t * t)))
            s = (side * math.cos(twist * t) + out_ * math.sin(twist * t)) * w * (1 - t) ** 0.85
            pts.append((p, s, t))
        for back in (False, True):
            base = len(V)
            for p, s, t in pts: V += [p - s, p + s]; UV += [(u - 0.1, t), (u + 0.1, t)]
            for i in range(n):
                q = (base + 2 * i, base + 2 * i + 1, base + 2 * i + 3, base + 2 * i + 2)
                F.append(q[::-1] if back else q)
    me = bpy.data.meshes.new("grass"); me.from_pydata([tuple(v) for v in V], [], F); me.update()
    uvl = me.uv_layers.new(name="UVMap")
    for li, lp in enumerate(me.loops): uvl.data[li].uv = UV[lp.vertex_index]
    for p in me.polygons: p.use_smooth = True
    me.normals_split_custom_set_from_vertices([(0, 0, 1)] * len(V))
    ob = bpy.data.objects.new("grass", me); bpy.context.scene.collection.objects.link(ob); me.materials.append(material())
    bpy.ops.export_scene.gltf(filepath=f"{out}/grass-{seed}.glb", export_format="GLB", export_yup=True, export_normals=True)
    print("grass", seed, len(F), "faces")
clump(0, 22, 0.18, 0.42, 0.13); clump(1, 28, 0.25, 0.6, 0.17); clump(2, 16, 0.12, 0.3, 0.1)
