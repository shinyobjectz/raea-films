# road/trees-b: a younger Douglas fir, 18 m, its crown starting 3.5 m up and fuller for its height, to stand in front
# of and between the tall ones so the wall of trees has depth and no two neighbours match (the same builder as
# road/trees, another seed). Rig: "sway" leans the crown in a gust, the top tier 4 degrees.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp
col, root = comp.fresh("trees_b")
tiers = _lib.fir(col, root, "trees_b", h=18.0, r0=0.27, seed=23, crown_from=3.5, tiers=5, dense=1.0, reach=4.2, res="1k")
_lib.channel("sway", _lib.sway_keys(tiers, 4.0))
_lib.done(col, root, "trees_b", source="own geometry; bark: https://polyhaven.com/a/pine_bark; sprigs: https://polyhaven.com/a/fir_tree_01", license="ours; textures CC0", credit="Poly Haven (pine_bark; fir_tree_01, Rico Cilliers)",
          rig={"sway": "the crown leans back in a gust: five tiers, the top one 4 degrees, each lower one less"})
