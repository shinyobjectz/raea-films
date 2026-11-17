# road/road-sign: a winding-road warning sign on the verge, modelled by hand: a 76 cm yellow diamond with a black
# border and a black winding arrow, an advisory plate under it (35 MPH), both on a perforated square steel post
# 3.1 m out of the ground, bolted through, the backs bare aluminium, the post's foot in a clod of gravel. Our own
# generic sign, no agency's. Rig: "shake" rocks the sign on its post 4 degrees (the car's wash, a gust); "glow": the
# faces are sign_face_yellow, which the scene lights when the headlights sweep it.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

col, root = comp.fresh("road_sign")
M = _lib.meshers(col, root)
yellow = comp.mat("sign_face_yellow", (0.92, 0.66, 0.02), rough=0.45)
black = comp.mat("sign_black", (0.01, 0.01, 0.01), rough=0.5)
alu = comp.mat("sign_aluminium", (0.6, 0.61, 0.62), rough=0.4, metal=0.7)
steel = comp.mat("sign_post_steel", (0.42, 0.43, 0.44), rough=0.5, metal=0.6)
hole = comp.mat("sign_post_hole", (0.02, 0.02, 0.02), rough=0.9)
gravel = comp.ph_texture("sign_gravel", "gravel_floor_03", tile=0.8, res="1k", tint=(0.5, 0.48, 0.46))
PH = 3.1
top = comp.pivot(col, root, "road_sign_top", (0, 0, 0.0))
# the post: 5 cm square tube with holes every 2.5 cm on all four faces
post = M("road_sign_post", comp.box((0.05, 0.05, PH + 0.2), at=(0, 0, PH / 2 - 0.1)), steel, parent=top)
comp.bevel(post, 0.004, 2)
hb = []
for k in range(int(PH / 0.0254) - 2):
    z = 0.05 + k * 0.0254
    hb.append(comp.cyl(0.0055, 0.052, at=(0, -0.026, z), seg=8, axis="Y"))
    hb.append(comp.cyl(0.0055, 0.052, at=(-0.026, 0, z), seg=8, axis="X"))
M("road_sign_post_holes", comp.merge(*hb), hole, parent=top)
# the diamond: a rounded square on its corner, 2 mm plate
def plate(side, r, t, y, z, name, m, diamond=True, seg=8):
    bm = bmesh.new()
    pts = []
    for cx, cy, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append(((side / 2 - r) * cx + r * math.cos(a), (side / 2 - r) * cy + r * math.sin(a)))
    f = bm.faces.new([bm.verts.new((px, 0, pz)) for px, pz in pts])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, t, 0), verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if diamond:
        xf(bm, R(45, "Y"))
    xf(bm, T(0, y, z))
    return M(name, bm, m, parent=top)
ZC = PH - 0.55
plate(0.762, 0.04, 0.003, -0.028, ZC, "road_sign_back", alu)
plate(0.757, 0.038, 0.0012, -0.0293, ZC, "road_sign_face", yellow)
# the border: a thin black frame just inside the edge
frame = []
for a in (45, 135, 225, 315):
    b = comp.box((0.66, 0.0008, 0.016), at=(0, 0, 0.33))
    xf(b, R(a, "Y")); xf(b, T(0, -0.0302, ZC)); frame.append(b)
M("road_sign_border", comp.merge(*frame), black, parent=top)
# the winding arrow: a ribbon up the diamond that swings right then left, and its head
pts = [(0.02 + 0.07 * math.sin((t - 0.1) * 2.3 * math.pi) * (1 if t > 0.1 else 0), -0.24 + 0.4 * t) for t in [i / 28 for i in range(29)]]
rb = bmesh.new()
prev = None
for i, (x, z) in enumerate(pts):
    dx, dz = (pts[min(i + 1, 28)][0] - pts[max(i - 1, 0)][0]), (pts[min(i + 1, 28)][1] - pts[max(i - 1, 0)][1])
    l = math.hypot(dx, dz); nx, nz = -dz / l * 0.024, dx / l * 0.024
    cur = (rb.verts.new((x - nx, 0, z - nz)), rb.verts.new((x + nx, 0, z + nz)))
    if prev: rb.faces.new((prev[0], prev[1], cur[1], cur[0]))
    prev = cur
hx, hz = pts[-1]
rb.faces.new([rb.verts.new(p) for p in ((hx - 0.07, 0, hz - 0.01), (hx + 0.07, 0, hz - 0.01), (hx + 0.005, 0, hz + 0.11))])
xf(rb, T(0, -0.0306, ZC))
M("road_sign_arrow", rb, black, parent=top)
# the advisory plate
ZP = ZC - 0.76
plate(0.46, 0.03, 0.003, -0.028, ZP, "road_sign_plate_back", alu, diamond=False)
plate(0.455, 0.028, 0.0012, -0.0293, ZP, "road_sign_plate_face", yellow, diamond=False)
tb = comp.merge(xf(comp.text("35", 0.21, 0.001), T(0, -0.0306, ZP + 0.045)), xf(comp.text("MPH", 0.085, 0.001), T(0, -0.0306, ZP - 0.14)))
M("road_sign_plate_text", tb, black, parent=top)
# bolts through sign and plate, washers on the face, nuts behind
bb = []
for z in (ZC + 0.2, ZC - 0.2, ZP + 0.15, ZP - 0.15):
    bb.append(comp.cyl(0.011, 0.004, at=(0, -0.0345, z), seg=12, axis="Y"))
    bb.append(comp.cyl(0.007, 0.07, at=(0, -0.034, z), seg=6, axis="Y"))
    bb.append(comp.cyl(0.011, 0.01, at=(0, 0.026, z), seg=6, axis="Y"))
M("road_sign_bolts", comp.merge(*bb), alu, parent=top)
# the foot: a clod of gravel round the post
clod = bmesh.new()
bmesh.ops.create_icosphere(clod, subdivisions=3, radius=1.0)
from mathutils import noise
for v in clod.verts:
    n = 1 + 0.2 * noise.noise(v.co * 3)
    v.co = Vector((v.co.x * 0.22 * n, v.co.y * 0.2 * n, max(-0.02, v.co.z * 0.06 * n)))
c = M("road_sign_foot", clod, gravel, smooth=True)
_lib.uv_top(c, 1.0)
_lib.channel("shake", [(top, "rotation_euler", 0, 0, math.radians(4))])
_lib.done(col, root, "road_sign", source="own geometry (a generic winding-road warning sign); gravel: https://polyhaven.com/a/gravel_floor_03", license="ours; texture CC0", credit="Poly Haven (gravel_floor_03)",
          rig={"shake": "the post and its signs rock 4 degrees back about the foot",
               "glow": "in the scene: sign_face_yellow lights when the headlights sweep it"})
