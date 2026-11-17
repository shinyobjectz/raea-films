# ferris/snack-cart CoffeeCart-01 a-vendor's-cart:  (Poly Haven's , CC0). Origin: on the ground at its middle. No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("ferris", "snack_cart CoffeeCart_01 a_vendor's_cart", "", res="1k")
lo, hi = comp.box_of(list(parts.values()))
print("PARTS snack_cart CoffeeCart_01 a_vendor's_cart", list(parts), [round(v, 3) for v in (hi - lo)])
comp.export(col, root, "ferris", "snack_cart CoffeeCart_01 a_vendor's_cart", made="blender/components/ferris/snack_cart CoffeeCart_01 a_vendor's_cart.py", source="https://polyhaven.com/a/", license="CC0", credit=credit)
