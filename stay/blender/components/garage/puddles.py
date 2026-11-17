# garage/puddles: three rain puddles on the deck by the ramp, the largest 2.1 m long: flat sheets of still water with
# ragged edges, 4 mm above the floor, in the material puddle_water (near black and mirror smooth, so the sodium lights
# and the car sit in them). Rig: "spread" grows each puddle from half its size to full about its own middle.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root = comp.fresh("puddles")
M = L.maker(col, root)
water = comp.mat("puddle_water", (0.012, 0.014, 0.016), rough=0.02, metal=0.0, alpha=0.9)
def outline(r, sq, seed, n=56):
    rs = random.Random(seed)
    ph = [rs.uniform(0, 6.28) for _ in range(5)]
    out = []
    for k in range(n):
        t = 2 * math.pi * k / n
        rr = r * (1 + 0.2 * math.sin(2 * t + ph[0]) + 0.15 * math.sin(3 * t + ph[1]) + 0.09 * math.sin(4 * t + ph[2]) + 0.06 * math.sin(7 * t + ph[3]) + 0.03 * math.sin(11 * t + ph[4]))
        out.append((rr * math.cos(t), rr * sq * math.sin(t)))
    return out
keys = []
for i, (cx, cy, r, sq, turn) in enumerate(((0, 0, 1.0, 0.55, 12), (1.55, -0.75, 0.48, 0.7, -30), (-1.25, 0.85, 0.36, 0.8, 50))):
    px = comp.pivot(col, root, f"puddle_{i + 1}", (cx, cy, 0))
    py = comp.pivot(col, root, f"puddle_{i + 1}_y", (cx, cy, 0), parent=px)  # two pivots: one clip keeps one key an object
    M(f"puddle_{i + 1}_water", xf(L.plate(outline(r, sq, 10 + i), 0.0), T(cx, cy, 0.004) @ R(turn, "Z")), water, parent=py)
    keys += [(px, "scale", 0, 0.5, 1.0), (py, "scale", 1, 0.5, 1.0)]
comp.channel("spread", keys)
L.look(col, "puddles", eye=(1, -5, 4), target=(0, 0, 0), lens=35)
comp.export(col, root, "garage", "puddles", made="blender/components/garage/puddles.py", source="own geometry", license="ours", credit="",
            rig={"spread": "each puddle grows from half its size to full about its own middle (rest is half; 1 is full)",
                 "water": "in the scene: the material puddle_water (its mirror, its ripples)"})
