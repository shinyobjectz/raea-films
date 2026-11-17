# observatory/dome: the turning dome, modelled by hand: a 9 m hemisphere lined in painted boards (Poly Haven
# white_planks_clean) on a steel frame of twenty-two meridian ribs and four purlin rings, a base ring beam with its
# rack, two arch girders and a cross girder framing the slit (1.5 m wide, from the ring up over the zenith and 80 cm
# beyond), and the slit's two shutter leaves riding outside the skin on their own ribs and rollers. The origin is the
# middle of the ring's foot (set it on the wall's track, 2.74 m up); the slit faces +y, away from the camera.
# Rig: "open" slides the two leaves 80 cm apart each way, clearing the whole slit (the cursor's drag); "turn" turns
# the dome, leaves and all, one whole turn on its track.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, pipe, rod, T, R, S, xf, RD, SW, YB, Vector

col, root = comp.fresh("dome")
M = _lib.maker(col, root)
boards = comp.ph_texture("dome_boards", "white_planks_clean", tile=1.8, res="2k", tint=(0.74, 0.78, 0.72))
steel = comp.mat("dome_frame", (0.2, 0.24, 0.23), rough=0.45, metal=0.6)
leaf_m = comp.ph_texture("dome_shutter", "white_planks_clean", tile=1.8, res="2k", tint=(0.5, 0.55, 0.52))
brass = comp.mat("dome_brass", (0.72, 0.55, 0.22), rough=0.3, metal=1.0)
turn = comp.pivot(col, root, "dome_turn", (0, 0, 0))
in_slit = lambda x, y, m=0.0: abs(x) < SW + m and y > YB - m

skin = M("dome_skin", _lib.dome_cut(RD, lambda x, y, z: not in_slit(x, y), cuts_x=(-SW, SW), cuts_y=(YB,)), boards, parent=turn)
_lib.uv_round(skin, RD, sphere=True)
comp.solidify(skin, 0.08, offset=1.0)

RF = RD - 0.045
frame = []
for i in range(24):                                   # the meridian ribs, stopping at the slit's girders or the crown ring
    az = math.radians(i * 15)
    pts = []
    for e in range(0, 80, 3):
        el = math.radians(e)
        p = (RF * math.cos(el) * math.cos(az), RF * math.cos(el) * math.sin(az), RF * math.sin(el))
        if in_slit(p[0], p[1], 0.1):
            break
        pts.append(p)
    if len(pts) > 3:
        frame.append(pipe(pts, 0.035, sides=2))
for e in (17, 34, 51, 66, 78):                         # the purlin rings, broken at the slit
    el = math.radians(e)
    ring = [(RF * math.cos(el) * math.cos(math.radians(a)), RF * math.cos(el) * math.sin(math.radians(a)), RF * math.sin(el)) for a in range(0, 360, 3)]
    ok = [not in_slit(p[0], p[1], 0.08) for p in ring]
    if all(ok):
        frame.append(pipe(ring, 0.028, sides=2, cyclic=True))
        continue
    start = next(i for i in range(len(ring)) if not ok[i - 1] and ok[i])
    run = []
    for j in range(len(ring)):
        i = (start + j) % len(ring)
        if ok[i]:
            run.append(ring[i])
        elif len(run) > 2:
            frame.append(pipe(run, 0.028, sides=2))
            run = []
        else:
            run = []
    if len(run) > 2:
        frame.append(pipe(run, 0.028, sides=2))
GX = SW + 0.07
rho = math.sqrt(RF ** 2 - GX ** 2)
a_end = math.acos((YB - 0.09) / rho)
for sx in (-1, 1):                                    # the slit's arch girders
    frame.append(pipe([(sx * GX, rho * math.cos(a), rho * math.sin(a)) for a in (a_end * i / 40 for i in range(41))], 0.065, sides=2))
yc = YB - 0.09
frame.append(pipe([(x, yc, math.sqrt(RF ** 2 - yc ** 2 - x ** 2)) for x in (-GX + 2 * GX * i / 10 for i in range(11))], 0.065, sides=2))
M("dome_frame", comp.merge(*frame), steel, parent=turn)
M("dome_ring", lathe([(RD - 0.1, 0.0), (RD + 0.12, 0.0), (RD + 0.12, 0.2), (RD - 0.1, 0.2), (RD - 0.1, 0.0)], seg=96), steel, parent=turn, smooth=False)
M("dome_rack", comp.merge(*[xf(comp.box((0.035, 0.03, 0.05)), R(a, "Z") @ T(RD - 0.115, 0, 0.1)) for a in (i * 1.5 for i in range(240))]), brass, parent=turn, smooth=False)

# the shutter leaves: outside the skin, each a strip of sphere half the slit wide and a hand more, ribbed inside
RS = RD + 0.13
keys = []
for sx, name in ((-1, "left"), (1, "right")):
    piv = comp.pivot(col, root, f"dome_shutter_{name}", (0, 0, 0), parent=turn)
    keep = lambda x, y, z, sx=sx: 0 < sx * x < SW + 0.1 and y > YB - 0.2 and z > 0.2
    leaf = M(f"dome_shutter_{name}_leaf", _lib.dome_cut(RS, keep, cuts_x=(0, sx * (SW + 0.1)), cuts_y=(YB - 0.2,)), leaf_m, parent=piv)
    _lib.uv_round(leaf, RS, sphere=True)
    comp.solidify(leaf, 0.03, offset=1.0)
    ribs = []
    xm = sx * (SW + 0.1) / 2
    rr = math.sqrt((RS - 0.03) ** 2 - xm ** 2)
    ae = math.acos((YB - 0.18) / rr)
    for k in range(1, 16):
        a = ae * k / 16
        y, z = rr * math.cos(a), rr * math.sin(a)
        if z > 0.3:
            ribs.append(rod((sx * 0.03, y, math.sqrt(max((RS - 0.03) ** 2 - y * y - 0.03 ** 2, 0))), (sx * (SW + 0.07), y * 0.999, math.sqrt(max((RS - 0.03) ** 2 - y * y - (SW + 0.07) ** 2, 0))), 0.018, seg=6))
    for xe in (sx * 0.03, sx * (SW + 0.07)):
        r2 = math.sqrt((RS - 0.03) ** 2 - xe ** 2)
        a2 = math.acos((YB - 0.18) / r2)
        ribs.append(pipe([(xe, r2 * math.cos(a), r2 * math.sin(a)) for a in (0.05 + (a2 - 0.05) * i / 40 for i in range(41))], 0.022, sides=2))
    M(f"dome_shutter_{name}_ribs", comp.merge(*ribs), steel, parent=piv)
    keys.append((piv, "location", 0, 0.0, sx * (SW + 0.05)))
_lib.channel("open", keys)
_lib.channel("turn", [(turn, "rotation_euler", 2, 0, 2 * math.pi)])
comp.export(col, root, "observatory", "dome", made="blender/components/observatory/dome.py", source="own geometry; Poly Haven texture white_planks_clean", license="CC0", credit="Poly Haven",
            rig={"open": "the slit's two shutter leaves slide 80 cm apart each way, clearing the whole 1.5 m slit", "turn": "the dome, leaves and all, one whole turn on its track"},
            notes="origin: the middle of the ring beam's foot; set it on the wall's rollers (2.74 m up). inside radius 4.5 m; the slit faces Blender +y (raea -z), from the ring over the zenith")
