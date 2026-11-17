# cathedral/chandelier: a wrought-iron corona hung in the nave, modelled by hand: a hoop 1.7 m across with a pierced
# band of quatrefoils between two rails, twelve candles on prickets with drip pans, six fleur-de-lis standards between
# them, six rods up to a crown ring, and 4.2 m of chain to a ceiling rose. A ceiling piece: the rose's top is at
# the origin and the hoop hangs 5.6 m below. The flames are chandelier_flame.
# Rig: "sway" swings the whole corona 5 degrees about its fixing; "turn" turns the hoop a twelfth of a turn on its chain.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("chandelier")
iron, wax, brass = L.iron_mat(), L.wax_mat(), L.brass_mat()
flame_m = L.flame_mat("chandelier_flame")
RR, DROP, CROWN = 0.85, 5.6, 4.4
swing = comp.pivot(col, root, "chandelier_swing", (0, 0, -0.06))
turn = comp.pivot(col, root, "chandelier_turn", (0, 0, -CROWN), parent=swing)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
flat = lambda bm: xf(bm, R(90, "X"))        # _lib's torus stands in the xz plane; lay it level
M("chandelier_rose", comp.merge(L.lathe([(0.11, 0.0), (0.11, -0.012), (0.07, -0.03), (0.02, -0.05), (0.0, -0.05)][::-1], seg=24), xf(L.torus(0.022, 0.006, 12, 5), T(0, 0, -0.07))), iron, smooth=True)
M("chandelier_chain", L.chain((0, 0, -0.08), (0, 0, -CROWN + 0.06), link=0.07, r=0.007), iron, parent=swing, smooth=True)
hoop = [xf(flat(L.torus(RR, 0.012, 72, 6)), T(0, 0, -DROP + dz)) for dz in (0.0, 0.11)]
hoop.append(xf(flat(L.torus(0.16, 0.012, 32, 6)), T(0, 0, -CROWN)))
hoop.append(xf(L.torus(0.03, 0.008, 12, 5), T(0, 0, -CROWN + 0.035)))
for i in range(36):       # the pierced band: a ring of quatrefoils between the rails
    a = math.radians(10 * i)
    q = xf(L.torus(0.042, 0.005, 14, 4), R(math.degrees(a) + 90, "Z"))
    hoop.append(xf(q, T(RR * math.cos(a), RR * math.sin(a), -DROP + 0.055)))
for i in range(6):        # the rods to the crown ring, and the fleur-de-lis standards
    a = math.radians(60 * i + 30)
    p0 = (RR * math.cos(a), RR * math.sin(a), -DROP + 0.11)
    p1 = (0.16 * math.cos(a), 0.16 * math.sin(a), -CROWN)
    hoop.append(comp.tube([p0, ((p0[0] + p1[0]) / 2 * 1.12, (p0[1] + p1[1]) / 2 * 1.12, (p0[2] + p1[2]) / 2 - 0.08), p1], 0.007, res=6, sides=2))
    fl = comp.merge(comp.box((0.012, 0.004, 0.16), at=(0, 0, 0.08)), L.ball(0.022, (0, 0, 0.17), squash=(0.7, 0.3, 1.6)),
                    xf(L.torus(0.03, 0.005, 12, 4, arc=math.pi), T(-0.03, 0, 0.1)), xf(L.torus(0.03, 0.005, 12, 4, arc=math.pi), T(0.03, 0, 0.1)))
    hoop.append(xf(xf(fl, R(math.degrees(a) + 90, "Z")), T(p0[0], p0[1], p0[2])))
M("chandelier_hoop", comp.merge(*hoop), iron, parent=turn, smooth=True)
pans, candles, wicks, flames = [], [], [], []
for i in range(12):
    a = math.radians(30 * i)
    x, y, z = RR * math.cos(a), RR * math.sin(a), -DROP + 0.11
    pans.append(xf(L.lathe([(0.006, 0.0), (0.006, 0.04), (0.012, 0.045), (0.045, 0.055), (0.048, 0.068), (0.044, 0.062), (0.012, 0.052), (0.0, 0.052)], seg=16), T(x, y, z)))
    candles.append(L.lathe([(0.016, z + 0.052), (0.016, z + 0.21), (0.012, z + 0.218), (0.0, z + 0.214)], seg=12).copy())
    candles[-1] = xf(candles[-1], T(x, y, 0))
    wicks.append(comp.cyl(0.0012, 0.012, at=(x, y, z + 0.214), seg=5))
    flames.append(L.flame(0.045, at=(x, y, z + 0.224)))
M("chandelier_pans", comp.merge(*pans), brass, parent=turn, smooth=True)
M("chandelier_candles", comp.merge(*candles), wax, parent=turn, smooth=True)
M("chandelier_wicks", comp.merge(*wicks), comp.mat("cathedral_wick", (0.02, 0.02, 0.02), rough=0.9), parent=turn)
M("chandelier_flames", comp.merge(*flames), flame_m, parent=turn, smooth=True)
L.channel("sway", [(swing, "rotation_euler", 0, 0, math.radians(5))])
L.channel("turn", [(turn, "rotation_euler", 2, 0, math.radians(30))])
comp.export(col, root, "cathedral", "chandelier", made="blender/components/cathedral/chandelier.py", source="own geometry (a Gothic Revival iron corona)", license="ours", credit="",
            rig={"sway": "the chain and the corona swing 5 degrees about the ceiling fixing (chandelier_swing)", "turn": "the corona turns 30 degrees on its chain (chandelier_turn)",
                 "glow": "in the scene: the material chandelier_flame's glow and a warm light at the hoop"})
