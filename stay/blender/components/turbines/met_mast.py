# turbines/met-mast: a guyed lattice meteorological mast, 50 m, modelled by hand: three tubular legs 0.5 m apart braced
# by horizontals and diagonals every 1.25 m, red and white in 5 m bands, three levels of guy wires down to three
# anchor blocks 16 m out, booms at 20, 35 and 49 m each carrying a cup anemometer, a wind vane on the top boom, an
# aviation light, a lightning spike, and at the foot a logger cabinet with its solar panel on a concrete pad. The
# light is its own material (mast_beacon). Rig: "cups" spins all three anemometers one whole turn; "vane" swings the
# wind vane 90 degrees.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, sphere
from mathutils import Vector

col, root = comp.fresh("met_mast")
red = comp.mat("mast_red", (0.6, 0.04, 0.03), rough=0.45)
white = comp.mat("mast_white", (0.8, 0.8, 0.8), rough=0.45)
steel = comp.mat("mast_steel", (0.55, 0.56, 0.58), rough=0.4, metal=1.0)
dark = comp.mat("mast_dark", (0.02, 0.02, 0.025), rough=0.5)
panel = comp.mat("mast_solar", (0.01, 0.015, 0.05), rough=0.15)
conc = comp.ph_texture("mast_concrete", "concrete_floor_worn_001", tile=3.0, res="1k")
beacon = comp.mat("mast_beacon", (0.9, 0.05, 0.03), rough=0.3, emit=(1.0, 0.06, 0.03), strength=6000.0)
M = _lib.maker(col, root)
H, SIDE, BAY = 50.0, 0.5, 1.25


def rod(a, b, r, seg=5):
    a, b = Vector(a), Vector(b)
    bm = comp.cyl(r, (b - a).length, seg=seg)
    xf(bm, (b - a).to_track_quat("Z", "Y").to_matrix())
    return xf(bm, T(*a))


