# subway/lamp: a 1930s station pendant, modelled by hand: a ceiling canopy, a 0.45 m conduit stem, a porcelain
# lampholder, a spun enamel shade 0.42 m across (dark green outside, white inside) and a bare 300 W bulb, its glass
# its own material (lamp_glow). A ceiling item: its top at z 0. Rig: "sway" swings it 7 degrees about the canopy
# along the track (the train's wind); "on" is the scene's: lamp_glow's glow and a light under it.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, lathe, sphere

col, root = comp.fresh("lamp")
green = comp.mat("lamp_shade", (0.02, 0.1, 0.06), rough=0.25)
white = comp.mat("lamp_shade_inside", (0.9, 0.9, 0.86), rough=0.3)
steel = comp.mat("lamp_stem", (0.3, 0.3, 0.31), rough=0.5, metal=0.9)
pot = comp.mat("lamp_holder", (0.85, 0.84, 0.8), rough=0.3)
glow = comp.mat("lamp_glow", (1.0, 0.93, 0.78), rough=0.3, emit=(1.0, 0.86, 0.62), strength=60000.0)
M = lambda n, bm, m, parent=None, smooth=True: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
M("lamp_canopy", lathe([(0.0, 0.0), (0.065, 0.0), (0.065, -0.012), (0.03, -0.045), (0.0, -0.045)], seg=24), steel)
sw = comp.pivot(col, root, "lamp_sway", (0, 0, -0.04))
M("lamp_stem", comp.cyl(0.011, 0.42, at=(0, 0, -0.46), seg=12), steel, parent=sw)
M("lamp_holder", lathe([(0.0, -0.44), (0.03, -0.44), (0.034, -0.47), (0.028, -0.53), (0.0, -0.53)], seg=20), pot, parent=sw)
M("lamp_shade", lathe([(0.03, -0.45), (0.06, -0.47), (0.15, -0.53), (0.2, -0.575), (0.21, -0.6), (0.214, -0.6)], seg=48), green, parent=sw)
M("lamp_shade_inside", lathe([(0.03, -0.452), (0.058, -0.473), (0.148, -0.533), (0.198, -0.578), (0.208, -0.6)], seg=48), white, parent=sw)
M("lamp_bulb", comp.merge(sphere(0.045, at=(0, 0, -0.6), u=16, v=10), comp.cyl(0.018, 0.05, at=(0, 0, -0.57), seg=12)), glow, parent=sw)
comp.channel("sway", [(sw, "rotation_euler", 0, 0, math.radians(7))])
comp.export(col, root, "subway", "lamp", made="blender/components/subway/lamp.py", source="own geometry (a generic enamel-shade station pendant)", license="ours", credit="",
            rig={"sway": "the stem, shade and bulb swing 7 degrees about the canopy, along the track", "on": "in the scene: the material lamp_glow's glow and a light under the shade, a key per state"})
