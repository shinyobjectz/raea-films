# laundromat/bulletin-board: a cork notice board, 0.9 x 0.6 m in a wooden frame, modelled by hand, with eight pinned
# papers in faded colours, each a little crooked with our own words and pin, two of them with tear-off tabs (some
# torn away), and a few cards. Back at y 0, origin its middle. Rig: "flutter" lifts the bottoms of the papers 16
# degrees off the cork on their pins (the door's draught).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, turn, rbox, label, T, R, S, xf

col, root = comp.fresh("bulletin_board")
M = _lib.maker(col, root)
cork = comp.ph_texture("bulletin_cork", "plywood", tile=0.6, res="1k", tint=(0.75, 0.55, 0.36))
wood = comp.ph_texture("bulletin_frame", "plywood", tile=0.5, res="1k", tint=(0.5, 0.35, 0.22))
ink = comp.mat("bulletin_ink", (0.04, 0.04, 0.06), rough=0.6)
papers = [comp.mat(f"bulletin_paper_{n}", c, rough=0.7) for n, c in (("white", (0.93, 0.93, 0.9)), ("yellow", (0.95, 0.88, 0.45)), ("pink", (0.93, 0.65, 0.7)), ("green", (0.65, 0.85, 0.65)), ("blue", (0.62, 0.78, 0.92)))]
pins = [comp.mat(f"bulletin_pin_{n}", c, rough=0.3) for n, c in (("red", (0.8, 0.08, 0.06)), ("blue", (0.1, 0.3, 0.8)), ("yellow", (0.95, 0.8, 0.1)))]
W, H = 0.9, 0.6
c = M("bulletin_board_cork", comp.box((W, 0.012, H), at=(0, -0.006, 0)), cork)
comp.uv_box(c, 1.0)
f = M("bulletin_board_frame", comp.merge(comp.box((W + 0.05, 0.022, 0.03), at=(0, -0.011, H / 2 + 0.01)), comp.box((W + 0.05, 0.022, 0.03), at=(0, -0.011, -H / 2 - 0.01)), comp.box((0.03, 0.022, H), at=(-W / 2 - 0.01, -0.011, 0)), comp.box((0.03, 0.022, H), at=(W / 2 + 0.01, -0.011, 0))), wood)
comp.bevel(f, 0.003, 2)
comp.uv_box(f, 1.0)
rnd = random.Random(21)
notes = [(-0.3, 0.13, 0.2, 0.26, 0, ["LOST CAT", "GREY, ONE EAR", "ANSWERS TO", "NOTHING"], True), (-0.05, 0.14, 0.16, 0.2, 1, ["GUITAR", "LESSONS", "CHEAP"], True), (0.2, 0.12, 0.22, 0.16, 2, ["ROOM TO LET", "NO SMOKERS", "ASK AT THE DESK"], False),
         (0.33, -0.1, 0.16, 0.2, 3, ["YARD SALE", "SATURDAY", "8 TO NOON"], False), (-0.33, -0.16, 0.14, 0.1, 4, ["FOUND:", "ONE SOCK"], False), (-0.12, -0.13, 0.2, 0.14, 0, ["BAND NEEDS", "A DRUMMER"], False),
         (0.1, -0.15, 0.14, 0.18, 1, ["NIGHT SHIFT", "HELP WANTED", "INQUIRE", "WITHIN"], False), (0.36, 0.2, 0.09, 0.055, 0, ["TAXI", "24 HRS"], False)]
keys = []
for i, (x, z, w, h, mi, lines, tabs) in enumerate(notes):
    yaw = rnd.uniform(-6, 6)
    top = (x, -0.0125, z + h / 2 - 0.012)
    p = comp.pivot(col, root, f"bulletin_board_note_{i + 1}", top)
    place = lambda bm: xf(xf(xf(bm, T(0, 0, -h / 2 + 0.012)), R(yaw, "Y")), T(*top))
    sheet = comp.box((w, 0.0006, h))
    if tabs:
        cuts = [comp.box((w / 8 - 0.003, 0.0006, 0.05), at=(-w / 2 + (k + 0.5) * w / 8, 0, -h / 2 - 0.025)) for k in range(8) if k not in (2, 5, 6)]
        sheet = comp.merge(sheet, *cuts)
    M(f"bulletin_board_note_{i + 1}_paper", place(sheet), papers[mi], parent=p)
    size = min(0.03, w / (max(len(l) for l in lines) * 0.62))
    txt = comp.merge(*[label(l, size, (0, -0.0008, h / 2 - 0.04 - k * size * 1.35), depth=0.0004) for k, l in enumerate(lines)])
    M(f"bulletin_board_note_{i + 1}_print", place(txt), ink, parent=p)
    M(f"bulletin_board_note_{i + 1}_pin", turn([(0.0, 0.012), (0.005, 0.011), (0.006, 0.006), (0.003, 0.004), (0.005, 0.0)], seg=10, axis="F", at=(top[0], top[1] - 0.0004, top[2])), pins[i % 3], smooth=True)
    keys.append((p, "rotation_euler", 0, 0, math.radians(-16) * rnd.uniform(0.5, 1.0)))
_lib.channel("flutter", keys)
comp.export(col, root, _lib.PLACE, "bulletin_board", made="blender/components/laundromat/bulletin_board.py", source="own geometry and our own words; cork and frame tinted from https://polyhaven.com/a/plywood", license="ours; texture CC0", credit="Poly Haven (plywood)",
            rig={"flutter": "every paper's bottom lifts up to 16 degrees off the cork, hinged at its pin (bulletin_board_note_1 to 8)"},
            notes="Back at y 0, origin its middle: hang it with its middle about 1.6 m up.")
