# koi/ripples: the rings a dropped pebble sends across the pond, modelled by hand: five concentric swells lying on
# the water (each a low smooth ridge, the outer ones lower and wider), a splash crown of twelve leaning jets with a
# bead on each tip, and a rebound drop above the middle. The hook's circle: it lies flat with its centre at the
# origin, at the water's level. All of its own material (ripple_water) so the scene can fade it.
# Rig: "spread" grows every ring from nothing to its full radius (0.22 to 1.28 m), flattening as it goes: the circle
# opening from the lower left third to the centre; "splash" throws the crown up 9 cm and the rebound drop 22 cm.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("ripples")
water = comp.mat("ripple_water", srgb((0.56, 0.76, 0.72)), rough=0.04, alpha=0.36)
RINGS = [(0.22, 0.016, 0.022), (0.45, 0.013, 0.028), (0.7, 0.01, 0.034), (0.98, 0.008, 0.04), (1.28, 0.006, 0.046)]   # radius, height, half width
keys = []
for i, (r, h, w) in enumerate(RINGS):
    pv = comp.pivot(col, root, f"ripples_ring_{i + 1}", (0, 0, 0))
    prof = [(r + w * (k / 6 - 1), h * 0.5 * (1 + math.cos(math.pi * (k / 6 - 1)))) for k in range(13)]
    prof = [(prof[0][0], -0.002)] + prof + [(prof[-1][0], -0.002)]
    o = M(f"ripples_ring_{i + 1}_swell", turn(prof, 0.0, seg=96), water, parent=pv, smooth=True)
    keys += [(pv, "scale", 0, 0.012, 1.0), (pv, "scale", 1, 0.012, 1.0), (pv, "scale", 2, 1.6, 1.0)]
    pv.scale = (0.012, 0.012, 1.6)
crown = comp.pivot(col, root, "ripples_crown", (0, 0, 0))
jets = []
for k in range(12):
    a = 2 * math.pi * k / 12
    j = comp.merge(comp.cyl(0.006, 0.09, seg=8, r2=0.002), sphere(0.006, at=(0, 0, 0.094), u=8, v=6))
    xf(j, T(0.035 * math.cos(a), 0.035 * math.sin(a), 0) @ Matrix.Rotation(a, 4, "Z") @ R(28, "Y"))
    jets.append(j)
M("ripples_crown_jets", comp.merge(*jets, turn([(0.03, 0), (0.04, 0.012), (0.046, 0.0)], seg=24)), water, parent=crown, smooth=True)
drop = comp.pivot(col, root, "ripples_drop", (0, 0, 0))
M("ripples_drop_bead", comp.merge(sphere(0.012, at=(0, 0, 0.0), u=12, v=8, scale=(1, 1, 1.3)), comp.cyl(0.005, 0.04, at=(0, 0, -0.05), seg=8, r2=0.009)), water, parent=drop, smooth=True)
crown.scale = (0.05, 0.05, 0.05)
drop.scale = (0.05, 0.05, 0.05)
bpy.context.view_layer.update()
channel("spread", keys)
channel("splash", [(crown, "scale", 0, 0.05, 1.0), (crown, "scale", 1, 0.05, 1.0), (crown, "scale", 2, 0.05, 1.0), (drop, "scale", 0, 0.05, 1.0), (drop, "scale", 1, 0.05, 1.0), (drop, "scale", 2, 0.05, 1.0), (drop, "location", 2, 0.0, 0.22)])
done(col, root, "ripples", "own geometry (a pebble's rings and splash)",
     rig={"spread": "the five rings grow from the centre to radii of 0.22, 0.45, 0.7, 0.98 and 1.28 m, flattening as they go",
          "splash": "the crown of jets rises 9 cm and opens, and the rebound drop jumps 22 cm",
          "fade": "in the scene: the material ripple_water's alpha"})
