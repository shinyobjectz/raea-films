# diner/back-bar: the work counter along the back wall under the pass-through, 2.4 m, modelled by hand: a stainless
# cabinet of four doors with bar handles on a black kick, a steel top with an upstand, and on it a malt mixer (a mint
# enamel column, its steel cup under the spindle), a chrome two-slice toaster with two slices in it, three syrup jars
# with pumps, three stacks of upturned glasses on a tray, and a stack of plates. 0.92 m to the top.
# Rig: "mix" turns the mixer's spindle and its agitator one whole turn; "toast" pops the two slices up 6 cm and the
# lever with them; "cup" lowers the mixer's cup 14 cm off the spindle.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import lathe, rbox, rod, T, R, S, xf

col, root = comp.fresh("back_bar")
M = _lib.maker(col, root)
L, D, H = 2.4, 0.55, 0.92
steel = comp.mat("back_bar_steel", (0.68, 0.68, 0.7), rough=0.3, metal=1.0)
chrome = comp.mat("back_bar_chrome", (0.86, 0.86, 0.88), rough=0.12, metal=1.0)
black = comp.mat("back_bar_kick", (0.02, 0.02, 0.022), rough=0.5)
mint = comp.mat("back_bar_enamel", (0.35, 0.62, 0.5), rough=0.2)
glass = comp.mat("back_bar_glass", (0.85, 0.92, 0.93), rough=0.03, alpha=0.3)
china = comp.mat("back_bar_china", (0.86, 0.85, 0.8), rough=0.16)
toast_m = comp.mat("back_bar_toast", (0.62, 0.4, 0.16), rough=0.85)
syrups = [comp.mat(f"back_bar_syrup_{n}", c, rough=0.15) for n, c in (("chocolate", (0.05, 0.02, 0.01)), ("strawberry", (0.5, 0.03, 0.06)), ("vanilla", (0.85, 0.7, 0.4)))]

M("back_bar_cabinet", comp.box((L, D - 0.04, H - 0.14), at=(0, 0.02, 0.1 + (H - 0.14) / 2)), steel, smooth=False)
M("back_bar_kick", comp.box((L - 0.04, D - 0.12, 0.1), at=(0, 0.04, 0.05)), black, smooth=False)
doors, handles = [], []
for i in range(4):
    x = -L / 2 + L / 8 + i * L / 4
    doors.append(rbox((L / 4 - 0.012, 0.018, H - 0.2), at=(x, -D / 2 + 0.03, 0.13 + (H - 0.2) / 2), r=0.004, seg=2))
    hx = x + (0.22 if i % 2 == 0 else -0.22)
    handles.append(comp.cyl(0.008, 0.22, at=(hx, -D / 2 - 0.012, 0.52), seg=12))
    handles += [rod((hx, -D / 2 + 0.02, z), (hx, -D / 2 - 0.012, z), 0.005, seg=8) for z in (0.54, 0.72)]
M("back_bar_doors", comp.merge(*doors), steel, smooth=False)
M("back_bar_handles", comp.merge(*handles), chrome)
M("back_bar_top", comp.merge(rbox((L + 0.02, D + 0.02, 0.04), at=(0, 0, H - 0.02), r=0.006, seg=2), comp.box((L + 0.02, 0.015, 0.1), at=(0, D / 2 + 0.002, H + 0.05))), steel, smooth=False)

# --- the malt mixer --------------------------------------------------------------------------------------------------
MX = -0.85
M("back_bar_mixer_base", lathe([(0, 0), (0.085, 0), (0.09, 0.006), (0.085, 0.022), (0.05, 0.03), (0, 0.03)], seg=40, at=(MX, 0.02, H)), mint)
M("back_bar_mixer_column", rbox((0.05, 0.055, 0.4), at=(MX, 0.085, H + 0.22), r=0.015, seg=3), mint, smooth=False)
M("back_bar_mixer_head", lathe([(0, 0), (0.045, 0), (0.055, 0.02), (0.058, 0.07), (0.05, 0.11), (0.03, 0.13), (0, 0.135)], seg=40, at=(MX, 0.03, H + 0.37)), mint)
M("back_bar_mixer_collar", lathe([(0.02, 0), (0.047, 0), (0.047, 0.012), (0.02, 0.012)], seg=32, at=(MX, 0.03, H + 0.358)), chrome)
spin = comp.pivot(col, root, "back_bar_mixer_spindle", (MX, 0.03, H + 0.36))
M("back_bar_mixer_shaft", comp.merge(comp.cyl(0.004, 0.2, at=(MX, 0.03, H + 0.16), seg=10), lathe([(0, 0), (0.016, 0.001), (0.016, 0.004), (0, 0.005)], seg=20, at=(MX, 0.03, H + 0.16)),
                                     comp.box((0.03, 0.004, 0.008), at=(MX + 0.008, 0.03, H + 0.175))), chrome, parent=spin)
