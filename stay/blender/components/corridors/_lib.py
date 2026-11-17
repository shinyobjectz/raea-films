# corridors' shared shapes and sizes (the director, 11-11, on assembly 23, at the subway: "when we hit this cut out a few of
# the next shots to match cut on this mobement speed of different well designed hallways or corridors that match this
# train size ... makes it look like we are flying down and match cutting hallwways"). The montage's subway shot ends
# with the lens flying through the arriving car; the four shots after it fly down four corridors at the car's speed.
# Every corridor has the car's section, so each cut lands on the same lines: 3.0 m between the walls' faces (x -1.5 to
# 1.5), 2.8 m from the floor (z 0) to the ceiling's underside (or the vault's crown), and the lens on the axis at
# 1.4 m. Blender frame: the corridor runs along +y (raea's -z, the way the lens flies) from y Y0 behind the lens's start
# to its far end at y L; origin on the floor's centre line where the lens starts.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh, bpy
from comp import T, R, S, xf
from mathutils import Vector, Matrix
import numpy as np

PLACE = "corridors"
W2, H, Y0, L = 1.5, 2.8, -4.0, 56.0
SRC = os.path.join(comp.CACHE, "corridors")


def slab(x0, x1, y0, y1, z0, z1):
    """A box between two corners (either way round)."""
    x0, x1 = min(x0, x1), max(x0, x1)
    y0, y1 = min(y0, y1), max(y0, y1)
    z0, z1 = min(z0, z1), max(z0, z1)
    return comp.box((x1 - x0, y1 - y0, z1 - z0), at=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))


def sphere(r, at=(0, 0, 0), scale=(1, 1, 1), u=20, v=12):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    xf(bm, S(*scale))
    xf(bm, T(*at))
    return bm


def prism(prof, y0, y1):
    """A profile [(x, z)] pushed along y from y0 to y1."""
    bm = bmesh.new()
    f = [bm.verts.new((x, y0, z)) for x, z in prof]
    b = [bm.verts.new((x, y1, z)) for x, z in prof]
    bm.faces.new(f)
    bm.faces.new(list(reversed(b)))
    n = len(prof)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((f[j], f[i], b[i], b[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def both(make):
    """A wall piece made for the right wall (x > 0, its face toward -x) and its mirror on the left."""
    a, b = make(), make()
    xf(b, S(-1, 1, 1))
    bmesh.ops.reverse_faces(b, faces=b.faces[:])
    return comp.merge(a, b)


def mirror_x(bm):
    xf(bm, S(-1, 1, 1))
    bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    return bm


# --- textures drawn here (numpy), saved beside the Poly Haven cache --------------------------------------------------

def noise(h, w, cell, seed):
    """Smooth value noise, h x w, features about `cell` pixels across."""
    rng = np.random.default_rng(seed)
    gh, gw = h // cell + 2, w // cell + 2
    g = rng.random((gh, gw)).astype(np.float32)
    y = np.arange(h, dtype=np.float32) / cell
    x = np.arange(w, dtype=np.float32) / cell
    yi, xi = y.astype(int), x.astype(int)
    fy, fx = y - yi, x - xi
    fy, fx = fy * fy * (3 - 2 * fy), fx * fx * (3 - 2 * fx)
    a = g[yi][:, xi]; b = g[yi][:, xi + 1]; c = g[yi + 1][:, xi]; d = g[yi + 1][:, xi + 1]
    top = a + (b - a) * fx[None, :]
    bot = c + (d - c) * fx[None, :]
    return top + (bot - top) * fy[:, None]


def save_image(name, rgb):
    """rgb: h x w x 3 floats 0..1 in sRGB, row 0 at the top. Saved as SRC/name.png; returns its path."""
    os.makedirs(SRC, exist_ok=True)
    path = os.path.join(SRC, name + ".png")
    h, w = rgb.shape[:2]
    im = bpy.data.images.new(name + "_px", w, h, alpha=False)
    px = np.ones((h, w, 4), dtype=np.float32)
    px[:, :, :3] = np.clip(rgb[::-1], 0, 1)          # (Blender's rows run bottom to top)
    im.pixels.foreach_set(px.ravel())
    im.filepath_raw = path
    im.file_format = "PNG"
    im.save()
    bpy.data.images.remove(im)
    return path


def image_mat(name, path, size=(1.0, 1.0), offset=(0.0, 0.0), rough=0.6, metal=0.0, rough_path=None):
    """A material showing an image laid in world metres on uv_box's UVs: one copy of it every size[0] across by size[1]
    up, moved by offset (metres)."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type not in ("BSDF_PRINCIPLED", "OUTPUT_MATERIAL"):
            nt.nodes.remove(n)
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    uv = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / size[0], 1 / size[1], 1)
    mp.inputs["Location"].default_value = (offset[0] / size[0], offset[1] / size[1], 0)
    nt.links.new(uv.outputs["UV"], mp.inputs["Vector"])
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(path, check_existing=True)
    t.image.colorspace_settings.name = "sRGB"
    nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if rough_path:
        r = nt.nodes.new("ShaderNodeTexImage")
        r.image = bpy.data.images.load(rough_path, check_existing=True)
        r.image.colorspace_settings.name = "Non-Color"
        nt.links.new(mp.outputs["Vector"], r.inputs["Vector"])
        nt.links.new(r.outputs["Color"], b.inputs["Roughness"])
    else:
        b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    m["source"] = "drawn by blender/components/corridors/_lib.py (numpy)"
    return m


def uv_set(o, fn):
    """UVs from a function of each loop's world point and its face's normal: fn(p, n) -> (u, v)."""
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.active
    mw = o.matrix_world
    for f in bm.faces:
        for l in f.loops:
            l[uv].uv = fn(mw @ l.vert.co, f.normal)
    bm.to_mesh(me)
    bm.free()
