# laundromat/sheet: the white bed sheet, 1.5 x 2 m of cotton (Poly Haven's cotton_jersey, bleached), modelled by hand
# as one cloth of 48 x 64 squares with three shapes: at rest it is wadded up small in a drum; "unfurl" opens it into a
# sheet hanging in the air in soft folds; "billow" bellies it toward the camera like a sail. Its origin is the wad's
# middle (the drum's axle, not the floor): it goes where the laundry goes.
# Rig: "drift" carries it out of the dryer's door, 1.5 m toward the camera and a little up, opening as it goes (its
# pivot sheet_drift moves and turns, the shape unfurl goes 0 to 1); "billow" starts where drift ends and bellies the open sheet (the shape unfurl 1 to 0 as billow goes 0 to 1).
# The shapes are morph targets (unfurl, billow), so a shot can also set them by name.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, T, R, S, xf
from mathutils import Vector, noise

col, root = comp.fresh("sheet")
cotton = comp.ph_texture("sheet_cotton", "cotton_jersey", tile=0.26, res="1k", tint=(0.96, 0.96, 0.94), grey=True)
W, Hh, NX, NY = 1.5, 2.0, 48, 64

def open_(u, v):
    x = u * W / 2 * (0.93 - 0.05 * v * v)
    z = v * Hh / 2 * 0.95 - 0.06 * u * u
    y = 0.17 * math.sin(2.1 * math.pi * u + 1.2 * v) * (0.55 + 0.45 * (1 - v) / 2) + 0.09 * math.sin(3.3 * math.pi * v + 2.0 * u) * (0.4 + 0.6 * abs(u)) + 0.05 * math.sin(5.3 * math.pi * u - 2.0 * v)
    y += 0.16 * u * u - 0.1 * v + 0.05 * noise.noise(Vector((u * 2.2, v * 2.2, 3.1)))
    return Vector((x, y, z))

def billow(u, v):
    k = (1 - u * u) * (1 - v * v)
    x = u * W / 2 * (0.84 - 0.04 * v * v)
    z = v * Hh / 2 * 0.86 - 0.04 * u * u + 0.05
    y = -0.5 * k ** 0.8 + 0.05 * math.sin(2.6 * math.pi * u - 0.8 * v + 1.0) * (1 - 0.6 * k) + 0.04 * math.sin(4.1 * math.pi * v + 1.0 * u) * (1 - 0.7 * k)
    y += 0.2 * u * u * (1 - k) + 0.05 * noise.noise(Vector((u * 2.6 + 4, v * 2.6, 9.7)))
    return Vector((x, y, z))

def wadded(u, v):
    # folded in a zigzag both ways and crumpled: a lump about 0.34 m across
    p = Vector((u * 2.7, v * 3.1, 0.0))
    x = 0.13 * math.sin(3.4 * math.pi * u + 0.9 * math.sin(2.2 * v)) + 0.05 * noise.noise(p + Vector((7, 0, 1)))
    z = 0.1 * math.sin(4.2 * math.pi * v + 1.1 * math.sin(2.7 * u)) + 0.04 * noise.noise(p + Vector((0, 5, 2))) - 0.02
    y = 0.11 * math.cos(2.6 * math.pi * u) * math.sin(2.9 * math.pi * v + 0.6) + 0.06 * noise.noise(p + Vector((3, 3, 3)))
    return Vector((x, y, z))

me = bpy.data.meshes.new("sheet_cloth")
verts, faces, uvs = [], [], []
for j in range(NY + 1):
    for i in range(NX + 1):
        verts.append((2 * i / NX - 1, 2 * j / NY - 1))
for j in range(NY):
    for i in range(NX):
        a = j * (NX + 1) + i
        faces.append((a, a + 1, a + NX + 2, a + NX + 1))
me.from_pydata([tuple(wadded(u, v)) for u, v in verts], [], faces)
uvl = me.uv_layers.new(name="UVMap")
for l in me.loops:
    u, v = verts[l.vertex_index]
    uvl.data[l.index].uv = (u * W / 2, v * Hh / 2)
for p in me.polygons:
    p.use_smooth = True
me.materials.append(cotton)
cotton.use_backface_culling = False
drift = comp.pivot(col, root, "sheet_drift", (0, 0, 0))
o = bpy.data.objects.new("sheet_cloth", me)
col.objects.link(o)
comp.link(col, root, o, parent=drift)
o.shape_key_add(name="Basis")
ku = o.shape_key_add(name="unfurl")
kb = o.shape_key_add(name="billow")
for k, (u, v) in enumerate(verts):
    op = open_(u, v)
    ku.data[k].co = op
    kb.data[k].co = billow(u, v)
END = [("location", 0, 0.15), ("location", 1, -1.5), ("location", 2, 0.12), ("rotation_euler", 1, math.radians(8)), ("rotation_euler", 2, math.radians(-14))]
_lib.channel("drift", [(drift, p, i, 0.0, v) for p, i, v in END])
_lib.key_channel("drift", o, [("unfurl", 0.0, 1.0), ("billow", 0.0, 0.0)])
# billow starts where drift ends: out in the room and open
ON = {("location", 0): 0.2, ("location", 1): -1.8, ("location", 2): 0.2, ("rotation_euler", 1): math.radians(11), ("rotation_euler", 2): math.radians(-20)}   # it drifts on a little as it bellies
_lib.channel("billow", [(drift, p, i, v, ON[(p, i)]) for p, i, v in END])
for p, i, v in END:
    getattr(drift, p)[i] = 0.0
_lib.key_channel("billow", o, [("unfurl", 1.0, 0.0), ("billow", 0.0, 1.0)])   # a crossfade: each shape is whole, so the normals hold
bpy.context.view_layer.update()
comp.export(col, root, _lib.PLACE, "sheet", made="blender/components/laundromat/sheet.py",
            source="own geometry (one cloth, three shapes); cotton: https://polyhaven.com/a/cotton_jersey", license="ours; texture CC0", credit="Poly Haven (cotton_jersey)",
            rig={"drift": "out of the drum 1.5 m toward the camera, 12 cm up, turning 14 degrees, opening from the wad into the hanging sheet (the pivot sheet_drift and the morph target unfurl)",
                 "billow": "from where drift ends (out in the room, open): the morph targets cross (unfurl 1 to 0, billow 0 to 1) and belly the sheet half a metre toward the camera like a sail as it drifts 0.3 m on"},
            notes="Origin: the wad's middle, at a drum's axle. Morph targets unfurl and billow are each a whole shape (the open sheet, the bellied sheet): set by name (<Model morphs>) they should sum to 1. A morphed mesh is drawn raster-lit under Solari (it casts no traced shadow).")