cup = comp.pivot(col, root, "back_bar_mixer_cup", (MX, 0.03, H + 0.13))
M("back_bar_mixer_cup_mesh", lathe([(0, 0), (0.036, 0), (0.038, 0.004), (0.048, 0.17), (0.05, 0.175), (0.047, 0.175), (0.036, 0.006), (0, 0.006)], seg=40, at=(MX, 0.03, H + 0.135)), chrome, parent=cup)
M("back_bar_mixer_rest", comp.merge(rbox((0.07, 0.03, 0.012), at=(MX, 0.055, H + 0.125), r=0.003), rod((MX, 0.07, H + 0.125), (MX, 0.085, H + 0.125), 0.006)), chrome, smooth=False)

# --- the toaster -----------------------------------------------------------------------------------------------------
TX = -0.25
tb = M("back_bar_toaster", rbox((0.27, 0.17, 0.17), at=(TX, 0.03, H + 0.1), r=0.035, seg=5), chrome, smooth=False)
M("back_bar_toaster_base", rbox((0.28, 0.18, 0.02), at=(TX, 0.03, H + 0.012), r=0.004, seg=2), black, smooth=False)
M("back_bar_toaster_slots", comp.merge(*[comp.box((0.15, 0.028, 0.004), at=(TX, 0.03 + sy * 0.035, H + 0.1855)) for sy in (-1, 1)]), black, smooth=False)
pop = comp.pivot(col, root, "back_bar_toaster_pop", (TX, 0.03, H + 0.1))
M("back_bar_toast", comp.merge(*[rbox((0.12, 0.014, 0.11), at=(TX, 0.03 + sy * 0.035, H + 0.14), r=0.005, seg=2) for sy in (-1, 1)]), toast_m, parent=pop, smooth=False)
M("back_bar_toaster_lever", rbox((0.02, 0.035, 0.014), at=(TX + 0.145, 0.03, H + 0.08), r=0.004, seg=2), black, parent=pop, smooth=False)

# --- syrup jars with pumps -------------------------------------------------------------------------------------------
for i, m in enumerate(syrups):
    at = (0.2 + i * 0.14, 0.08, H)
    M(f"back_bar_syrup_{i + 1}_jar", lathe([(0, 0), (0.05, 0), (0.055, 0.008), (0.055, 0.15), (0.045, 0.17), (0.045, 0.18), (0, 0.18)], seg=32, at=at), glass)
    M(f"back_bar_syrup_{i + 1}_fill", lathe([(0, 0.004), (0.052, 0.006), (0.052, 0.12), (0, 0.12)], seg=32, at=at), m)
    M(f"back_bar_syrup_{i + 1}_pump", comp.merge(lathe([(0.046, 0.178), (0.048, 0.18), (0.046, 0.19), (0.012, 0.196), (0.008, 0.25), (0, 0.25)], seg=24, at=at),
                                                 xf(_lib.pipe(_lib.fillet([(0, 0, 0.25), (0, 0, 0.275), (0, -0.07, 0.275), (0, -0.07, 0.255)], 0.012), 0.005, sides=3), T(*at)),
                                                 lathe([(0, 0.275), (0.014, 0.276), (0.014, 0.284), (0, 0.286)], seg=16, at=at)), chrome)

# --- glasses on a tray, a stack of plates ----------------------------------------------------------------------------
GX = 0.8
M("back_bar_tray", rbox((0.36, 0.26, 0.012), at=(GX, 0.02, H + 0.006), r=0.004, seg=2), comp.mat("back_bar_tray", (0.3, 0.16, 0.07), rough=0.5), smooth=False)
gl = []
for i, (x, y, n) in enumerate(((-0.1, -0.05, 3), (0.0, -0.05, 2), (0.1, -0.05, 3), (-0.05, 0.06, 2), (0.06, 0.06, 1))):
    for k in range(n):
        gl.append(lathe([(0.038, 0), (0.04, 0.002), (0.03, 0.12), (0, 0.124), (0, 0.121), (0.028, 0.118), (0.0365, 0.004)], seg=10, at=(GX + x, 0.02 + y, H + 0.012 + k * 0.045)))
M("back_bar_glasses", comp.merge(*gl), glass, smooth=False)
M("back_bar_plates", comp.merge(*[lathe([(0, 0.003), (0.06, 0.003), (0.085, 0.01), (0.105, 0.017), (0.1055, 0.02), (0.085, 0.0135), (0.06, 0.0075), (0, 0.007)], seg=40, at=(1.08, 0.04, H + k * 0.011)) for k in range(9)]), china)

comp.channel("mix", [(spin, "rotation_euler", 2, 0, 2 * math.pi)])
comp.channel("toast", [(pop, "location", 2, pop.location.z, pop.location.z + 0.06)])
comp.channel("cup", [(cup, "location", 2, cup.location.z, cup.location.z - 0.14)])
comp.export(col, root, "diner", "back_bar", made="blender/components/diner/back_bar.py",
            source="own geometry (a generic back bar: malt mixer, toaster, syrup jars, glasses, plates; no brands)", license="ours", credit="",
            rig={"mix": "the malt mixer's spindle and agitator one whole turn", "toast": "the two slices and the lever pop up 6 cm", "cup": "the mixer's steel cup 14 cm down off the spindle"})
