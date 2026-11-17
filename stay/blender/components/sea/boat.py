# sea/boat: a 9 m inshore fishing boat, modelled by hand: a round-bilged hull lofted from 25 stations with red
# antifouling, a white boot stripe and a blue topside, a rubbing strake, a planked deck inside the bulwark, a
# wheelhouse forward with framed windows, a door, an overhanging roof carrying a radar bar, a searchlight, a horn and
# two whip aerials, a mast and derrick boom with its stays, a net drum and a pot hauler aft, stacked lobster pots and
# fish boxes, a coiled warp, tyre fenders, a life ring, an anchor on the bow, a bow rail, and navigation lights (their
# own materials). Its bow points -y (raea +z); its origin is amidships on the waterline. Rig: "drift" carries it 20 m
# ahead; "rock" rolls it 7 degrees; "pitch" lifts its bow 4 degrees; "radar" turns the radar bar once (it loops).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix
random.seed(2)
col, root = comp.fresh("boat")
drift = comp.pivot(col, root, "boat_drift", (0, 0, 0))
pitch = comp.pivot(col, root, "boat_pitch", (0, 0, 0), parent=drift)
roll = comp.pivot(col, root, "boat_rock", (0, 0, 0), parent=pitch)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent or roll, smooth=smooth)
antifoul = comp.mat("boat_antifoul", (0.33, 0.05, 0.04), rough=0.8)
stripe = comp.mat("boat_stripe", (0.85, 0.85, 0.82), rough=0.5)
blue = comp.mat("boat_hull", (0.03, 0.12, 0.25), rough=0.45)
white = comp.mat("boat_white", (0.82, 0.82, 0.78), rough=0.5)
deck_m = comp.ph_texture("boat_deck", "weathered_planks", tile=1.2, res="1k")
glass = comp.mat("boat_glass", (0.02, 0.03, 0.04), rough=0.08)
steel = comp.mat("boat_steel", (0.6, 0.61, 0.62), rough=0.35, metal=1.0)
rust = comp.mat("boat_gear", (0.2, 0.13, 0.09), rough=0.8, metal=0.4)
rubber = comp.mat("boat_rubber", (0.015, 0.015, 0.016), rough=0.85)
rope = comp.mat("boat_rope", (0.55, 0.45, 0.28), rough=0.95)
net = comp.mat("boat_net", (0.05, 0.25, 0.2), rough=0.95)
orange = comp.mat("boat_orange", (0.85, 0.25, 0.03), rough=0.6)
yellow = comp.mat("boat_yellow", (0.8, 0.6, 0.05), rough=0.6)
port = comp.mat("boat_light_port", (0.8, 0.05, 0.03), rough=0.3, emit=(1.0, 0.05, 0.02), strength=6000.0)
stbd = comp.mat("boat_light_starboard", (0.05, 0.7, 0.2), rough=0.3, emit=(0.05, 1.0, 0.3), strength=6000.0)
mast_l = comp.mat("boat_light_mast", (1.0, 1.0, 0.9), rough=0.3, emit=(1.0, 0.95, 0.8), strength=9000.0)
cabin_l = comp.mat("boat_light_cabin", (1.0, 0.75, 0.4), rough=0.3, emit=(1.0, 0.7, 0.35), strength=2500.0)

LOA, NS, NK = 9.0, 24, 9
def beam(s): return max(0.03, 1.55 * min(1.0, 0.84 + 0.5 * s) * (1 - max(0.0, (s - 0.42) / 0.58) ** 2.3))
def sheer(s): return 0.95 + 0.75 * s ** 2.2
def keel(s): return -0.8 * (1 - 0.85 * max(0.0, (s - 0.78) / 0.22) ** 2) * (0.75 + 0.25 * min(1, s / 0.25))
def ypos(s): return LOA / 2 - LOA * s - 0.5 * max(0.0, s - 0.75) ** 1.5 * 0   # bow at -y
def section(s, side):
    b, h, d = beam(s), sheer(s), keel(s)
    return [Vector((side * b * (u ** 0.5) * (0.92 + 0.08 * u), ypos(s), d + (h - d) * u ** 1.7)) for u in [k / (NK - 1) for k in range(NK)]]
