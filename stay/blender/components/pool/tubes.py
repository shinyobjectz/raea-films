# pool/tubes: the hall's light fitting, the office's twin-tube troffer (blender/components/office/tubes.py) hung on the
# soffit instead of set into it: a white steel tray 1.2 x 0.6 m, its top at z 0 (the origin), two T8 tubes on their
# lampholders with a ballast cover between them, a mirror louvre across them, and a gasketed rim for the wet air. The
# tubes are their own material (tubes_glow). Rig: "on" is the scene's: tubes_glow's glow and the light under the
# fitting, a key per state (a render holds its first frame's glow).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("tubes")
white = comp.mat("tubes_tray", (0.88, 0.88, 0.86), rough=0.45)
mirror = comp.mat("tubes_louvre", (0.86, 0.86, 0.86), rough=0.12, metal=1.0)
glow = comp.mat("tubes_glow", (1.0, 1.0, 0.98), rough=0.3, emit=(0.92, 1.0, 0.95), strength=6.0)
grey = comp.mat("tubes_caps", (0.7, 0.7, 0.72), rough=0.3, metal=1.0)
gasket = comp.mat("tubes_gasket", (0.08, 0.08, 0.08), rough=0.8)
W, D, DEPTH = 1.2, 0.6, 0.09
DOWN = T(0, 0, -DEPTH - 0.002)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, xf(bm, DOWN), m, smooth=smooth)
tray = comp.merge(comp.box((W, D, 0.002), at=(0, 0, DEPTH)), comp.box((W, 0.002, DEPTH), at=(0, D / 2, DEPTH / 2)), comp.box((W, 0.002, DEPTH), at=(0, -D / 2, DEPTH / 2)),
                  comp.box((0.002, D, DEPTH), at=(W / 2, 0, DEPTH / 2)), comp.box((0.002, D, DEPTH), at=(-W / 2, 0, DEPTH / 2)))
M("tubes_tray", tray, white)
rim = comp.merge(comp.box((W + 0.03, 0.02, 0.004), at=(0, D / 2, -0.002)), comp.box((W + 0.03, 0.02, 0.004), at=(0, -D / 2, -0.002)), comp.box((0.02, D + 0.03, 0.004), at=(W / 2, 0, -0.002)), comp.box((0.02, D + 0.03, 0.004), at=(-W / 2, 0, -0.002)))
M("tubes_rim", rim, white)
M("tubes_gasket", comp.merge(comp.box((W + 0.012, D + 0.012, 0.006), at=(0, 0, DEPTH - 0.001))), gasket)
M("tubes_ballast", comp.box((W - 0.1, 0.07, 0.03), at=(0, 0, DEPTH - 0.016)), white)
for i, y in enumerate((-0.15, 0.15)):
    M(f"tubes_tube_{i + 1}", comp.cyl(0.013, W - 0.1, at=(-(W - 0.1) / 2, y, DEPTH - 0.04), seg=20, axis="X"), glow, smooth=True)
    M(f"tubes_caps_{i + 1}", comp.merge(comp.cyl(0.0135, 0.012, at=(-(W - 0.1) / 2 - 0.012, y, DEPTH - 0.04), seg=20, axis="X"), comp.cyl(0.0135, 0.012, at=((W - 0.1) / 2, y, DEPTH - 0.04), seg=20, axis="X"),
                                         comp.box((0.02, 0.03, 0.045), at=(-(W - 0.06) / 2, y, DEPTH - 0.024)), comp.box((0.02, 0.03, 0.045), at=((W - 0.06) / 2, y, DEPTH - 0.024))), grey)
blades = [comp.box((0.0015, D - 0.01, 0.04), at=(-W / 2 + 0.05 + i * (W - 0.1) / 15, 0, 0.022)) for i in range(16)]
blades += [comp.box((W - 0.01, 0.0015, 0.04), at=(0, y, 0.022)) for y in (-0.29, 0.0, 0.29)]
M("tubes_louvre", comp.merge(*blades), mirror)
done(col, root, "tubes", source="own geometry (a generic surface-mounted twin-tube fitting; the office's troffer)",
     rig={"on": "in the scene: the material tubes_glow's glow and a light under the fitting, a key per state"})
