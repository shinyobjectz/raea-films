# road/reflector-post: a roadside delineator, modelled by hand: a flexible white plastic post 1.2 m out of the
# shoulder, 10 cm wide and slightly dished, a black band near its top with a white retroreflective sheet on the
# face the traffic sees, a second amber one on its back, a moulded base and dirt up its foot. One every 20 m along
# the fog line; they are the dots that run to the vanishing point. Rig: "flex" bends it back 28 degrees from the
# ground and springs (the car's wash as it passes); "glow": reflector_post_lens is the scene's to light.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

col, root = comp.fresh("reflector_post")
M = _lib.meshers(col, root)
white = comp.mat("reflector_post_plastic", (0.82, 0.82, 0.8), rough=0.55)
black = comp.mat("reflector_post_band", (0.02, 0.02, 0.02), rough=0.6)
lens = comp.mat("reflector_post_lens", (0.92, 0.94, 0.98), rough=0.12, emit=(0.9, 0.95, 1.0), strength=1.5)
lens_b = comp.mat("reflector_post_lens_back", (0.95, 0.5, 0.05), rough=0.12, emit=(1.0, 0.5, 0.08), strength=1.0)
dirt = comp.mat("reflector_post_dirt", (0.11, 0.09, 0.07), rough=0.95)
base = M("reflector_post_base", comp.merge(comp.cyl(0.07, 0.025, at=(0, 0, -0.005), seg=20, r2=0.055), comp.box((0.11, 0.03, 0.05), at=(0, 0, 0.04))), black)
comp.bevel(base, 0.004, 2)
flex = comp.pivot(col, root, "reflector_post_flex", (0, 0, 0.05))
H, Wd = 1.2, 0.1
bm = comp.grid(Wd, H - 0.04, 6, 24)
for v in bm.verts:
    v.co.y = 0.012 * (1 - (2 * v.co.x / Wd) ** 2) - 0.006      # dished across
    if v.co.z > (H - 0.04) / 2 - 0.05:                          # a rounded top
        t = (v.co.z - ((H - 0.04) / 2 - 0.05)) / 0.05
        v.co.x *= math.sqrt(max(0.0, 1 - 0.75 * t * t))
xf(bm, T(0, 0, 0.04 + (H - 0.04) / 2))
p = M("reflector_post_blade", bm, white, parent=flex, smooth=True)
comp.solidify(p, 0.006, 0)
M("reflector_post_band", comp.box((Wd + 0.002, 0.016, 0.16), at=(0, 0.0, H - 0.2)), black, parent=flex)
M("reflector_post_lens", comp.box((0.075, 0.002, 0.12), at=(0, -0.009, H - 0.2)), lens, parent=flex)
M("reflector_post_lens_back", comp.box((0.075, 0.002, 0.06), at=(0, 0.009, H - 0.2)), lens_b, parent=flex)
M("reflector_post_dirt", comp.box((Wd - 0.006, 0.012, 0.16), at=(0, 0.0, 0.13)), dirt, parent=flex)
_lib.channel("flex", [(flex, "rotation_euler", 0, 0, math.radians(-28))])
_lib.done(col, root, "reflector_post", source="own geometry (a generic flexible delineator post)", license="ours", credit="",
          rig={"flex": "the blade bends back 28 degrees about its base (away from the camera, with the car's wash)",
               "glow": "in the scene: reflector_post_lens lights in the headlights"})