hull = bmesh.new()
for side in (1, -1):
    rows = [[hull.verts.new(p) for p in section(i / NS, side)] for i in range(NS + 1)]
    for i in range(NS):
        for k in range(NK - 1):
            q = [rows[i][k], rows[i + 1][k], rows[i + 1][k + 1], rows[i][k + 1]]
            hull.faces.new(q if side > 0 else q[::-1])
    if side > 0:
        right = rows
    else:
        left = rows
hull.faces.new([v for v in right[0]] + [v for v in left[0]][::-1])   # the transom
bmesh.ops.remove_doubles(hull, verts=hull.verts, dist=0.002)
bmesh.ops.recalc_face_normals(hull, faces=hull.faces)
_lib.by_height(hull, [0.1, 0.19])
ho = comp.mesh(col, root, "boat_hull", hull, [antifoul, stripe, blue], parent=roll, smooth=True)
comp.solidify(ho, 0.05, offset=-1)
DECK = lambda s: sheer(s) - 0.38
dk = bmesh.new()
dr = [(dk.verts.new((-beam(i / NS) * 0.95, ypos(i / NS), DECK(i / NS))), dk.verts.new((beam(i / NS) * 0.95, ypos(i / NS), DECK(i / NS)))) for i in range(NS + 1)]
for i in range(NS):
    dk.faces.new([dr[i][0], dr[i][1], dr[i + 1][1], dr[i + 1][0]])
do = M("boat_deck", dk, deck_m)
comp.uv_box(do, 1.0)
# the rubbing strake and the capping rail along the sheer, the keel and the rudder
for side in (1, -1):
    M(f"boat_strake_{'sp'[side < 0]}", comp.tube([(side * (beam(i / NS) * 0.985 + 0.02), ypos(i / NS), sheer(i / NS) - 0.2) for i in range(NS + 1)], 0.035, res=3, sides=2), white, smooth=True)
    M(f"boat_capping_{'sp'[side < 0]}", comp.tube([(side * beam(i / NS), ypos(i / NS), sheer(i / NS) + 0.02) for i in range(NS + 1)], 0.04, res=3, sides=2), white, smooth=True)
M("boat_keel", comp.merge(comp.box((0.1, 6.6, 0.3), at=(0, 0.9, -0.82)), comp.box((0.05, 0.6, 0.8), at=(0, 4.2, -0.45))), antifoul)
M("boat_stem", comp.tube([(0, ypos(1.0) - 0.02, sheer(1.0) + 0.12), (0, ypos(0.97), 0.6), (0, ypos(0.9), -0.2), (0, ypos(0.8), -0.72)], 0.05, res=6, sides=2), white, smooth=True)

# the wheelhouse, forward of amidships
WY0, WY1, WW, WZ, WH = -2.3, -0.3, 1.75, DECK(0.6), 2.0
wh = M("boat_wheelhouse", comp.box((WW, WY1 - WY0, WH), at=(0, (WY0 + WY1) / 2, WZ + WH / 2)), white)
comp.bevel(wh, 0.03, 3)
roofo = M("boat_wheelhouse_roof", comp.box((WW + 0.3, WY1 - WY0 + 0.45, 0.07), at=(0, (WY0 + WY1) / 2 - 0.08, WZ + WH + 0.035)), white)
comp.bevel(roofo, 0.02, 2)
panes, frames = [], []
for x in (-0.55, 0.0, 0.55):                                   # three across the front
    panes.append(comp.box((0.46, 0.02, 0.62), at=(x, WY0 - 0.008, WZ + 1.45)))
    frames.append(comp.box((0.54, 0.014, 0.7), at=(x, WY0 - 0.003, WZ + 1.45)))
for side in (1, -1):
    for y in (-1.8, -1.15):
        panes.append(comp.box((0.02, 0.5, 0.58), at=(side * (WW / 2 + 0.008), y, WZ + 1.45)))
        frames.append(comp.box((0.014, 0.58, 0.66), at=(side * (WW / 2 + 0.003), y, WZ + 1.45)))
