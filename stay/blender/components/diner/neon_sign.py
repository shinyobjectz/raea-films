# diner/neon-sign: the window's neon, modelled by hand: OPEN in bent tube 20 cm tall (material neon_tube: the one the
# agent turns from red to blue) over a coffee cup with steam in a second tube (neon_tube_b, warm white), each letter one
# tube on stand-offs from a black steel frame 0.92 x 0.56 m, a transformer box and its lead, two chains to the window
# head. Its back at y 0, its middle the origin. Rig: both colours are the scene's (a key per state).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import pipe, fillet, rod, rbox, T, R, S, xf

col, root = comp.fresh("neon_sign")
M = _lib.maker(col, root)
red = comp.mat("neon_tube", (1.0, 0.1, 0.06), rough=0.3, emit=(1.0, 0.07, 0.04), strength=22.0)
warm = comp.mat("neon_tube_b", (1.0, 0.85, 0.6), rough=0.3, emit=(1.0, 0.8, 0.5), strength=14.0)
frame = comp.mat("neon_frame", (0.02, 0.02, 0.022), rough=0.5)
steel = comp.mat("neon_fixings", (0.6, 0.6, 0.62), rough=0.35, metal=1.0)
Y, TR = -0.035, 0.009
ell = lambda cx, cz, rx, rz, a0=0, a1=360, n=28: [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cz + rz * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
H = 0.2
letters = {
    "O": [ell(0.055, H / 2, 0.055, H / 2, 100, 460)],
    "P": [fillet([(0, 0, 0), (0, 0, H), (0.07, 0, H), (0.105, 0, H * 0.75), (0.07, 0, H * 0.5), (0.012, 0, H * 0.5)], 0.03)],
    "E": [fillet([(0.1, 0, H), (0, 0, H), (0, 0, 0), (0.1, 0, 0)], 0.02), [(0.012, 0, H / 2), (0.08, 0, H / 2)]],
    "N": [fillet([(0, 0, 0), (0, 0, H), (0.1, 0, 0), (0.1, 0, H)], 0.012)],
}
x = -0.3
tubes, posts = [], []
for ch in "OPEN":
    for path in letters[ch]:
        pts = [((p[0] + x, Y, p[1] + 0.03) if len(p) == 2 else (p[0] + x, Y, p[2] + 0.03)) for p in path]
        tubes.append(pipe(pts, TR, sides=3))
        for q in (pts[len(pts) // 5], pts[-len(pts) // 5 - 1]):
            posts.append(rod((q[0], Y, q[2]), (q[0], -0.008, q[2]), 0.003, seg=6))
    x += 0.165
M("neon_sign_open", comp.merge(*tubes), red)
# the cup: a bowl, a handle, a saucer line, and three wisps of steam
cup = [pipe([(px - 0.0, Y, pz) for px, pz in ell(0, -0.1, 0.085, 0.085, 180, 360, 20)] + [(0.085, Y, -0.1), (-0.085, Y, -0.1)], TR, sides=3, cyclic=True),
       pipe([(px, Y, pz) for px, pz in ell(0.085, -0.135, 0.04, 0.03, -80, 80, 12)], TR, sides=3),
       pipe([(-0.13, Y, -0.205), (0.13, Y, -0.205)], TR, sides=3)]
for i, sx in enumerate((-0.045, 0.0, 0.045)):
    cup.append(pipe([(sx + 0.012 * math.sin(t * 7), Y, -0.085 + t * 0.075) for t in [k / 12 for k in range(13)]], TR * 0.85, sides=3))
M("neon_sign_cup", comp.merge(*cup), warm)
for q in ((-0.07, -0.16), (0.07, -0.16), (-0.12, -0.205), (0.12, -0.205)):
    posts.append(rod((q[0], Y, q[1]), (q[0], -0.008, q[1]), 0.003, seg=6))
M("neon_sign_posts", comp.merge(*posts), steel)
FW, FH = 0.92, 0.56
bars = [comp.box((FW, 0.012, 0.012), at=(0, -0.006, z)) for z in (FH / 2 - 0.006, -FH / 2 + 0.006, 0.13, -0.02, -0.16)] + [comp.box((0.012, 0.012, FH), at=(sx * (FW / 2 - 0.006), -0.006, 0)) for sx in (-1, 1)]
bars += [comp.box((0.012, 0.012, FH), at=(sx, -0.006, 0)) for sx in (-0.22, 0.0, 0.22)]
M("neon_sign_frame", comp.merge(*bars), frame, smooth=False)
M("neon_sign_transformer", rbox((0.16, 0.04, 0.06), at=(0.3, -0.03, -FH / 2 + 0.05), r=0.005), frame, smooth=False)
M("neon_sign_lead", comp.tube([(0.36, -0.03, -FH / 2 + 0.03), (0.42, -0.03, -FH / 2 - 0.02), (0.44, -0.02, -0.5), (0.43, -0.01, -0.8)], 0.003), frame)
chains = []
for sx in (-0.4, 0.4):
    for k in range(14):
        ln = _lib.torus(0.008, 0.0018, seg=10, sides=4, at=(0, 0, 0), axis="Y" if k % 2 else "X")
        xf(ln, S(1, 1, 1.5)); xf(ln, T(sx, -0.006, FH / 2 + 0.012 + k * 0.02))
        chains.append(ln)
M("neon_sign_chains", comp.merge(*chains), steel)
comp.export(col, root, "diner", "neon_sign", made="blender/components/diner/neon_sign.py",
            source="own geometry (a generic OPEN sign with a coffee cup; no brand)", license="ours", credit="",
            rig={"colour": "in the scene: the material neon_tube (the word OPEN) from red to blue, a key per state; neon_tube_b (the cup) is its own material",
                 "position": "the Model's own (it hangs 30 cm inside the window's glass)"},
            notes="the TR rectangle of the diner's hooks: the frame is 0.92 x 0.56 m")
