# pool/pool: the hall's floor with the pool in it, modelled by hand at real size: a 16 x 30 m deck of anti-slip tiles
# round an 8 x 20 m basin, 1.1 m deep at the shallow end (toward the camera) sloping to 3.0 m under the board, lined
# in aqua mosaic with a navy band at the water line; bullnose coping stones, a deck-level overflow channel of grating
# modules, four navy lane lines on the floor with their T ends and wall targets, depth markers and NO DIVING lettered
# on the deck, six underwater lights in their niches (pool_light, the scene's to glow). Its origin is the pool's
# centre at deck level; the water is its own component. No rig.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("pool")
deck_m, basin_m, band_m = deck_tiles(), basin_tiles(), band_tiles()
coping_m = comp.mat("pool_coping", (0.9, 0.9, 0.86), rough=0.55)
grate_m = comp.mat("pool_grating", (0.8, 0.82, 0.8), rough=0.5)
conc_m = comp.mat("pool_concrete", (0.5, 0.5, 0.48), rough=0.9)
ink_m = comp.mat("pool_lettering", (0.03, 0.1, 0.3), rough=0.5)
light_m = comp.mat("pool_light", (1.0, 1.0, 0.95), rough=0.2, emit=(0.85, 0.97, 1.0), strength=4.0)
ring_m = steel("pool_steel")
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
W, L, HW, HL = POOL_W / 2, POOL_L / 2, HALL_W / 2, HALL_L / 2

# the deck: four slabs of tile round the basin, and the slab's sides and underside in concrete
bm = bmesh.new()
for x0, x1, y0, y1 in ((-HW, -W, -HL, HL), (W, HW, -HL, HL), (-W, W, -HL, -L), (-W, W, L, HL)):
    face(bm, [(x0, y0, 0), (x1, y0, 0), (x1, y1, 0), (x0, y1, 0)], (0, 0, 1))
deck = M("pool_deck", bm, deck_m)
comp.uv_box(deck, 1.0)
B = -DEEP - 0.3
bm = bmesh.new()
for a, b, n in (((-HW, -HL), (HW, -HL), (0, -1, 0)), ((HW, -HL), (HW, HL), (1, 0, 0)), ((HW, HL), (-HW, HL), (0, 1, 0)), ((-HW, HL), (-HW, -HL), (-1, 0, 0))):
    face(bm, [(*a, 0), (*b, 0), (*b, B), (*a, B)], n)
face(bm, [(-HW, -HL, B), (HW, -HL, B), (HW, HL, B), (-HW, HL, B)], (0, 0, -1))
M("pool_slab", bm, conc_m)

# the basin: the floor in three runs, the walls split at the band's lower edge
BAND = -0.3
bm = bmesh.new()
for (y0, z0), (y1, z1) in zip(FLOOR, FLOOR[1:]):
    face(bm, [(-W, y0, z0), (W, y0, z0), (W, y1, z1), (-W, y1, z1)], (0, 0, 1))
    for x, n in ((-W, (1, 0, 0)), (W, (-1, 0, 0))):
        face(bm, [(x, y0, 0), (x, y1, 0), (x, y1, BAND), (x, y0, BAND)], n)
        face(bm, [(x, y0, BAND), (x, y1, BAND), (x, y1, z1), (x, y0, z0)], n)
for y, z, n in ((-L, -SHALLOW, (0, 1, 0)), (L, -DEEP, (0, -1, 0))):
    face(bm, [(-W, y, 0), (W, y, 0), (W, y, BAND), (-W, y, BAND)], n)
    face(bm, [(-W, y, BAND), (W, y, BAND), (W, y, z), (-W, y, z)], n)
basin = M("pool_basin", bm, [basin_m, band_m])
paint(basin, lambda c, n: 1 if (abs(n.z) < 0.5 and c.z > BAND) else 0)
comp.uv_box(basin, 1.0)

# lane lines on the floor, their T ends, and a cross target on each end wall
bm = bmesh.new()
E = 0.005
for x in (-3, -1, 1, 3):
    ys = [-8.0, -2.0, 4.0, 8.0]
    for y0, y1 in zip(ys, ys[1:]):
        face(bm, [(x - 0.125, y0, floor_z(y0) + E), (x + 0.125, y0, floor_z(y0) + E), (x + 0.125, y1, floor_z(y1) + E), (x - 0.125, y1, floor_z(y1) + E)], (0, 0, 1))
    for y in (-8.0, 8.0):
        s = 1 if y > 0 else -1
        z = floor_z(y) + E
        face(bm, [(x - 0.5, y, z), (x + 0.5, y, z), (x + 0.5, y + s * 0.25, z), (x - 0.5, y + s * 0.25, z)], (0, 0, 1))
    for y, n, d in ((-L + E, (0, 1, 0), SHALLOW), (L - E, (0, -1, 0), DEEP)):
        zc = -0.35 - min(d - 0.45, 0.9) / 2
        hh = min(d - 0.45, 0.9) / 2
        face(bm, [(x - 0.125, y, zc - hh), (x + 0.125, y, zc - hh), (x + 0.125, y, zc + hh), (x - 0.125, y, zc + hh)], n)
        face(bm, [(x - 0.25, y, zc + hh - 0.25), (x + 0.25, y, zc + hh - 0.25), (x + 0.25, y, zc + hh), (x - 0.25, y, zc + hh)], n)