panes.append(comp.box((0.4, 0.02, 0.45), at=(-0.4, WY1 + 0.008, WZ + 1.5)))
M("boat_windows", comp.merge(*panes), glass)
M("boat_window_frames", comp.merge(*frames), blue)
M("boat_door", comp.merge(comp.box((0.62, 0.03, 1.7), at=(0.42, WY1 + 0.012, WZ + 0.9)), comp.box((0.3, 0.035, 0.35), at=(0.42, WY1 + 0.014, WZ + 1.4))), blue)
M("boat_door_handle", comp.cyl(0.015, 0.1, at=(0.2, WY1 + 0.03, WZ + 0.95), seg=8), steel)
M("boat_cabin_light", comp.box((0.26, 0.012, 0.3), at=(0.42, WY1 + 0.034, WZ + 1.4)), cabin_l)
# on the roof: the radar on its pedestal, a searchlight, a horn, two aerials, the navigation lights
RZ = WZ + WH + 0.07
M("boat_radar_pedestal", comp.merge(comp.cyl(0.09, 0.3, at=(0, -1.5, RZ), seg=12), comp.cyl(0.16, 0.08, at=(0, -1.5, RZ + 0.3), seg=16)), white, smooth=True)
radar = comp.pivot(col, root, "boat_radar", (0, -1.5, RZ + 0.4), parent=roll)
rb = M("boat_radar_bar", comp.box((1.3, 0.1, 0.09), at=(0, -1.5, RZ + 0.42)), white, parent=radar)
comp.bevel(rb, 0.02, 2)
M("boat_searchlight", comp.merge(comp.cyl(0.02, 0.2, at=(0.55, -2.2, RZ), seg=8), comp.cyl(0.11, 0.16, at=(0.55, -2.36, RZ + 0.26), seg=16, axis="Y")), steel, smooth=True)
M("boat_horn", comp.merge(comp.cyl(0.03, 0.3, at=(-0.55, -2.4, RZ + 0.1), seg=10, r2=0.08, axis="Y"), comp.box((0.06, 0.1, 0.1), at=(-0.55, -2.1, RZ + 0.05))), orange, smooth=True)
M("boat_aerials", comp.merge(comp.cyl(0.008, 2.6, at=(0.7, -0.6, RZ), seg=6, r2=0.003), comp.cyl(0.008, 1.9, at=(-0.7, -0.6, RZ), seg=6, r2=0.003), comp.cyl(0.03, 0.12, at=(0.7, -0.6, RZ), seg=8), comp.cyl(0.03, 0.12, at=(-0.7, -0.6, RZ), seg=8)), steel)
for side, m, nm in ((-1, port, "port"), (1, stbd, "starboard")):   # the bow points -y, so port (its left) is at +x... seen from astern; red to port
    x = -side * (WW / 2 + 0.1)
    M(f"boat_light_{nm}_box", comp.box((0.1, 0.22, 0.16), at=(x + (-side) * -0.02, -1.9, RZ + 0.1)), rubber)
    M(f"boat_light_{nm}", comp.box((0.03, 0.14, 0.09), at=(x - side * 0.05, -1.92, RZ + 0.1)), m)
