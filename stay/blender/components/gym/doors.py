# gym/doors: the gym's double doors, modelled by hand: a painted steel frame 1.9 m wide and 2.15 m tall, two leaves
# with narrow wired-glass lights, panic bars, steel kick plates and closers, a dark corridor behind them, and a lit
# EXIT box over the head (doors_exit_glow). Its frame's back at y 0, standing on the floor, the leaves opening toward -y.
# Rig: "open" swings both leaves 75 degrees into the gym on their hinges; "left" swings only the left leaf.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib, comp, bmesh
from _lib import rbox, rod, T, R, S, xf

col, root = comp.fresh("doors")
M = _lib.maker(col, root)
LW, LH = 0.9, 2.1
paint = comp.mat("doors_paint", (0.2, 0.05, 0.015), rough=0.45)
frame = comp.mat("doors_frame", (0.2, 0.2, 0.21), rough=0.5)
steel = comp.mat("doors_steel", (0.7, 0.7, 0.72), rough=0.3, metal=1.0)
glass = comp.mat("doors_glass", (0.1, 0.13, 0.14), rough=0.05, alpha=0.35)
wire = comp.mat("doors_wire", (0.1, 0.1, 0.1), rough=0.5)
dark = comp.mat("doors_corridor", (0.004, 0.004, 0.005), rough=0.9)
glow = comp.mat("doors_exit_glow", (0.6, 0.03, 0.02), rough=0.3, emit=(1.0, 0.08, 0.04), strength=4.0)
white = comp.mat("doors_exit_letters", (1.0, 0.98, 0.95), rough=0.3, emit=(1.0, 0.95, 0.9), strength=6.0)
f = [comp.box((0.06, 0.12, LH + 0.06), at=(sx * (LW + 0.03), -0.04, (LH + 0.06) / 2)) for sx in (-1, 1)] + [comp.box((2 * LW + 0.12, 0.12, 0.06), at=(0, -0.04, LH + 0.03))]
M("doors_frame", comp.merge(*f), frame, smooth=False)
M("doors_corridor", comp.box((2 * LW, 0.01, LH), at=(0, -0.002, LH / 2)), dark, smooth=False)
leaves = []
for sx, side in ((-1, "left"), (1, "right")):
    hx = sx * LW
    p = comp.pivot(col, root, f"doors_{side}", (hx, -0.08, 0))
    cx = sx * LW / 2
    M(f"doors_{side}_leaf", rbox((LW - 0.006, 0.045, LH - 0.012), at=(cx, -0.08, LH / 2), r=0.003, seg=1), paint, parent=p, smooth=False)
    gx = sx * 0.2
    M(f"doors_{side}_light_frame", comp.merge(*[comp.box((0.2, 0.052, 0.025), at=(gx, -0.08, z)) for z in (1.05, 1.85)], *[comp.box((0.025, 0.052, 0.82), at=(gx + s * 0.0875, -0.08, 1.45)) for s in (-1, 1)]), frame, parent=p, smooth=False)
    M(f"doors_{side}_glass", comp.box((0.15, 0.05, 0.775), at=(gx, -0.08, 1.45)), glass, parent=p, smooth=False)
    ws = [comp.box((0.15, 0.053, 0.0015), at=(gx, -0.08, 1.07 + k * 0.05)) for k in range(16)] + [comp.box((0.0015, 0.053, 0.775), at=(gx - 0.05 + k * 0.05, -0.08, 1.45)) for k in range(3)]
    M(f"doors_{side}_wire", comp.merge(*ws), wire, parent=p, smooth=False)
    M(f"doors_{side}_kick", comp.box((LW - 0.05, 0.003, 0.25), at=(cx, -0.104, 0.15)), steel, parent=p, smooth=False)
    bar = [rbox((LW - 0.14, 0.03, 0.06), at=(cx, -0.118, 1.0), r=0.008, seg=2), rbox((LW - 0.3, 0.035, 0.035), at=(cx - sx * 0.05, -0.145, 1.0), r=0.01, seg=3)]
    bar += [rbox((0.1, 0.05, 0.13), at=(sx * 0.07, -0.125, 1.0), r=0.008, seg=2)]
    M(f"doors_{side}_panic_bar", comp.merge(*bar), steel, parent=p, smooth=False)
    cl = [rbox((0.22, 0.05, 0.06), at=(hx - sx * 0.2, -0.128, LH - 0.08), r=0.006, seg=2), rod((hx - sx * 0.3, -0.13, LH - 0.06), (hx - sx * 0.05, -0.1, LH + 0.0), 0.006, seg=6)]
    M(f"doors_{side}_closer", comp.merge(*cl), steel, parent=p, smooth=False)
    M(f"doors_{side}_hinges", comp.merge(*[comp.cyl(0.009, 0.1, at=(hx - sx * 0.0, -0.106, z), seg=10) for z in (0.2, 1.0, 1.85)]), steel, parent=p)
    leaves.append((p, sx))
M("doors_exit_box", rbox((0.36, 0.06, 0.19), at=(0, -0.03, LH + 0.22), r=0.006, seg=2), frame, smooth=False)
M("doors_exit_face", comp.box((0.33, 0.002, 0.16), at=(0, -0.061, LH + 0.22)), glow, smooth=False)
M("doors_exit_letters", xf(comp.text("EXIT", 0.105, depth=0.002), T(0, -0.063, LH + 0.22)), white, smooth=False)
comp.channel("open", [(p, "rotation_euler", 2, 0, math.radians(75) * sx) for p, sx in leaves])
comp.channel("left", [(leaves[0][0], "rotation_euler", 2, 0, math.radians(-75))])
comp.export(col, root, "gym", "doors", made="blender/components/gym/doors.py",
            source="own geometry (generic steel double doors with panic bars and a lit exit box); letters in Blender's built-in font", license="ours", credit="",
            rig={"open": "both leaves swing 75 degrees into the gym on their outer hinges", "left": "the left leaf alone swings 75 degrees",
                 "glow": "in the scene: the materials doors_exit_glow and doors_exit_letters"})
