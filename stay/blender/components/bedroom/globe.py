# bedroom/globe: a 30 cm desk globe, modelled by hand: a turned black base and stem, a brass half-meridian tilted
# 23.5 degrees with its degree ticks, the ball on brass pins at its poles, printed with a political map painted here
# (blue seas, pastel patchwork lands, a graticule every 15 degrees; coarse coastlines of our own drawing). 0.44 m
# high. Rig: "spin" turns the ball one whole turn eastward on its tilted axis (the cursor's flick; it loops); the ball
# is the shot's circle and the montage's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bpy
import numpy as np
from comp import T, R, xf
col, root = comp.fresh("globe")
M = _lib.maker(col, root)
# --- the map ----------------------------------------------------------------------------------------------------
LANDS = [
    [(-168, 66), (-156, 71), (-130, 70), (-110, 68), (-95, 72), (-82, 73), (-78, 62), (-64, 60), (-56, 52), (-66, 45), (-70, 42), (-76, 35), (-81, 31), (-80, 25), (-84, 30), (-90, 29), (-97, 26), (-97, 20), (-92, 18), (-87, 21), (-87, 16), (-83, 10), (-78, 8), (-82, 8), (-86, 12), (-92, 15), (-105, 20), (-110, 24), (-115, 31), (-120, 34), (-124, 40), (-124, 48), (-135, 58), (-150, 60), (-162, 55), (-165, 62)],
    [(-55, 60), (-44, 60), (-22, 70), (-20, 80), (-40, 83), (-60, 82), (-70, 77), (-55, 70)],
    [(-78, 8), (-72, 12), (-62, 10), (-52, 5), (-50, 0), (-36, -6), (-39, -15), (-48, -25), (-58, -35), (-65, -42), (-68, -53), (-74, -52), (-73, -40), (-71, -30), (-70, -18), (-76, -14), (-81, -5), (-80, 0)],
    [(-17, 15), (-16, 22), (-10, 30), (-5, 35), (10, 37), (11, 33), (25, 32), (33, 31), (36, 24), (43, 12), (51, 11), (48, 4), (40, -3), (40, -15), (35, -24), (30, -31), (20, -35), (17, -29), (12, -17), (13, -8), (9, 0), (9, 4), (-4, 5), (-10, 5), (-15, 10)],
    [(-9, 37), (-9, 43), (-1, 44), (-4, 48), (3, 51), (8, 54), (8, 57), (12, 56), (11, 59), (5, 59), (6, 62), (14, 68), (26, 71), (40, 67), (44, 66), (60, 69), (70, 73), (88, 76), (105, 78), (113, 74), (130, 72), (160, 70), (180, 68), (180, 65), (170, 60), (163, 58), (156, 51), (155, 57), (142, 54), (135, 44), (129, 41), (127, 35), (122, 39), (118, 38), (122, 31), (120, 26), (110, 21), (108, 16), (109, 12), (105, 9), (100, 13), (98, 8), (103, 2), (100, 6), (98, 16), (94, 17), (90, 22), (86, 20), (80, 15), (78, 8), (73, 16), (72, 21), (67, 25), (57, 26), (52, 28), (48, 30), (51, 24), (56, 25), (59, 22), (55, 17), (45, 13), (43, 15), (39, 21), (35, 28), (36, 36), (27, 37), (26, 40), (29, 41), (40, 41), (41, 43), (37, 45), (31, 46), (28, 42), (24, 40), (23, 36), (20, 40), (19, 42), (13, 45), (18, 40), (16, 38), (12, 42), (8, 44), (3, 43), (0, 39), (-2, 37), (-6, 36)],
    [(114, -22), (122, -17), (130, -12), (136, -12), (137, -16), (142, -11), (146, -19), (153, -26), (151, -34), (146, -39), (140, -38), (135, -35), (129, -32), (123, -34), (115, -34)],
    [(-5, 50), (1, 51), (0, 54), (-2, 56), (-3, 58), (-6, 57), (-5, 54)], [(-10, 52), (-6, 52), (-6, 55), (-10, 54)],
    [(130, 32), (136, 34), (141, 36), (142, 40), (141, 45), (145, 44), (141, 41), (139, 37), (133, 35)],
    [(44, -25), (47, -25), (50, -15), (49, -12), (44, -17)], [(167, -46), (171, -44), (174, -41), (178, -38), (174, -36), (173, -40), (169, -44)],
    [(95, 5), (104, -5), (106, -6), (100, 0)], [(109, 1), (114, 5), (119, 5), (117, -3), (111, -3)], [(131, -1), (141, -3), (148, -6), (147, -10), (141, -9), (134, -4)],
    [(105, -6), (114, -7), (114, -8.5), (106, -7.5)], [(-24, 65), (-14, 66), (-14, 64), (-22, 63.5)], [(120, 18), (122, 18), (126, 7), (122, 7), (120, 13)],
    [(-85, 22), (-75, 20), (-74, 19.5), (-84, 21)], [(80, 9.5), (82, 8), (81, 6), (80, 7)], [(-180, 65), (-170, 66), (-172, 64), (-180, 63)],
]
PW, PH = 1536, 768
sea = _lib.canvas(PW, PH, (0.16, 0.42, 0.72))
X, Y = _lib.grid_xy(sea)
lon, lat = X * 360 - 180, 90 - Y * 180
sea *= (0.9 + 0.1 * np.cos(np.radians(lat)))[..., None]
land = np.zeros(X.shape, dtype=bool)
for p in LANDS:
    land |= _lib.inside(lon, lat, p)
