# lighthouse/beam: the light's beam, modelled by hand: a soft-edged shaft leaving the lens and widening to 13 m across
# 170 m out, a brighter core inside a fainter halo, and the short counter-beam a lens throws the other way. Its origin
# is the lamp (the lens's focal point, 2.1 m above the lantern's floor); at rest it points at the camera (-y). The
# shafts are their own materials (beam_light, beam_core). Rig: "sweep" turns the beam one whole turn about the lamp,
# clockwise seen from above, with the lens; "dip" tips it 10 degrees down, onto the waves.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, lathe

col, root = comp.fresh("beam")
halo = comp.mat("beam_light", (1.0, 0.86, 0.55), rough=1.0, emit=(1.0, 0.8, 0.45), strength=60.0, alpha=0.04)
core = comp.mat("beam_core", (1.0, 0.92, 0.7), rough=1.0, emit=(1.0, 0.88, 0.6), strength=90.0, alpha=0.05)
M = _lib.maker(col, root)
sweep = comp.pivot(col, root, "beam_sweep", (0, 0, 0))
dip = comp.pivot(col, root, "beam_dip", (0, 0, 0), parent=sweep)


def shaft(r0, r1, y0, y1, seg=40):
    b = lathe([(r0, y0), (r1, y1)], seg=seg)       # along z
    return xf(b, R(90, "X"))                       # z to -y


M("beam_halo", shaft(0.75, 6.5, 1.95, 170.0), halo, parent=dip, smooth=True)
M("beam_shaft", shaft(0.4, 3.2, 1.95, 170.0), core, parent=dip, smooth=True)
M("beam_counter", xf(shaft(0.6, 2.4, 1.95, 46.0), R(180, "Z")), halo, parent=dip, smooth=True)
comp.channel("sweep", [(sweep, "rotation_euler", 2, 0, -2 * math.pi)])
comp.channel("dip", [(dip, "rotation_euler", 0, 0, math.radians(10))])
comp.export(col, root, "lighthouse", "beam", made="blender/components/lighthouse/beam.py", source="own geometry (cones of light)", license="ours", credit="",
            rig={"sweep": "the beam one whole turn about the lamp, clockwise seen from above (the lens's turn)", "dip": "the beam tips 10 degrees down, onto the waves",
                 "glow": "in the scene: the materials beam_light and beam_core (how bright, how thick the air)"},
            notes="origin: the lamp, 2.1 m above the lantern room's floor (20.1 m above the tower's foot)")
