# koi/pebble: the pebble the cursor drops, modelled by hand: a smooth flat river stone 6 cm across, speckled grey
# (Poly Haven's lichen_rock, CC0), held 1.3 m above the water over the origin. Rig: "drop" lets it fall 1.4 m,
# tumbling one and a half turns, to just under the water where the ripples start.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, M = start("pebble")
rng = random.Random(2)
rock = comp.ph_texture("pebble_stone", "lichen_rock", tile=0.5, res="1k", tint=(0.8, 0.8, 0.82), grey=True)
fall = comp.pivot(col, root, "pebble_fall", (0, 0, 0.0))
o = M("pebble_stone", stone(rng, (0.062, 0.048, 0.024), at=(0, 0, -0.008), sub=3, rough=0.08, flat=0.9), rock, parent=fall, smooth=True)
comp.subsurf(o, 1)
comp.uv_box(o, 1.0)
fall.location.z = 1.3
bpy.context.view_layer.update()
channel("drop", [(fall, "location", 2, 1.3, -0.1), (fall, "rotation_euler", 0, 0, 3 * math.pi)])
done(col, root, "pebble", "own geometry; https://polyhaven.com/a/lichen_rock (CC0)", license="CC0", credit="Poly Haven (texture)",
     rig={"drop": "the pebble falls 1.4 m from the cursor's grip to just under the water, tumbling one and a half turns"})
