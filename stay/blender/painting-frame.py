# The garden's painting on the kid's bedroom wall (the director, 11-11: "as we pull out stay in painted letters appears ... and
# we zoom out to see it is a painting on a wall"): Poly Haven's carved, gilded "Fancy Picture Frame 02" (CC0), turned
# a quarter so it hangs landscape and stretched a little so its opening is the film's own shape, 5:4, 1.0 m by 0.8 m.
# The picture in it is drawn by v3/painting.tsx over the frame's own canvas (which stays, as the canvas's surface).
#   media/models/kidsroom/painting-frame.glb   origin: the opening's middle, on the canvas's face; the front toward +z
#   raea blender run blender/painting-frame.py
import os, sys, math, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
import comp, bpy
from mathutils import Matrix, Vector

ASSET = "fancy_picture_frame_02"
W, H = 1.0, 0.8
col, root, parts, credit = comp.ph_component("kidsroom", "painting_frame", ASSET, origin="back")
print("parts", {k: [m.name for m in o.data.materials] for k, o in parts.items()}, flush=True)
canvas = [o for o in parts.values() if any("canvas" in m.name.lower() for m in o.data.materials)]
if not canvas:
    comp.fail("no canvas part in " + ASSET)
meshes = list(parts.values())
# a quarter turn in the wall's plane (about y: the frame stands in x-z, its front toward -y)
q = Matrix.Rotation(math.radians(90), 4, "Y")
for o in meshes:
    o.matrix_world = q @ o.matrix_world
lo, hi = comp.box_of(canvas)
cw, ch = hi.x - lo.x, hi.z - lo.z
print("canvas", round(cw, 4), round(ch, 4), "aspect", round(cw / ch, 3), flush=True)
mid = (lo + hi) / 2
sx, sz = W / cw, H / ch
sy = (sx + sz) / 2
m = Matrix.Diagonal((sx, sy, sz, 1)) @ Matrix.Translation((-mid.x, -lo.y, -mid.z))
for o in meshes:
    o.matrix_world = m @ o.matrix_world
lo2, hi2 = comp.box_of(meshes)
clo, chi = comp.box_of(canvas)
print("frame", [round(v, 3) for v in lo2], [round(v, 3) for v in hi2], "canvas", [round(v, 3) for v in clo], [round(v, 3) for v in chi], flush=True)
comp.export(col, root, "kidsroom", "painting_frame", made="blender/painting-frame.py", source=f"https://polyhaven.com/a/{ASSET}", license="CC0", credit=credit,
            notes=f"turned a quarter to hang landscape, scaled x {sx:.3f} z {sz:.3f}: the opening 1.0 x 0.8 m; origin the opening's middle on the canvas's face")
print("painting frame done", json.dumps({"canvas_face_y": round(clo.y, 4), "frame_front_y": round(lo2.y, 4), "frame_back_y": round(hi2.y, 4)}))
