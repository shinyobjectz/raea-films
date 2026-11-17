# pool/lifeguard-chair: a lifeguard's high chair, modelled by hand at real size: a white tubular steel tower on four
# splayed legs with rubber feet, five rungs up its front, cross braces, a non-slip platform 1.5 m up, a moulded seat
# with a back and arms on a swivel post 1.9 m up, a footrest bar, and a red rescue can hung on its strap from a hook
# on the left. Its front faces -y (the water). Rig: "swivel" turns the seat one whole turn on its post.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("lifeguard_chair")
tube_m = paint_m("pool_chair_frame", (0.9, 0.91, 0.9), 0.35)
seat_m = comp.mat("pool_chair_seat", (0.85, 0.12, 0.08), rough=0.45)
deck_m = comp.mat("pool_chair_deck", (0.75, 0.77, 0.76), rough=0.9)
can_m = comp.mat("pool_rescue_can", (0.85, 0.1, 0.06), rough=0.4)
strap_m = comp.mat("pool_strap", (0.05, 0.05, 0.05), rough=0.85)
rub = comp.mat("pool_rubber", (0.02, 0.02, 0.02), rough=0.8)
st = steel("pool_steel", 0.2)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
PZ = 1.5
foot = {(sx, sy): Vector((sx * 0.58, sy * 0.62, 0.02)) for sx in (-1, 1) for sy in (-1, 1)}
head = {(sx, sy): Vector((sx * 0.36, sy * 0.36, PZ)) for sx in (-1, 1) for sy in (-1, 1)}
at = lambda k, z: foot[k] + (head[k] - foot[k]) * ((z - 0.02) / (PZ - 0.02))
tubes = [rod(foot[k], head[k], 0.024, 4) for k in foot]
for z in (0.3, 0.6, 0.9, 1.2):
    tubes.append(rod(at((-1, -1), z), at((1, -1), z), 0.017))        # the rungs, up the front
for sx in (-1, 1):
    tubes += [rod(at((sx, -1), 0.3), at((sx, 1), 1.2), 0.014), rod(at((sx, 1), 0.3), at((sx, -1), 1.2), 0.014), rod(at((sx, -1), 0.3), at((sx, 1), 0.3), 0.017)]
tubes += [rod(at((-1, 1), 0.3), at((1, 1), 1.2), 0.014), rod(at((1, 1), 0.3), at((-1, 1), 1.2), 0.014), rod(at((-1, 1), 0.3), at((1, 1), 0.3), 0.017)]
# grab rails beside the top rungs, and the footrest out in front
for sx in (-1, 1):
    tubes.append(pipe(bend([head[(sx, -1)], head[(sx, -1)] + Vector((0, 0, 0.55)), head[(sx, -1)] + Vector((0, 0.3, 0.55)), head[(sx, -1)] + Vector((0, 0.3, 0.0))], 0.1, 5), 0.017))
tubes.append(pipe(bend([(-0.3, -0.36, PZ), (-0.3, -0.62, PZ + 0.02), (0.3, -0.62, PZ + 0.02), (0.3, -0.36, PZ)], 0.06, 4), 0.017))
M("lifeguard_chair_frame", comp.merge(*tubes), tube_m, smooth=True)
M("lifeguard_chair_feet", comp.merge(*[turn([(0.0, 0.0), (0.04, 0.0), (0.04, 0.012), (0.028, 0.05), (0.0, 0.05)], seg=16, at=(p.x, p.y, 0)) for p in foot.values()]), rub, smooth=True)
pl = M("lifeguard_chair_platform", comp.merge(comp.box((0.82, 0.82, 0.035), at=(0, 0, PZ + 0.0175)), *[comp.box((0.76, 0.012, 0.004), at=(0, -0.36 + i * 0.06, PZ + 0.037)) for i in range(13)]), deck_m)
comp.bevel(pl, 0.004, 2)
# the seat on its swivel post
sw = comp.pivot(col, root, "lifeguard_chair_swivel", (0, 0.06, PZ + 0.035))
M("lifeguard_chair_post_base", turn([(0.0, 0.0), (0.11, 0.0), (0.11, 0.012), (0.045, 0.03), (0.045, 0.2), (0.0, 0.2)], seg=24, at=(0, 0.06, PZ + 0.035)), st, smooth=True)
M("lifeguard_chair_post", comp.cyl(0.03, 0.18, at=(0, 0.06, PZ + 0.2), seg=20), st, parent=sw, smooth=True)
SZ = PZ + 0.4
seat = comp.box((0.46, 0.44, 0.05), at=(0, 0.04, SZ))
for v in seat.verts:
    if v.co.z > SZ:
        v.co.z += 0.012 * (abs(v.co.x) / 0.23) ** 2
so = M("lifeguard_chair_seat", seat, seat_m, parent=sw, smooth=True)
comp.bevel(so, 0.02, 3)
back = comp.grid(0.46, 0.42, 8, 6)
for v in back.verts:
    v.co.y -= 0.05 * (2 * v.co.x / 0.46) ** 2
xf(back, T(0, 0.27, SZ + 0.27) @ R(-9, "X"))
bo = M("lifeguard_chair_back", back, seat_m, parent=sw, smooth=True)
comp.solidify(bo, 0.03, 0)
comp.bevel(bo, 0.012, 2)
arms = []
for sx in (-1, 1):
    arms.append(pipe(bend([(sx * 0.2, 0.22, SZ + 0.0), (sx * 0.27, 0.22, SZ + 0.22), (sx * 0.27, -0.16, SZ + 0.22), (sx * 0.22, -0.16, SZ + 0.0)], 0.06, 4), 0.014))
arms.append(comp.box((0.3, 0.3, 0.03), at=(0, 0.05, SZ - 0.04)))
M("lifeguard_chair_arms", comp.merge(*arms), st, parent=sw, smooth=True)
# the rescue can on its hook, left of the platform
HX = -0.47
M("lifeguard_chair_hook", pipe(bend([(-0.41, 0.0, PZ - 0.0), (HX - 0.03, 0.0, PZ - 0.0), (HX - 0.03, 0.0, PZ + 0.06)], 0.02, 3), 0.006), st, smooth=True)
can = turn([(0.0, 0.0), (0.045, 0.01), (0.075, 0.08), (0.085, 0.3), (0.08, 0.55), (0.055, 0.66), (0.0, 0.69)], seg=24)
xf(can, S(1.0, 0.62, 1.0))
grips = [pipe(bend([(sx * 0.07, 0, 0.16), (sx * 0.125, 0, 0.2), (sx * 0.125, 0, 0.48), (sx * 0.07, 0, 0.52)], 0.03, 3), 0.011) for sx in (-1, 1)]
canb = xf(comp.merge(can, *grips), T(HX - 0.03, 0.0, PZ - 1.0))
M("lifeguard_chair_rescue_can", canb, can_m, smooth=True)
M("lifeguard_chair_can_strap", pipe([(HX - 0.03, 0.0, PZ - 0.31), (HX - 0.03, 0.0, PZ + 0.02)], 0.006), strap_m, smooth=True)
comp.channel("swivel", [(sw, "rotation_euler", 2, 0, 2 * math.pi)])
done(col, root, "lifeguard_chair", source="own geometry (a generic tubular lifeguard chair and rescue can)",
     rig={"swivel": "the seat, its back and arms turn one whole turn on the post", "position": "the Model's own position on the deck"})