# the mast and the derrick boom
MY, MH = 0.15, 4.6
M("boat_mast", comp.merge(comp.cyl(0.06, MH, at=(0, MY, WZ), seg=12, r2=0.04), comp.cyl(0.02, 1.3, at=(-0.65, MY, WZ + MH - 0.9), seg=8, axis="X"), comp.box((0.2, 0.2, 0.02), at=(0, MY, WZ + 0.01))), white, smooth=True)
M("boat_mast_light", _lib.sphere(0.06, at=(0, MY, WZ + MH + 0.05), u=10, v=6), mast_l, smooth=True)
BOOM_END = Vector((0, 3.3, WZ + 2.6))
M("boat_boom", comp.tube([(0, MY + 0.05, WZ + 1.2), tuple((Vector((0, MY, WZ + 1.2)) + BOOM_END) / 2), tuple(BOOM_END)], 0.04, res=2, sides=3), white, smooth=True)
stays = [comp.tube([(0, MY, WZ + MH - 0.1), tuple(BOOM_END)], 0.006, res=1, sides=1), comp.tube([(0, MY, WZ + MH - 0.2), (0, WY0 - 0.1, RZ + 0.02)], 0.006, res=1, sides=1)]
stays += [comp.tube([(sx * 0.65, MY, WZ + MH - 0.9), (sx * beam(0.45) * 0.96, 0.6, sheer(0.45))], 0.006, res=1, sides=1) for sx in (-1, 1)]
stays.append(comp.tube([tuple(BOOM_END), tuple(BOOM_END + Vector((0, -0.05, -0.5))), (0, 3.2, WZ + 1.0)], 0.008, res=4, sides=1))
M("boat_stays", comp.merge(*stays), steel)
M("boat_block", comp.merge(comp.box((0.06, 0.1, 0.16), at=tuple(BOOM_END + Vector((0, -0.05, -0.55)))), _lib.ring(0.05, 0.012, at=(0, 3.2, WZ + 0.95), n=10, axis="X")), rust)
# aft: the net drum, the pot hauler, pots, fish boxes, a coiled warp
AZ = DECK(0.12)
M("boat_net_drum", comp.merge(comp.cyl(0.42, 0.04, at=(-0.62, 3.6, AZ + 0.55), seg=24, axis="X"), comp.cyl(0.42, 0.04, at=(0.58, 3.6, AZ + 0.55), seg=24, axis="X"), comp.cyl(0.06, 1.5, at=(-0.75, 3.6, AZ + 0.55), seg=10, axis="X"),
                              comp.box((0.06, 0.5, 0.6), at=(-0.74, 3.6, AZ + 0.28)), comp.box((0.06, 0.5, 0.6), at=(0.74, 3.6, AZ + 0.28))), rust)
nd = _lib.lump(xf(comp.cyl(0.33, 1.14, at=(-0.57, 3.6, AZ + 0.55), seg=24, axis="X"), Matrix.Identity(4)), 0.05, 0.25, 3)
M("boat_net", nd, net, smooth=True)
M("boat_hauler", comp.merge(comp.cyl(0.05, 1.0, at=(1.05, 1.6, AZ), seg=10), comp.cyl(0.16, 0.08, at=(1.05, 1.56, AZ + 1.0), seg=16, axis="Y"), comp.tube([(1.05, 1.6, AZ + 1.0), (1.2, 1.6, AZ + 1.35), (1.45, 1.6, AZ + 1.3)], 0.03, res=4, sides=2)), steel, smooth=True)
pots = []
for (x, y, z, a) in [(-0.7, 1.6, 0, 4), (-0.72, 2.35, 0, -6), (-0.68, 1.95, 0.42, 10), (0.0, 2.6, 0, 80)]:
    frame = [comp.box((0.72, 0.03, 0.03), at=(0, sy * 0.26, sz)) for sy in (-1, 1) for sz in (0.02, 0.4)] + [comp.box((0.03, 0.52, 0.03), at=(sx * 0.35, 0, sz)) for sx in (-1, 0, 1) for sz in (0.02, 0.4)]
    frame += [comp.box((0.03, 0.03, 0.4), at=(sx * 0.35, sy * 0.26, 0.21)) for sx in (-1, 0, 1) for sy in (-1, 1)]
    p = comp.merge(*frame)
    xf(p, T(x, y, AZ + z) @ R(a, "Z"))
    pots.append(p)
    mesh_ = comp.box((0.68, 0.48, 0.36), at=(0, 0, 0.21))
    xf(mesh_, T(x, y, AZ + z) @ R(a, "Z"))
    pots.append(mesh_)
M("boat_pots", comp.merge(*pots[0::2]), yellow)
M("boat_pot_netting", comp.merge(*pots[1::2]), comp.mat("boat_pot_netting", (0.03, 0.12, 0.1), rough=0.95, alpha=0.55))
boxes = [(comp.box((0.75, 0.45, 0.28), at=(0.55, 2.4 + 0.02 * i, AZ + 0.14 + 0.29 * i)), m) for i, m in enumerate((orange, yellow, orange))]
for i, (b, m) in enumerate(boxes):
    o = M(f"boat_fish_box_{i + 1}", b, m)
    comp.bevel(o, 0.015, 2)
