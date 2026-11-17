# observatory/chart-cabinet: the plate and chart cabinet, Poly Haven's vintage_wooden_drawer_01 (CC0): six drawers with
# brass label pulls. Rig: "drawer" pulls the top middle drawer out 38 cm; "drawers" pulls all six by their own amounts.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
col, root, parts, credit = comp.ph_component("observatory", "chart_cabinet", "vintage_wooden_drawer_01", res="2k")
dr = sorted((k, o) for k, o in parts.items() if "drawer" in k)
lo, hi = comp.box_of(parts["body"])
for k, o in dr:                                   # the asset has them part open; push each home, flush with the body's front
    dlo, dhi = comp.box_of(o)
    o.location.y += (lo.y - 0.012) - dlo.y
mid = dr[1][1]
_lib.channel("drawer", [(mid, "location", 1, mid.location.y, mid.location.y - 0.38)])
pulls = (0.22, 0.38, 0.12, 0.3, 0.16, 0.34)
_lib.channel("drawers", [(o, "location", 1, o.location.y, o.location.y - p) for (k, o), p in zip(dr, pulls)])
comp.export(col, root, "observatory", "chart_cabinet", made="blender/components/observatory/chart_cabinet.py", source="https://polyhaven.com/a/vintage_wooden_drawer_01 (its drawers pushed home)", license="CC0", credit=credit,
            rig={"drawer": "the top middle drawer slides out 38 cm", "drawers": "all six slide out, 12 to 38 cm each"})
