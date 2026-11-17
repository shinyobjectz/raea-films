# nave/screen: the choir screen (blender/components/nave/_plan.py), a wall of carved limestone across the nave between
# two piers, 5.1 m wide, its coping 4.56 m up and its gable's finial 5.35 m. In its middle a pointed doorway of three
# moulded orders on shafts with bell capitals, under a hood mould; over it a gable with a sunk trefoil, crocketed, and a
# finial; beside it two pinnacles. Each side of the door two blind lancets, then a frieze of sunk quatrefoils, a cornice
# whose top is a ledge with four candles on it each side, and a pierced parapet. The door is nave/door.
# The candles are wax only: their flames are the scene's (v3/nave.tsx), at the wicks this writes in its notes.
import os, sys, math, json, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _plan as P
from _plan import comp, bpy, bmesh, T, R, S, xf, CL, Vector

random.seed(7)
col, root = comp.fresh("nave_screen")
ASHLAR, DRESSED = P.materials()
WAX = P.wax()
IRON = CL.iron_mat("nave_iron")
WICK = comp.mat("nave_wick", (0.02, 0.018, 0.016), rough=0.9)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)


def path3(pts, y, z0=None, step=0.25):
    """(x, z) points at depth y, with the first and last legs (the jambs, straight down to z0) given points every `step`."""
    out = []
    if z0 is not None:
        x, z = pts[0]
        n = max(1, int((z - z0) / step))
        out += [(x, y, z0 + (z - z0) * i / n) for i in range(n)]
    out += [(x, y, z) for x, z in pts]
    if z0 is not None:
        x, z = pts[-1]
        n = max(1, int((z - z0) / step))
        out += [(x, y, z - (z - z0) * i / n) for i in range(1, n + 1)]
    return out


# ---- the wall: four layers, each cut back round the doorway by one order --------------------------------------------
layers, y = [], P.FRONT
for k in range(P.NORD, -1, -1):
    hw = P.HW + P.ORDER * k
    y1 = y + P.ORDER if k > 0 else P.BACK
    top = P.CORNICE[0] if k == P.NORD else P.CORNICE[1]
    loops = [P.notched(-P.XE, 0.0, P.XE, top, hw, P.ZS)]
    if k == P.NORD:
        for sx in (-1, 1):
            for cx in P.LANCETS:
                loops.append(P.lancet(sx * cx, P.LAN_HW, P.LAN_Z0, P.LAN_ZS))
        zc = sum(P.FRIEZE) / 2
        for i in range(-7, 8):
            loops.append(P.foil(i * 0.3, zc, 0.118, 4))
    layers.append(P.plate_at(loops, y, y1))
    y = y1
# (in the fine stone the carving is in: the cathedral's ashlar, this close and under candles, read as stained concrete)
wall = M("screen_wall", comp.merge(*layers), DRESSED)
comp.bevel(wall, 0.007, 2, angle=40)
CL.finish(wall, 1.0)

# ---- the doorway: a roll on each order's edge, bases, bell capitals at the springing, the hood mould ------------------
carved = []
for k in range(P.NORD + 1):
    hw = P.HW + P.ORDER * k
    yk = P.FRONT + P.ORDER * (P.NORD - k)
    carved.append(CL.sweep(path3(P.arch_path(hw, P.ZS, 22), yk, z0=0.30), 0.034))
    for sx in (-1, 1):
        carved.append(xf(CL.lathe([(0.0, 0.0), (0.075, 0.0), (0.075, 0.07), (0.055, 0.1), (0.065, 0.13), (0.042, 0.18), (0.036, 0.31), (0.0, 0.31)], seg=20), T(sx * hw, yk, 0.0)))
        carved.append(xf(CL.lathe([(0.0, 0.0), (0.036, 0.0), (0.042, 0.035), (0.058, 0.085), (0.072, 0.115), (0.08, 0.12), (0.08, 0.15), (0.0, 0.15)], seg=20), T(sx * hw, yk, P.ZS - 0.15)))
