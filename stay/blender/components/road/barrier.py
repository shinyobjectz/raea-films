# road/barrier: 7.6 m of W-beam guardrail for the bend, modelled by hand: two galvanised corrugated rail panels lapped
# and spliced with eight bolts, on five weathered timber posts with timber blockouts 1.9 m apart, the rail's top
# 0.73 m up, a button-head bolt through each post, amber reflector tabs on alternate posts, grime at the feet.
# Runs along x, its face toward -y (the road). Lengths butt end to end. Rig: "glow": the reflector tabs
# (barrier_reflector) are the scene's to light.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

col, root = comp.fresh("barrier")
M = _lib.meshers(col, root)
galv = comp.mat("barrier_galvanised", (0.5, 0.52, 0.54), rough=0.42, metal=0.55)
bolt_m = comp.mat("barrier_bolt", (0.34, 0.35, 0.36), rough=0.5, metal=0.6)
wood = comp.ph_texture("barrier_timber", "weathered_brown_planks", tile=0.9, res="1k", tint=(0.55, 0.5, 0.45))
refl = comp.mat("barrier_reflector", (0.95, 0.5, 0.05), rough=0.15, emit=(1.0, 0.5, 0.08), strength=1.5)
LEN, SP, TOPZ = 7.62, 1.905, 0.73
# the W profile (depth y, height z), 31 cm tall and 8 cm deep, 2.7 mm steel
PROF = [(0.0, 0.155), (-0.012, 0.15), (-0.03, 0.135), (-0.07, 0.1), (-0.082, 0.085), (-0.082, 0.07), (-0.07, 0.055), (-0.02, 0.012), (-0.012, 0.0),
        (-0.02, -0.012), (-0.07, -0.055), (-0.082, -0.07), (-0.082, -0.085), (-0.07, -0.1), (-0.03, -0.135), (-0.012, -0.15), (0.0, -0.155)]
def rail(x0, x1, y_off, name):
    bm = bmesh.new()
    rows = []
    for x in (x0, x1):
        rows.append([bm.verts.new((x, y + y_off, TOPZ - 0.155 + z)) for y, z in PROF])
    for i in range(len(PROF) - 1):
        bm.faces.new((rows[0][i], rows[1][i], rows[1][i + 1], rows[0][i + 1]))
    o = M(name, bm, galv, smooth=True)
    comp.solidify(o, 0.0027, 0)
    return o
YR = -0.2 - 0.2    # the rail's back sits on the blockout's face
rail(-LEN / 2, 0.16, YR, "barrier_rail_a")
rail(-0.16, LEN / 2, YR - 0.003, "barrier_rail_b")
bolts = []
for dx in (-0.11, -0.04, 0.04, 0.11):
    for dz in (0.085 - 0.155 + 0.155, -0.0775):
        bolts.append(comp.cyl(0.013, 0.012, at=(dx, YR - 0.03, TOPZ - 0.155 + (0.0775 if dz > 0 else -0.0775)), seg=12, axis="Y"))
posts, blocks, tabs = [], [], []
for k in range(5):
    x = -LEN / 2 + 0.0 + k * SP
    x = max(-LEN / 2 + 0.1, min(LEN / 2 - 0.1, x))
    p = comp.box((0.15, 0.2, TOPZ + 0.05 + 0.25), at=(x, -0.1, (TOPZ + 0.05) / 2 - 0.125))
    posts.append(p)
    blocks.append(comp.box((0.15, 0.2, 0.36), at=(x, -0.3, TOPZ - 0.155)))
    bolts.append(comp.cyl(0.02, 0.012, at=(x, YR - 0.02, TOPZ - 0.155), seg=14, axis="Y"))
    bolts.append(comp.cyl(0.008, 0.46, at=(x, YR - 0.02, TOPZ - 0.155), seg=8, axis="Y"))
    bolts.append(comp.cyl(0.016, 0.014, at=(x, 0.0, TOPZ - 0.155), seg=6, axis="Y"))
    if k % 2 == 0:
        tabs.append(comp.box((0.075, 0.004, 0.1), at=(x, -0.3, TOPZ + 0.085)))
po = M("barrier_posts", comp.merge(*posts), wood)
comp.bevel(po, 0.008, 2)
comp.uv_box(po, 1.0)
bo = M("barrier_blockouts", comp.merge(*blocks), wood)
comp.bevel(bo, 0.006, 2)
comp.uv_box(bo, 1.0)
M("barrier_bolts", comp.merge(*bolts), bolt_m)
M("barrier_reflector_brackets", comp.merge(*[comp.box((0.08, 0.003, 0.14), at=(-LEN / 2 + 0.1 * (k == 0) - 0.1 * (k == 4) + k * SP, -0.297, TOPZ + 0.06)) for k in (0, 2, 4)]), galv)
M("barrier_reflectors", comp.merge(*tabs), refl)
_lib.done(col, root, "barrier", source="own geometry (a W-beam guardrail on timber posts); timber: https://polyhaven.com/a/weathered_brown_planks", license="ours; texture CC0", credit="Poly Haven (weathered_brown_planks)",
          rig={"glow": "in the scene: the amber tabs (barrier_reflector) light in the headlights"},
          notes="Runs along x, 7.62 m, posts at its back (y 0 to -0.2), rail face at y -0.48. Stand it on the shoulder with its face to the road.")
