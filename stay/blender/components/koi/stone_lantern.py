# koi/stone-lantern: a tachi-gata stone lantern, 1.78 m, modelled by hand in its six classical parts: a hexagonal
# base on a stepped plinth, a round post with a belt, a flaring hexagonal platform, the fire box (six corner posts,
# open windows front and back, a full moon and a crescent cut in the side panels, a lit core inside), a hexagonal
# roof with a curved slope and upturned eaves with a scroll at each corner, and an onion jewel on top. Lichened
# granite (Poly Haven's lichen_rock, CC0). Stands on the ground by the pond. Rig: its light is the scene's (the
# material lantern_glow and a small light in the fire box); "lean" is a clip that settles the whole lantern 3
# degrees off plumb (old lanterns lean).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("stone_lantern")
rock = comp.ph_texture("lantern_stone", "lichen_rock", tile=0.9, res="1k", tint=(0.86, 0.86, 0.82))
glow = comp.mat("lantern_glow", (1.0, 0.72, 0.36), rough=0.6, emit=(1.0, 0.62, 0.25), strength=3.0)
lean = comp.pivot(col, root, "stone_lantern_lean", (0, 0, 0))
def P(name, bm, bev=0.006, smooth=False):
    o = M(f"stone_lantern_{name}", bm, rock, parent=lean, smooth=smooth)
    comp.uv_box(o, 1.0)
    if bev:
        comp.bevel(o, bev, 2)
    return o
hexa = lambda r, h, z, r2=None: xf(comp.cyl(r, h, at=(0, 0, z), seg=6, r2=r2), R(0, "Z"))
P("base", comp.merge(hexa(0.33, 0.1, 0.0), hexa(0.27, 0.035, 0.1, r2=0.24), hexa(0.2, 0.03, 0.135, r2=0.14)))
post = P("post", turn([(0.0, 0.16), (0.105, 0.16), (0.095, 0.2), (0.092, 0.5), (0.112, 0.52), (0.112, 0.58), (0.092, 0.6), (0.095, 0.9), (0.108, 0.95), (0, 0.95)], seg=28), bev=0, smooth=True)
shade(post)
P("platform", comp.merge(hexa(0.13, 0.1, 0.95, r2=0.3), hexa(0.32, 0.035, 1.05)))
Z0, HB, RB = 1.085, 0.3, 0.2
AP = RB * math.cos(math.pi / 6)
box_parts = [hexa(RB, 0.025, Z0), hexa(RB, 0.025, Z0 + HB - 0.025)]
for k in range(6):
    a = math.radians(60 * k)
    box_parts.append(comp.box((0.034, 0.034, HB), at=(RB * 0.93 * math.cos(a), RB * 0.93 * math.sin(a), Z0 + HB / 2)))
marks = []
for k in range(6):
    a = math.radians(30 + 60 * k)
    m = Matrix.Rotation(a - math.pi / 2, 4, "Z")                     # a panel built facing +y, turned to face a
    if k in (1, 4):                                                # the faces toward +y and -y: open windows
        fr = comp.merge(comp.box((0.2, 0.02, 0.03), at=(0, AP - 0.012, Z0 + 0.04)), comp.box((0.2, 0.02, 0.03), at=(0, AP - 0.012, Z0 + HB - 0.04)))
        box_parts.append(xf(fr, m))
    else:
        box_parts.append(xf(comp.box((0.2, 0.02, HB - 0.04), at=(0, AP - 0.012, Z0 + HB / 2)), m))
        if k in (0, 3):                                            # a full moon
            marks.append(xf(comp.cyl(0.055, 0.003, at=(0, AP - 0.004, Z0 + HB / 2), seg=28, axis="Y"), m))
        else:                                                      # a crescent: a disc with a stone disc over part of it
            marks.append(xf(comp.cyl(0.055, 0.003, at=(0, AP - 0.004, Z0 + HB / 2), seg=28, axis="Y"), m))
            box_parts.append(xf(comp.cyl(0.05, 0.004, at=(0.022, AP - 0.004, Z0 + HB / 2 + 0.012), seg=28, axis="Y"), m))
P("fire_box", comp.merge(*box_parts), bev=0.003)
M("stone_lantern_cuts", comp.merge(*marks), glow, parent=lean)
M("stone_lantern_core", hexa(0.13, HB - 0.06, Z0 + 0.03), glow, parent=lean)
ZR = Z0 + HB
roof = turn([(0.0, 0.2), (0.07, 0.2), (0.11, 0.14), (0.24, 0.075), (0.4, 0.04), (0.45, 0.06), (0.46, 0.02), (0.36, 0.0), (0, 0.0)], ZR, seg=6)
scrolls = [sphere(0.04, at=(0.44 * math.cos(math.radians(60 * k)), 0.44 * math.sin(math.radians(60 * k)), ZR + 0.07), u=12, v=8, scale=(1, 1, 0.8)) for k in range(6)]
P("roof", comp.merge(roof, *scrolls), bev=0.004)
jw = P("jewel", turn([(0.0, 0.2), (0.055, 0.2), (0.065, 0.22), (0.04, 0.245), (0.075, 0.3), (0.07, 0.345), (0.035, 0.385), (0.0, 0.4)], ZR, seg=24), bev=0, smooth=True)
shade(jw, 50)
channel("lean", [(lean, "rotation_euler", 1, 0, math.radians(3))])
done(col, root, "stone_lantern", "own geometry (a generic tachi-gata lantern); https://polyhaven.com/a/lichen_rock (CC0)", license="CC0", credit="Poly Haven (texture)",
     rig={"lean": "the whole lantern 3 degrees off plumb about its foot", "glow": "in the scene: the material lantern_glow (the lit fire box) and a small warm light inside it"})
