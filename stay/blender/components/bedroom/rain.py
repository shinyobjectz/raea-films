# bedroom/rain: the rain on the window's glass, modelled by hand for the 1.4 x 1.2 m window: 220 beads of water
# standing on the pane and 44 running drops, each a fat bead with the wet trail it leaves above it, every runner on
# its own pivot so each falls its own distance. A thin sheet, its origin the window's centre, lying on the glass's
# room side (water: rain_water). Rig: "fall" runs every runner down the pane (0.12 to 0.75 m, the heavy ones
# furthest); the first drops of the shot are the Model's scale and fade in the scene, then this.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from comp import T, R, S, xf
col, root = comp.fresh("rain")
M = _lib.maker(col, root)
rnd = random.Random(5663)
water = comp.mat("rain_water", (0.86, 0.92, 0.97), rough=0.04, alpha=0.5)
W, H = 1.3, 1.1
def bead(r, squash=0.45):
    s = bmesh.new()
    bmesh.ops.create_uvsphere(s, u_segments=8, v_segments=5, radius=r)
    return xf(s, S(1, squash, 1.15))
beads = []
for i in range(220):
    b = bead(rnd.uniform(0.002, 0.0065) * (1.6 if rnd.random() < 0.08 else 1))
    beads.append(xf(b, T(rnd.uniform(-W / 2, W / 2), 0, rnd.uniform(-H / 2, H / 2))))
M("rain_beads", comp.merge(*beads), water, smooth=True)
keys = []
for i in range(44):
    r = rnd.uniform(0.005, 0.0095)
    x = -W / 2 + (i + rnd.uniform(0.1, 0.9)) * W / 44
    z = rnd.uniform(-0.1, H / 2 - 0.02)
    fall = min(z + H / 2 - 0.02, (r / 0.0095) ** 2 * rnd.uniform(0.5, 0.85))
    trail = min(rnd.uniform(0.08, 0.3), H / 2 - z - r)
    p = comp.pivot(col, root, f"rain_drop_{i + 1:02d}", (x, 0, z))
    d = bead(r, 0.5)
    # the trail: a thin wandering ribbon of water above the drop
    pts = [(0.004 * math.sin(k * 1.3 + i) * (k / 6), 0, r * 0.6 + trail * k / 6) for k in range(7)]
    t = comp.tube(pts, r * 0.32, res=4, sides=2)
    xf(t, S(1, 0.35, 1))
    M(f"rain_drop_{i + 1:02d}_water", xf(comp.merge(d, t), T(x, 0, z)), water, parent=p, smooth=True)
    keys.append((p, "location", 2, p.location.z, p.location.z - max(0.12, fall)))
comp.channel("fall", keys)
comp.export(col, root, _lib.PLACE, "rain", made="blender/components/bedroom/rain.py", source="own geometry", license="ours", credit="",
            rig={"fall": "each of the 44 running drops slides down the pane its own distance (0.12 to 0.75 m), its trail with it"},
            notes="origin = the window's centre; lay it on the glass's room side (wall-window's lower sash glass is 5.5 cm behind the wall's face); the shot's streaks, and the cut to the windscreen")
