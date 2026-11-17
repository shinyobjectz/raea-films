# sea/lighthouse: a masonry lighthouse for the headland, 27 m to its vane, modelled by hand: a stone plinth with steps
# and a door, a tapering white tower with two red bands and six windows up it, a corbelled gallery with a railing, a
# glazed lantern room with sixteen mullions, a Fresnel lens of stacked glowing rings on a pedestal, a copper dome with
# a ventilator ball and a lightning rod; beside it the keeper's cottage with a slate roof, a chimney and lit windows.
# Its origin is the tower's foot on the ground. Rig: "beam" turns the lens and its two beams one whole turn (it
# loops); the lens, the beams and the cottage's windows are their own materials (lighthouse_lens, lighthouse_beam,
# lighthouse_window) for the scene to light.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix

random.seed(4)
col, root = comp.fresh("lighthouse")
M = _lib.maker(col, root)
white = comp.ph_texture("lighthouse_wall", "white_plaster_rough_01", tile=4.0, res="1k")
red = comp.mat("lighthouse_band", (0.5, 0.05, 0.035), rough=0.7)
stone = comp.ph_texture("lighthouse_stone", "seaworn_sandstone_brick", tile=3.0, res="1k")
iron = comp.mat("lighthouse_iron", (0.03, 0.035, 0.035), rough=0.5, metal=0.7)
copper = comp.mat("lighthouse_dome", (0.16, 0.36, 0.3), rough=0.55, metal=0.3)
glass = comp.mat("lighthouse_glass", (0.6, 0.75, 0.8), rough=0.05, alpha=0.18)
lens = comp.mat("lighthouse_lens", (1.0, 0.9, 0.6), rough=0.2, emit=(1.0, 0.86, 0.55), strength=25000.0)
beam = comp.mat("lighthouse_beam", (1.0, 0.9, 0.65), rough=1.0, emit=(1.0, 0.88, 0.6), strength=8.0, alpha=0.13)
window = comp.mat("lighthouse_window", (1.0, 0.7, 0.3), rough=0.4, emit=(1.0, 0.62, 0.25), strength=6000.0)
dark = comp.mat("lighthouse_door", (0.06, 0.1, 0.08), rough=0.6)
slate = comp.ph_texture("lighthouse_slate", "roof_planks", tile=2.0, res="1k", grey=True, tint=(0.3, 0.32, 0.36))

TH = 18.0
def rad(z):
    return 3.3 - 1.15 * (z / TH) ** 0.85
pl = M("lighthouse_plinth", _lib.turn([(0, 0), (4.1, 0), (4.1, 0.9), (3.9, 1.1), (3.45, 1.2), (0, 1.2)], seg=48), stone, smooth=False)
comp.uv_box(pl, 1.0)
bands = [(1.2, 5.2, white), (5.2, 7.2, red), (7.2, 11.4, white), (11.4, 13.4, red), (13.4, TH, white)]
for i, (z0, z1, m) in enumerate(bands):
    n = max(2, int((z1 - z0) / 0.5))
    o = M(f"lighthouse_tower_{i + 1}", _lib.turn([(rad(z0 + (z1 - z0) * k / n), z0 + (z1 - z0) * k / n) for k in range(n + 1)], seg=48), m, smooth=True)
    if m is white:
        comp.uv_box(o, 1.0)
# windows up the tower, spiralling with the stair: a frame, a dark pane, a sill
wins = []
for k, (z, az) in enumerate([(3.6, 0), (6.2, 70), (8.8, 140), (11.0, 215), (14.0, 290), (16.2, 20)]):
    r = rad(z)
    w = comp.merge(comp.box((0.62, 0.3, 1.0), at=(0, -r - 0.02, z)), comp.box((0.8, 0.36, 0.1), at=(0, -r - 0.06, z - 0.55)), comp.box((0.74, 0.3, 0.14), at=(0, -r - 0.04, z + 0.57)))
    xf(w, R(az, "Z"))
    M(f"lighthouse_window_frame_{k + 1}", w, stone)
    p = comp.merge(comp.box((0.46, 0.04, 0.84), at=(0, -r - 0.16, z)))
    xf(p, R(az, "Z"))
    wins.append(p)
