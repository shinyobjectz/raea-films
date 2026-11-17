# laundromat/bin: the lint and rubbish bin, 0.8 m, modelled by hand: a round grey plastic tub with a rolled rim and
# moulded handles, a domed lid with a swing flap on its own axle, a lint-grey liner bag folded over the rim, and
# beside it a full tied rubbish bag (Poly Haven's trashbag, CC0). Rig: "flap" swings the lid's flap 50 degrees in
# (something dropped through it).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rod, rbox, label, ph_add, T, R, S, xf
import bmesh

col, root = comp.fresh("bin")
M = _lib.maker(col, root)
tub = comp.mat("bin_plastic", (0.36, 0.38, 0.4), rough=0.5)
lid = comp.mat("bin_lid", (0.16, 0.17, 0.19), rough=0.45)
bag = comp.mat("bin_liner", (0.03, 0.03, 0.035), rough=0.35)
white = comp.mat("bin_print", (0.92, 0.92, 0.9), rough=0.5)
b = M("bin_tub", turn([(0.0, 0.012), (0.17, 0.012), (0.185, 0.0), (0.19, 0.02), (0.225, 0.6), (0.235, 0.605), (0.235, 0.62), (0.215, 0.62), (0.18, 0.03), (0.0, 0.03)], seg=40), tub, smooth=True)
M("bin_ribs", comp.merge(*[turn([(0.19 + 0.035 * (z - 0.02) / 0.58 + 0.001, z - 0.008), (0.19 + 0.035 * (z - 0.02) / 0.58 + 0.006, z), (0.19 + 0.035 * (z - 0.02) / 0.58 + 0.001, z + 0.008)], seg=40) for z in (0.2, 0.42)]), tub, smooth=True)
M("bin_handles", comp.merge(*[rbox((0.03, 0.12, 0.03), at=(s * 0.245, 0, 0.55), r=0.01) for s in (-1, 1)]), tub, smooth=True)
M("bin_liner", turn([(0.236, 0.56), (0.24, 0.6), (0.238, 0.625), (0.215, 0.63), (0.21, 0.6)], seg=40), bag, smooth=True)
dome = turn([(0.24, 0.62), (0.242, 0.66), (0.22, 0.73), (0.16, 0.78), (0.09, 0.8), (0.0, 0.805)], seg=40)
bmesh.ops.bisect_plane(dome, geom=dome.verts[:] + dome.edges[:] + dome.faces[:], plane_co=(0, -0.12, 0.7), plane_no=(0, -0.75, 0.66), clear_outer=True)
d = M("bin_lid", dome, lid, smooth=True)
comp.solidify(d, 0.005, 1)
M("bin_lid_dark", comp.cyl(0.2, 0.004, at=(0, 0, 0.64), seg=32), bag)
fp = comp.pivot(col, root, "bin_flap", (0, -0.085, 0.762))
fl = xf(xf(rbox((0.26, 0.004, 0.15), at=(0, 0, -0.07), r=0.002, seg=1), R(-41.5, "X")), T(0, -0.085, 0.762))
M("bin_flap_plate", fl, lid, parent=fp)
M("bin_flap_print", xf(xf(label("LINT + LITTER", 0.026, (0, -0.0026, -0.07)), R(-41.5, "X")), T(0, -0.085, 0.762)), white, parent=fp)
M("bin_flap_axle", rod((-0.135, -0.085, 0.762), (0.135, -0.085, 0.762), 0.005, seg=8), lid)
parts, credit = ph_add(col, root, "trashbag", "bin_bag", at=(0.52, 0.06, 0), turn_deg=40, scale=0.85)
_lib.channel("flap", [(fp, "rotation_euler", 0, 0, math.radians(50))])
comp.export(col, root, _lib.PLACE, "bin", made="blender/components/laundromat/bin.py", source="own geometry (a generic swing-lid bin); the tied bag: https://polyhaven.com/a/trashbag", license="ours; CC0", credit=credit,
            rig={"flap": "the lid's flap swings 50 degrees in on its axle (bin_flap)"})
