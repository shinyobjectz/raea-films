# laundromat/soap-vendor: a wall-mounted soap vendor, 0.66 m wide and 0.78 m tall, modelled by hand: a cream enamel
# cabinet with a red header, four columns each with a window on its stack of little boxes, a price, and a chrome
# coin slide with a T handle; a delivery trough along the bottom with one box lying in it, and a lock. Back at y 0,
# origin its middle. Rig: "slide" pushes the second column's coin slide 5 cm in; "vend" drops that column's bottom
# box into the trough.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rod, rbox, label, T, R, S, xf

col, root = comp.fresh("soap_vendor")
M = _lib.maker(col, root)
enamel = comp.mat("soap_vendor_enamel", (0.86, 0.83, 0.72), rough=0.35)
red = comp.mat("soap_vendor_header", (0.7, 0.1, 0.08), rough=0.4)
dark = comp.mat("soap_vendor_dark", (0.03, 0.03, 0.035), rough=0.6)
chrome = comp.mat("soap_vendor_chrome", (0.85, 0.85, 0.87), rough=0.15, metal=0.9)
white = comp.mat("soap_vendor_print", (0.95, 0.95, 0.92), rough=0.5)
glass = _lib.glass("soap_vendor_glass", alpha=0.1)
boxes = [comp.mat("soap_vendor_box_blue", (0.08, 0.25, 0.7), rough=0.5), comp.mat("soap_vendor_box_orange", (0.9, 0.42, 0.05), rough=0.5), comp.mat("soap_vendor_box_white", (0.9, 0.9, 0.88), rough=0.5), comp.mat("soap_vendor_box_pink", (0.85, 0.45, 0.6), rough=0.5)]
W, H, D = 0.66, 0.78, 0.2
M("soap_vendor_cabinet", rbox((W, D, H), at=(0, -D / 2, 0), r=0.01), enamel)
M("soap_vendor_header", rbox((W - 0.04, 0.006, 0.1), at=(0, -D - 0.002, H / 2 - 0.07), r=0.002, seg=1), red)
M("soap_vendor_header_print", label("SOAP  -  BLEACH  -  SOFTENER", 0.032, (0, -D - 0.0056, H / 2 - 0.07)), white)
names = ("SOAP", "SOAP", "BLEACH", "SOFT")
recess, panes, prints, slides_fixed = [], [], [], []
slide = vend = None
CW = (W - 0.06) / 4
for i in range(4):
    cx = -W / 2 + 0.03 + (i + 0.5) * CW
    recess.append(comp.box((CW - 0.03, 0.01, 0.3), at=(cx, -D + 0.055, 0.1)))
    recess.append(comp.box((CW - 0.03, 0.06, 0.005), at=(cx, -D + 0.028, -0.05)))
    panes.append(comp.box((CW - 0.03, 0.004, 0.3), at=(cx, -D - 0.001, 0.1)))
    for k in range(4):
        b = rbox((CW - 0.05, 0.04, 0.066), at=(cx, -D + 0.028, -0.013 + k * 0.068), r=0.003, seg=1)
        if i == 1 and k == 0:
            vend = comp.pivot(col, root, "soap_vendor_vend", (cx, -D + 0.028, -0.013))
            M("soap_vendor_vend_box", b, boxes[i], parent=vend)
        else:
            M(f"soap_vendor_box_{i + 1}_{k + 1}", b, boxes[i])
    prints.append(label(names[i], 0.022, (cx, -D - 0.0008, -0.09)))
    prints.append(label(".75", 0.02, (cx, -D - 0.0008, -0.118)))
    # the coin slide: a chrome plate, the slide and its T handle
    slides_fixed.append(rbox((CW - 0.04, 0.008, 0.07), at=(cx, -D - 0.004, -0.19), r=0.003))
    s = comp.merge(rbox((0.06, 0.07, 0.012), at=(cx, -D - 0.035, -0.19), r=0.003), rbox((0.085, 0.016, 0.03), at=(cx, -D - 0.075, -0.19), r=0.006))
    if i == 1:
        slide = comp.pivot(col, root, "soap_vendor_slide", (cx, -D - 0.035, -0.19))
        M("soap_vendor_slide_2", s, chrome, parent=slide, smooth=True)
    else:
        M(f"soap_vendor_slide_{i + 1}", s, chrome, smooth=True)
M("soap_vendor_recess", comp.merge(*recess), dark)
M("soap_vendor_windows", comp.merge(*panes), glass)
M("soap_vendor_print", comp.merge(*prints), dark)
M("soap_vendor_slide_plates", comp.merge(*slides_fixed), chrome)
M("soap_vendor_trough", comp.merge(comp.box((W - 0.08, 0.004, 0.09), at=(0, -D - 0.001, -0.3)), comp.box((W - 0.08, 0.05, 0.004), at=(0, -D - 0.025, -0.343))), dark)
M("soap_vendor_trough_lip", comp.merge(rbox((W - 0.06, 0.008, 0.03), at=(0, -D - 0.05, -0.33), r=0.003), rbox((0.008, 0.05, 0.03), at=(-W / 2 + 0.034, -D - 0.025, -0.33), r=0.003), rbox((0.008, 0.05, 0.03), at=(W / 2 - 0.034, -D - 0.025, -0.33), r=0.003)), chrome)
M("soap_vendor_fallen_box", xf(xf(rbox((0.1, 0.04, 0.066), r=0.003, seg=1), R(90, "Y")), T(0.2, -D - 0.025, -0.3)), boxes[3])
M("soap_vendor_lock", turn([(0.0, 0.008), (0.012, 0.008), (0.015, 0.0)], seg=20, axis="F", at=(W / 2 - 0.03, -D, H / 2 - 0.16)), chrome, smooth=True)
_lib.channel("slide", [(slide, "location", 1, slide.location.y, slide.location.y + 0.05)])
_lib.channel("vend", [(vend, "location", 2, vend.location.z, -0.3), (vend, "location", 1, vend.location.y, -D - 0.025), (vend, "rotation_euler", 1, 0, math.radians(90))])
comp.export(col, root, _lib.PLACE, "soap_vendor", made="blender/components/laundromat/soap_vendor.py", source="own geometry (a generic coin-slide soap vendor); letters in Blender's built-in font", license="ours", credit="",
            rig={"slide": "the second column's coin slide pushes 5 cm in (soap_vendor_slide)", "vend": "that column's bottom box drops into the trough and falls on its side (soap_vendor_vend)"},
            notes="Back at y 0, origin its middle: mount it with its middle about 1.35 m up.")
