# stairwell/mailboxes: the ground floor's bank of letterboxes, eight in two rows, 1.0 x 0.72 m and 22 cm deep,
# modelled by hand: a folded steel carcass, each box with its own door (a letter slot under a hood, a cam lock, a
# name-card holder with its card, a number), letters and a rolled paper standing out of three slots. A wall item:
# its back at y 0, its front toward -y, origin at its centre. Rig: "open" swings box 6's door 100 degrees on its
# side hinge; "flap" pushes every slot's flap 40 degrees in.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

random.seed(3)
col, root = comp.fresh("mailboxes")
steel = comp.mat("mailbox_steel", (0.3, 0.33, 0.35), rough=0.42, metal=0.6)
doorm = comp.mat("mailbox_door", (0.42, 0.45, 0.46), rough=0.38, metal=0.6)
dark = comp.mat("mailbox_slot", (0.01, 0.01, 0.012), rough=0.9)
chrome = comp.mat("mailbox_lock", (0.85, 0.85, 0.87), rough=0.15, metal=1.0)
card = comp.mat("mailbox_card", (0.92, 0.9, 0.82), rough=0.6)
ink = comp.mat("mailbox_ink", (0.1, 0.1, 0.12), rough=0.6)
paper = comp.mat("mailbox_letter", (0.9, 0.88, 0.8), rough=0.6)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
W, HT, D, NX, NY = 1.0, 0.72, 0.22, 4, 2
shell = comp.merge(comp.box((W, 0.004, HT), at=(0, -0.002, 0)), comp.box((W, D, 0.012), at=(0, -D / 2, HT / 2 - 0.006)), comp.box((W, D, 0.012), at=(0, -D / 2, -HT / 2 + 0.006)),
                   *[comp.box((0.012, D, HT), at=(-W / 2 + 0.006 + k * (W - 0.012) / NX, -D / 2, 0)) for k in range(NX + 1)], comp.box((W, D, 0.012), at=(0, -D / 2, 0)))
s = M("mailboxes_carcass", shell, steel)
comp.bevel(s, 0.002, 2)
M("mailboxes_dark", comp.box((W - 0.03, 0.002, HT - 0.03), at=(0, -0.006, 0)), dark)
CW, CH = (W - 0.012) / NX, (HT - 0.012) / NY
flaps, door6 = [], None
for r in range(NY):
    for c in range(NX):
        n = r * NX + c + 1
        cx, cz = -W / 2 + 0.006 + (c + 0.5) * CW, HT / 2 - 0.006 - (r + 0.5) * CH
        dw, dh = CW - 0.02, CH - 0.02
        hp = comp.pivot(col, root, f"mailboxes_door_{n}", (cx - dw / 2, -D - 0.002, cz))
        SZ = cz + dh / 2 - 0.06      # the slot's height
        door = comp.merge(comp.box((dw, 0.006, dh - 0.085), at=(cx, -D - 0.003, cz - 0.0425)), comp.box((dw, 0.006, 0.035), at=(cx, -D - 0.003, cz + dh / 2 - 0.0175)),
                          comp.box((0.02, 0.006, 0.05), at=(cx - dw / 2 + 0.01, -D - 0.003, SZ)), comp.box((0.02, 0.006, 0.05), at=(cx + dw / 2 - 0.01, -D - 0.003, SZ)),
                          comp.box((dw - 0.03, 0.022, 0.004), at=(cx, -D - 0.014, SZ + 0.026)))
        d = M(f"mailboxes_door_{n}_panel", door, doorm, parent=hp)
        comp.bevel(d, 0.0015, 2)
        fp = comp.pivot(col, root, f"mailboxes_flap_{n}", (cx, -D - 0.001, SZ + 0.024), parent=hp)
        M(f"mailboxes_flap_{n}_plate", comp.box((dw - 0.042, 0.002, 0.046), at=(cx, -D - 0.001, SZ)), steel, parent=fp)
        flaps.append(fp)
        M(f"mailboxes_lock_{n}", comp.merge(comp.cyl(0.011, 0.006, at=(cx + dw / 2 - 0.035, -D - 0.012, cz - 0.09), seg=16, axis="Y"), comp.box((0.003, 0.002, 0.012), at=(cx + dw / 2 - 0.035, -D - 0.013, cz - 0.09))), chrome, parent=hp)
        M(f"mailboxes_card_{n}", comp.merge(comp.box((0.09, 0.001, 0.028), at=(cx - 0.02, -D - 0.0065, cz - 0.02))), card, parent=hp)
        M(f"mailboxes_holder_{n}", comp.merge(*[comp.box((0.096, 0.002, 0.004), at=(cx - 0.02, -D - 0.007, cz - 0.02 + s_ * 0.015)) for s_ in (-1, 1)]), chrome, parent=hp)
        M(f"mailboxes_number_{n}", comp.merge(xf(comp.text(str(n), 0.03, depth=0.001), T(cx - dw / 2 + 0.035, -D - 0.0065, cz - 0.09)), *[comp.box((0.012 + random.random() * 0.05, 0.0006, 0.003), at=(cx - 0.035 + 0.02 * k, -D - 0.0072, cz - 0.02 + 0.006 - 0.012 * k)) for k in range(2)]), ink, parent=hp)
        if n in (2, 5, 7):
            post = [xf(comp.box((0.16 + 0.02 * k, 0.11, 0.0015)), R(8 * k - 6, "Z")) for k in range(2 if n != 5 else 1)]
            for k, b_ in enumerate(post):
                xf(b_, T(cx - 0.01 + 0.012 * k, -D - 0.02, SZ - 0.004 + 0.006 * k))
            if n == 5:
                post.append(comp.cyl(0.02, 0.2, at=(cx + 0.02, -D - 0.09, SZ), seg=14, axis="Y"))
            M(f"mailboxes_post_{n}", comp.merge(*post), paper, parent=hp, smooth=(n == 5))
        if n == 6:
            door6 = hp
comp.channel("open", [(door6, "rotation_euler", 2, 0, math.radians(-100))])
comp.channel("flap", [(fp, "rotation_euler", 0, 0, math.radians(-40)) for fp in flaps])
comp.export(col, root, "stairwell", "mailboxes", made="blender/components/stairwell/mailboxes.py", source="own geometry (a generic bank of letterboxes); numbers in Blender's built-in font", license="ours", credit="",
            rig={"open": "box 6's door swings 100 degrees out on its side hinge", "flap": "every letter slot's flap pushes 40 degrees in on its top edge"}, notes="origin: its centre on the wall")