carved.append(CL.sweep([(x, P.FRONT - 0.03, z) for x, z in P.arch_path(P.HOOD, P.ZS, 24)], 0.045))
for sx in (-1, 1):
    carved.append(comp.box((0.11, 0.09, 0.13), at=(sx * P.HOOD, P.FRONT - 0.04, P.ZS - 0.04)))
# the threshold
carved.append(comp.box((2 * P.HW, P.BACK - P.FRONT - P.ORDER * P.NORD, 0.022), at=(0, (P.BACK + P.FRONT + P.ORDER * P.NORD) / 2, 0.011)))

# ---- the blind lancets: a roll round each, a sloped sill -------------------------------------------------------------
for sx in (-1, 1):
    for cx in P.LANCETS:
        x = sx * cx
        carved.append(CL.sweep(path3(P.arch_path(P.LAN_HW, P.LAN_ZS, 12, at=x), P.FRONT, z0=P.LAN_Z0), 0.022))
        carved.append(xf(xf(comp.box((2 * P.LAN_HW + 0.08, 0.13, 0.05)), R(-24, "X")), T(x, P.FRONT - 0.005, P.LAN_Z0 - 0.01)))
        # (in the lancet's head, a trefoil set in the stone behind)
        carved.append(P.plate_at([P.lancet(x, P.LAN_HW - 0.01, P.LAN_ZS - 0.05, P.LAN_ZS), P.foil(x, P.LAN_ZS + 0.12, 0.1, 3, depth=0.4, turn=math.pi / 2)], P.FRONT + 0.05, P.FRONT + P.ORDER))

# ---- the plinth, the cornice and its ledge, the parapet and its coping -----------------------------------------------
for sx in (-1, 1):
    a, b = sorted((sx * 1.12, sx * P.XE))
    carved.append(P.prism_x([(P.FRONT + 0.01, 0.0), (P.FRONT - 0.06, 0.0), (P.FRONT - 0.06, 0.25), (P.FRONT + 0.01, 0.33)], a, b))
carved.append(P.prism_x([(P.FRONT + 0.02, P.CORNICE[0]), (P.FRONT - 0.02, P.CORNICE[0] + 0.012), (P.FRONT - 0.07, P.CORNICE[0] + 0.05), (P.FRONT - 0.11, P.CORNICE[0] + 0.1), (P.FRONT - P.LEDGE_OUT, P.CORNICE[0] + 0.135), (P.FRONT - P.LEDGE_OUT, P.CORNICE[1]), (P.FRONT + 0.02, P.CORNICE[1])], -P.XE, P.XE))
holes = [P.lancet(i * 0.22, 0.062, P.PARAPET[0] + 0.08, P.PARAPET[0] + 0.27, 8) for i in range(-10, 11) if abs(i * 0.22) > 1.16]
carved.append(P.plate_at([CL.rect(-P.XE, P.PARAPET[0], P.XE, P.PARAPET[1])] + holes, P.FRONT, P.FRONT + 0.16))
carved.append(comp.box((2 * P.XE, 0.21, P.COPING[1] - P.COPING[0]), at=(0, P.FRONT + 0.08, sum(P.COPING) / 2)))

# ---- the gable over the door ------------------------------------------------------------------------------------------
gw, gz0, gz1 = P.GABLE
tri = [(-gw, gz0), (gw, gz0), (0.0, gz1)]
carved.append(P.plate_at([tri], P.FRONT - 0.02, P.FRONT + 0.1))
carved.append(P.plate_at([tri, P.foil(0.0, gz0 + 0.4, 0.21, 3, depth=0.42, turn=math.pi / 2)], P.FRONT - 0.07, P.FRONT - 0.02))
rake_len = math.hypot(gw, gz1 - gz0)
for sx in (-1, 1):
    a, b = Vector((sx * gw, P.FRONT - 0.07, gz0)), Vector((0.0, P.FRONT - 0.07, gz1))
    carved.append(CL.sweep([tuple(a + (b - a) * (i / 6)) for i in range(7)], 0.036))
    up = (b - a).normalized()
    out = Vector((sx * (gz1 - gz0), 0.0, gw)).normalized()
    for i in range(1, 8):
        p = a + (b - a) * (i / 8.4) + out * 0.02
        carved.append(P.crocket(tuple(p), tuple(out), tuple(up), s=1.05))
