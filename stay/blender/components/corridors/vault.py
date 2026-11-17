# corridors/vault: a Victorian brick service passage, 60 m of it, modelled by hand: straight brick walls 1.3 m high and
# a round brick vault over them (the corridors' section: 3.0 m across, its crown 2.8 m up), riveted iron ribs every
# 3 m, caged amber bulkhead lamps hung along the crown on a conduit, two painted pipes on brackets down the left wall
# and a cable tray down the right, a floor of granite setts with a shallow drain of standing water down its middle and
# puddles, and daylight filling the far end. Textures: Poly Haven red_brick and cobblestone_floor_08 (CC0). Origin: the
# floor's centre line where the lens starts; the passage runs along +y.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, np, slab, sphere, W2, H, Y0, L, uv_set
from mathutils import Vector

col, root = comp.fresh("vault")
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
ZS, RV = H - W2, W2                                          # the springing (1.3 m) and the vault's radius

brick = comp.ph_texture("vault_brick", "red_brick", tile=1.6, tint=(0.72, 0.62, 0.55))
setts = comp.ph_texture("vault_setts", "cobblestone_floor_08", tile=2.0, tint=(0.55, 0.55, 0.56))
iron = comp.mat("vault_iron", (0.05, 0.07, 0.06), rough=0.55, metal=0.6)
pipe_m = comp.mat("vault_pipe", (0.12, 0.2, 0.15), rough=0.45, metal=0.3)
red = comp.mat("vault_valve", (0.5, 0.05, 0.03), rough=0.4, metal=0.3)
cable_m = comp.mat("vault_cable", (0.015, 0.015, 0.017), rough=0.6)
lamp = comp.mat("vault_lamp", (1.0, 0.8, 0.5), rough=0.2, emit=(1.0, 0.6, 0.26), strength=45000.0)
water = comp.mat("vault_water", (0.02, 0.025, 0.028), rough=0.03)
day = comp.mat("vault_daylight", (1.0, 0.97, 0.9), rough=0.5, emit=(1.0, 0.95, 0.86), strength=8000.0)

# the section, from the left foot up and over to the right foot, and each point's inward normal
sec, nrm = [], []
for i in range(6):
    z = ZS * i / 5
    sec.append((-W2, z)); nrm.append((1.0, 0.0))
for i in range(1, 40):
    a = math.pi - math.pi * i / 40
    sec.append((RV * math.cos(a), ZS + RV * math.sin(a))); nrm.append((-math.cos(a), -math.sin(a)))
for i in range(5, -1, -1):
    z = ZS * i / 5
    sec.append((W2, z)); nrm.append((-1.0, 0.0))
arc = [0.0]
for i in range(1, len(sec)):
    arc.append(arc[-1] + math.dist(sec[i - 1], sec[i]))


