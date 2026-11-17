# laundromat/storefront: the strip mall's shopfront seen from inside, 6.4 m long and 3 m high, its room face at y 0
# and the car park behind it (+y), modelled by hand: an aluminium frame of mullions, a transom and a head over a low
# tiled kick wall with a sill the chairs stand under, four bays of glass, vinyl letters on the outside of the glass
# (so they read backwards from in here), a neon OPEN sign on two chains inside the glass, and at the near end a glass
# door in aluminium stiles with a push bar, a pull handle, a closer and an hours decal.
# Rig: "door" swings the door 85 degrees out to the car park on its pivot at the near jamb. The neon's tubes are
# their own materials (open_neon_red, open_neon_blue): their glow is the scene's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, disc, rbox, label, T, R, S, xf

col, root = comp.fresh("storefront")
M = _lib.maker(col, root)
m = _lib.wall_mats()
alu = comp.mat("storefront_aluminium", (0.66, 0.67, 0.68), rough=0.38, metal=0.6)
glass = _lib.glass("storefront_glass", alpha=0.1)
vinyl = comp.mat("storefront_vinyl", (0.95, 0.95, 0.92), rough=0.5)
vinyl_r = comp.mat("storefront_vinyl_red", (0.78, 0.1, 0.08), rough=0.5)
black = comp.mat("storefront_black", (0.02, 0.02, 0.022), rough=0.5)
neon_r = comp.mat("open_neon_red", (1.0, 0.25, 0.2), rough=0.3, emit=(1.0, 0.12, 0.08), strength=6.0)
neon_b = comp.mat("open_neon_blue", (0.3, 0.5, 1.0), rough=0.3, emit=(0.15, 0.35, 1.0), strength=6.0)
L, Hh, TH = 6.4, 3.0, 0.11
KICK, TRANSOM = 0.42, 2.25
DOOR_X0, DOOR_W = -L / 2 + 0.06, 0.98
bays = [DOOR_X0 + DOOR_W + 0.05]
n = 3
bw = (L / 2 - 0.05 - bays[0]) / n
bays = [bays[0] + i * bw for i in range(n + 1)]

# the frame: jambs and mullions, the head, the transom, the sill
posts = [comp.box((0.06, TH, Hh), at=(x, TH / 2, Hh / 2)) for x in [-L / 2 + 0.03, DOOR_X0 + DOOR_W + 0.025, L / 2 - 0.03] + [b for b in bays[1:-1]]]
rails = [comp.box((L, TH, 0.07), at=(0, TH / 2, Hh - 0.035)), comp.box((L, TH, 0.06), at=(0, TH / 2, TRANSOM)),
         comp.box((bays[-1] - bays[0] + 0.05, TH, 0.05), at=((bays[0] + bays[-1]) / 2, TH / 2, KICK + 0.025))]
