# lighthouse/sea: the sea round the headland, modelled by hand: 560 m square of long swell (a 24 m wave half a metre
# high running in to the cliff, a 12 m cross swell, chop on both), dark and glossy at dusk. Sea level is z 0; its
# origin is under the tower's foot like the cliff's. Rig: "swell" runs the whole surface one 24 m wavelength toward the
# land (+y), so the clip loops.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, fbm

col, root = comp.fresh("sea")
water = comp.mat("sea_water", (0.004, 0.014, 0.022), rough=0.16)
M = _lib.maker(col, root)
L = 24.0


def wave(x, y):
    k = 2 * math.pi / L
    z = 0.5 * math.sin(k * y + 0.35 * math.sin(k * x * 0.5))
    z += 0.2 * math.sin(k * (0.5 * x + 2.0 * y)) + 0.1 * math.sin(k * (3 * y - x) + 1.0)   # all whole waves in 24 m of y
    z += 0.06 * fbm(x, y * 0.0 + x * 0.3, scale=3.0, octaves=2, seed=4.0)
    return 0, 0, 0.12 + z


slide = comp.pivot(col, root, "sea_swell", (0, 0, 0))
s = M("sea_surface", _lib.field(560, 560, 254, 254, wave, at=(0, -30)), water, parent=slide, smooth=True)
comp.channel("swell", [(slide, "location", 1, 0.0, L)])
comp.export(col, root, "lighthouse", "sea", made="blender/components/lighthouse/sea.py", source="own geometry (a swell from sines)", license="ours", credit="",
            rig={"swell": "the surface slides 24 m (one wavelength) toward the land; it loops", "colour": "in the scene: the material sea_water"},
            notes="origin: sea level under the tower's foot (the cliff's origin)")
