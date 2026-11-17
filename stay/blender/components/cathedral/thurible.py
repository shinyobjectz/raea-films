# cathedral/thurible: a brass censer hanging on its stand, modelled by hand: a wrought-iron stand 1.75 m high on three
# scrolled feet with a crook at the top; from the crook a ring, a top plate, and four chains 0.75 m long down to the
# censer: a footed bowl, and a domed, pierced lid with a finial that the fourth chain lifts. Inside, the coals glow
# (thurible_coals). Rig: "swing" swings the censer and its chains 38 degrees about the crook, across the stand;
# "lid" lifts the lid 9 cm up its chains.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("thurible")
iron, brass = L.iron_mat(), L.brass_mat()
M = lambda n, bm, m, parent=None, smooth=True: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
HOOK = (0.0, -0.3, 1.62)
st = [comp.cyl(0.014, 1.72, at=(0, 0, 0.03), seg=12), L.lathe([(0.03, 0.9), (0.04, 0.92), (0.03, 0.94)], seg=12), L.lathe([(0.03, 0.2), (0.045, 0.23), (0.03, 0.26)], seg=12)]
for i in range(3):
    a = math.radians(120 * i + 90)
    d = (math.cos(a), math.sin(a))
    st.append(comp.tube([(0, 0, 0.3), (d[0] * 0.14, d[1] * 0.14, 0.2), (d[0] * 0.28, d[1] * 0.28, 0.04), (d[0] * 0.36, d[1] * 0.36, 0.015), (d[0] * 0.4, d[1] * 0.4, 0.05)], 0.011, res=8, sides=2))
    st.append(L.ball(0.018, (d[0] * 0.4, d[1] * 0.4, 0.055)))
st.append(comp.tube([(0, 0, 1.74), (0, -0.06, 1.84), (0, -0.2, 1.86), (0, -0.3, 1.78), (0, -0.3, 1.68), (0, -0.27, 1.65)], 0.011, res=10, sides=2))
M("thurible_stand", comp.merge(*st), iron)
sw = comp.pivot(col, root, "thurible_swing", (HOOK[0], HOOK[1], HOOK[2] + 0.06))
top = [xf(L.torus(0.022, 0.004, 14, 5), T(HOOK[0], HOOK[1], HOOK[2] + 0.04)), xf(L.lathe([(0.0, 0.0), (0.04, 0.0), (0.045, 0.006), (0.02, 0.016), (0.0, 0.02)], seg=20), T(HOOK[0], HOOK[1], HOOK[2] - 0.004))]
M("thurible_top_plate", comp.merge(*top), brass, parent=sw)
BZ = HOOK[2] - 0.78           # the bowl's rim
ch = []
for i in range(3):
    a = math.radians(120 * i + 30)
    ch.append(L.chain((HOOK[0] + 0.035 * math.cos(a), HOOK[1] + 0.035 * math.sin(a), HOOK[2]), (HOOK[0] + 0.075 * math.cos(a), HOOK[1] + 0.075 * math.sin(a), BZ + 0.005), link=0.014, r=0.0016, sides=3, seg=6))
M("thurible_chains", comp.merge(*ch), brass, parent=sw)
bowl = L.lathe([(0.0, -0.105), (0.04, -0.105), (0.045, -0.098), (0.03, -0.085), (0.026, -0.075), (0.05, -0.062), (0.074, -0.035), (0.08, 0.0), (0.076, 0.0), (0.07, -0.034), (0.046, -0.058), (0.0, -0.066)], seg=28, cap=False)
M("thurible_bowl", xf(comp.merge(bowl, *[L.ball(0.007, (0.08 * math.cos(math.radians(120 * i + 30)), 0.08 * math.sin(math.radians(120 * i + 30)), -0.004)) for i in range(3)]), T(HOOK[0], HOOK[1], BZ)), brass, parent=sw)
M("thurible_coals", xf(comp.merge(*[L.ball(0.018, (0.03 * math.cos(k * 2.1), 0.03 * math.sin(k * 2.1), -0.045 + 0.004 * (k % 3)), sub=1) for k in range(7)]), T(HOOK[0], HOOK[1], BZ)), comp.mat("thurible_coals", (0.25, 0.05, 0.02), rough=0.9, emit=(1.0, 0.25, 0.04), strength=2500.0), parent=sw, smooth=False)
lidp = comp.pivot(col, root, "thurible_lid", (HOOK[0], HOOK[1], BZ), parent=sw)
lid = [L.lathe([(0.08, 0.003), (0.082, 0.01), (0.076, 0.018), (0.07, 0.04), (0.052, 0.075), (0.03, 0.098), (0.014, 0.108), (0.014, 0.12), (0.022, 0.13), (0.012, 0.142), (0.006, 0.16), (0.0, 0.165)], seg=28, cap=False)]
for row, (z, r, n) in enumerate(((0.03, 0.074, 12), (0.058, 0.063, 10), (0.085, 0.043, 8))):   # the piercings, as dark lozenges
    for i in range(n):
        a = math.radians(360 / n * i + row * 15)
        lid.append(None)
        lid[-1] = xf(xf(L.ball(0.008, squash=(0.35, 0.8, 1.3), sub=1), R(math.degrees(a), "Z")), T(r * math.cos(a), r * math.sin(a), z))
holes = lid[1:]
M("thurible_lid_dome", xf(lid[0], T(HOOK[0], HOOK[1], BZ)), brass, parent=lidp)
M("thurible_lid_piercings", xf(comp.merge(*holes), T(HOOK[0], HOOK[1], BZ)), comp.mat("cathedral_shadow", (0.02, 0.02, 0.022), rough=0.95), parent=lidp)
M("thurible_lid_chain", L.chain((HOOK[0], HOOK[1], BZ + 0.165), (HOOK[0], HOOK[1], HOOK[2] - 0.004), link=0.014, r=0.0016, sides=3, seg=6), brass, parent=sw)
L.channel("swing", [(sw, "rotation_euler", 1, 0, math.radians(38))])
L.channel("lid", [(lidp, "location", 2, lidp.location.z, lidp.location.z + 0.09)])
comp.export(col, root, "cathedral", "thurible", made="blender/components/cathedral/thurible.py", source="own geometry (a brass thurible on an iron stand)", license="ours", credit="",
            rig={"swing": "the censer and its chains (thurible_swing) swing 38 degrees about the crook, across the stand", "lid": "the pierced lid (thurible_lid) rises 9 cm",
                 "glow": "in the scene: the material thurible_coals' glow"})
