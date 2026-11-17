# canyon/sky: the sky ahead of and over the slot, the far half of a dome 150 m in radius that glows (so it lights the
# slot as the sky does and stands behind the rim; the half behind the camera is left open, because a whole dome
# shadows the scene's DirectionalLight): deep blue overhead paling to a warm haze at the horizon, its picture painted here.
# No rig in the file. In the scene: its glow's strength and colour (material canyon_sky) follow the sun down.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy
import numpy as np

col, root = comp.fresh("sky")
W, HT = 8, 256
px = np.zeros((HT, W, 4), dtype=np.float32)
zen, mid, hor = np.array([0.10, 0.27, 0.62]), np.array([0.30, 0.52, 0.86]), np.array([0.93, 0.80, 0.62])
for r in range(HT):
    v = r / (HT - 1)
    c = hor + (mid - hor) * min(1, v / 0.22) if v < 0.22 else mid + (zen - mid) * ((v - 0.22) / 0.78) ** 0.8
    px[r, :, :3] = c
    px[r, :, 3] = 1
path = os.path.join(comp.CACHE, "canyon", "sky.jpg")
os.makedirs(os.path.dirname(path), exist_ok=True)
im = bpy.data.images.new("canyon_sky", W, HT)
im.pixels.foreach_set(px.ravel())
im.filepath_raw = path
im.file_format = "JPEG"
im.save()
bpy.data.images.remove(im)

m = bpy.data.materials.get("canyon_sky") or bpy.data.materials.new("canyon_sky")
m.use_nodes = True
nt = m.node_tree
b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
for n in list(nt.nodes):
    if n.type == "TEX_IMAGE":
        nt.nodes.remove(n)
t = nt.nodes.new("ShaderNodeTexImage")
t.image = bpy.data.images.load(path, check_existing=False)
b.inputs["Base Color"].default_value = (0, 0, 0, 1)
b.inputs["Roughness"].default_value = 1.0
b.inputs["Specular IOR Level"].default_value = 0.0
nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
b.inputs["Emission Strength"].default_value = float(os.environ.get("CANYON_SKY", "4000"))

RAD, SEG, RINGS = 150.0, 32, 14
A0, A1 = math.radians(-12), math.radians(192)   # from the right round the far side (+y) to the left
bm = bmesh.new()
uv = bm.loops.layers.uv.new("UVMap")
ring = []
for j in range(RINGS + 1):
    el = -0.06 + (math.pi / 2 + 0.06) * j / RINGS
    ring.append([(bm.verts.new((RAD * math.cos(el) * math.cos(A0 + (A1 - A0) * i / SEG), RAD * math.cos(el) * math.sin(A0 + (A1 - A0) * i / SEG), RAD * math.sin(el))), i / SEG, max(0.004, min(0.996, el / (math.pi / 2)))) for i in range(SEG + 1)])
for j in range(RINGS):
    for i in range(SEG):
        q = [ring[j][i], ring[j + 1][i], ring[j + 1][i + 1], ring[j][i + 1]]   # looking inward
        f = bm.faces.new([v for v, _, _ in q])
        for l, (_, a, e) in zip(f.loops, q):
            l[uv].uv = (a, e)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
comp.mesh(col, root, "sky_dome", bm, m, smooth=True)
comp.export(col, root, L.PLACE, "sky", made="blender/components/canyon/sky.py", source="own geometry and picture", license="ours", credit="",
            rig={"glow": "in the scene: material canyon_sky's emissive strength (4000 reads as a noon sky at exposure 0) and tint follow the sun down, noon blue to a gold dusk"},
            notes="half a dome, open behind the camera (+z in raea): a closed dome shadows a DirectionalLight under Solari. A scene with an Environment sky does not need it")
