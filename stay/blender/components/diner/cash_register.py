# diner/cash-register: a vintage cash register on the counter (Poly Haven's CashRegister_01, CC0), 60 cm wide, its keys
# toward -y. The model's coin drawer stands open; here it rests shut. Rig: "drawer" springs it 17 cm open.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
TURN = float(os.environ.get("REGISTER_TURN", "0"))
col, root, parts, credit = comp.ph_component("diner", "cash_register", "CashRegister_01", res="1k", turn=TURN)
print("PARTS", {k: [tuple(round(c, 3) for c in v) for v in comp.box_of(o)] for k, o in parts.items()})
rig = {}
dr = next((o for k, o in parts.items() if "drawer" in k.lower()), None)
if dr is not None:
    comp.channel("drawer", [(dr, "location", 1, dr.location.y + 0.17, dr.location.y)])
    dr.location.y += 0.17
    rig["drawer"] = "the coin drawer springs 17 cm open toward the front (it rests shut)"
comp.export(col, root, "diner", "cash_register", made="blender/components/diner/cash_register.py",
            source="https://polyhaven.com/a/CashRegister_01", license="CC0", credit=credit, rig=rig)
