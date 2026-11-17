# vinyl/speaker: a two-way monitor speaker on its stand, modelled by hand: a walnut cabinet 0.27 x 0.3 x 0.46 m with
# a black baffle, a 6.5-inch woofer (rubber surround, paper cone, dust cap, a cast basket ring on six screws), a dome
# tweeter in its faceplate, a flared bass port, a badge of our own, on a steel stand 0.62 m high with a spiked base.
# Rig: "thump" pushes the woofer's cone and dust cap 7 mm out (a bass note).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("speaker")
wood = comp.ph_texture("speaker_cabinet", "walnut_veneer", tile=0.6, res="1k", tint=(0.5, 0.36, 0.27))
baffle = comp.mat("speaker_baffle", (0.02, 0.02, 0.022), rough=0.7)
rubber = comp.mat("speaker_surround", (0.012, 0.012, 0.012), rough=0.55)
cone_m = comp.mat("speaker_cone", (0.07, 0.07, 0.075), rough=0.8)
metal = comp.mat("speaker_metal", (0.5, 0.5, 0.52), rough=0.3, metal=1.0)
dome = comp.mat("speaker_tweeter", (0.75, 0.72, 0.6), rough=0.25, metal=1.0)
steel = comp.mat("speaker_stand", (0.03, 0.03, 0.033), rough=0.4, metal=0.6)
W, D, H, SH = 0.27, 0.3, 0.46, 0.62
st = M("speaker_stand", comp.merge(comp.box((0.3, 0.34, 0.012), at=(0, 0, 0.026)), comp.box((0.07, 0.09, SH - 0.044), at=(0, 0.03, 0.032 + (SH - 0.044) / 2)), comp.box((0.2, 0.22, 0.008), at=(0, 0, SH - 0.004)),
                                    *[comp.cyl(0.008, 0.02, at=(sx * 0.13, sy * 0.15, 0.0), seg=10, r2=0.002) for sx in (-1, 1) for sy in (-1, 1)]), steel)
for o in [st]:
    comp.bevel(o, 0.002, 2)
cab = M("speaker_cabinet", comp.box((W, D, H), at=(0, 0, SH + H / 2)), wood)
comp.uv_box(cab, 1.0)
comp.bevel(cab, 0.006, 3)
FY = -D / 2
bf = M("speaker_baffle", comp.box((W - 0.024, 0.006, H - 0.024), at=(0, FY - 0.003, SH + H / 2)), baffle)
comp.bevel(bf, 0.002, 2)
FY -= 0.006
def face(bm, x, z):
    return xf(bm, T(x, FY, z) @ R(90, "X"))
WZ = SH + 0.17
shade(M("speaker_basket", face(comp.merge(turn([(0.084, 0), (0.1, 0), (0.1, 0.004), (0.084, 0.006)], seg=48), *[comp.cyl(0.004, 0.006, at=(0.092 * math.cos(a), 0.092 * math.sin(a), 0.002), seg=8) for a in [math.pi / 6 + k * math.pi / 3 for k in range(6)]]), 0, WZ), metal))
shade(M("speaker_surround", face(torus(0.076, 0.009, 48, 10, at=(0, 0, 0.002)), 0, WZ), rubber), 80)
cone = comp.pivot(col, root, "speaker_woofer", (0, FY, WZ))
shade(M("speaker_cone", face(turn([(0.068, 0.002), (0.05, -0.012), (0.03, -0.024), (0.022, -0.028)], seg=48), 0, WZ), cone_m, parent=cone), 80)
shade(M("speaker_dust_cap", face(sphere(0.03, at=(0, 0, -0.045), u=28, v=14, scale=(1, 1, 0.72)), 0, WZ), cone_m, parent=cone), 80)
TZ = SH + 0.36
shade(M("speaker_tweeter_plate", face(turn([(0.016, 0.001), (0.05, 0.001), (0.05, 0.004), (0.046, 0.005), (0.02, 0.003), (0.016, 0.001)], seg=40), 0, TZ), metal))
shade(M("speaker_tweeter", face(sphere(0.0155, at=(0, 0, -0.002), u=24, v=12, scale=(1, 1, 0.75)), 0, TZ), dome), 80)
shade(M("speaker_port", face(turn([(0.03, 0.001), (0.024, -0.004), (0.021, -0.03), (0.0, -0.03)], seg=32), 0.075, SH + 0.045), baffle), 60)
M("speaker_badge", comp.box((0.05, 0.002, 0.012), at=(-0.06, FY - 0.001, SH + 0.035)), dome)
channel("thump", [(cone, "location", 1, cone.location.y, cone.location.y - 0.007)])
done(col, root, "speaker", "own geometry (a generic two-way monitor on a stand; veneer https://polyhaven.com/a/walnut_veneer, CC0)",
     rig={"thump": "the woofer's cone and dust cap 7 mm out toward the front"})
