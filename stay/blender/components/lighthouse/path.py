# lighthouse/path: the flagged path between the tower's door and the cottage, modelled by hand: 16 m by 1.5 m of worn
# stone paving a few centimetres proud of the turf, kerbed both sides with rough setts of uneven size. Paving and stone
# from Poly Haven texture sets. It runs along +x from the origin (the middle of its left end).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf

col, root = comp.fresh("path")
paving = comp.ph_texture("path_paving", "stone_pathway", tile=1.5, res="1k")
stone = comp.ph_texture("path_kerb", "large_sandstone_blocks_01", tile=2.2, res="1k", grey=True, tint=(0.62, 0.6, 0.56))
M = _lib.maker(col, root)
LEN, WID = 16.0, 1.5
p = M("path_paving", comp.box((LEN, WID, 0.06), at=(LEN / 2, 0, 0.025)), paving)
comp.uv_box(p, 1.0)
rng = random.Random(7)
setts = []
for s in (-1, 1):
    x = 0.0
    while x < LEN - 0.2:
        ln = rng.uniform(0.22, 0.42)
        b = comp.box((ln - 0.02, rng.uniform(0.13, 0.17), rng.uniform(0.1, 0.14)), at=(x + ln / 2, s * (WID / 2 + 0.07) + rng.uniform(-0.012, 0.012), 0.05))
        xf(b, T(-(x + ln / 2), 0, 0)); xf(b, R(rng.uniform(-4, 4), "Z")); xf(b, T(x + ln / 2, 0, 0))
        setts.append(b)
        x += ln
k = M("path_kerbs", comp.merge(*setts), stone)
comp.bevel(k, 0.012, 2)
comp.uv_box(k, 1.0)
comp.export(col, root, "lighthouse", "path", made="blender/components/lighthouse/path.py", source="own geometry; textures: https://polyhaven.com/a/stone_pathway, https://polyhaven.com/a/large_sandstone_blocks_01",
            license="ours; textures CC0", credit="Poly Haven (stone_pathway, large_sandstone_blocks_01)", notes="origin: the middle of its left end; it runs 16 m along +x")
