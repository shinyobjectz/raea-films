# bedroom/toy-box: a cardboard box used as the toy box (Poly Haven's cardboard_box_01, CC0), with a baseball bat
# standing in it and leaning on its rim, an American football and a baseball in it (Poly Haven's baseball_bat,
# american_football and baseball_01, CC0). Rig: "bat" tips the bat 14 degrees further over (a knock).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from comp import T, R
col, root, parts, credit = comp.ph_component(_lib.PLACE, "toy_box", "cardboard_box_01", res="1k", origin="floor")
lo, hi = comp.box_of(list(parts.values()))
print("box", list(parts), lo, hi)
bat = comp.pivot(col, root, "toy_box_bat", (0.05, 0.0, 0.03))
m1, c1 = _lib.ph_add(col, root, "baseball_bat", "toy_box_bat_wood", X=T(0.05, 0.0, 0.03) @ R(-17, "Y"), parent=bat)
m2, c2 = _lib.ph_add(col, root, "american_football", "toy_box_football", X=T(-0.05, -0.08, hi.z - 0.09) @ R(35, "Z") @ R(-20, "Y"), scale=0.62)
m3, c3 = _lib.ph_add(col, root, "baseball_01", "toy_box_baseball", X=T(0.08, 0.12, hi.z - 0.02))
comp.channel("bat", [(bat, "rotation_euler", 1, 0, math.radians(-14))])
comp.export(col, root, _lib.PLACE, "toy_box", made="blender/components/bedroom/toy_box.py",
            source="https://polyhaven.com/a/cardboard_box_01, /baseball_bat, /american_football, /baseball_01", license="CC0", credit=f"{credit}; {c1}; {c2}; {c3}",
            rig={"bat": "the bat tips 14 degrees further over about its foot in the box"})
