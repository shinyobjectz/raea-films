# cathedral/arcade-bay: one 4.5 m bay of the nave's wall above the piers, modelled by hand: the arcade arch in two
# orders with a roll moulding, a string course, a triforium of four small arches on colonettes before a dark passage,
# a second string course, and the clerestory, two lancets of pale quarry glass (cathedral_grisaille, which glows).
# It stands on the piers: its origin is on the floor under its middle, on the wall's centre line, its stone runs from
# the piers' tops at 5.5 m to 14.3 m, and its face is toward -y (the nave). A vaulting shaft climbs each end of it to
# the vault's springing at 10.3 m. No rig; the glass's glow is the scene's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("arcade_bay")
stone, dressed = L.stone(), L.plain_stone()
glass = L.grisaille()
dark = comp.mat("cathedral_shadow", (0.02, 0.02, 0.022), rough=0.95)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
BAY, TH, Z0, ZT = 4.5, 0.9, 5.5, 14.3
SPAN = 3.5
pts, apex = L.arch(SPAN, Z0, Z0, n=16)
outline = [(-BAY / 2, Z0)] + list(reversed(pts[2:])) + [(BAY / 2, Z0), (BAY / 2, ZT), (-BAY / 2, ZT)]
holes = []
TRI = [(-1.5 + i * 1.0) for i in range(4)]
for x in TRI:
    holes.append(L.arch(0.62, 9.75, 9.15, at=x, n=8)[0])
LAN = (-0.62, 0.62)
for x in LAN:
    holes.append(L.arch(0.86, 12.3, 10.95, at=x, n=10)[0])
w = M("arcade_bay_wall", xf(L.plate([outline] + holes, TH), T(0, TH / 2, 0)), stone)
L.finish(w, 1.0)
# the arch's inner order and its roll
ip, _ = L.arch(SPAN - 0.5, Z0, Z0, n=16)
ring = list(reversed(pts[2:])) + ip[2:]
o2 = M("arcade_bay_inner_order", xf(L.plate([ring], 0.5), T(0, 0.25, 0)), dressed)
comp.bevel(o2, 0.03, 2, angle=50)
roll = [(x, -TH / 2 - 0.02, z) for x, z in L.arch(SPAN + 0.16, Z0, Z0, n=16)[0][2:]]
M("arcade_bay_arch_roll", comp.merge(L.sweep(roll, 0.06), L.sweep([(x, TH / 2 + 0.02, z) for x, y, z in roll], 0.06)), dressed, smooth=True)
# string courses
sc = []
for z in (8.92, 10.6):
    sc += [comp.box((BAY, 0.1, 0.1), at=(0, -TH / 2 - 0.05, z)), comp.cyl(0.04, BAY, at=(-BAY / 2, -TH / 2 - 0.09, z - 0.03), seg=10, axis="X")]
s = M("arcade_bay_string_courses", comp.merge(*sc), dressed)
# the triforium: the passage behind, colonettes between the openings
M("arcade_bay_passage", comp.box((BAY - 0.3, 0.04, 1.5), at=(0, TH / 2 - 0.05, 9.7)), dark)
cols = []
for x in [t - 0.5 for t in TRI] + [TRI[-1] + 0.5]:
    cols.append(xf(L.lathe([(0.075, 0.0), (0.075, 0.04), (0.05, 0.07), (0.05, 0.5), (0.06, 0.52), (0.085, 0.58), (0.09, 0.6), (0, 0.6)], seg=12), T(x, -TH / 2 - 0.03, 9.15)))
M("arcade_bay_colonettes", comp.merge(*cols), dressed, smooth=True)
tm = []
for x in TRI:
    tm.append(L.sweep([(px, -TH / 2 - 0.015, pz) for px, pz in L.arch(0.7, 9.75, 9.75, at=x, n=8)[0][2:]], 0.03))
M("arcade_bay_triforium_rolls", comp.merge(*tm), dressed, smooth=True)
# the clerestory glass, set mid wall, and its lead bars
for i, x in enumerate(LAN):
    g = M(f"arcade_bay_glass_{i + 1}", xf(L.plate([L.arch(0.9, 12.3, 10.93, at=x, n=10)[0]], 0.012), T(0, 0.1, 0)), glass)
    L.uv_planar(g, x - 0.45, 10.93, 0.9, 2.7)
M("arcade_bay_glazing_bars", comp.merge(*[comp.box((0.88, 0.02, 0.018), at=(x, 0.085, 11.2 + k * 0.38)) for x in LAN for k in range(4)]), comp.mat("cathedral_lead", (0.05, 0.05, 0.055), rough=0.5, metal=0.5))
M("arcade_bay_sill", comp.merge(*[xf(xf(comp.box((1.0, TH / 2 + 0.05, 0.05)), R(-25, "X")), T(x, -TH / 4, 10.93)) for x in LAN]), dressed)
# the vaulting shafts and their capitals
vs = []
for x in (-BAY / 2, BAY / 2):
    vs.append(comp.cyl(0.13, 10.3 - Z0 - 0.3, at=(x, -TH / 2 - 0.08, Z0), seg=20))
    for dx in (-0.17, 0.17):
        vs.append(comp.cyl(0.07, 10.3 - Z0 - 0.3, at=(x + dx, -TH / 2 - 0.03, Z0), seg=12))
    vs.append(xf(L.lathe([(0.2, 0.0), (0.23, 0.03), (0.2, 0.06), (0.2, 0.1), (0.3, 0.26), (0.34, 0.27), (0.34, 0.33), (0, 0.33)], seg=20), T(x, -TH / 2 - 0.08, 10.3 - 0.33)))
    vs.append(xf(L.lathe([(0.2, 0.0), (0.22, 0.03), (0.2, 0.06)], seg=20), T(x, -TH / 2 - 0.08, 8.9)))
M("arcade_bay_vault_shafts", comp.merge(*vs), dressed, smooth=True)
comp.export(col, root, "cathedral", "arcade_bay", made="blender/components/cathedral/arcade_bay.py",
            source="own geometry and glass painting (a three-storey Gothic bay); stone: https://polyhaven.com/a/large_sandstone_blocks_01", license="ours; texture CC0", credit="Poly Haven (large_sandstone_blocks_01)",
            rig={"glow": "in the scene: the material cathedral_grisaille's glow (the daylight in the clerestory)"},
            notes="Stands on two columns 4.5 m apart: place it on the floor midway between them and turn it so -y faces the nave. Its stone begins 5.5 m up.")
