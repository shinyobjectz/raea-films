# turbines/warning-sign: the site's warning signs on a galvanised post by the road, modelled by hand: a yellow hazard
# triangle with a falling-ice mark, and under it a white plate reading DANGER / FALLING ICE / KEEP CLEAR OF TURBINES IN
# FREEZING WEATHER and a smaller one, AUTHORISED ACCESS ONLY; clamps and bolts on the back, a concrete foot. 2.3 m.
# Our own wording, no operator's name. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf

col, root = comp.fresh("warning_sign")
galv = comp.mat("sign_post", (0.6, 0.62, 0.64), rough=0.35, metal=1.0)
yellow = comp.mat("sign_yellow", (0.9, 0.68, 0.02), rough=0.5)
white = comp.mat("sign_white", (0.85, 0.85, 0.83), rough=0.5)
black = comp.mat("sign_black", (0.01, 0.01, 0.012), rough=0.6)
redm = comp.mat("sign_red", (0.6, 0.03, 0.03), rough=0.5)
conc = comp.mat("sign_concrete", (0.45, 0.44, 0.42), rough=0.9)
M = _lib.maker(col, root)
M("warning_sign_post", comp.merge(comp.cyl(0.03, 2.3, at=(0, 0, 0), seg=14), comp.cyl(0.034, 0.02, at=(0, 0, 2.3), seg=14)), galv, smooth=True)
M("warning_sign_foot", comp.cyl(0.2, 0.08, at=(0, 0, -0.02), seg=20, r2=0.16), conc)


def poly(pts, y, d=0.004):
    bm = bmesh.new()
    f = bm.faces.new([bm.verts.new((x, y, z)) for x, z in pts])
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, -d, 0), verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


Y = -0.04
TZ = 1.95
M("warning_sign_triangle_edge", poly([(-0.33, TZ - 0.27), (0.33, TZ - 0.27), (0, TZ + 0.3)], Y), black)
M("warning_sign_triangle", poly([(-0.27, TZ - 0.24), (0.27, TZ - 0.24), (0, TZ + 0.23)], Y - 0.004), yellow)
ice = [poly([(-0.035, TZ + 0.06), (0.035, TZ + 0.06), (0.0, TZ - 0.06)], Y - 0.008, 0.002), poly([(-0.11, TZ - 0.07), (-0.06, TZ - 0.07), (-0.085, TZ - 0.15)], Y - 0.008, 0.002),
       poly([(0.06, TZ - 0.02), (0.11, TZ - 0.02), (0.085, TZ - 0.11)], Y - 0.008, 0.002), poly([(-0.2, TZ - 0.18), (0.2, TZ - 0.18), (0.2, TZ - 0.2), (-0.2, TZ - 0.2)], Y - 0.008, 0.002)]
M("warning_sign_ice_mark", comp.merge(*ice), black)
M("warning_sign_plate", comp.box((0.62, 0.004, 0.44), at=(0, Y - 0.002, 1.38)), white)
M("warning_sign_plate_head", comp.box((0.62, 0.003, 0.12), at=(0, Y - 0.005, 1.54)), redm)
txt = []
for body, size, z, depth in (("DANGER", 0.085, 1.54, 0.009), ("FALLING ICE", 0.075, 1.4, 0.006), ("KEEP CLEAR OF TURBINES", 0.036, 1.3, 0.006), ("IN FREEZING WEATHER", 0.036, 1.24, 0.006)):
    t = comp.text(body, size, depth=0.002)
    xf(t, T(0, Y - depth, z))
    txt.append((body, t))
M("warning_sign_text_head", txt[0][1], white)
M("warning_sign_text", comp.merge(*[t for _, t in txt[1:]]), black)
M("warning_sign_plate_2", comp.box((0.5, 0.004, 0.2), at=(0, Y - 0.002, 0.98)), white)
t2 = [comp.text("AUTHORISED", 0.05, depth=0.002), comp.text("ACCESS ONLY", 0.05, depth=0.002)]
xf(t2[0], T(0, Y - 0.006, 1.02)); xf(t2[1], T(0, Y - 0.006, 0.94))
M("warning_sign_text_2", comp.merge(*t2), black)
M("warning_sign_clamps", comp.merge(*[comp.merge(comp.box((0.12, 0.05, 0.03), at=(0, -0.012, z)), comp.cyl(0.008, 0.02, at=(-0.045, -0.046, z), seg=6, axis="Y"), comp.cyl(0.008, 0.02, at=(0.045, -0.046, z), seg=6, axis="Y"))
                                         for z in (2.1, 1.8, 1.52, 1.24, 1.04, 0.92)]), galv)
comp.export(col, root, "turbines", "warning_sign", made="blender/components/turbines/warning_sign.py", source="own geometry and wording (a generic wind-farm ice warning); letters in Blender's built-in font",
            license="ours", credit="")