RL = SIDE / math.sqrt(3)
legs = [(RL * math.cos(math.radians(90 + k * 120)), RL * math.sin(math.radians(90 + k * 120))) for k in range(3)]
bands = {0: [], 1: []}
nb = int(H / BAY)
for i in range(nb):
    z0, z1 = i * BAY, (i + 1) * BAY
    c = (i // 4) % 2
    for k in range(3):
        a, b = legs[k], legs[(k + 1) % 3]
        bands[c].append(rod((a[0], a[1], z0), (a[0], a[1], z1), 0.02, seg=6))
        bands[c].append(rod((a[0], a[1], z1), (b[0], b[1], z1), 0.009))
        bands[c].append(rod((a[0], a[1], z0), (b[0], b[1], z1), 0.009) if i % 2 == 0 else rod((b[0], b[1], z0), (a[0], a[1], z1), 0.009))
M("met_mast_lattice_red", comp.merge(*bands[0]), red)
M("met_mast_lattice_white", comp.merge(*bands[1]), white)
# the guys: three directions, three levels, to anchors 16 m out
guys, anchors = [], []
for k in range(3):
    a = math.radians(k * 120)
    ax, ay = 16 * math.cos(a), 16 * math.sin(a)
    for z in (16.0, 32.0, 47.0):
        guys.append(rod((legs[k][0], legs[k][1], z), (ax, ay, 0.3), 0.012, seg=5))
    anchors.append(comp.box((1.0, 1.0, 0.8), at=(ax, ay, 0.05)))
    guys.append(comp.cyl(0.03, 0.3, at=(ax, ay, 0.3), seg=8))
M("met_mast_guys", comp.merge(*guys), steel)
an = M("met_mast_anchors", comp.merge(*anchors, comp.box((1.4, 1.4, 0.3), at=(0, 0, 0.1))), conc)
comp.uv_box(an, 1.0)
# the booms and instruments
cup_pivots, booms = [], []
for i, (z, ang) in enumerate(((20.0, 200), (35.0, 200), (49.0, 200))):
    d = Vector((math.cos(math.radians(ang)), math.sin(math.radians(ang)), 0))
    tip = d * 2.4 + Vector((0, 0, z))
    booms += [rod(d * 0.2 + Vector((0, 0, z)), tip, 0.02, seg=6), rod(d * 0.2 + Vector((0, 0, z - 0.8)), d * 1.6 + Vector((0, 0, z)), 0.012), comp.cyl(0.014, 0.45, at=tip, seg=6)]
    cp = comp.pivot(col, root, f"met_mast_cups_{i + 1}", tip + Vector((0, 0, 0.5)))
    cups = [comp.cyl(0.022, 0.07, at=(tip.x, tip.y, tip.z + 0.44), seg=8)]
    for k in range(3):
        c = comp.merge(rod((0, 0, 0), (0.13, 0, 0), 0.006), sphere(0.045, (0.13, 0.04, 0), u=10, v=6))
        xf(c, R(k * 120, "Z")); xf(c, T(tip.x, tip.y, tip.z + 0.5))
        cups.append(c)
    M(f"met_mast_cups_{i + 1}_mesh", comp.merge(*cups), dark, parent=cp, smooth=True)
    cup_pivots.append(cp)
d2 = Vector((math.cos(math.radians(20)), math.sin(math.radians(20)), 0))
vt = d2 * 2.4 + Vector((0, 0, 49.0))
booms += [rod(d2 * 0.2 + Vector((0, 0, 49.0)), vt, 0.02, seg=6), comp.cyl(0.014, 0.45, at=vt, seg=6)]
M("met_mast_booms", comp.merge(*booms), steel)
vp = comp.pivot(col, root, "met_mast_vane", vt + Vector((0, 0, 0.5)))
vane = comp.merge(rod((0, -0.22, 0), (0, 0.24, 0), 0.008), comp.box((0.008, 0.2, 0.16), at=(0, 0.28, 0)), sphere(0.028, (0, -0.22, 0), u=8, v=6))
xf(vane, T(vt.x, vt.y, vt.z + 0.5))
M("met_mast_vane_mesh", vane, dark, parent=vp)
M("met_mast_top", comp.merge(comp.cyl(0.03, 0.4, at=(0, 0, H), seg=8), rod((0, 0, H + 0.4), (0, 0, H + 1.6), 0.008), comp.box((0.3, 0.3, 0.02), at=(0, 0, H))), steel)
M("met_mast_beacon", _lib.lathe([(0.07, 0.0), (0.08, 0.1), (0.06, 0.18), (0.0, 0.21)], seg=14, z0=H + 0.02, at=(0.12, 0.0)), beacon, smooth=True)
# the logger cabinet and its solar panel
cab = M("met_mast_logger", comp.merge(comp.box((0.6, 0.3, 0.8), at=(0.0, -0.75, 1.3)), comp.cyl(0.035, 1.7, at=(0, -0.58, 0.2), seg=8)), white)
comp.bevel(cab, 0.01, 2)
sp = comp.merge(comp.box((1.0, 0.03, 0.65), at=(0, 0, 0)))
xf(sp, R(-35, "X")); xf(sp, T(0, -0.8, 2.25))
M("met_mast_solar_panel", sp, panel)
M("met_mast_logger_fittings", comp.merge(comp.box((0.04, 0.02, 0.1), at=(0.22, -0.91, 1.3)), comp.tube([(0, -0.6, 1.0), (0.05, -0.4, 0.6), (0.2, -0.2, 0.3), (0.25, 0.1, 0.25)], 0.012, sides=2)), dark)
comp.channel("cups", [(c, "rotation_euler", 2, 0, 2 * math.pi) for c in cup_pivots])
comp.channel("vane", [(vp, "rotation_euler", 2, 0, math.radians(90))])
comp.export(col, root, "turbines", "met_mast", made="blender/components/turbines/met_mast.py", source="own geometry (a generic guyed lattice met mast); concrete: https://polyhaven.com/a/concrete_floor_worn_001",
            license="ours; texture CC0", credit="Poly Haven (concrete_floor_worn_001)",
            rig={"cups": "the three cup anemometers each one whole turn on its spindle", "vane": "the wind vane swings 90 degrees on the top boom",
                 "beacon": "in the scene: the material mast_beacon (the aviation light at the top)"},
            notes="origin: the mast's foot; the guys reach anchors 16 m out in three directions (+x along the crest, back left, front left)")
