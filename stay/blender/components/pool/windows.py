# pool/windows: one clerestory window for the hall's long wall, 3.2 x 1.8 m, modelled by hand: a white steel frame set
# 10 cm into the wall, three mullions and a transom, four fixed lights below and four top-hung vents above, each vent a
# sash of its own with its glass, a stay arm and a handle. Its origin is the middle of the opening's sill at the wall's
# room face (y 0). The glass is its own material (pool_glass: the scene's night or day shows through).
# Rig: "vent" swings the four top vents 28 degrees out about their top hinges.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root = comp.fresh("windows")
frame_m = paint_m("pool_window_frame", (0.86, 0.87, 0.85), 0.4)
glass_m = comp.mat("pool_glass", (0.62, 0.78, 0.82), rough=0.03, alpha=0.22)
metal_m = steel("pool_steel")
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, H, _ = WIN
Y, FD, FW, TR = 0.14, 0.07, 0.06, 1.12   # the frame's plane, depth and face width; the transom's height
bars = [comp.box((W, FD, FW), at=(0, Y, FW / 2)), comp.box((W, FD, FW), at=(0, Y, H - FW / 2)), comp.box((FW, FD, H), at=(-W / 2 + FW / 2, Y, H / 2)), comp.box((FW, FD, H), at=(W / 2 - FW / 2, Y, H / 2)),
        comp.box((W, FD, FW), at=(0, Y, TR))]
bars += [comp.box((FW, FD, H), at=(x, Y, H / 2)) for x in (-W / 4, 0, W / 4)]
f = M("windows_frame", comp.merge(*bars), frame_m)
comp.bevel(f, 0.006, 2)
PW = W / 4
M("windows_glass", comp.merge(*[comp.box((PW - FW, 0.006, TR - FW * 1.5), at=(-W / 2 + PW * (i + 0.5), Y, (TR + FW / 2) / 2)) for i in range(4)]), glass_m)
vents = []
for i in range(4):
    x = -W / 2 + PW * (i + 0.5)
    top, bot = H - FW, TR + FW / 2
    hinge = comp.pivot(col, root, f"windows_vent_{i + 1}", (x, Y + 0.02, top))
    sw, sh, sb = PW - FW - 0.012, top - bot - 0.008, 0.035
    zc = (top + bot) / 2
    sash = comp.merge(comp.box((sw, 0.04, sb), at=(x, Y + 0.02, top - sb / 2 - 0.004)), comp.box((sw, 0.04, sb), at=(x, Y + 0.02, bot + sb / 2 + 0.004)),
                      comp.box((sb, 0.04, sh), at=(x - sw / 2 + sb / 2, Y + 0.02, zc)), comp.box((sb, 0.04, sh), at=(x + sw / 2 - sb / 2, Y + 0.02, zc)))
    so = M(f"windows_vent_{i + 1}_sash", sash, frame_m, parent=hinge)
    comp.bevel(so, 0.004, 2)
    M(f"windows_vent_{i + 1}_glass", comp.box((sw - sb * 2 + 0.01, 0.006, sh - sb * 2 + 0.01), at=(x, Y + 0.02, zc)), glass_m, parent=hinge)
    M(f"windows_vent_{i + 1}_handle", comp.merge(comp.box((0.02, 0.03, 0.02), at=(x, Y - 0.012, bot + sb / 2 + 0.004)), comp.box((0.11, 0.012, 0.016), at=(x + 0.04, Y - 0.03, bot + sb / 2 + 0.004))), metal_m, parent=hinge)
    # the stay arm: a peg bar on the transom
    M(f"windows_stay_{i + 1}", comp.box((0.012, 0.004, 0.2), at=(x - sw / 2 + 0.06, Y - 0.037, TR + 0.1)), metal_m)
    vents.append(hinge)
comp.channel("vent", [(h, "rotation_euler", 0, 0, math.radians(28)) for h in vents])
done(col, root, "windows", source="own geometry (a generic steel clerestory window with top-hung vents)",
     rig={"vent": "the four top vents swing 28 degrees outward about their top hinges", "sky": "in the scene: what shows through pool_glass (night, or the day coming in)"},
     notes="origin: the sill's middle at the wall's room face; fits pool/wall-side's openings (3.2 x 1.8 m)")
