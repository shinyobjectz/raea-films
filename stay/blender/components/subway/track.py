# subway/track: 20 m of running track in its trough, modelled by hand: a concrete bed (Poly Haven's dirty_concrete,
# CC0) with a centre drain, 33 timber sleepers, two flat-bottom rails of real section (head, web, foot) at standard
# gauge on tie plates with spikes, their running tops polished, and the third rail on its insulators under a
# timber cover board on brackets. Origin: the track's centre on the bed, the track along y. A shell part: lay
# several end to end (through the station and on into the tunnel).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, prism, slab, bolt, XL, XE, LEN

col, root = comp.fresh("track")
bed_m = comp.ph_texture("track_bed", "dirty_concrete", tile=2.5, tint=(0.5, 0.48, 0.45))
wood = comp.ph_texture("track_sleeper", "rough_wood", tile=0.9, res="1k", tint=(0.3, 0.26, 0.22))
rust = comp.mat("track_rail", (0.13, 0.075, 0.045), rough=0.7, metal=0.6)
shine = comp.mat("track_rail_top", (0.75, 0.76, 0.78), rough=0.18, metal=1.0)
iron = comp.mat("track_iron", (0.06, 0.05, 0.045), rough=0.7, metal=0.5)
pot = comp.mat("track_insulator", (0.45, 0.2, 0.1), rough=0.3)
drain = comp.mat("track_drain", (0.015, 0.015, 0.014), rough=0.4)
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, smooth=smooth)
Y0, Y1 = -LEN / 2, LEN / 2
b = M("track_bed", slab(XL, XE + 0.5, Y0, Y1, -0.1, 0.0), bed_m)
comp.uv_box(b)
M("track_drain", slab(-0.09, 0.09, Y0, Y1, 0.0, 0.004), drain)
NS = 33
ys = [Y0 + 0.3 + i * (LEN - 0.6) / (NS - 1) for i in range(NS)]
s = M("track_sleepers", comp.merge(*[comp.box((2.5, 0.23, 0.15), at=(0, y, 0.075)) for y in ys]), wood)
comp.bevel(s, 0.008, 1)
comp.uv_box(s)
G = 1.435 / 2 + 0.035
RAILP = [(-0.07, 0), (0.07, 0), (0.07, 0.012), (0.012, 0.03), (0.009, 0.105), (0.035, 0.115), (0.035, 0.143), (0.028, 0.149), (-0.028, 0.149), (-0.035, 0.143), (-0.035, 0.115), (-0.009, 0.105), (-0.012, 0.03), (-0.07, 0.012)]
rails, tops, plates = [], [], []
for sx in (-1, 1):
    rails.append(prism([(sx * G + x, 0.151 + z) for x, z in RAILP], Y0, Y1))
    tops.append(slab(sx * G - 0.026, sx * G + 0.026, Y0, Y1, 0.3, 0.3008))
    for y in ys:
        plates.append(comp.box((0.3, 0.17, 0.012), at=(sx * G, y, 0.156)))
        plates += [bolt((sx * G + d * 0.09, y + e * 0.05, 0.162), 0.011, 0.014, seg=5) for d in (-1, 1) for e in (-1, 1)]
M("track_rails", comp.merge(*rails), rust)
M("track_rail_tops", comp.merge(*tops), shine)
M("track_plates", comp.merge(*plates), iron)
# the third rail, outside the left running rail
TX = -1.42
M("track_third_rail", prism([(TX + x * 0.9, 0.24 + z * 0.8) for x, z in RAILP], Y0, Y1), rust)
M("track_third_rail_top", slab(TX - 0.022, TX + 0.022, Y0, Y1, 0.3592, 0.36), shine)
ins, brk = [], []
for y in ys[1::4]:
    ins.append(_lib.lathe([(0.0, 0), (0.05, 0), (0.05, 0.02), (0.035, 0.03), (0.05, 0.045), (0.035, 0.06), (0.045, 0.075), (0.03, 0.09), (0.0, 0.09)], seg=16, at=(TX, y, 0.15)))
    brk += [comp.box((0.03, 0.03, 0.34), at=(TX - 0.16, y, 0.32)), comp.box((0.22, 0.03, 0.02), at=(TX - 0.06, y, 0.48))]
M("track_insulators", comp.merge(*ins), pot, smooth=True)
M("track_cover_brackets", comp.merge(*brk), iron)
c = M("track_cover_board", slab(TX - 0.1, TX + 0.12, Y0, Y1, 0.49, 0.52), wood)
comp.uv_box(c)
comp.export(col, root, "subway", "track", made="blender/components/subway/track.py", source="own geometry; textures https://polyhaven.com/a/dirty_concrete, https://polyhaven.com/a/rough_wood", license="ours; textures CC0", credit="textures: Poly Haven",
            notes="Shell part, 20 m: origin at the track's centre on the bed; rail tops 0.3 m up. Lay copies end to end along z in raea.")