fr = M("storefront_frame", comp.merge(*posts, *rails), alu)
comp.bevel(fr, 0.003, 2)
# the kick wall under the windows, tiled inside, and its sill
kw = M("storefront_kick_wall", comp.box((bays[-1] - bays[0] + 0.05, 0.16, KICK), at=((bays[0] + bays[-1]) / 2, 0.08, KICK / 2)), m["tile"])
comp.uv_box(kw, 1.0)
M("storefront_sill", rbox((bays[-1] - bays[0] + 0.05, 0.2, 0.03), at=((bays[0] + bays[-1]) / 2, 0.06, KICK + 0.005), r=0.008), m["white"])
M("storefront_cove_base", comp.box((bays[-1] - bays[0] + 0.05, 0.008, 0.1), at=((bays[0] + bays[-1]) / 2, -0.004, 0.05)), m["base"])
# the glass: a pane a bay under the transom, a light over it, one over the door
panes = [comp.box((bays[i + 1] - bays[i] - 0.05, 0.008, TRANSOM - KICK - 0.07), at=((bays[i] + bays[i + 1]) / 2, 0.055, (TRANSOM + KICK + 0.02) / 2)) for i in range(n)]
panes += [comp.box((bays[i + 1] - bays[i] - 0.05, 0.008, Hh - TRANSOM - 0.1), at=((bays[i] + bays[i + 1]) / 2, 0.055, (Hh + TRANSOM - 0.04) / 2)) for i in range(n)]
panes += [comp.box((DOOR_W - 0.02, 0.008, Hh - TRANSOM - 0.1), at=(DOOR_X0 + DOOR_W / 2, 0.055, (Hh + TRANSOM - 0.04) / 2))]
M("storefront_glass", comp.merge(*panes), glass)
# vinyl letters on the outside of the glass: a word a pane, backwards from inside
words = []
for i, (big, small) in enumerate((("24 HRS", "OPEN ALL NIGHT"), ("LAUNDRY", "WASH  -  DRY  -  FOLD"), ("COIN", "SELF SERVICE"))):
    cx = (bays[i] + bays[i + 1]) / 2
    words.append(label(big, 0.3, (cx, 0.0596, 1.62), yaw=180, depth=0.0006))
    words.append(label(small, 0.085, (cx, 0.0596, 1.3), yaw=180, depth=0.0006))
M("storefront_letters", comp.merge(*words), vinyl)
M("storefront_stripe", comp.merge(*[comp.box((bays[i + 1] - bays[i] - 0.06, 0.0006, 0.05), at=((bays[i] + bays[i + 1]) / 2, 0.0596, 0.62)) for i in range(n)]), vinyl_r)

# the neon OPEN sign, hung inside the middle pane on two chains
NX, NZ = (bays[1] + bays[2]) / 2 - 0.25, 2.0
M("storefront_neon_back", comp.merge(rbox((0.66, 0.012, 0.34), at=(NX, 0.03, NZ), r=0.004), *[comp.cyl(0.0025, TRANSOM - 0.03 - NZ - 0.17, at=(NX + s * 0.27, 0.03, NZ + 0.17), seg=6) for s in (-1, 1)],
                                    rbox((0.05, 0.03, 0.07), at=(NX + 0.26, 0.012, NZ - 0.115), r=0.004), comp.tube([(NX + 0.26, 0.012, NZ - 0.15), (NX + 0.27, 0.02, NZ - 0.6), (NX + 0.5, 0.03, KICK + 0.07), (NX + 0.7, 0.0, KICK + 0.05)], 0.003, res=8)), black)
M("storefront_neon_open", label("OPEN", 0.17, (NX, 0.016, NZ), depth=0.014), neon_r)
bx, bz, rr = 0.3, 0.14, 0.035
loop = []
for cx_, cz_, a0 in ((bx - rr, bz - rr, 0), (-bx + rr, bz - rr, 90), (-bx + rr, -bz + rr, 180), (bx - rr, -bz + rr, 270)):
    for k in range(5):
        a = math.radians(a0 + k * 22.5)
        loop.append((NX + cx_ + rr * math.cos(a), 0.016, NZ + cz_ + rr * math.sin(a)))
loop.append(loop[0])
from mathutils import Vector
tubes = []
for a, b in zip(loop[:-1], loop[1:]):
    a, b = Vector(a), Vector(b)
    c = comp.cyl(0.0065, (b - a).length + 0.004, seg=8)
    q = Vector((0, 0, 1)).rotation_difference((b - a).normalized()).to_matrix().to_4x4()
    xf(c, q)
    xf(c, T(*a))
    tubes.append(c)
M("storefront_neon_border", comp.merge(*tubes), neon_b, smooth=True)

