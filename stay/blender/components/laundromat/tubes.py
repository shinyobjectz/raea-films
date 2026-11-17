# laundromat/tubes: a recessed ceiling troffer, 1.2 x 0.6 m, modelled by hand: a white steel tray set up into the ceiling
# (its rim flush at z 0, the origin), two T8 fluorescent tubes on their lampholders with a ballast cover between them,
# and a mirror louvre of blades across them. The tubes are their own material (tubes_glow). Rig: "on" is the
# scene's: tubes_glow's glow and the light under the fitting, a key per state (a render holds its first frame's glow).
# (Replaces Poly Haven's mounted_fluorescent_lights, a bare batten: a laundromat's grid ceiling has troffers.)
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("tubes")
white = comp.mat("tubes_tray", (0.88, 0.88, 0.86), rough=0.45)
mirror = comp.mat("tubes_louvre", (0.86, 0.86, 0.86), rough=0.12, metal=1.0)
glow = comp.mat("tubes_glow", (1.0, 1.0, 0.98), rough=0.3, emit=(1.0, 0.98, 0.92), strength=6.0)
grey = comp.mat("tubes_caps", (0.7, 0.7, 0.72), rough=0.3, metal=1.0)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
W, D, DEPTH = 1.2, 0.6, 0.09
tray = comp.merge(comp.box((W, D, 0.002), at=(0, 0, DEPTH)), comp.box((W, 0.002, DEPTH), at=(0, D / 2, DEPTH / 2)), comp.box((W, 0.002, DEPTH), at=(0, -D / 2, DEPTH / 2)),
                  comp.box((0.002, D, DEPTH), at=(W / 2, 0, DEPTH / 2)), comp.box((0.002, D, DEPTH), at=(-W / 2, 0, DEPTH / 2)))
M("tubes_tray", tray, white)
rim = comp.merge(comp.box((W + 0.03, 0.02, 0.004), at=(0, D / 2, -0.002)), comp.box((W + 0.03, 0.02, 0.004), at=(0, -D / 2, -0.002)), comp.box((0.02, D + 0.03, 0.004), at=(W / 2, 0, -0.002)), comp.box((0.02, D + 0.03, 0.004), at=(-W / 2, 0, -0.002)))
M("tubes_rim", rim, white)
M("tubes_ballast", comp.box((W - 0.1, 0.07, 0.03), at=(0, 0, DEPTH - 0.016)), white)
for i, y in enumerate((-0.15, 0.15)):
    M(f"tubes_tube_{i + 1}", comp.cyl(0.013, W - 0.1, at=(-(W - 0.1) / 2, y, DEPTH - 0.04), seg=20, axis="X"), glow, smooth=True)
    M(f"tubes_caps_{i + 1}", comp.merge(comp.cyl(0.0135, 0.012, at=(-(W - 0.1) / 2 - 0.012, y, DEPTH - 0.04), seg=20, axis="X"), comp.cyl(0.0135, 0.012, at=((W - 0.1) / 2, y, DEPTH - 0.04), seg=20, axis="X"),
                                         comp.box((0.02, 0.03, 0.045), at=(-(W - 0.06) / 2, y, DEPTH - 0.024)), comp.box((0.02, 0.03, 0.045), at=((W - 0.06) / 2, y, DEPTH - 0.024))), grey)
blades = [comp.box((0.0015, D - 0.01, 0.04), at=(-W / 2 + 0.05 + i * (W - 0.1) / 15, 0, 0.022)) for i in range(16)]
blades += [comp.box((W - 0.01, 0.0015, 0.04), at=(0, y, 0.022)) for y in (-0.29, 0.0, 0.29)]
M("tubes_louvre", comp.merge(*blades), mirror)
comp.export(col, root, "laundromat", "tubes", made="blender/components/laundromat/tubes.py", source="own geometry (a generic recessed twin-tube troffer)", license="ours", credit="",
            rig={"on": "in the scene: the material tubes_glow's glow and a light under the fitting, a key per state", "flicker": "in the scene: tubes_glow's glow keyed frame by frame (a dying tube)"})
