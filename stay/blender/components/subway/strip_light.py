# subway/strip-light: a bare twin-tube fluorescent batten, 1.2 m, the kind bolted along a 1930s station's girders
# decades later, modelled by hand: a white steel channel on two short drop rods, lampholders, two T12 tubes (their
# glass is strip_glow) and a ballast cover. A ceiling item: its top at z 0, the tubes along y (the track).
# Rig: "on" is the scene's: strip_glow's glow and the light under it (a flicker is the scene's too).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, slab

col, root = comp.fresh("strip_light")
white = comp.mat("strip_channel", (0.8, 0.8, 0.76), rough=0.45)
grey = comp.mat("strip_caps", (0.6, 0.6, 0.62), rough=0.3, metal=1.0)
glow = comp.mat("strip_glow", (1.0, 1.0, 0.98), rough=0.3, emit=(0.92, 1.0, 0.95), strength=50000.0)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
Lh, Z = 0.61, -0.12
c = M("strip_light_channel", comp.merge(slab(-0.06, 0.06, -Lh, Lh, Z - 0.05, Z), slab(-0.03, 0.03, -Lh + 0.1, Lh - 0.1, Z - 0.07, Z - 0.05)), white)
comp.bevel(c, 0.004, 2)
M("strip_light_rods", comp.merge(*[comp.cyl(0.006, -Z, at=(0, y, Z), seg=8) for y in (-0.4, 0.4)], *[comp.cyl(0.025, 0.008, at=(0, y, -0.008), seg=12) for y in (-0.4, 0.4)]), grey)
for i, x in enumerate((-0.085, 0.085)):
    M(f"strip_light_tube_{i + 1}", comp.cyl(0.019, 2 * Lh - 0.06, at=(x, -Lh + 0.03, Z - 0.045), seg=16, axis="Y"), glow, smooth=True)
    M(f"strip_light_holders_{i + 1}", comp.merge(*[comp.box((0.045, 0.02, 0.06), at=(x, s * (Lh - 0.015), Z - 0.035)) for s in (-1, 1)]), white)
comp.export(col, root, "subway", "strip_light", made="blender/components/subway/strip_light.py", source="own geometry (a generic twin-tube fluorescent batten)", license="ours", credit="",
            rig={"on": "in the scene: the material strip_glow's glow and a light under the fitting, a key per state"})
