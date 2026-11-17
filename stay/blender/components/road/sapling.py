# road/sapling: a fir sapling, 3.4 m, branched to the ground, for the bank and the road's edge where the light reaches
# (the same builder as road/trees, small). Rig: "sway" whips it 8 degrees at the top (rain and the car's wash).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp
col, root = comp.fresh("sapling")
tiers = _lib.fir(col, root, "sapling", h=3.4, r0=0.045, seed=41, crown_from=0.25, tiers=3, dense=1.6, reach=1.1, res="1k")
_lib.channel("sway", _lib.sway_keys(tiers, 8.0))
_lib.done(col, root, "sapling", source="own geometry; bark: https://polyhaven.com/a/pine_bark; sprigs: https://polyhaven.com/a/fir_tree_01", license="ours; textures CC0", credit="Poly Haven (pine_bark; fir_tree_01, Rico Cilliers)",
          rig={"sway": "three tiers lean back, the top one 8 degrees"})