M("lighthouse_tower_panes", comp.merge(*wins), dark)
# the door and its steps
M("lighthouse_door_frame", comp.merge(comp.box((1.5, 0.6, 2.5), at=(0, -3.3, 2.45)), comp.cyl(0.75, 0.6, at=(0, -3.6, 3.7), seg=24, axis="Y")), stone)
M("lighthouse_door", comp.merge(comp.box((1.0, 0.08, 2.1), at=(0, -3.62, 2.25)), comp.cyl(0.5, 0.08, at=(0, -3.66, 3.3), seg=24, axis="Y")), dark)
M("lighthouse_door_fittings", comp.merge(comp.cyl(0.04, 0.05, at=(0.36, -3.7, 2.2), seg=10, axis="Y"), comp.box((0.9, 0.02, 0.06), at=(0, -3.67, 1.6)), comp.box((0.9, 0.02, 0.06), at=(0, -3.67, 2.9))), iron)
M("lighthouse_steps", comp.merge(*[comp.box((2.0 + 0.5 * i, 0.4, 0.2), at=(0, -4.2 - 0.38 * i, 1.1 - 0.2 * i - 0.1)) for i in range(6)]), stone)
# the gallery: corbels, the deck, the railing
G = TH
M("lighthouse_corbels", comp.merge(*[xf(comp.taper((0, -rad(G - 0.9), G), (0, -3.25, G), 0.22, 0.22, 0.9, 0.2), R(a, "Z")) for a in range(0, 360, 20)]), white)
M("lighthouse_gallery", _lib.turn([(0, G), (3.4, G), (3.45, G + 0.08), (3.45, G + 0.22), (0, G + 0.22)], seg=48), stone)
rail = [comp.cyl(0.025, 1.1, at=(3.3 * math.cos(math.radians(a)), 3.3 * math.sin(math.radians(a)), G + 0.22), seg=6) for a in range(0, 360, 15)]
rail += [_lib.ring(3.3, 0.028, at=(0, 0, G + 0.22 + h), n=36) for h in (0.4, 0.75, 1.1)]
M("lighthouse_railing", comp.merge(*rail), iron, smooth=True)
# the lantern room
L0 = G + 0.22
M("lighthouse_lantern_base", _lib.turn([(0, L0), (2.2, L0), (2.2, L0 + 1.0), (2.05, L0 + 1.1), (0, L0 + 1.1)], seg=32), white)
M("lighthouse_lantern_glass", _lib.turn([(2.0, L0 + 1.1), (2.0, L0 + 3.6)], seg=32), glass, smooth=True)
mull = [comp.box((0.06, 0.06, 2.5), at=(2.0 * math.cos(math.radians(a)), 2.0 * math.sin(math.radians(a)), L0 + 2.35)) for a in [i * 22.5 for i in range(16)]]
mull += [_lib.ring(2.0, 0.04, at=(0, 0, L0 + h), n=32) for h in (1.12, 2.35, 3.6)]
M("lighthouse_mullions", comp.merge(*mull), iron)
M("lighthouse_dome", _lib.turn([(2.3, L0 + 3.55), (2.3, L0 + 3.75), (2.0, L0 + 4.2), (1.4, L0 + 4.8), (0.6, L0 + 5.2), (0.3, L0 + 5.3), (0.3, L0 + 5.6), (0.0, L0 + 5.6)], seg=32), copper, smooth=True)
M("lighthouse_vent", comp.merge(_lib.sphere(0.4, at=(0, 0, L0 + 5.85), u=16, v=10), comp.cyl(0.03, 1.8, at=(0, 0, L0 + 6.2), seg=6), comp.box((0.9, 0.02, 0.3), at=(0.3, 0, L0 + 7.3)), comp.cyl(0.02, 1.0, at=(-0.5, 0, L0 + 7.0), seg=6, axis="X")), iron, smooth=True)
# the lens: a pedestal, and on a turntable a barrel of stacked prisms with two bullseyes; two beams out of them
M("lighthouse_pedestal", _lib.turn([(0, L0 + 1.1), (0.7, L0 + 1.1), (0.5, L0 + 1.3), (0.35, L0 + 1.7), (0.6, L0 + 1.8), (0, L0 + 1.8)], seg=20), iron, smooth=True)
turn_p = comp.pivot(col, root, "lighthouse_turn", (0, 0, L0 + 1.8))
prof = []
for i in range(9):
    z = L0 + 1.8 + i * 0.16
    r = 0.55 + 0.28 * math.sin(math.pi * (i + 0.5) / 9)
    prof += [(r - 0.07, z), (r, z + 0.08), (r - 0.07, z + 0.16)]
M("lighthouse_lens", comp.merge(_lib.turn(prof, seg=28), comp.cyl(0.4, 0.12, at=(0, -0.92, L0 + 2.5), seg=24, axis="Y"), comp.cyl(0.4, 0.12, at=(0, 0.8, L0 + 2.5), seg=24, axis="Y")), lens, parent=turn_p, smooth=True)
M("lighthouse_lens_frame", comp.merge(*[comp.box((0.04, 0.04, 1.5), at=(0.86 * math.cos(math.radians(a)), 0.86 * math.sin(math.radians(a)), L0 + 2.55)) for a in (45, 135, 225, 315)], _lib.ring(0.86, 0.03, at=(0, 0, L0 + 1.82), n=24), _lib.ring(0.86, 0.03, at=(0, 0, L0 + 3.3), n=24)), comp.mat("lighthouse_brass", (0.7, 0.5, 0.2), rough=0.3, metal=1.0), parent=turn_p)
for s, nm in ((-1, "a"), (1, "b")):
    b = comp.cyl(0.4, 110.0, at=(0, 0, 0), seg=20, r2=3.6)
    for f in [f for f in b.faces if len(f.verts) > 4]:
        b.faces.remove(f)
    xf(b, R(90 * s, "X"))
    xf(b, T(0, -s * 1.0, L0 + 2.5))
    M(f"lighthouse_beam_{nm}", b, beam, parent=turn_p, smooth=True)
