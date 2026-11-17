# bedroom/games: the stack of games beside the television, modelled by hand: nine boxed games in plastic clamshell
# cases (19 x 13.5 x 2.6 cm), each its own colour with a spine label and a made-up title, stacked a little askew, and
# two loose grey cartridges with their labels leaning on the stack. Rig: "slide" pushes the top three cases 6 cm off
# the stack (the cursor's nudge), each a little further than the one under it.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp
from comp import T, R, xf
col, root = comp.fresh("games")
M = _lib.maker(col, root)
rnd = random.Random(96)
TITLES = ["STAR KART", "MOON QUEST", "DINO DASH", "TURBO PALS", "CASTLE 64", "SKATE CITY", "ROBO RALLY", "DEEP SEA", "PIXEL CUP"]
COLS = [(0.8, 0.1, 0.1), (0.1, 0.25, 0.7), (0.1, 0.55, 0.25), (0.95, 0.75, 0.1), (0.5, 0.15, 0.6), (0.95, 0.45, 0.1), (0.1, 0.6, 0.65), (0.05, 0.1, 0.35), (0.85, 0.2, 0.5)]
CW, CD, CT = 0.19, 0.135, 0.026
clear = comp.mat("games_case", (0.07, 0.07, 0.08), rough=0.25)
white = comp.mat("games_label", (0.93, 0.92, 0.88), rough=0.6)
ink = comp.mat("games_ink", (0.04, 0.04, 0.05), rough=0.6)
tops = []
for i, (t, c) in enumerate(zip(TITLES, COLS)):
    z = i * (CT + 0.0006)
    a = rnd.uniform(-9, 9)
    off = (rnd.uniform(-0.008, 0.008), rnd.uniform(-0.008, 0.008))
    p = comp.pivot(col, root, f"games_case_{i + 1}", (off[0], off[1], z))
    X = R(a, "Z")
    place = lambda bm: xf(xf(bm, X), T(off[0], off[1], z))
    cm = comp.mat(f"games_cover_{i + 1}", _lib.srgb(c), rough=0.35)
    case = M(f"games_case_{i + 1}_shell", place(comp.box((CW, CD, CT), at=(0, 0, CT / 2))), clear, parent=p)
    comp.bevel(case, 0.003, 2)
    # the cover sheet wraps the front (top when lying), the spine (toward -y) and the back
    M(f"games_case_{i + 1}_cover", place(comp.merge(comp.box((CW - 0.012, CD - 0.008, 0.0006), at=(0, 0.002, CT + 0.0002)), comp.box((CW - 0.012, 0.0006, CT - 0.006), at=(0, -CD / 2 - 0.0002, CT / 2)))), cm, parent=p)
    M(f"games_case_{i + 1}_band", place(comp.merge(comp.box((0.03, 0.0008, CT - 0.006), at=(-CW / 2 + 0.03, -CD / 2 - 0.0005, CT / 2)), comp.box((CW - 0.04, 0.04, 0.0008), at=(0, -0.02, CT + 0.0005)))), white, parent=p)
    M(f"games_case_{i + 1}_title", place(comp.merge(xf(comp.text(t, 0.012, depth=0.0006), T(0.02, -CD / 2 - 0.001, CT / 2)), xf(xf(comp.text(t, 0.02, depth=0.0006), R(-90, "X")), T(0, -0.02, CT + 0.0012)))), ink, parent=p)
    tops.append(p)
# two loose cartridges leaning against the stack
grey = comp.mat("games_cart", (0.45, 0.45, 0.47), rough=0.5)
for i, (x, a, c) in enumerate(((0.16, 14, (0.9, 0.3, 0.1)), (0.2, 22, (0.2, 0.5, 0.9)))):
    cart = comp.merge(comp.box((0.11, 0.018, 0.075), at=(0, 0, 0.0375)), comp.box((0.09, 0.02, 0.012), at=(0, 0, 0.081)))
    lab = comp.box((0.085, 0.0006, 0.045), at=(0, -0.0094, 0.043))
    Xc = T(x, -0.03 + i * 0.05, 0) @ R(90, "Z") @ R(a, "X")
    co = M(f"games_cart_{i + 1}", xf(cart, Xc), grey)
    comp.bevel(co, 0.002, 2)
    M(f"games_cart_{i + 1}_label", xf(lab, Xc), comp.mat(f"games_cart_label_{i + 1}", _lib.srgb(c), rough=0.4))
comp.channel("slide", [(p, "location", 0, p.location.x, p.location.x + 0.02 * (j + 1)) for j, p in enumerate(tops[-3:])])
comp.export(col, root, _lib.PLACE, "games", made="blender/components/bedroom/games.py", source="own geometry (generic game cases; the titles are made up)", license="ours", credit="",
            rig={"slide": "the top three cases slide 2, 4 and 6 cm off the stack toward +x"})