land |= lat < -72 - 4 * np.sin(np.radians(lon * 3)) - 2 * np.sin(np.radians(lon * 7 + 40))
# pastel patchwork "countries": a jittered cell pattern over the land
PAL = np.array([(0.96, 0.86, 0.45), (0.93, 0.62, 0.55), (0.62, 0.8, 0.52), (0.95, 0.72, 0.42), (0.78, 0.66, 0.85), (0.9, 0.88, 0.7), (0.56, 0.78, 0.7)], dtype=np.float32)
jl = lon + 6 * np.sin(np.radians(lat * 7)) + 4 * np.sin(np.radians(lat * 13 + 50))
jt = lat + 5 * np.sin(np.radians(lon * 5)) + 3 * np.sin(np.radians(lon * 11 + 20))
cell = (np.floor(jl / 17).astype(int) * 7 + np.floor(jt / 13).astype(int) * 13) % len(PAL)
px = sea.copy()
px[land] = PAL[cell][land]
ice = land & (np.abs(lat) > 70)
px[ice] = (0.94, 0.95, 0.96)
# coast and border lines: where the land mask or the cell changes
edge = np.zeros(X.shape, dtype=bool)
edge[:, 1:] |= land[:, 1:] != land[:, :-1]
edge[1:, :] |= land[1:, :] != land[:-1, :]
bord = np.zeros(X.shape, dtype=bool)
bord[:, 1:] |= cell[:, 1:] != cell[:, :-1]
bord[1:, :] |= cell[1:, :] != cell[:-1, :]
px[bord & land & ~ice] *= 0.72
px[edge] = (0.08, 0.2, 0.42)
# the graticule: every 15 degrees, the equator and the tropics heavier
dl = np.abs(((lon + 7.5) % 15) - 7.5) * np.cos(np.radians(lat))
dt = np.abs(((lat + 7.5) % 15) - 7.5)
grat = ((dl < 0.22) | (dt < 0.22)) & (np.abs(lat) < 84)
px[grat] = px[grat] * 0.55 + np.array((0.05, 0.12, 0.3), dtype=np.float32) * 0.45
eq = (np.abs(lat) < 0.5) | (np.abs(np.abs(lat) - 23.5) < 0.25)
px[eq] = px[eq] * 0.3 + np.array((0.6, 0.1, 0.1), dtype=np.float32) * 0.7
map_m = _lib.image_mat("globe_map", _lib.save_image("globe_map", px), rough=0.32)
# --- the stand --------------------------------------------------------------------------------------------------
black = comp.mat("globe_base", (0.03, 0.025, 0.02), rough=0.3)
brass = comp.mat("globe_brass", (0.78, 0.6, 0.28), rough=0.22, metal=1.0)
RB, RM, TILT = 0.15, 0.163, 23.5
CZ = 0.07 + RM
base = [(0.0, 0.0), (0.085, 0.0), (0.09, 0.006), (0.088, 0.014), (0.07, 0.02), (0.05, 0.024), (0.03, 0.03), (0.018, 0.04), (0.014, 0.05), (0.02, 0.058), (0.014, 0.066), (0.012, 0.075), (0.0, 0.075)]
M("globe_base", _lib.turn(base, seg=40), black, smooth=True)
M("globe_felt", comp.cyl(0.082, 0.002, at=(0, 0, -0.0005), seg=32), comp.mat("globe_felt", (0.1, 0.25, 0.12), rough=0.95))
# the half-meridian: a flat brass band from pole to pole, tilted
import bmesh
arc = bmesh.new()
N = 48
ring = []
for i in range(N + 1):
    a = math.radians(-92 + 184 * i / N)
    for r, y in ((RM - 0.004, -0.006), (RM + 0.004, -0.006), (RM + 0.004, 0.006), (RM - 0.004, 0.006)):
        ring.append(arc.verts.new((r * math.cos(a), y, r * math.sin(a))))