def sweep(off0, off1, y0, y1, ring=False):
    """the section, from off0 to off1 metres inward of the lining, from y0 to y1: the lining itself (off 0, one sheet
    facing in) or a rib (a solid band)"""
    bm = bmesh.new()
    rows = []
    for (x, z), (nx, nz) in zip(sec, nrm):
        rows.append([bm.verts.new((x + nx * o, y, z + nz * o)) for o, y in ((off0, y0), (off0, y1), (off1, y1), (off1, y0))])
    for i in range(len(rows) - 1):
        a, b = rows[i], rows[i + 1]
        faces = [(0, 1)] if not ring else [(2, 3), (1, 2), (3, 0)]
        for p, q in faces:
            bm.faces.new((a[p], a[q], b[q], b[p]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    # every face toward the passage's axis
    for f in bm.faces:
        c = f.calc_center_median()
        to = Vector((0 - c.x, 0, ZS - c.z)) if c.z > ZS else Vector((-c.x, 0, 0))
        if f.normal.dot(to) < 0:
            f.normal_flip()
    return bm


# the lining, in 4 m lengths, its UVs along the passage and round the section
lin = [sweep(0.0, 0.0, Y0 + 4 * k, min(L, Y0 + 4 * (k + 1))) for k in range(int((L - Y0) / 4) + 1) if Y0 + 4 * k < L]
o = M("vault_lining", comp.merge(*lin), brick)
def lining_uv(p, n):
    # the arc length to the point's place on the section
    best, s = 1e9, 0.0
    for i in range(len(sec) - 1):
        (x0, z0), (x1, z1) = sec[i], sec[i + 1]
        dx, dz = x1 - x0, z1 - z0
        k = max(0.0, min(1.0, ((p.x - x0) * dx + (p.z - z0) * dz) / (dx * dx + dz * dz)))
        d = (p.x - x0 - k * dx) ** 2 + (p.z - z0 - k * dz) ** 2
        if d < best:
            best, s = d, arc[i] + k * math.dist(sec[i], sec[i + 1])
    return (p.y, s)
uv_set(o, lining_uv)

# the ribs
ribs = [sweep(0.0, 0.07, y - 0.06, y + 0.06, ring=True) for y in np.arange(0.0, L - 0.5, 3.0)]
M("vault_ribs", comp.merge(*ribs), iron)

# the lamps on the crown, the conduit between them
lamps, cages = [], []
for y in np.arange(1.5, L - 1.0, 6.0):
    cages += [comp.cyl(0.09, 0.03, at=(0, y, H - 0.03), seg=20), comp.cyl(0.075, 0.02, at=(0, y, H - 0.05), seg=20)]
    lamps.append(sphere(0.07, at=(0, y, H - 0.09), scale=(1, 1, 1.1), u=16, v=10))
    for a in range(4):
        t = a * math.pi / 2
        cages.append(comp.tube([(0.075 * math.cos(t), y + 0.075 * math.sin(t), H - 0.05), (0.08 * math.cos(t), y + 0.08 * math.sin(t), H - 0.12), (0.0, y, H - 0.17)], 0.005, res=2, sides=1))
    cages.append(comp.cyl(0.012, 0.012, at=(0, y, H - 0.175), seg=8))
cages.append(comp.cyl(0.014, L - Y0, at=(0, Y0, H - 0.015), seg=8, axis="Y"))
M("vault_lamps", comp.merge(*lamps), lamp, smooth=True)
M("vault_lamp_cages", comp.merge(*cages), iron, smooth=True)

# the pipes on the left wall, the cable tray on the right
pipes, brk, valves, cables = [], [], [], []
for r, z in ((0.075, 0.98), (0.05, 0.74)):
    pipes.append(comp.cyl(r, L - Y0, at=(-W2 + 0.16, Y0, z), seg=20, axis="Y"))
for y in np.arange(Y0 + 0.75, L, 1.5):
    brk += [slab(-W2, -W2 + 0.24, y - 0.025, y + 0.025, 0.66, 0.69), slab(-W2, -W2 + 0.24, y - 0.025, y + 0.025, 0.88, 0.9), slab(-W2, -W2 + 0.02, y - 0.04, y + 0.04, 0.6, 1.1)]
    brk += [slab(W2 - 0.3, W2, y - 0.02, y + 0.02, 1.2, 1.22), slab(W2 - 0.02, W2, y - 0.03, y + 0.03, 1.1, 1.3)]
for y in np.arange(9.0, L - 2, 12.0):
    w = bmesh.new()
    bmesh.ops.create_circle(w, cap_ends=False, radius=0.13, segments=24)
    vs = [v.co.copy() for v in w.verts]
    w.free()
    pts = [(-W2 + 0.27, y + v.x, 0.98 + v.y) for v in vs] + [(-W2 + 0.27, y + vs[0].x, 0.98 + vs[0].y)]
    valves.append(comp.tube(pts, 0.012, res=3, sides=1))
    valves += [comp.cyl(0.02, 0.12, at=(-W2 + 0.16, y, 0.98), seg=10, axis="X"), slab(-W2 + 0.26, -W2 + 0.28, y - 0.13, y + 0.13, 0.97, 0.99), slab(-W2 + 0.26, -W2 + 0.28, y - 0.01, y + 0.01, 0.85, 1.11)]
tray = [slab(W2 - 0.3, W2 - 0.02, Y0, L, 1.22, 1.23), slab(W2 - 0.31, W2 - 0.29, Y0, L, 1.22, 1.3)]
for k, (dx, dz) in enumerate(((-0.08, 1.255), (-0.14, 1.255), (-0.2, 1.255), (-0.11, 1.285), (-0.17, 1.285))):
    cables.append(comp.cyl(0.022, L - Y0, at=(W2 + dx, Y0, dz), seg=8, axis="Y"))
M("vault_pipes", comp.merge(*pipes), pipe_m, smooth=True)
M("vault_brackets", comp.merge(*brk, *tray), iron)
M("vault_valves", comp.merge(*valves), red, smooth=True)
M("vault_cables", comp.merge(*cables), cable_m, smooth=True)

# the floor: setts, a drain of standing water down the middle, puddles
o = M("vault_floor", slab(-W2, W2, Y0, L, -0.03, 0.0), setts)
uv_set(o, lambda p, n: (p.x, p.y))
wet = [slab(-0.16, 0.16, Y0, L, 0.0, 0.004)]
rng = np.random.default_rng(5)
for i in range(16):
    c = comp.cyl(0.25 + 0.4 * rng.random(), 0.003, at=(0, 0, 0), seg=24)
    xf(c, S(1.0, 1.4 + 1.5 * rng.random(), 1.0))
    xf(c, T((rng.random() - 0.5) * 1.8, Y0 + 3 + (L - Y0 - 6) * rng.random(), 0.0))
    wet.append(c)
M("vault_water", comp.merge(*wet), water)

# daylight at the far end, filling the section
bm = bmesh.new()
vs = [bm.verts.new((x, L, z)) for x, z in sec]
bm.faces.new(vs)
bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
M("vault_daylight", bm, day)
comp.export(col, root, _lib.PLACE, "vault", made="blender/components/corridors/vault.py", source="own geometry; textures https://polyhaven.com/a/red_brick and https://polyhaven.com/a/cobblestone_floor_08", license="ours; textures CC0", credit="textures: Poly Haven",
            rig={"lights": "in the scene: the materials vault_lamp and vault_daylight glow"},
            notes="Shell part, the corridors' section (3.0 m wide, a round vault 2.8 m high); origin on the floor's centre line where the lens starts, the passage running 60 m along +y (raea -z).")
