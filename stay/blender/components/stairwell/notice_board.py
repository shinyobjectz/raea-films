# stairwell/notice-board: a residents' notice board, 90 x 60 cm, modelled by hand: a cork panel in a mitred oak
# frame, nine pinned papers (notices with grey lines of text, a yellow flyer with tear-off tabs, a card, a takeaway
# menu) each hanging from its own pin, and spare pins. A wall item: its back at y 0, its front toward -y, its origin
# at its centre. Rig: "flutter" lifts the papers' free ends 6 to 28 degrees about their pins (the draught of
# something falling past, a door opening).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

random.seed(7)
col, root = comp.fresh("notice_board")
cork = comp.ph_texture("board_cork", "oriented_strand_board", tile=0.5, res="1k", tint=(0.8, 0.6, 0.42))
oak = comp.ph_texture("board_frame", "oak_veneer_01", tile=0.6, res="1k")
ink = comp.mat("board_ink", (0.18, 0.18, 0.2), rough=0.7)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, HT = 0.9, 0.6
c = M("notice_board_cork", comp.box((W, 0.012, HT), at=(0, -0.006, 0)), cork)
comp.uv_box(c, 1.0)
fr = M("notice_board_frame", comp.merge(comp.box((W + 0.07, 0.024, 0.035), at=(0, -0.012, HT / 2 + 0.0175)), comp.box((W + 0.07, 0.024, 0.035), at=(0, -0.012, -HT / 2 - 0.0175)),
                                         comp.box((0.035, 0.024, HT), at=(-W / 2 - 0.0175, -0.012, 0)), comp.box((0.035, 0.024, HT), at=(W / 2 + 0.0175, -0.012, 0))), oak)
comp.bevel(fr, 0.004, 2)
comp.uv_box(fr, 1.0)
PAPERS = [(-0.3, 0.26, 0.21, 0.297, (0.93, 0.93, 0.9), 3), (-0.05, 0.24, 0.21, 0.297, (0.9, 0.82, 0.3), -2), (0.21, 0.27, 0.148, 0.21, (0.92, 0.9, 0.86), 4), (0.37, 0.2, 0.1, 0.15, (0.55, 0.75, 0.9), -5),
          (-0.36, -0.08, 0.148, 0.105, (0.95, 0.75, 0.75), 2), (0.2, 0.03, 0.21, 0.148, (0.93, 0.93, 0.9), -3), (0.36, -0.02, 0.105, 0.2, (0.8, 0.25, 0.2), 6), (-0.17, -0.1, 0.09, 0.055, (0.95, 0.95, 0.92), -8), (0.03, -0.12, 0.1, 0.1, (0.6, 0.85, 0.6), 4)]
PINS = [(0.8, 0.1, 0.08), (0.1, 0.3, 0.8), (0.9, 0.75, 0.1), (0.1, 0.6, 0.2)]
chans = []
for i, (x, ztop, w, h, colr, lean) in enumerate(PAPERS):
    pp = comp.pivot(col, root, f"notice_board_paper_{i + 1}", (x, -0.0125, ztop))
    y = -0.0128 - 0.0006 * i
    sheet = comp.box((w, 0.0004, h), at=(x, y, ztop - h / 2 + 0.012))
    pm = comp.mat(f"board_paper_{i + 1}", colr, rough=0.6)
    M(f"notice_board_paper_{i + 1}_sheet", sheet, pm, parent=pp)
    lines = [comp.box((w * 0.5, 0.0002, 0.012), at=(x, y - 0.0003, ztop - 0.03))] if h > 0.12 else []
    n = int((h - 0.07) / 0.014)
    for k in range(max(0, n)):
        ln = w * (0.78 if k % 5 != 4 else 0.45)
        lines.append(comp.box((ln, 0.0002, 0.0035), at=(x - (w * 0.78 - ln) / 2, y - 0.0003, ztop - 0.055 - k * 0.014)))
    if i == 1:   # tear-off tabs along the flyer's foot
        lines += [comp.box((0.0012, 0.0002, 0.05), at=(x - w / 2 + (k + 1) * w / 8, y - 0.0003, ztop + 0.012 - h + 0.025)) for k in range(7)]
    if lines:
        M(f"notice_board_paper_{i + 1}_print", comp.merge(*lines), ink, parent=pp)
    M(f"notice_board_pin_{i + 1}", comp.merge(L.sphere(0.006, at=(x, y - 0.008, ztop), u=10, v=6), comp.cyl(0.001, 0.009, at=(x, y - 0.008, ztop), seg=6, axis="Y")), comp.mat(f"board_pin_{i % 4 + 1}", PINS[i % 4], rough=0.25), parent=pp, smooth=True)
    pp.rotation_euler[1] = math.radians(lean)
    chans.append((pp, "rotation_euler", 0, 0, math.radians(6 + (i * 37) % 23)))
M("notice_board_spare_pins", comp.merge(*[L.sphere(0.006, at=(-0.42 + 0.03 * k, -0.02, -0.27 + 0.01 * (k % 2)), u=10, v=6) for k in range(5)]), comp.mat("board_pin_1", PINS[0], rough=0.25), smooth=True)
comp.bpy.context.view_layer.update()
comp.channel("flutter", chans)
comp.export(col, root, "stairwell", "notice_board", made="blender/components/stairwell/notice_board.py", source="own geometry; textures: https://polyhaven.com/a/oriented_strand_board (as cork), https://polyhaven.com/a/oak_veneer_01", license="ours; textures CC0", credit="Poly Haven (oriented_strand_board, oak_veneer_01)",
            rig={"flutter": "each paper's free end lifts 6 to 28 degrees off the board about its pin"}, notes="origin: its centre on the wall")
