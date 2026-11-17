# laundromat/laundry: one dryer's load, modelled by hand: nine wadded garments and towels and four socks in real
# cloth (Poly Haven's denim_fabric, terry_cloth, waffle_pique_cotton, gingham_check, cotton_jersey),
# heaped along the bottom of a 0.69 m drum. Its origin is the drum's axle at the drum's middle (not the floor): it
# goes where a dryer's drum is (the dryer's sidecar says where).
# Rig: "tumble" turns the whole load one turn about the axle, with the drum; "float" lifts every piece off the heap
# to hang apart in the middle of the drum, each turned a little (the agent's "let it float"). Each piece is a node
# of its own (laundry_piece_01 ...), so a shot can also move one by itself.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, wad, rbox, T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("laundry")
M = _lib.maker(col, root)
cloth = {
    "denim": comp.ph_texture("laundry_denim", "denim_fabric", tile=0.1, res="1k"),
    "towel": comp.ph_texture("laundry_towel", "terry_cloth", tile=0.2, res="1k", tint=(0.95, 0.95, 0.92), grey=True),
    "waffle": comp.ph_texture("laundry_waffle", "waffle_pique_cotton", tile=0.28, res="1k"),
    "check": comp.ph_texture("laundry_red", "terry_cloth", tile=0.2, res="1k", tint=(0.72, 0.1, 0.08), grey=True),
    "gingham": comp.ph_texture("laundry_gingham", "gingham_check", tile=0.28, res="1k"),
    "tee": comp.ph_texture("laundry_tee", "cotton_jersey", tile=0.26, res="1k", tint=(0.9, 0.45, 0.4), grey=True),
    "grey": comp.ph_texture("laundry_grey", "cotton_jersey", tile=0.26, res="1k", tint=(0.5, 0.52, 0.56), grey=True),
    "sock": comp.ph_texture("laundry_sock", "terry_cloth", tile=0.2, res="1k", tint=(0.92, 0.92, 0.9), grey=True),
}
RD = 0.345
rnd = random.Random(7)
load = comp.pivot(col, root, "laundry_load", (0, 0, 0))
#        cloth      size (m)             angle on the drum's wall (deg from straight down), along the axle, lift off the wall
pieces = [("denim", (0.34, 0.26, 0.15), -38, -0.12, 0.085), ("towel", (0.36, 0.28, 0.17), 4, -0.14, 0.09), ("check", (0.3, 0.24, 0.14), 40, -0.1, 0.08),
          ("waffle", (0.28, 0.24, 0.13), -18, 0.1, 0.075), ("tee", (0.27, 0.22, 0.12), 24, 0.12, 0.07), ("gingham", (0.28, 0.2, 0.12), -58, 0.06, 0.07),
          ("grey", (0.26, 0.2, 0.12), 60, 0.1, 0.07), ("towel", (0.24, 0.2, 0.12), -6, 0.0, 0.2), ("denim", (0.22, 0.18, 0.1), 18, -0.02, 0.19)]
keys_float = []
n = 0
def place(name, bm, m, at, floats, spin):
    global n
    n += 1
    p = comp.pivot(col, root, f"laundry_piece_{n:02d}", at, parent=load)
    xf(bm, T(*at))
    o = M(f"laundry_piece_{n:02d}_{name}", bm, m, parent=p, smooth=True)
    comp.uv_box(o, 1.0)
    for i in range(3):
        keys_float.append((p, "location", i, at[i], floats[i]))
    for i in range(3):
        keys_float.append((p, "rotation_euler", i, 0.0, spin[i]))

for i, (c, size, ang, y, lift) in enumerate(pieces):
    a = math.radians(ang)
    r = RD - lift
    at = (r * math.sin(a), y, -r * math.cos(a))
    bm = wad(20 + i, size, rough=0.3)
    xf(bm, R(rnd.uniform(-25, 25), "Y"))
    xf(bm, R(math.degrees(a), "Y") if False else R(-ang, "Y"))
    fa = 2 * math.pi * i / len(pieces) + 0.4
    fr = 0.19 if i < 7 else 0.03
    target = (fr * math.cos(fa), -0.2 + 0.4 * ((i * 5) % 9) / 8, fr * math.sin(fa) * 0.95)
    place(c, bm, cloth[c], at, target, (rnd.uniform(-1.2, 1.2), rnd.uniform(-1.5, 1.5), rnd.uniform(-1.2, 1.2)))
for i in range(4):                       # socks: a bent tube each
    ang = (-70, -28, 34, 72)[i]
    a = math.radians(ang)
    r = RD - 0.03
    at = (r * math.sin(a), (-0.22, 0.2, 0.22, -0.2)[i], -r * math.cos(a))
    bm = comp.tube([(-0.09, 0, 0.012), (-0.03, 0, 0.0), (0.03, 0, 0.0), (0.06, 0.0, 0.012), (0.075, 0, 0.06)], 0.03, res=8, sides=4)
    xf(bm, S(1, 1, 0.6))
    xf(bm, R(rnd.uniform(0, 360), "Z"))
    xf(bm, R(-ang, "Y"))
    fa = 2 * math.pi * i / 4 + 1.1
    place("sock", bm, cloth["sock"], at, (0.1 * math.cos(fa), (-0.24, 0.24, -0.08, 0.1)[i], 0.1 * math.sin(fa)), (rnd.uniform(-2, 2), rnd.uniform(-2, 2), rnd.uniform(-2, 2)))
comp.channel("tumble", [(load, "rotation_euler", 1, 0, 2 * math.pi)])
_lib.channel("float", keys_float)
comp.export(col, root, _lib.PLACE, "laundry", made="blender/components/laundromat/laundry.py",
            source="own geometry (wadded cloth); cloth: https://polyhaven.com/a/denim_fabric, /terry_cloth, /waffle_pique_cotton, /gingham_check, /cotton_jersey",
            license="ours; textures CC0", credit="Poly Haven (denim_fabric, terry_cloth, waffle_pique_cotton, gingham_check, cotton_jersey)",
            rig={"tumble": "the whole load one turn about the drum's axle (laundry_load); the Model's own turn about that axle does the same while float plays",
                 "float": "every piece leaves the heap and hangs apart in the middle of the drum, turned up to 100 degrees"},
            notes="Origin: the drum's axle at the drum's middle. In a dryer at X, Y, Z (raea) it goes at X, Y + 1.57 (upper) or 0.63 (lower), Z + 0.045; in a washer at Y + 0.48, Z + 0.075 scaled 0.78.")
