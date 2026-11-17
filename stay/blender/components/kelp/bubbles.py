# kelp/bubbles: a column of bubbles rising from the bottom, modelled by hand: 110 bubbles from 4 mm beads to 5 cm
# caps (the big ones flattened and wobbling as real ones are), in a column that widens from 0.15 m at the sand to
# 0.8 m across 4.5 m up. Material: bubble (see-through, and it glows so the beads read against the blue). Rig: "rise" lifts the column 2.2 m and lets it
# spread by a quarter.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf

col, root = comp.fresh("bubbles")
m = comp.mat("bubble", (0.85, 0.95, 1.0), rough=0.06, alpha=0.55, emit=(0.7, 0.95, 1.0), strength=45.0)
rise = comp.pivot(col, root, "bubbles_column", (0, 0, 0))
rnd = random.Random(19)
parts = []
for i in range(110):
    z = rnd.uniform(0.05, 4.5)
    spread = 0.075 + 0.33 * (z / 4.5)
    a = rnd.uniform(0, 6.28)
    d = spread * rnd.uniform(0, 1) ** 0.7
    r = rnd.choice((0.002, 0.003, 0.004, 0.006, 0.008, 0.012, 0.018, 0.025)) * (0.6 + 0.5 * z / 4.5)
    sq = 1.0 if r < 0.008 else rnd.uniform(0.45, 0.7)          # the big ones are caps
    b = L.ball(r, sub=2 if r > 0.006 else 1, squash=(1, 1, sq))
    if r >= 0.008:
        xf(b, R(rnd.uniform(-18, 18), "X"))
    parts.append(xf(b, T(d * math.cos(a) + 0.06 * math.sin(z * 2.2), d * math.sin(a) + 0.05 * math.cos(z * 1.7), z)))
comp.mesh(col, root, "bubbles_bubbles", comp.merge(*parts), m, parent=rise, smooth=True)
L.channel("rise", [(rise, "location", 2, 0.0, 2.2), (rise, "scale", 0, 1.0, 1.25), (rise, "scale", 1, 1.0, 1.25)])
comp.export(col, root, "kelp", "bubbles", made="blender/components/kelp/bubbles.py", source="own geometry", license="ours", credit="",
            rig={"rise": "the column (bubbles_column) rises 2.2 m and spreads by a quarter", "glow": "in the scene: the material bubble's glow, so the beads read in the blue"})
