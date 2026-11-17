# diner/condiments: what stands on every table and along the counter, modelled by hand as one set 30 cm wide: a
# chrome napkin dispenser with napkins showing in its slot, a red ketchup bottle with a white cap, a yellow mustard
# squeeze bottle with a cone tip, glass salt and pepper shakers with chrome dome caps, and a glass sugar pourer with a
# chrome spout top. Rig: "pull" draws one napkin 9 cm out of the dispenser.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, rbox, T, R, S, xf

col, root = comp.fresh("condiments")
M = _lib.maker(col, root)
chrome = comp.mat("condiments_chrome", (0.86, 0.86, 0.88), rough=0.14, metal=1.0)
paper = comp.mat("condiments_napkin", (0.93, 0.93, 0.9), rough=0.8)
red = comp.mat("condiments_ketchup", (0.5, 0.02, 0.015), rough=0.25)
white = comp.mat("condiments_cap", (0.9, 0.9, 0.88), rough=0.4)
yellow = comp.mat("condiments_mustard", (0.9, 0.62, 0.04), rough=0.35)
glass = comp.mat("condiments_glass", (0.92, 0.96, 0.97), rough=0.03, alpha=0.3)
salt = comp.mat("condiments_salt", (0.93, 0.93, 0.93), rough=0.8)
pepper = comp.mat("condiments_pepper", (0.12, 0.1, 0.08), rough=0.8)
sugar = comp.mat("condiments_sugar", (0.95, 0.94, 0.9), rough=0.8)
# the napkin dispenser
d = M("condiments_dispenser", rbox((0.1, 0.19, 0.13), at=(-0.09, 0, 0.068), r=0.012, seg=4), chrome, smooth=False)
M("condiments_dispenser_feet", comp.merge(*[comp.cyl(0.006, 0.004, at=(-0.09 + sx * 0.035, sy * 0.08, 0), seg=8) for sx in (-1, 1) for sy in (-1, 1)]), comp.mat("condiments_rubber", (0.02, 0.02, 0.02), rough=0.8))
M("condiments_napkins", comp.merge(comp.box((0.003, 0.15, 0.075), at=(-0.1415, 0, 0.068)), comp.box((0.003, 0.15, 0.075), at=(-0.0385, 0, 0.068))), paper, smooth=False)
nap = comp.pivot(col, root, "condiments_napkin", (-0.143, 0, 0.068))
M("condiments_napkin_sheet", xf(comp.box((0.05, 0.14, 0.002)), T(-0.158, 0, 0.072) @ R(-12, "Y")), paper, parent=nap, smooth=False)
# ketchup, mustard
M("condiments_ketchup", lathe([(0, 0), (0.028, 0), (0.031, 0.006), (0.031, 0.1), (0.026, 0.13), (0.015, 0.155), (0.0135, 0.175), (0, 0.175)], seg=32, at=(0.0, 0.05, 0)), red)
M("condiments_ketchup_cap", lathe([(0.0145, 0.172), (0.016, 0.173), (0.016, 0.193), (0.014, 0.196), (0, 0.196)], seg=24, at=(0.0, 0.05, 0)), white)
M("condiments_ketchup_label", lathe([(0.0313, 0.035), (0.0313, 0.09)], seg=32, at=(0.0, 0.05, 0)), white)
M("condiments_mustard", lathe([(0, 0), (0.026, 0), (0.029, 0.006), (0.029, 0.11), (0.024, 0.13), (0.02, 0.135), (0, 0.135)], seg=32, at=(0.0, -0.045, 0)), yellow)
M("condiments_mustard_tip", lathe([(0.021, 0.133), (0.022, 0.145), (0.012, 0.15), (0.003, 0.185), (0, 0.186)], seg=24, at=(0.0, -0.045, 0)), yellow)
# salt and pepper: eight-sided glass, chrome domes
for name, x, fill in (("salt", 0.075, salt), ("pepper", 0.12, pepper)):
    M(f"condiments_{name}", lathe([(0, 0), (0.019, 0), (0.021, 0.004), (0.017, 0.065), (0.0165, 0.07), (0, 0.07)], seg=8, at=(x, -0.045, 0)), glass, smooth=False)
    M(f"condiments_{name}_fill", lathe([(0, 0.003), (0.0175, 0.003), (0.0165, 0.045), (0, 0.047)], seg=8, at=(x, -0.045, 0)), fill, smooth=False)
    M(f"condiments_{name}_cap", lathe([(0.0175, 0.066), (0.019, 0.068), (0.018, 0.08), (0.011, 0.088), (0, 0.09)], seg=24, at=(x, -0.045, 0)), chrome)
# the sugar pourer
M("condiments_sugar", lathe([(0, 0), (0.03, 0), (0.033, 0.005), (0.031, 0.11), (0.03, 0.115), (0, 0.115)], seg=12, at=(0.1, 0.045, 0)), glass, smooth=False)
M("condiments_sugar_fill", lathe([(0, 0.004), (0.03, 0.004), (0.0285, 0.085), (0, 0.088)], seg=12, at=(0.1, 0.045, 0)), sugar, smooth=False)
M("condiments_sugar_top", comp.merge(lathe([(0.031, 0.108), (0.033, 0.11), (0.03, 0.135), (0.012, 0.15), (0, 0.151)], seg=32, at=(0.1, 0.045, 0)),
                                    xf(comp.cyl(0.007, 0.03, seg=12), T(0.1, 0.045, 0.14) @ R(35, "Y"))), chrome)
comp.channel("pull", [(nap, "location", 0, nap.location.x, nap.location.x - 0.09)])
comp.export(col, root, "diner", "condiments", made="blender/components/diner/condiments.py",
            source="own geometry (generic unlabelled bottles, shakers and a napkin dispenser)", license="ours", credit="",
            rig={"pull": "one napkin 9 cm out of the dispenser's left face"})
