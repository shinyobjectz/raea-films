# office/printer: an office laser printer on its own stand, modelled by hand: a low cabinet with two doors, the
# printer's body with a paper cassette, an output slot and tray, a control panel with a small lit display and
# buttons, and a sheet of paper in the slot. Rig: "paper feed" slides the sheet 0.24 m out onto the tray.
import os, sys, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("printer")
body_m = comp.mat("printer_body", (0.8, 0.79, 0.75), rough=0.5)
dark = comp.mat("printer_dark", (0.09, 0.09, 0.1), rough=0.5)
stand_m = comp.mat("printer_stand", (0.5, 0.51, 0.5), rough=0.5)
paper = comp.mat("printer_paper", (0.93, 0.93, 0.9), rough=0.7)
lcd = comp.mat("printer_display", (0.1, 0.3, 0.2), rough=0.2, emit=(0.3, 0.9, 0.55), strength=2.0)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
SH = 0.56
st = M("printer_stand", comp.merge(comp.box((0.56, 0.5, SH - 0.04), at=(0, 0, 0.04 + (SH - 0.04) / 2)), *[comp.cyl(0.02, 0.04, at=(sx * 0.24, sy * 0.21, 0), seg=12) for sx in (-1, 1) for sy in (-1, 1)]), stand_m)
comp.bevel(st, 0.004, 2)
M("printer_stand_doors", comp.merge(comp.box((0.268, 0.012, SH - 0.08), at=(-0.137, -0.256, 0.04 + (SH - 0.04) / 2)), comp.box((0.268, 0.012, SH - 0.08), at=(0.137, -0.256, 0.04 + (SH - 0.04) / 2)),
                                    comp.box((0.012, 0.014, 0.1), at=(-0.02, -0.268, 0.36)), comp.box((0.012, 0.014, 0.1), at=(0.02, -0.268, 0.36))), stand_m)
W, D, H = 0.46, 0.43, 0.3
body = comp.box((W, D, H), at=(0, 0, SH + H / 2))
for v in body.verts:
    if v.co.z > SH + H / 2 and v.co.y < 0:
        v.co.y += 0.05; v.co.z -= 0.03   # the front slopes back to the top
b = M("printer_body", body, body_m)
comp.bevel(b, 0.012, 3)
M("printer_cassette", comp.merge(comp.box((W - 0.06, 0.02, 0.07), at=(0, -D / 2 - 0.004, SH + 0.055)), comp.box((0.12, 0.012, 0.016), at=(0, -D / 2 - 0.016, SH + 0.055))), body_m)
M("printer_slot", comp.box((W - 0.1, 0.06, 0.012), at=(0, -D / 2 + 0.07, SH + H - 0.034)), dark)
tray = comp.box((W - 0.12, 0.2, 0.006), at=(0, -D / 2 - 0.06, SH + H - 0.075))
xf(tray, T(0, 0, 0)); 
to = M("printer_tray", tray, body_m)
comp.bevel(to, 0.002, 2)
panel = M("printer_panel", comp.box((0.16, 0.07, 0.012), at=(W / 2 - 0.1, D / 2 - 0.09, SH + H + 0.004)), dark)
M("printer_display", comp.box((0.07, 0.03, 0.002), at=(W / 2 - 0.13, D / 2 - 0.085, SH + H + 0.0105)), lcd)
M("printer_buttons", comp.merge(*[comp.cyl(0.006, 0.004, at=(W / 2 - 0.075 + i * 0.018, D / 2 - 0.075 - j * 0.02, SH + H + 0.009), seg=12) for i in range(3) for j in range(2)]), body_m)
sheet = comp.pivot(col, root, "printer_sheet", (0, -D / 2 + 0.07, SH + H - 0.06))
M("printer_paper", comp.box((0.21, 0.297, 0.0006), at=(0, -D / 2 + 0.2, SH + H - 0.066)), paper, parent=sheet)
M("printer_stack", comp.box((0.21, 0.297, 0.012), at=(0, -D / 2 - 0.02, SH + H - 0.066)), paper)
comp.channel("paper feed", [(sheet, "location", 1, sheet.location.y, sheet.location.y - 0.24)])
comp.export(col, root, "office", "printer", made="blender/components/office/printer.py", source="own geometry (a generic office laser printer on a stand)", license="ours", credit="",
            rig={"paper feed": "a sheet slides 0.24 m out of the slot onto the tray"})
