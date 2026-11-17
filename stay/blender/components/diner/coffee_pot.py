# diner/coffee-pot: a two-burner coffee warmer with its two glass decanters, modelled by hand: a brushed steel base
# with two black hot plates, two rocker switches with red lamps (coffee_pot_lamp), and two bowl decanters of glass with
# coffee in them, a steel band, and a plastic collar and handle (black for regular, orange for decaf). 42 cm wide.
# Rig: "pour" lifts the right-hand pot 9 cm and tips it 55 degrees toward its spout (to the left, over a cup);
# "level" is the scene's (the coffee is its own node in each pot).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, rbox, T, R, S, xf

col, root = comp.fresh("coffee_pot")
M = _lib.maker(col, root)
steel = comp.mat("coffee_pot_steel", (0.72, 0.72, 0.74), rough=0.32, metal=1.0)
plate = comp.mat("coffee_pot_plate", (0.02, 0.02, 0.022), rough=0.6)
glass = comp.mat("coffee_pot_glass", (0.92, 0.95, 0.96), rough=0.03, alpha=0.22)
coffee = comp.mat("coffee_pot_coffee", (0.07, 0.03, 0.012), rough=0.08)
black = comp.mat("coffee_pot_black", (0.02, 0.02, 0.022), rough=0.4)
orange = comp.mat("coffee_pot_orange", (0.85, 0.3, 0.03), rough=0.4)
lamp = comp.mat("coffee_pot_lamp", (0.9, 0.1, 0.05), rough=0.3, emit=(1.0, 0.15, 0.05), strength=3.0)

b = M("coffee_pot_base", rbox((0.42, 0.2, 0.06), at=(0, 0, 0.036), r=0.008), steel, smooth=False)
M("coffee_pot_feet", comp.merge(*[comp.cyl(0.012, 0.008, at=(sx * 0.18, sy * 0.075, 0), seg=12) for sx in (-1, 1) for sy in (-1, 1)]), black)
BZ = 0.066
pots, lifts = [], []
for i, (x, m) in enumerate(((-0.105, orange), (0.105, black))):
    M(f"coffee_pot_hotplate_{i + 1}", lathe([(0, BZ), (0.072, BZ), (0.074, BZ + 0.003), (0.07, BZ + 0.005), (0, BZ + 0.005)], seg=40, at=(x, 0.01, 0)), plate)
    M(f"coffee_pot_switch_{i + 1}", rbox((0.022, 0.008, 0.014), at=(x - 0.03, -0.102, 0.036), r=0.002), black, smooth=False)
    M(f"coffee_pot_lamp_{i + 1}", rbox((0.012, 0.006, 0.012), at=(x + 0.03, -0.101, 0.036), r=0.002), lamp, smooth=False)
    Z = BZ + 0.005
    up = comp.pivot(col, root, f"coffee_pot_pot_{i + 1}_lift", (x, 0.01, Z))
    p = comp.pivot(col, root, f"coffee_pot_pot_{i + 1}", (x - 0.062, 0.01, Z + 0.165), parent=up)  # the hinge of a pour: the spout's lip
    lifts.append(up)
    at = (x, 0.01, Z)
    M(f"coffee_pot_pot_{i + 1}_glass", lathe([(0, 0.002), (0.05, 0.002), (0.066, 0.012), (0.078, 0.04), (0.08, 0.062), (0.073, 0.092), (0.058, 0.118), (0.052, 0.14), (0.058, 0.165),
                                             (0.056, 0.165), (0.05, 0.14), (0.056, 0.118), (0.071, 0.092), (0.078, 0.062), (0.076, 0.04), (0.064, 0.014), (0.05, 0.004), (0, 0.004)], seg=48, at=at), glass, parent=p)
    fill = 0.085 if i else 0.05
    rr = 0.0715 if i else 0.0765
    M(f"coffee_pot_pot_{i + 1}_coffee", lathe([(0, 0.005), (0.05, 0.005), (0.063, 0.014), (0.075, 0.04), (0.0765, 0.05)] + ([(0.0775, 0.062), (rr, fill)] if i else []) + [(0, fill)], seg=48, at=at), coffee, parent=p)
    M(f"coffee_pot_pot_{i + 1}_collar", lathe([(0.0525, 0.128), (0.056, 0.128), (0.0615, 0.168), (0.058, 0.168)], seg=48, at=at), m, parent=p)
    M(f"coffee_pot_pot_{i + 1}_band", lathe([(0.0575, 0.118), (0.0595, 0.118), (0.0545, 0.13), (0.0525, 0.13)], seg=48, at=at), steel, parent=p)
    h = _lib.pipe(_lib.fillet([(0.058, 0, 0.15), (0.115, 0, 0.15), (0.12, 0, 0.05), (0.085, 0, 0.035)], 0.02), 0.009, sides=3)
    xf(h, S(1, 1.5, 1)); xf(h, T(*at))
    M(f"coffee_pot_pot_{i + 1}_handle", h, m, parent=p)
    sp = comp.taper((-0.05, 0, 0.167), (-0.068, 0, 0.169), 0.03, 0.012, 0.012, 0.006)
    xf(sp, T(*at))
    M(f"coffee_pot_pot_{i + 1}_spout", sp, m, parent=p, smooth=False)
    pots.append(p)
p, up = pots[1], lifts[1]
# (comp.channel keeps one key a node in a clip: the lift and the tip are two nodes)
comp.channel("pour", [(up, "location", 2, up.location.z, up.location.z + 0.09), (p, "rotation_euler", 1, 0, math.radians(-55))])
comp.export(col, root, "diner", "coffee_pot", made="blender/components/diner/coffee_pot.py",
            source="own geometry (a generic two-burner warmer and bowl decanters)", license="ours", credit="",
            rig={"pour": "the right-hand pot (coffee_pot_pot_2) up 9 cm and tipped 55 degrees about its spout's lip, pouring to its left",
                 "level": "in the scene: each pot's coffee is its own node (coffee_pot_pot_N_coffee)",
                 "lamps": "in the scene: the material coffee_pot_lamp glows"})