lanes = M("pool_lane_lines", bm, band_m)
comp.uv_box(lanes, 1.0)

# the coping: bullnose stones 0.6 m long, 0.3 m wide, overhanging the basin 3 cm
stones, grates = [], []
def run(a, b, across, n_out):
    a, b = Vector(a), Vector(b)
    d = (b - a)
    n = round(d.length / 0.6)
    step = d / n
    o = Vector(n_out)
    for i in range(n):
        c = a + step * (i + 0.5)
        sz = (abs(step.x) - 0.004 + 0.3 * abs(o.x), abs(step.y) - 0.004 + 0.3 * abs(o.y), 0.05)
        stones.append(comp.box(sz, at=(c.x + o.x * 0.12, c.y + o.y * 0.12, 0.012)))
        gz = (abs(step.x) - 0.006 + 0.24 * abs(o.x), abs(step.y) - 0.006 + 0.24 * abs(o.y), 0.02)
        grates.append(comp.box(gz, at=(c.x + o.x * 0.4, c.y + o.y * 0.4, -0.004)))
run((-W, -L, 0), (W, -L, 0), 0.3, (0, -1, 0)); run((-W, L, 0), (W, L, 0), 0.3, (0, 1, 0))
run((-W, -L, 0), (-W, L, 0), 0.3, (-1, 0, 0)); run((W, -L, 0), (W, L, 0), 0.3, (1, 0, 0))
for sx in (-1, 1):
    for sy in (-1, 1):
        stones.append(comp.box((0.3, 0.3, 0.05), at=(sx * (W + 0.12), sy * (L + 0.12), 0.012)))
        grates.append(comp.box((0.55, 0.55, 0.018), at=(sx * (W + 0.27), sy * (L + 0.27), -0.005)))
cp = M("pool_coping", comp.merge(*stones), coping_m)
comp.bevel(cp, 0.012, 3)
gr = M("pool_overflow_grating", comp.merge(*grates), grate_m)
comp.bevel(gr, 0.003, 1)
# the grating's slots: short dark bars across each module (wide enough apart not to shimmer)
slots = []
for i in range(int(POOL_L / 0.2)):
    y = -L + 0.1 + i * 0.2
    for sx in (-1, 1):
        slots.append(comp.box((0.17, 0.035, 0.002), at=(sx * (W + 0.4), y, 0.0065)))
for i in range(int(POOL_W / 0.2)):
    x = -W + 0.1 + i * 0.2
    for sy in (-1, 1):
        slots.append(comp.box((0.035, 0.17, 0.002), at=(x, sy * (L + 0.4), 0.0065)))
M("pool_overflow_slots", comp.merge(*slots), comp.mat("pool_slot", (0.08, 0.1, 0.11), rough=0.6))

# lettering on the deck: depths beside the pool, the warnings at its ends (read from the shallow end)
words = []
def letter(s, size, x, y):
    words.append(xf(flat(comp.text(s, size, depth=0.003)), T(x, y, 0.003)))
for y, d in ((-8.5, "1.1 m"), (-3.0, "1.1 m"), (1.0, "2.0 m"), (6.8, "3.0 m")):   # clear of the flags' posts at y -5 and 5
    for sx in (-1, 1):
        letter(d, 0.22, sx * (W + 1.0), y)
for x in (-2.0, 2.0):
    letter("NO DIVING", 0.2, x, -L - 0.95)
    letter("SHALLOW END  1.1 m", 0.11, x, -L - 1.25)
letter("DEEP END  3.0 m", 0.2, -2.2, L + 0.95)
M("pool_lettering", comp.merge(*words), ink_m)

# underwater lights in the side walls: a lens in a steel ring, 0.8 m down
lens, rings = [], []
for sx in (-1, 1):
    for y in (-6.5, 0.0, 6.5):
        z = -0.8 if y < 3 else -1.0
        lens.append(turn([(0.0, 0.02), (0.07, 0.016), (0.105, 0.004)], seg=24, axis="X", at=(sx * W, y, z)) if sx < 0 else xf(turn([(0.0, 0.02), (0.07, 0.016), (0.105, 0.004)], seg=24, axis="X"), T(W, y, z) @ R(180, "Z")))
        rg = turn([(0.105, 0.0), (0.105, 0.012), (0.135, 0.008), (0.14, 0.0)], seg=24, axis="X")
        rings.append(xf(rg, T(sx * W, y, z) @ (R(180, "Z") if sx > 0 else R(0, "Z"))))
M("pool_lights", comp.merge(*lens), light_m, smooth=True)
M("pool_light_rings", comp.merge(*rings), ring_m, smooth=True)

done(col, root, "pool", source="own geometry (a generic 20 m municipal pool); tiles: https://polyhaven.com/a/anti_skid_tiles, https://polyhaven.com/a/rounded_square_tiled_wall (levels stretched and tinted)",
     license="ours; textures CC0", credit="Poly Haven (anti_skid_tiles, rounded_square_tiled_wall)",
     rig={"lights": "in the scene: the material pool_light's glow (the underwater lights), a key per state"},
     notes="origin: the pool's centre at deck level; shallow end toward -y (raea +z). The water stands at -0.15 m (pool/water).")
