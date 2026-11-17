# office/filing-cabinet: a four-drawer steel filing cabinet, 0.46 x 0.62 x 1.32 m, modelled by hand: a folded case,
# four drawer fronts each with a pull, a label holder and a thumb latch, a lock at the top. Rig: "drawer" pulls the
# top drawer out 0.42 m; "drawers" all four a little (rattled).
import os, sys, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("filing_cabinet")
steel = comp.ph_texture("cabinet_steel", "metal_plate", tile=1.2, tint=(0.62, 0.64, 0.6), metal=0.0)
steel = comp.mat("cabinet_paint", (0.55, 0.57, 0.53), rough=0.42)
chrome = comp.mat("cabinet_chrome", (0.85, 0.85, 0.87), rough=0.15, metal=1.0)
card = comp.mat("cabinet_label", (0.9, 0.88, 0.8), rough=0.8)
dark = comp.mat("cabinet_inside", (0.08, 0.08, 0.08), rough=0.8)
W, D, H = 0.46, 0.62, 1.32
case = comp.box((W, D, H), at=(0, 0, H / 2))
c = comp.mesh(col, root, "filing_cabinet_case", case, steel)
comp.bevel(c, 0.004, 2)
comp.mesh(col, root, "filing_cabinet_lock", comp.cyl(0.009, 0.006, at=(W / 2 - 0.045, -D / 2 - 0.004, H - 0.03), seg=20, axis="Y"), chrome, smooth=True)
DH = (H - 0.08) / 4
drawers = []
for i in range(4):
    z = H - 0.03 - DH * (i + 0.5)
    piv = comp.pivot(col, root, f"filing_cabinet_drawer_{i + 1}", (0, -D / 2, z))
    front = comp.mesh(col, root, f"filing_cabinet_front_{i + 1}", comp.box((W - 0.022, 0.02, DH - 0.012), at=(0, -D / 2 - 0.008, z)), steel, parent=piv)
    comp.bevel(front, 0.003, 2)
    comp.mesh(col, root, f"filing_cabinet_box_{i + 1}", comp.merge(comp.box((W - 0.05, D - 0.06, 0.004), at=(0, -0.02, z - DH / 2 + 0.03)),
              comp.box((0.004, D - 0.06, DH - 0.06), at=(-W / 2 + 0.027, -0.02, z)), comp.box((0.004, D - 0.06, DH - 0.06), at=(W / 2 - 0.027, -0.02, z)),
              comp.box((W - 0.05, 0.004, DH - 0.06), at=(0, D / 2 - 0.052, z))), dark, parent=piv)
    pull = comp.merge(comp.box((0.13, 0.012, 0.012), at=(0, -D / 2 - 0.036, z - 0.02)), comp.box((0.012, 0.022, 0.012), at=(-0.059, -D / 2 - 0.026, z - 0.02)), comp.box((0.012, 0.022, 0.012), at=(0.059, -D / 2 - 0.026, z - 0.02)))
    po = comp.mesh(col, root, f"filing_cabinet_pull_{i + 1}", pull, chrome, parent=piv)
    comp.bevel(po, 0.003, 2)
    comp.mesh(col, root, f"filing_cabinet_label_{i + 1}", comp.merge(comp.box((0.09, 0.003, 0.034), at=(0, -D / 2 - 0.019, z + 0.045)), ), chrome, parent=piv)
    comp.mesh(col, root, f"filing_cabinet_card_{i + 1}", comp.box((0.08, 0.001, 0.026), at=(0, -D / 2 - 0.0212, z + 0.045)), card, parent=piv)
    comp.mesh(col, root, f"filing_cabinet_latch_{i + 1}", comp.box((0.016, 0.01, 0.024), at=(W / 2 - 0.05, -D / 2 - 0.022, z - 0.02)), chrome, parent=piv)
    drawers.append(piv)
comp.channel("drawer", [(drawers[0], "location", 1, drawers[0].location.y, drawers[0].location.y - 0.42)])
comp.channel("drawers", [(d, "location", 1, d.location.y, d.location.y - 0.05) for d in drawers])
comp.export(col, root, "office", "filing_cabinet", made="blender/components/office/filing_cabinet.py", source="own geometry (a generic four-drawer filing cabinet)", license="ours", credit="",
            rig={"drawer": "the top drawer out 0.42 m toward the front", "drawers": "all four drawers out 5 cm"})