carved.append(P.finial(0.0, P.FRONT - 0.045, gz1 - 0.02, h=0.36, r=0.06))

# ---- the pinnacles beside the door -------------------------------------------------------------------------------------
for sx in (-1, 1):
    x, yc = sx * P.PIN_X, P.FRONT - 0.02
    carved.append(comp.box((0.29, 0.29, P.PLINTH), at=(x, yc, P.PLINTH / 2)))
    carved.append(comp.box((P.PIN_W, P.PIN_W, P.PIN_TOP - P.PLINTH), at=(x, yc, (P.PIN_TOP + P.PLINTH) / 2)))
    for zb in (P.ZS - 0.02, P.CORNICE[0] + 0.01, P.PARAPET[1] - 0.02):
        carved.append(comp.box((P.PIN_W + 0.045, P.PIN_W + 0.045, 0.045), at=(x, yc, zb)))
    # (its cap, and the spirelet on it)
    carved.append(comp.box((P.PIN_W + 0.05, P.PIN_W + 0.05, 0.06), at=(x, yc, P.PIN_TOP + 0.03)))
    carved.append(P.pyramid(x, yc, P.PIN_TOP + 0.06, P.SPIRE, P.PIN_W))
    for e in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        corner = Vector((x + e[0] * P.PIN_W / 2, yc + e[1] * P.PIN_W / 2, P.PIN_TOP + 0.06))
        apex = Vector((x, yc, P.SPIRE))
        out = Vector((e[0], e[1], 0.0)).normalized()
        for f in (0.28, 0.55, 0.8):
            carved.append(P.crocket(tuple(corner + (apex - corner) * f), tuple(out), tuple((apex - corner).normalized()), s=0.75))
    carved.append(P.finial(x, yc, P.SPIRE - 0.02, h=0.22, r=0.04))
dressed = M("screen_carving", comp.merge(*carved), DRESSED, smooth=False)
comp.bevel(dressed, 0.004, 1, angle=40)
CL.finish(dressed, 1.0)

# ---- the ledge's candles: wax on an iron dish, burned down to different heights, a drip or two each -------------------
wax, dishes, wicks, tips = [], [], [], []
for sx in (-1, 1):
    for i, x0 in enumerate(P.LEDGE_X):
        x, y0 = sx * x0, P.LEDGE_Y
        h = 0.2 + 0.08 * random.random()
        z0 = P.CORNICE[1] + 0.012
        dishes.append(comp.cyl(0.05, 0.012, at=(x, y0, P.CORNICE[1]), seg=20))
        wax.append(xf(CL.lathe([(0.0, 0.0), (0.034, 0.0), (0.035, h), (0.032, h + 0.008), (0.024, h + 0.002), (0.0, h - 0.004)], seg=20), T(x, y0, z0)))
        for _ in range(2):
            a = random.random() * 2 * math.pi
            zt = z0 + h - 0.01 - 0.06 * random.random()
            wax.append(comp.cyl(0.006, 0.05 + 0.04 * random.random(), at=(x + 0.033 * math.cos(a), y0 + 0.033 * math.sin(a), zt - 0.07), r2=0.0045, seg=8))
        wicks.append(comp.cyl(0.0017, 0.016, at=(x, y0, z0 + h - 0.006), seg=6))
        tips.append([round(x, 4), round(y0, 4), round(z0 + h + 0.01, 4)])
M("screen_candles", comp.merge(*wax), WAX, smooth=True)
M("screen_candle_dishes", comp.merge(*dishes), IRON)
M("screen_wicks", comp.merge(*wicks), WICK)

comp.export(col, root, "nave", "screen", made="blender/components/nave/screen.py",
            source="own geometry; Poly Haven's large_sandstone_blocks_01 and beige_wall_001 (CC0)", license="ours (textures CC0)", credit="Poly Haven (polyhaven.com)",
            notes=json.dumps({"origin": "the floor at the middle of the door's opening, on the screen's middle plane; front toward -y",
                              "opening": {"half_width": P.HW, "spring": P.ZS, "apex": round(P.APEX, 4), "back": P.BACK, "front": P.FRONT},
                              "wicks": tips}))
