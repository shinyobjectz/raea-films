# ferris/string-lights: an 8 m span of festoon lights, modelled by hand: a black rubber cable sagging 0.55 m
# between its two ends, 17 moulded lampholders on short droppers, a clear globe bulb in each with its filament
# stem, and a hook and a tail of cable at each end. A hanging item: its origin is the middle of the straight line
# between its ends (hang the ends on two poles 8 m apart along x); it sags below. The lit bulbs are parts of their
# own (string_lights_lit_NN, material festoon_glow), nothing at rest.
# Rig: "on" lights the bulbs one after another from left to right; "sway" swings the whole string 14 degrees
# about the line between its ends.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("string_lights")
rubber = comp.mat("festoon_cable", (0.015, 0.015, 0.017), rough=0.6)
glass = comp.mat("festoon_bulb", (0.8, 0.76, 0.62), rough=0.1)
brass = comp.mat("festoon_cap", (0.7, 0.55, 0.25), rough=0.35, metal=1.0)
glow = comp.mat("festoon_glow", (1.0, 0.85, 0.55), rough=0.3, emit=(1.0, 0.7, 0.32), strength=40000.0)
SPAN, SAG, NB = 8.0, 0.55, 17
sw = comp.pivot(col, root, "string_lights_sway", (0, 0, 0))
M = lambda n, bm, m, parent=sw, smooth=True: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
cz = lambda x: -SAG * (1 - (2 * x / SPAN) ** 2)
M("string_lights_cable", comp.merge(comp.tube([(x, 0, cz(x)) for x in [-SPAN / 2 + SPAN * k / 24 for k in range(25)]], 0.009, res=3, sides=3),
                                    comp.tube([(-SPAN / 2, 0, 0), (-SPAN / 2 - 0.05, 0, -0.2), (-SPAN / 2 - 0.02, 0.02, -0.6), (-SPAN / 2 - 0.06, 0, -0.9)], 0.008, res=4, sides=3)), rubber)
M("string_lights_hooks", comp.merge(*[L.torus(0.025, 0.004, seg_=12, sides=5, axis="Y", at=(sx * (SPAN / 2 + 0.02), 0, 0.0)) for sx in (-1, 1)]), brass)
holders, caps, glasses, lit = [], [], [], []
for i in range(NB):
    x = -SPAN / 2 + SPAN * (i + 0.5) / NB
    z = cz(x)
    holders.append(comp.cyl(0.022, 0.07, at=(x, 0, z - 0.075), seg=10, r2=0.014))
    caps.append(comp.cyl(0.016, 0.022, at=(x, 0, z - 0.095), seg=10))
    glasses.append(L.sphere(0.04, at=(x, 0, z - 0.13), u=12, v=8))
    lp = comp.pivot(col, root, f"string_lights_lit_{i + 1:02d}", (x, 0, z - 0.13), parent=sw)
    M(f"string_lights_lit_{i + 1:02d}_glow", L.ico(0.047, (x, 0, z - 0.13), 2), glow, lp)
    lit.append(lp)
M("string_lights_holders", comp.merge(*holders), rubber)
M("string_lights_caps", comp.merge(*caps), brass)
M("string_lights_bulbs", comp.merge(*glasses), glass)
for i, lp in enumerate(lit):
    L.clip("on", lp, L.on_keys(0.03 + 0.9 * i / (NB - 1)))
L.unlit(*lit)
comp.channel("sway", [(sw, "rotation_euler", 0, 0, math.radians(14))])
comp.export(col, root, "ferris", "string_lights", made="blender/components/ferris/string_lights.py", source="own geometry (a generic festoon string)", license="ours", credit="",
            rig={"on": "the bulbs light one after another from left to right", "sway": "the whole string swings 14 degrees about the line between its ends",
                 "glow": "in the scene: the material festoon_glow glows, a key per state"}, notes="origin: the middle of the line between its two ends, which are 4 m either side along x; it hangs 0.55 m below")