# the keeper's cottage, 7 x 5 m, to the tower's right
CX, CY = 8.5, 1.0
walls = M("lighthouse_cottage", comp.box((7.0, 5.0, 2.7), at=(CX, CY, 1.35)), white)
comp.uv_box(walls, 1.0)
gable = bmesh.new()
vs = [gable.verts.new(p) for p in [(CX - 3.5, CY - 2.5, 2.7), (CX + 3.5, CY - 2.5, 2.7), (CX + 3.5, CY + 2.5, 2.7), (CX - 3.5, CY + 2.5, 2.7), (CX - 3.5, CY, 4.6), (CX + 3.5, CY, 4.6)]]
for q in [(0, 3, 4), (1, 5, 2)]:
    gable.faces.new([vs[i] for i in q])
g = M("lighthouse_cottage_gables", gable, white)
comp.uv_box(g, 1.0)
roof = bmesh.new()
e = 0.35
vs = [roof.verts.new(p) for p in [(CX - 3.5 - e, CY - 2.5 - e, 2.7 - 0.25), (CX + 3.5 + e, CY - 2.5 - e, 2.7 - 0.25), (CX + 3.5 + e, CY, 4.72), (CX - 3.5 - e, CY, 4.72), (CX - 3.5 - e, CY + 2.5 + e, 2.7 - 0.25), (CX + 3.5 + e, CY + 2.5 + e, 2.7 - 0.25)]]
roof.faces.new([vs[0], vs[1], vs[2], vs[3]]); roof.faces.new([vs[3], vs[2], vs[5], vs[4]])
ro = M("lighthouse_cottage_roof", roof, slate)
comp.solidify(ro, 0.1); comp.uv_box(ro, 1.0)
M("lighthouse_cottage_chimney", comp.merge(comp.box((0.7, 0.7, 1.6), at=(CX + 2.4, CY, 4.9)), comp.box((0.85, 0.85, 0.12), at=(CX + 2.4, CY, 5.7)), comp.cyl(0.14, 0.4, at=(CX + 2.25, CY, 5.76), seg=10), comp.cyl(0.14, 0.4, at=(CX + 2.6, CY, 5.76), seg=10)), stone)
M("lighthouse_cottage_windows", comp.merge(*[comp.box((0.9, 0.04, 1.1), at=(CX + x, CY - 2.52, 1.55)) for x in (-2.2, 2.2)], comp.box((0.04, 0.9, 1.1), at=(CX + 3.52, CY, 1.55))), window)
M("lighthouse_cottage_frames", comp.merge(*[comp.box((w, 0.07, h), at=(CX + x + dx, CY - 2.54, 1.55 + dz)) for x in (-2.2, 2.2) for (w, h, dx, dz) in ((1.02, 0.07, 0, 0.55), (1.02, 0.07, 0, -0.55), (0.07, 1.1, -0.48, 0), (0.07, 1.1, 0.48, 0), (0.04, 1.1, 0, 0), (0.9, 0.04, 0, 0))],
                                             comp.box((1.0, 0.08, 2.05), at=(CX, CY - 2.53, 1.02))), dark)
M("lighthouse_cottage_step", comp.box((1.4, 0.5, 0.15), at=(CX, CY - 2.8, 0.075)), stone)
# a low wall round the yard
wall = [xf(comp.box((1.0, 0.4, 0.9), at=(0, -9.0, 0.45)), R(a, "Z")) for a in range(-150, 151, 6) if abs(a) > 9]
wo = M("lighthouse_yard_wall", comp.merge(*wall), stone)
comp.uv_box(wo, 1.0)
bpy.context.view_layer.update()
_lib.uv_missing(col)
_lib.channel("beam", [(turn_p, "rotation_euler", 2, 0.0, 2 * math.pi)])
comp.export(col, root, "sea", "lighthouse", made="blender/components/sea/lighthouse.py", source="own geometry; textures: https://polyhaven.com/a/white_plaster_rough_01, /seaworn_sandstone_brick, /roof_planks", license="ours; textures CC0", credit="Poly Haven (white_plaster_rough_01, seaworn_sandstone_brick, roof_planks)",
            rig={"beam": "the lens and its two 110 m beams turn one whole turn about the tower's axis (anticlockwise from above); it loops",
                 "light": "in the scene: the materials lighthouse_lens (25,000, traced), lighthouse_beam (blended, drawn raster: 8) and lighthouse_window (6,000), a key per state"})