# the door, on its pivot at the near jamb, swinging out
hp = comp.pivot(col, root, "storefront_door", (DOOR_X0 + 0.03, 0.055, 0))
DH = TRANSOM - 0.035
dx0, dx1 = DOOR_X0 + 0.005, DOOR_X0 + DOOR_W - 0.005
stiles = comp.merge(comp.box((0.09, 0.045, DH - 0.01), at=(dx0 + 0.045, 0.055, DH / 2)), comp.box((0.09, 0.045, DH - 0.01), at=(dx1 - 0.045, 0.055, DH / 2)),
                    comp.box((dx1 - dx0, 0.045, 0.09), at=((dx0 + dx1) / 2, 0.055, DH - 0.05)), comp.box((dx1 - dx0, 0.045, 0.24), at=((dx0 + dx1) / 2, 0.055, 0.125)))
so = M("storefront_door_frame", stiles, alu, parent=hp)
comp.bevel(so, 0.003, 2)
M("storefront_door_glass", comp.box((dx1 - dx0 - 0.17, 0.008, DH - 0.33), at=((dx0 + dx1) / 2, 0.055, 0.24 + (DH - 0.33) / 2)), glass, parent=hp)
M("storefront_door_push_bar", comp.merge(comp.cyl(0.014, dx1 - dx0 - 0.1, at=(dx0 + 0.05, 0.0, 1.05), seg=16, axis="X"), *[comp.cyl(0.01, 0.04, at=(x, -0.002, 1.05), seg=12, axis="Y") for x in (dx0 + 0.06, dx1 - 0.06)]), alu, parent=hp, smooth=True)
M("storefront_door_pull", comp.merge(comp.cyl(0.012, 0.36, at=(dx1 - 0.045, 0.125, 0.92), seg=16), *[comp.cyl(0.008, 0.05, at=(dx1 - 0.045, 0.075, z), seg=12, axis="Y") for z in (0.95, 1.25)]), alu, parent=hp, smooth=True)
M("storefront_door_lock", turn([(0.0, 0.006), (0.014, 0.006), (0.017, 0.0)], seg=20, axis="F", at=(dx1 - 0.045, 0.0325, 1.2)), alu, parent=hp, smooth=True)
M("storefront_door_decal", comp.merge(label("PULL", 0.05, ((dx0 + dx1) / 2, 0.0596, 1.42), yaw=180, depth=0.0006), label("OPEN 24 HOURS", 0.04, ((dx0 + dx1) / 2, 0.0596, 1.62), yaw=180, depth=0.0006),
                                        label("LAST WASH ANY TIME", 0.026, ((dx0 + dx1) / 2, 0.0596, 1.56), yaw=180, depth=0.0006)), vinyl, parent=hp)
M("storefront_door_push_sign", rbox((0.16, 0.002, 0.06), at=((dx0 + dx1) / 2, 0.05, 1.2), r=0.001, seg=1), vinyl_r, parent=hp)
M("storefront_door_push_print", label("PUSH", 0.036, ((dx0 + dx1) / 2, 0.0485, 1.2)), vinyl, parent=hp)
M("storefront_door_closer", comp.merge(rbox((0.26, 0.05, 0.055), at=(dx0 + 0.2, 0.01, DH - 0.05), r=0.006), comp.box((0.34, 0.01, 0.012), at=(dx0 + 0.28, -0.005, DH + 0.012))), alu)
M("storefront_door_threshold", rbox((DOOR_W, 0.14, 0.012), at=(DOOR_X0 + DOOR_W / 2, 0.055, 0.004), r=0.004), alu)
comp.channel("door", [(hp, "rotation_euler", 2, 0, math.radians(85))])
comp.export(col, root, _lib.PLACE, "storefront", made="blender/components/laundromat/storefront.py",
            source="own geometry (a generic aluminium shopfront); tiles: https://polyhaven.com/a/long_white_tiles; letters in Blender's built-in font", license="ours; texture CC0", credit="Poly Haven (long_white_tiles)",
            rig={"door": "the glass door swings 85 degrees out to the car park on its pivot at the near jamb (storefront_door)",
                 "neon": "in the scene: the materials open_neon_red (OPEN) and open_neon_blue (its border) glow, a key per state"},
            notes="Its room face is at y 0, the outside behind it. Turned a quarter (yaw 90 degrees in raea) it stands along the floor's left edge with its door at the front.")
