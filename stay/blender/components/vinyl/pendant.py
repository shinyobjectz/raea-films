# vinyl/pendant: an enamelled industrial pendant lamp on its chain, 1.36 m drop (Poly Haven's
# hanging_industrial_lamp, CC0), a ceiling fitting: its top at z 0. Rig: "swing" swings it 9 degrees about its
# ceiling hook; its glow is the scene's (the material hanging_industrial_lamp_glass and a light under it).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, parts, credit = comp.ph_component(PLACE, "pendant", "hanging_industrial_lamp", res="1k", origin="top")
sw = comp.hang(col, root, list(parts.values()), "pendant_swing", at=(0, 0, 0))
channel("swing", [(sw, "rotation_euler", 1, 0, math.radians(9))])
done(col, root, "pendant", "https://polyhaven.com/a/hanging_industrial_lamp", license="CC0", credit=credit,
     rig={"swing": "the whole lamp 9 degrees to the side about its ceiling hook", "on": "in the scene: the material hanging_industrial_lamp_glass's glow and a light under the shade"})