M("boat_warp", comp.merge(*[_lib.ring(0.26 - 0.015 * (k % 3), 0.02, at=(0.2, 1.0, AZ + 0.025 + 0.035 * k), n=14, sides=2) for k in range(5)]), rope, smooth=True)
# along the sides: tyre fenders on lanyards, a life ring on the wheelhouse
fend, lan = [], []
for side in (1, -1):
    for s in (0.25, 0.48, 0.66):
        x, y, z = side * (beam(s) + 0.1), ypos(s), sheer(s) - 0.55
        fend.append(_lib.ring(0.2, 0.075, at=(x, y, z), n=14, sides=3, axis="X"))
        lan.append(comp.tube([(side * beam(s), y, sheer(s) + 0.03), (x, y, z + 0.2)], 0.012, res=1, sides=2))
M("boat_fenders", comp.merge(*fend), rubber, smooth=True)
M("boat_lanyards", comp.merge(*lan), rope)
M("boat_life_ring", _lib.ring(0.26, 0.055, at=(WW / 2 + 0.07, -0.75, WZ + 1.2), n=18, sides=3, axis="X"), orange, smooth=True)
# the bow: a rail on stanchions, an anchor in its roller, a samson post and a cleat
bow_pts = [(side * beam(s) * 0.93, ypos(s), sheer(s) + 0.6) for side, ss in ((1, (0.72, 0.8, 0.88, 0.95)), (-1, (0.95, 0.88, 0.8, 0.72))) for s in ss]
bow_pts.insert(4, (0, ypos(0.995), sheer(1.0) + 0.6))
rail = [comp.tube(bow_pts, 0.02, res=5, sides=2)] + [comp.cyl(0.016, 0.6, at=(p[0], p[1], p[2] - 0.6), seg=6) for p in bow_pts]
M("boat_bow_rail", comp.merge(*rail), steel, smooth=True)
M("boat_samson_post", comp.merge(comp.box((0.12, 0.12, 0.5), at=(0, ypos(0.86), DECK(0.86) + 0.25)), comp.cyl(0.025, 0.36, at=(-0.18, ypos(0.86), DECK(0.86) + 0.38), seg=8, axis="X")), white)
anchor = comp.merge(comp.box((0.05, 0.75, 0.05), at=(0, ypos(0.95), sheer(0.95) + 0.08)), comp.tube([(-0.28, ypos(0.99) + 0.05, sheer(1.0) - 0.1), (0, ypos(1.0) - 0.12, sheer(1.0) + 0.05), (0.28, ypos(0.99) + 0.05, sheer(1.0) - 0.1)], 0.03, res=6, sides=2),
                    comp.cyl(0.02, 0.4, at=(-0.2, ypos(0.95) + 0.36, sheer(0.95) + 0.08), seg=6, axis="X"))
M("boat_anchor", anchor, rust)
# her number on the bow, both sides
for side in (1, -1):
    s = 0.8
    t = comp.text("SY 114", 0.24, depth=0.004)
    xf(t, R(-90 * side, "Z"))
    ang = math.degrees(math.atan2(beam(0.86) - beam(0.74), LOA * 0.12))
    xf(t, R(side * ang, "Z"))
    xf(t, T(side * (beam(s) + 0.012), ypos(s), sheer(s) - 0.5))
    M(f"boat_number_{'sp'[side < 0]}", t, stripe)
_lib.channel("drift", [(drift, "location", 1, 0.0, -20.0)])
_lib.channel("rock", [(roll, "rotation_euler", 1, 0.0, math.radians(7))])
_lib.channel("pitch", [(pitch, "rotation_euler", 0, 0.0, math.radians(-4))])
_lib.channel("radar", [(radar, "rotation_euler", 2, 0.0, 2 * math.pi)])
comp.export(col, root, "sea", "boat", made="blender/components/sea/boat.py", source="own geometry (a generic inshore fishing boat); deck: https://polyhaven.com/a/weathered_planks; number in Blender's built-in font", license="ours; texture CC0", credit="Poly Haven (weathered_planks)",
            rig={"drift": "the boat moves 20 m ahead (the way her bow points)", "rock": "she rolls 7 degrees about her keel line", "pitch": "her bow lifts 4 degrees", "radar": "the radar bar turns one whole turn; it loops",
                 "lights": "in the scene: the materials boat_light_port, boat_light_starboard, boat_light_mast and boat_light_cabin, a key per state"})
