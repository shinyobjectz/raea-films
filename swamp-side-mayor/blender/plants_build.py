# blender/plants_build.py: the small plants, ours, on the trees' and grass's recipe (no specular, leaves shaded as
# the ground under them by straight-up normals, both windings):
#   cattail-K.glb  a clump of long strap leaves arching out, two to four stems, each with a brown head and a spike
#   daisy-K.glb    a few daisies: thin stems, a ring of white petals, a yellow middle
#   lotus.glb      a pink water lily: two rings of cupped petals and a yellow middle
# usage: raea blender run blender/plants_build.py OUT_DIR RAMP.png
import bpy, bmesh, sys, math, random
from mathutils import Vector
out, ramp = sys.argv[-2:]
def lin(h): c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]; return [((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c]
def mat(name, hexc=None, tex=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bs = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bs.inputs["Roughness"].default_value = 1
    if "Specular IOR Level" in bs.inputs: bs.inputs["Specular IOR Level"].default_value = 0
    if tex:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(tex); nt.links.new(t.outputs["Color"], bs.inputs["Base Color"])
        r = nt.nodes.new("ShaderNodeMath"); r.operation = "ROUND"; nt.links.new(t.outputs["Alpha"], r.inputs[0]); nt.links.new(r.outputs[0], bs.inputs["Alpha"])
    else: bs.inputs["Base Color"].default_value = (*lin(hexc), 1)
    m.use_backface_culling = True; return m
class Part:
    def __init__(self, name, material, up=True): self.name, self.m, self.up, self.V, self.F, self.UV, self.N = name, material, up, [], [], [], []
    def ribbon(self, pts, widths, side, u, both=True, normal=None):
        for back in ((False, True) if both else (False,)):
            base = len(self.V)
            for i, (p, w) in enumerate(zip(pts, widths)):
                t = i / (len(pts) - 1); self.V += [p - side * w, p + side * w]; self.UV += [(u - 0.08, t), (u + 0.08, t)]
                self.N += [normal or (0, 0, 1)] * 2
            for i in range(len(pts) - 1):
                q = (base + 2 * i, base + 2 * i + 1, base + 2 * i + 3, base + 2 * i + 2); self.F.append(q[::-1] if back else q)
    def tube(self, pts, r, sides=6):
        base = len(self.V)
        for i, p in enumerate(pts):
            d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized(); a = d.orthogonal().normalized(); b = d.cross(a)
            rr = r(i / (len(pts) - 1)) if callable(r) else r
            for k in range(sides):
                ang = k / sides * math.tau; n = a * math.cos(ang) + b * math.sin(ang); self.V.append(p + n * rr); self.UV.append((0.5, 0.5)); self.N.append(tuple(n))
        for i in range(len(pts) - 1):
            for k in range(sides):
                a0, a1 = base + i * sides + k, base + i * sides + (k + 1) % sides; self.F.append((a0, a1, a1 + sides, a0 + sides))
    def disc(self, c, r, n, normal=(0, 0, 1)):
        base = len(self.V); self.V.append(c); self.UV.append((0.5, 0.5)); self.N.append(normal)
        for k in range(n): ang = k / n * math.tau; self.V.append(c + Vector((math.cos(ang) * r, math.sin(ang) * r, 0))); self.UV.append((0.5, 0.5)); self.N.append(normal)
        for k in range(n): self.F.append((base, base + 1 + k, base + 1 + (k + 1) % n))
    def object(self):
        me = bpy.data.meshes.new(self.name); me.from_pydata([tuple(v) for v in self.V], [], self.F); me.update()
        uvl = me.uv_layers.new(name="UVMap")
        for li, lp in enumerate(me.loops): uvl.data[li].uv = self.UV[lp.vertex_index]
        for p in me.polygons: p.use_smooth = True
        me.normals_split_custom_set_from_vertices([tuple(n) for n in self.N])
        ob = bpy.data.objects.new(self.name, me); bpy.context.scene.collection.objects.link(ob); me.materials.append(self.m); return ob
def export(path):
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_yup=True, export_normals=True)
def reset(): bpy.ops.wm.read_factory_settings(use_empty=True)

def cattail(seed):
    reset(); rng = random.Random(seed)
    leaves, stems, heads = Part("leaves", mat("leaf", tex=ramp)), Part("stems", mat("stem", "#6f9c3c")), Part("heads", mat("head", "#6b3b20"))
    for i in range(rng.randint(7, 11)):   # strap leaves: up, then arching out and over
        a = rng.uniform(0, math.tau); out_ = Vector((math.cos(a), math.sin(a), 0)); L = rng.uniform(0.9, 1.6); bend = rng.uniform(0.15, 0.6)
        root = out_ * rng.uniform(0, 0.06); pts = []
        for k in range(8):
            t = k / 7; ang = bend * t * t * 2.2; pts.append(root + out_ * (L * 0.5 * (1 - math.cos(ang)) / max(ang, 1e-3) * t * 2 + 0.05 * t) + Vector((0, 0, L * t * (1 - 0.25 * bend * t))))
        side = out_.cross(Vector((0, 0, 1))).normalized(); w = rng.uniform(0.016, 0.024)
        leaves.ribbon(pts, [w * (1 - 0.85 * (k / 7) ** 2) for k in range(8)], side, rng.choice((0.125, 0.625)))
    for i in range(rng.randint(2, 4)):    # stems, heads, spikes
        a = rng.uniform(0, math.tau); lean = Vector((math.cos(a), math.sin(a), 0)) * rng.uniform(0.02, 0.12); H = rng.uniform(1.2, 1.75)
        pts = [lean * t * t + Vector((math.cos(a) * 0.03, math.sin(a) * 0.03, H * t)) for t in [k / 6 for k in range(7)]]
        stems.tube(pts + [pts[-1] + (pts[-1] - pts[-2]).normalized() * 0.32], 0.007, 5)
        d = (pts[-1] - pts[-2]).normalized(); hs = pts[-1] - d * 0.02
        heads.tube([hs + d * (0.2 * k / 6) for k in range(7)], lambda t: 0.028 * (0.75 + 0.25 * math.sin(math.pi * min(1, t * 1.15))), 8)
    for p in (leaves, stems, heads): p.object()
    export(f"{out}/cattail-{seed}.glb"); print("cattail", seed)
def daisies(seed):
    reset(); rng = random.Random(seed + 20)
    stems, petals, mids = Part("stems", mat("stem", "#6aa83f")), Part("petals", mat("petal", "#fbf8ee")), Part("mids", mat("mid", "#f2c230"))
    for i in range(rng.randint(3, 5)):
        a = rng.uniform(0, math.tau); r0 = rng.uniform(0, 0.1); H = rng.uniform(0.18, 0.32); base = Vector((math.cos(a) * r0, math.sin(a) * r0, 0))
        top = base + Vector((rng.uniform(-0.03, 0.03), rng.uniform(-0.03, 0.03), H)); stems.tube([base.lerp(top, k / 3) for k in range(4)], 0.003, 4)
        R = rng.uniform(0.022, 0.032)
        for k in range(11):   # petals: thin ribbons out from the middle, a little cupped
            ang = k / 11 * math.tau + rng.uniform(-0.1, 0.1); d = Vector((math.cos(ang), math.sin(ang), 0))
            pts = [top + d * R * (0.25 + 0.75 * t) + Vector((0, 0, 0.006 * t * t)) for t in (0, 0.5, 1)]
            petals.ribbon(pts, [R * 0.13, R * 0.16, R * 0.09], d.cross(Vector((0, 0, 1))), 0.5)
        mids.disc(top + Vector((0, 0, 0.003)), R * 0.32, 10)
    for p in (stems, petals, mids): p.object()
    export(f"{out}/daisy-{seed}.glb"); print("daisy", seed)
def lotus():
    reset(); rng = random.Random(7)
    petals, mids = Part("petals", mat("petal", "#ffb6cf")), Part("mids", mat("mid", "#ffd24a"))
    for ring, (n, L, tilt) in enumerate([(8, 0.11, 0.55), (7, 0.085, 0.95)]):
        for k in range(n):
            ang = k / n * math.tau + ring * 0.4; d = Vector((math.cos(ang), math.sin(ang), 0))
            pts = [d * 0.015 + d * L * t * math.cos(tilt * t) + Vector((0, 0, L * t * math.sin(tilt * t) * 1.2)) for t in [i / 4 for i in range(5)]]
            nrm = tuple((Vector((0, 0, 1)) * 0.6 - d * 0.4).normalized())
            petals.ribbon(pts, [0.01, 0.026, 0.03, 0.022, 0.004], d.cross(Vector((0, 0, 1))), 0.5, normal=nrm)
    mids.disc(Vector((0, 0, 0.02)), 0.022, 10)
    for p in (petals, mids): p.object()
    export(f"{out}/lotus.glb"); print("lotus")
for s in (0, 1, 2): cattail(s)
for s in (0, 1): daisies(s)
lotus()
