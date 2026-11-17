# The cursor in the space (v7-10: "a mouse in the space making comments"): a pointer arrow as a small physical object,
# our own outline (the classic arrow: a tip, a long left edge, a wing, a notch and a slanted tail), a white body raised
# a little inside a dark rim, its edges rounded so the light runs along them. One node, "cursor", 1 m from the tip to
# the tail's foot (scale it in the scene), its origin at the tip: the hotspot, so a click lands where it's placed.
# In raea's frame it faces +z, the tip up and left of the body.
#   raea blender run blender/cursor.py media/models/cursor.glb
# raea's frame to Blender's: (x, y, z) -> (x, -z, y).
import bpy, bmesh, sys, json, os
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
out = argv[0]

# the outline, drawn on a 64 grid with y down (the tip at 5,1), clockwise as seen from the front
OUTLINE = [(5, 1), (46, 35.5), (29.5, 35.5), (37.5, 54.5), (26.5, 59.5), (18.5, 38.5), (5, 51)]
SPAN = 59.5 - 1
DEPTH, RIM, BEVEL, RAISE = 0.11, 0.055, 0.016, 0.012

def at(p):
    # raea (x right, y up, the tip at 0,0), then to Blender's frame on the front plane (Blender y = 0)
    return Vector(((p[0] - 5) / SPAN, 0.0, -(p[1] - 1) / SPAN))

try:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bm = bmesh.new()
    verts = [bm.verts.new(at(p)) for p in OUTLINE]
    face = bm.faces.new(verts)
    bmesh.ops.recalc_face_normals(bm, faces=[face])
    if face.normal.y > 0:  # the front faces raea +z, Blender -y
        face.normal_flip()
    # the body: the outline pushed back (raea -z, Blender +y)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    back = [g for g in ext["geom"] if isinstance(g, bmesh.types.BMVert)]
    for v in back:
        v.co.y += DEPTH
    # the extrusion leaves the caps wound against each other: make every face point out, then find the caps by where
    # they are (the front at Blender y 0, the back at DEPTH), never by which way a normal happens to point
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.normal_update()
    cap = lambda y: next(f for f in bm.faces if all(abs(v.co.y - y) < 1e-5 for v in f.verts))
    front, back_face = cap(0.0), cap(DEPTH)
    assert front.normal.y < -0.9 and back_face.normal.y > 0.9, (front.normal, back_face.normal)
    # round the silhouette's edges, front and back, so a sun runs a highlight along them
    edges = list({e for f in (front, back_face) for e in f.edges})
    bmesh.ops.bevel(bm, geom=edges, offset=BEVEL, segments=3, profile=0.5, affect="EDGES")
    bm.normal_update()
    front = max((f for f in bm.faces if f.normal.y < -0.9 and f.calc_center_median().y < DEPTH / 2), key=lambda f: f.calc_area())
    # the white body: the front inset by the rim's width and raised a little out of it
    ins = bmesh.ops.inset_region(bm, faces=[front], thickness=RIM, depth=RAISE, use_even_offset=True)
    body = front
    bm.normal_update()
    me = bpy.data.meshes.new("cursor")
    bm.to_mesh(me)
    bm.free()
    rim = bpy.data.materials.new("cursor-rim")
    rim.diffuse_color = (0.018, 0.018, 0.022, 1)
    white = bpy.data.materials.new("cursor-body")
    white.diffuse_color = (0.92, 0.92, 0.9, 1)
    for m, c, r in ((rim, (0.018, 0.018, 0.022, 1), 0.35), (white, (0.92, 0.92, 0.9, 1), 0.28)):
        m.use_nodes = True
        bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        bsdf.inputs["Base Color"].default_value = c
        bsdf.inputs["Roughness"].default_value = r
    me.materials.append(rim)
    me.materials.append(white)
    # the raised front face is the body; everything else is rim
    best = max(me.polygons, key=lambda p: (p.normal.y < -0.9 and p.center.y < 0) * p.area)
    assert best.center.y < 0, "the body isn't on the front"
    for p in me.polygons:
        p.material_index = 1 if p.index == best.index else 0
    ob = bpy.data.objects.new("cursor", me)
    bpy.context.scene.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = False
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB")
    lo = [min(v.co[i] for v in me.vertices) for i in range(3)]
    hi = [max(v.co[i] for v in me.vertices) for i in range(3)]
    info = {"made": "blender/cursor.py", "source": "own geometry (a generic arrow pointer)", "license": "ours", "credit": "",
            "faces": len(me.polygons), "nodes": ["cursor"], "box_blender": [lo, hi], "steps": ["cursor.py"]}
    json.dump(info, open(out + ".json", "w"), indent=1)
    print("DONE", json.dumps(info))
except Exception as e:
    import traceback
    traceback.print_exc()
    print("FAILED", e)
    sys.exit(1)
