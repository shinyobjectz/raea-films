# ferris/snack-cart: a vendor's cart (Poly Haven's CoffeeCart_01, CC0). Origin: on the ground at its middle. No rig.
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp
col, root, parts, credit = comp.ph_component("ferris", "snack_cart", "CoffeeCart_01", res="1k")
lo, hi = comp.box_of(list(parts.values()))
print("PARTS snack_cart", list(parts), [round(v, 3) for v in (hi - lo)])
comp.export(col, root, "ferris", "snack_cart", made="blender/components/ferris/snack_cart.py", source="https://polyhaven.com/a/CoffeeCart_01", license="CC0", credit=credit)
