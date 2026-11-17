# The micro shots' surfaces (in the road's slot, song 56.63-60.06): the director, 11-12, "a ghigh res tree and have a super
# closeup of the bark or something with moss ... maybe something like rock with moss after that", and "the moss is
# moving on these surfaces" (v3/micro-moss.tsx grows it over them).
# Each is a scan from Poly Haven (CC0) cut to the patch the lens sees (tools/micro-tex.sh) on a grid half a millimetre
# fine, pushed out by the scan's own heights, so its furrows and cracks are shapes that cast shadows, not a picture:
#   micro/bark  Jolcham Oak Bark 01: 35 x 45 cm of an oak's trunk, 76 cm across (Blender: the trunk up Z, the patch
#               facing -Y, i.e. +z in raea); its furrows 1.6 cm deep
#   micro/rock  Dry Riverbed Rock: 60 cm of a boulder's top, its crown 80 cm round (facing up), its cracks 3 cm deep
# Beside each, media/models/micro/NAME-field.json: the surface on a coarser grid (raea's axes, metres: each point, its
# normal, and how green the scan is there) for the moss to be placed on.
#   bash tools/micro-tex.sh && raea blender run blender/micro.py
import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp, bpy
import numpy as np

MADE = "blender/micro.py"
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "micro")
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "media", "models", "micro")


def bark_shape(x, y, h, R=0.38):
    """x across the bark and y up it (metres, from the patch's middle), h out of it: on a trunk of radius R"""
    a, r = x / R, R + h
    return r * np.sin(a), R - r * np.cos(a), y


def rock_shape(x, y, h, R=0.8):
    """x across and y into the distance, h out: on a crown of radius R, its top at 0, facing up"""
    z = np.sqrt(np.maximum(R * R - x * x - y * y, 1e-6))
    n = np.stack([x, y, z]) / R
    return (R + h) * n[0], (R + h) * n[1], (R + h) * n[2] - R


def heights(name, nx, ny, depth):
    d = np.fromfile(os.path.join(SRC, f"{name}-disp.u16"), dtype="<u2").reshape(ny, nx).astype(np.float64) / 65535.0
    return (d - np.median(d)) * depth


def material(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    def img(f, colour):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(os.path.join(SRC, f), check_existing=True)
        t.image.colorspace_settings.name = "sRGB" if colour else "Non-Color"
        return t
    nt.links.new(img(f"{name}-diff.jpg", True).outputs["Color"], b.inputs["Base Color"])
    nt.links.new(img(f"{name}-rough.jpg", False).outputs["Color"], b.inputs["Roughness"])
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(img(f"{name}-nor.jpg", False).outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


def surface(name, W, H, nx, ny, fx, fy, depth, shape, source, credit):
    h = heights(name, nx, ny, depth)
    U, V = np.meshgrid(np.linspace(0, 1, nx), np.linspace(1, 0, ny))   # (the heights' top row first)
    X, Y, Z = shape(U * W - W / 2, V * H - H / 2, h)
    verts = np.stack([X, Y, Z], -1).reshape(-1, 3)
    i = (np.arange(ny - 1)[:, None] * nx + np.arange(nx - 1)[None, :]).reshape(-1)
    faces = np.stack([i, i + nx, i + nx + 1, i + 1], -1)
    col, root = comp.fresh(name)
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts.tolist(), [], faces.tolist())
    uv = me.uv_layers.new(name="UVMap")
    uv.data.foreach_set("uv", np.stack([U, V], -1).reshape(-1, 2)[faces.reshape(-1)].ravel())
    try:
        me.shade_smooth()
    except AttributeError:
        me.polygons.foreach_set("use_smooth", np.ones(len(me.polygons), dtype=bool))
    me.validate()
    me.materials.append(material(name))
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    comp.link(col, root, o, name=name)
    comp.export(col, root, "micro", name, made=MADE, source=source, license="CC0", credit=credit)

    # the field: the same surface on the moss's grid, in raea's axes (Blender's x, z, -y)
    rgb = np.fromfile(os.path.join(SRC, f"{name}-field.rgb"), dtype=np.uint8).reshape(fy, fx, 3).astype(np.float64) / 255.0
    ji, ii = np.meshgrid(np.linspace(0, ny - 1, fy).round().astype(int), np.linspace(0, nx - 1, fx).round().astype(int), indexing="ij")
    fu, fv = np.meshgrid(np.linspace(0, 1, fx), np.linspace(1, 0, fy))
    bx, by, bz = shape(fu * W - W / 2, fv * H - H / 2, h[ji, ii])
    P = np.stack([bx, bz, -by], -1)
    du = np.gradient(P, axis=1)
    dv = np.gradient(P, axis=0)
    N = np.cross(du, -dv)
    N /= np.linalg.norm(N, axis=-1, keepdims=True)
    # (turned to face the side the surface faces: out of the bark, up off the rock)
    facing = np.array([0.0, 0.0, 1.0] if name == "bark" else [0.0, 1.0, 0.0])
    if N.reshape(-1, 3).mean(0) @ facing < 0:
        N = -N
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    green = g - 0.5 * (r + b)
    field = {
        "w": fx, "h": fy, "size": [W, H],
        "p": np.round(P.reshape(-1), 5).tolist(),
        "n": np.round(N.reshape(-1), 3).tolist(),
        "green": np.round(green.reshape(-1), 3).tolist(),
        "lum": np.round((0.3 * r + 0.59 * g + 0.11 * b).reshape(-1), 3).tolist(),
    }
    with open(os.path.join(OUT, f"{name}-field.json"), "w") as f:
        json.dump(field, f, separators=(",", ":"))
    print("field", name, fx, fy, "green p50/p90", round(float(np.percentile(green, 50)), 3), round(float(np.percentile(green, 90)), 3))
    for ob in list(col.all_objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    comp.purge()


surface("bark", 0.35, 0.45, 701, 901, 176, 226, 0.016, bark_shape, "https://polyhaven.com/a/jolcham_oak_bark_01", "Charlotte Baglioni")
surface("rock", 0.6, 0.6, 1001, 1001, 241, 241, 0.03, rock_shape, "https://polyhaven.com/a/dry_riverbed_rock", "Amal Kumar")
