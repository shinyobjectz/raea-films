# threshold/_lib: what the threshold's components share. The threshold is the film's first world (the director, 11-11, on
# assembly 22: "open in wireframe world here with a ancient door here and a torch on the side"): the castle door
# (cathedral/door.glb) set in a ruined wall of dressed stone, on a floor of flags, with an iron torch beside it.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh
from mathutils import Vector

# The castle door's frame, as built (probed from media/models/cathedral/door.glb): straight sides at x +-1.006 up to
# where its round head springs, the head an arc about (0, SPRING_Z) of radius HEAD_R, its crown at 2.965. The frame
# stands at y 0.014 to 0.143 (its face toward -y); the leaves' rings stand out to y -0.092.
DOOR_HALF = 1.006
SPRING_Z = 1.622
HEAD_R = 1.343
CLEAR = 0.015                     # the gap round the frame
WALL_Y = (-0.15, 0.45)            # the wall's faces: its front, toward the camera, at -0.15


def stone(name="threshold_stone", tint=(0.8, 0.75, 0.66), tile=1.6, res="1k"):
    """Weathered limestone without joints (Poly Haven's worn_rock_natural_01, CC0): each block is its own solid, so the
    joints are real gaps."""
    return comp.ph_texture(name, "worn_rock_natural_01", tile=tile, res=res, tint=tint, grey=True)


def prism(poly, y0, y1):
    """A solid from a simple polygon in the xz plane (a list of (x, z)), from y0 to y1."""
    bm = bmesh.new()
    front = [bm.verts.new((x, y0, z)) for x, z in poly]
    back = [bm.verts.new((x, y1, z)) for x, z in poly]
    f0 = bm.faces.new(front)
    f1 = bm.faces.new(list(reversed(back)))
    n = len(poly)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([front[i], back[i], back[j], front[j]])
    bm.normal_update()
    # (a polygon's winding decides which way its faces point: make them all face out)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    return bm


def rough(bm, amount, seed, scale=7.0):
    """Knock a solid's surface about a little (worn stone): each vertex pushed along a smooth noise field."""
    rnd = random.Random(seed)
    ph = [rnd.uniform(0, 100) for _ in range(6)]
    for v in bm.verts:
        p = v.co
        n = (math.sin(p.x * scale + ph[0]) * math.sin(p.y * scale * 1.3 + ph[1]) * math.sin(p.z * scale * 0.9 + ph[2]))
        m = (math.sin(p.x * scale * 2.1 + ph[3]) * math.sin(p.z * scale * 1.7 + ph[4]))
        v.co += Vector((n * amount, m * amount * 0.6, (n - m) * amount * 0.5))
    return bm


def finish(o, size=1.0):
    bpy.context.view_layer.update()
    comp.uv_box(o, size)
    return o
