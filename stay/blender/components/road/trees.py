# road/trees: a Douglas fir, 30 m, the kind that walls a Pacific Northwest road: a straight furrowed bole bare for its
# first 9 m but for dead stubs, then a crown of sagging boughs whose tips lift, narrowing to a leader. Modelled by hand
# (Poly Haven's fir_tree_01 is 7.8 million triangles) with that model's bark and sprig pictures (CC0) on its own
# trunk and bough cards. Stand copies either side of the road, turned and scaled. Rig: "sway" leans the crown in a
# gust, the top tier 3 degrees and each tier under it less (the bole stands still).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp
col, root = comp.fresh("trees")
tiers = _lib.fir(col, root, "trees", h=30.0, r0=0.5, seed=7, crown_from=9.0, tiers=6, dense=1.0)
_lib.channel("sway", _lib.sway_keys(tiers, 3.0))
_lib.done(col, root, "trees", source="own geometry; bark: https://polyhaven.com/a/pine_bark; sprigs: https://polyhaven.com/a/fir_tree_01", license="ours; textures CC0", credit="Poly Haven (pine_bark; fir_tree_01, Rico Cilliers)",
          rig={"sway": "the crown leans back in a gust: six tiers, the top one 3 degrees, each lower one less, about its own foot on the trunk"})
