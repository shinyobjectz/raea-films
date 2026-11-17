# pool/pace-clock: a swimmers' pace clock for the wall, 80 cm across, modelled by hand: a white case with a navy rim,
# a face with sixty second ticks, twelve numerals from 5 to 60, and two sweep hands in one line, red and blue, thirty
# seconds apart. Its origin is its middle, its back on the wall (y 0). The office's wall clock is a Poly Haven one;
# this is the pool's. Rig: "sweep" takes the hands one whole turn, clockwise from the front (a minute).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("pace_clock")
case_m = comp.mat("pool_clock_case", (0.92, 0.92, 0.9), rough=0.4)
rim_m = comp.mat("pool_clock_rim", (0.04, 0.12, 0.34), rough=0.35)
ink = comp.mat("pool_clock_ink", (0.02, 0.02, 0.03), rough=0.5)
red = comp.mat("pool_clock_red", (0.85, 0.06, 0.04), rough=0.4)
blue = comp.mat("pool_clock_blue", (0.04, 0.2, 0.75), rough=0.4)
st = steel("pool_steel", 0.25)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
RAD, DEP = 0.4, 0.07
M("pace_clock_case", turn([(0.0, 0.0), (RAD - 0.01, 0.0), (RAD - 0.01, DEP - 0.012), (0.0, DEP - 0.012)], seg=64, axis="Y", at=(0, -DEP, 0)), case_m, smooth=False)
RD = DEP + 0.022   # the rim stands proud of the face
M("pace_clock_rim", turn([(RAD - 0.035, 0.022), (RAD - 0.03, 0.004), (RAD - 0.012, 0.0), (RAD, 0.006), (RAD, RD - 0.006), (RAD - 0.012, RD), (RAD - 0.035, RD)], seg=64, axis="Y", at=(0, -RD, 0)), rim_m, smooth=True)
FY = -DEP - 0.001
ticks, nums = [], []
for i in range(60):
    a = i * 6
    big = i % 5 == 0
    ticks.append(xf(comp.box((0.012 if big else 0.005, 0.002, 0.045 if big else 0.024)), R(a, "Y") @ T(0, FY - 0.0, RAD - 0.06 - (0.0225 if big else 0.012))))
for i in range(1, 13):
    a = math.radians(i * 30)
    nums.append(xf(comp.text(str(i * 5), 0.062, depth=0.002), T(math.sin(a) * (RAD - 0.155), FY - 0.001, math.cos(a) * (RAD - 0.155))))
M("pace_clock_ticks", comp.merge(*ticks), ink)
M("pace_clock_numerals", comp.merge(*nums), ink)
hands = comp.pivot(col, root, "pace_clock_hands", (0, FY - 0.012, 0))
def hand(up, m, n, y):
    s = 1 if up else -1
    bm = bmesh.new()
    pts = [(-0.012, 0.0), (0.012, 0.0), (0.009, s * 0.27), (0.03, s * 0.27), (0.0, s * 0.335), (-0.03, s * 0.27), (-0.009, s * 0.27)]
    face(bm, [(x, y, z) for x, z in pts], (0, -1, 0))
    o = M(n, bm, m, parent=hands)
    comp.solidify(o, 0.003, 0)
hand(True, red, "pace_clock_hand_red", FY - 0.012)
hand(False, blue, "pace_clock_hand_blue", FY - 0.0125)
M("pace_clock_hub", turn([(0.0, 0.0), (0.022, 0.0), (0.022, 0.012), (0.012, 0.018), (0.0, 0.018)], seg=20, axis="Y", at=(0, FY - 0.026, 0)), st, parent=hands, smooth=True)
M("pace_clock_bracket", comp.merge(comp.box((0.12, 0.012, 0.9), at=(0, -0.006, 0)), comp.cyl(0.006, 0.004, at=(0, -0.012, 0.43), seg=8, axis="Y"), comp.cyl(0.006, 0.004, at=(0, -0.012, -0.43), seg=8, axis="Y")), st)
comp.channel("sweep", [(hands, "rotation_euler", 1, 0, 2 * math.pi)])
done(col, root, "pace_clock", source="own geometry (a generic swimmers' pace clock); numerals in Blender's built-in font (Bfont, GPL font exception: output is free)",
     rig={"sweep": "both hands one whole turn, clockwise from the front (sixty seconds)"})