for i in range(N):
    for k in range(4):
        a0, a1 = i * 4 + k, i * 4 + (k + 1) % 4
        arc.faces.new((ring[a0], ring[a1], ring[a1 + 4], ring[a0 + 4]))
arc.faces.new(ring[0:4]); arc.faces.new(ring[-4:])
bmesh.ops.recalc_face_normals(arc, faces=arc.faces)
TX = T(0, 0, CZ) @ R(TILT, "Y")
mo = M("globe_meridian", xf(arc, TX), brass, smooth=False)
comp.bevel(mo, 0.001, 1)
ticks = []
for i in range(1, 36):
    a = math.radians(-90 + i * 5)
    t = comp.box((0.0006, 0.004 if i % 3 else 0.008, 0.0012))
    xf(t, T(RM + 0.0042, -0.004 + (0.002 if i % 3 else 0.004), 0)); xf(t, R(-math.degrees(a), "Y"))
    ticks.append(xf(t, TX))
M("globe_ticks", comp.merge(*ticks), comp.mat("globe_tick", (0.1, 0.07, 0.03), rough=0.5))
M("globe_collar", comp.cyl(0.011, 0.012, at=(0, 0, 0.066), seg=16), brass, smooth=True)
# the ball on its axis: tilt holds the lean, spin turns about the leaning axis
tilt = comp.pivot(col, root, "globe_tilt", (0, 0, CZ))
spin = comp.pivot(col, root, "globe_spin", (0, 0, CZ), parent=tilt)
ball = _lib.uv_sphere(RB, seg=64, rings=32)
xf(ball, T(0, 0, CZ))
M("globe_ball", ball, map_m, parent=spin, smooth=True)
pins = comp.merge(comp.cyl(0.004, RM - RB + 0.01, at=(0, 0, CZ + RB - 0.002), seg=10), comp.cyl(0.004, RM - RB + 0.01, at=(0, 0, CZ - RM - 0.008), seg=10),
                  comp.cyl(0.008, 0.006, at=(0, 0, CZ + RM + 0.004), seg=14), comp.cyl(0.011, 0.003, at=(0, 0, CZ + RB), seg=14), comp.cyl(0.011, 0.003, at=(0, 0, CZ - RB - 0.003), seg=14))
M("globe_pins", pins, brass, parent=spin, smooth=True)
tilt.rotation_euler[1] = math.radians(TILT)
bpy.context.view_layer.update()
comp.channel("spin", [(spin, "rotation_euler", 2, 0, 2 * math.pi)])
comp.export(col, root, _lib.PLACE, "globe", made="blender/components/bedroom/globe.py", source="own geometry and our own painted map (blender/src/bedroom/globe_map.png)", license="ours", credit="",
            rig={"spin": "the ball (globe_spin) one whole turn eastward about its axis, which leans 23.5 degrees toward +x; loops"},
            notes="the ball is 0.30 m across, its centre 0.233 m above the desk")
