# vinyl/cash-register: a vintage cash register for the counter (Poly Haven's CashRegister_01, CC0), 0.6 m wide.
# Rig: "drawer" opens the cash drawer 0.17 m toward the front (the model's drawer stands open; rest is pushed shut).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

col, root, parts, credit = comp.ph_component(PLACE, "cash_register", "CashRegister_01", res="2k")
d = next(o for k, o in parts.items() if "drawer" in k)
channel("drawer", [(d, "location", 1, d.location.y + 0.17, d.location.y)])
done(col, root, "cash_register", "https://polyhaven.com/a/CashRegister_01", license="CC0", credit=credit,
     rig={"drawer": "the cash drawer out 0.17 m toward the front"})
