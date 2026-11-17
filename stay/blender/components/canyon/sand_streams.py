# canyon/sand-streams: three streams of dry sand pouring off the rim, modelled by hand: each four thin strands that leave
# the lip together and wander 25 cm apart as they fall 10 m, inside a veil of 400 loose grains, with a heap of sand at
# the lip it pours from and a fan where it lands. Its origin is the lip (a ceiling item: its top at z 0), the streams
# 0.8 m and 0.9 m apart along the rim. Rig: "fall" lets the three streams down from the lip to their full 10 m (the
# second and third a little behind the first) and grows their fans; "flow" moves the veils' grains down one metre,
# their own spacing, so it loops.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector, Matrix, noise

col, root = comp.fresh("sand_streams")
core_m = comp.mat("sand_stream_core", (0.93, 0.66, 0.42), rough=1.0, alpha=0.35)
grain_m = comp.mat("sand_stream_grain", (0.96, 0.72, 0.48), rough=1.0)
heap_m = comp.ph_texture("canyon_sand", "coast_sand_01", tile=1.6, res="1k", tint=(1.0, 0.68, 0.46))
rnd = random.Random(31)
fall_keys, flow_keys = [], []
for n, (y0, length, out) in enumerate(((-0.8, 10.2, 0.0), (0.0, 10.3, 0.05), (0.9, 9.9, -0.04))):
    top = Vector((out, y0, 0))
    fall = comp.pivot(col, root, f"sand_streams_fall_{n + 1}", tuple(top))
    # the core: four thin strands of sand that start together at the lip and wander apart as they fall, each fraying
    for st in range(4):
        bm = bmesh.new()
        rings, NR, SEG = [], 90, 6
        ph = st * 1.7 + n * 3.1
        for i in range(NR + 1):
            t = i / NR
            z = -length * t
            r = (0.004 + 0.008 * t) * (1 + 0.5 * noise.noise(Vector((z * 2.3, ph, 3.0)))) * (1.0 if st else 1.6)
            wx = (0.01 + 0.13 * t ** 1.3) * noise.noise(Vector((z * 0.7, ph, 0.0))) + 0.012 * math.cos(ph)
            wy = (0.01 + 0.13 * t ** 1.3) * noise.noise(Vector((z * 0.7, ph, 5.0))) + 0.012 * math.sin(ph)
            rings.append([bm.verts.new(top + Vector((wx + r * math.cos(2 * math.pi * k / SEG), wy + r * math.sin(2 * math.pi * k / SEG), z))) for k in range(SEG)])
        for i in range(NR):
            for k in range(SEG):
                bm.faces.new((rings[i][k], rings[i + 1][k], rings[i + 1][(k + 1) % SEG], rings[i][(k + 1) % SEG]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        comp.mesh(col, root, f"sand_streams_core_{n + 1}_{st + 1}", bm, core_m, parent=fall, smooth=True)
    # the veil: 40 grains to each metre of fall, the same 40 places in every metre (so a metre's slide loops)
    flow = comp.pivot(col, root, f"sand_streams_flow_{n + 1}", tuple(top), parent=fall)
    gb = bmesh.new()
    lattice = [(rnd.uniform(0, 1), rnd.uniform(0, 2 * math.pi), rnd.uniform(0.2, 1.0) ** 0.5, rnd.choice((0.008, 0.01, 0.013, 0.018))) for _ in range(40)]
    for m in range(int(length)):
        for (ph, az, rr, s) in lattice:
            d = m + ph
            if d > length - 0.05:
                continue
            spread = 0.03 + 0.2 * (d / length) ** 1.3
            p = top + Vector((spread * rr * math.cos(az), spread * rr * math.sin(az), -d))
            bmesh.ops.create_icosphere(gb, subdivisions=1, radius=s / 2, matrix=Matrix.Translation(p) @ S(1, 1, 2.2))
    comp.mesh(col, root, f"sand_streams_grains_{n + 1}", gb, grain_m, parent=flow)
    # the fan it lands in and the heap it leaves at the lip
    fan = comp.pivot(col, root, f"sand_streams_fan_{n + 1}", (out, y0, -length))
    fb = L.rock((0.8, 0.9, 0.24), seed=500 + n, sub=3, rough=0.12)
    xf(fb, T(out, y0, -length - 0.05))
    fo = comp.mesh(col, root, f"sand_streams_fan_mesh_{n + 1}", fb, heap_m, parent=fan, smooth=True)
    hb = L.rock((0.5, 0.6, 0.14), seed=520 + n, sub=3, rough=0.14)
    xf(hb, T(out - 0.22, y0, -0.03))
    ho = comp.mesh(col, root, f"sand_streams_heap_{n + 1}", hb, heap_m, smooth=True)
    bpy.context.view_layer.update()
    comp.uv_box(fo)
    comp.uv_box(ho)
    late = (1.0, 0.85, 0.7)[n]       # how much of its drop this stream has made when the first has made all of its own
    fall_keys += [(fall, "scale", 2, 0.002, late), (fan, "scale", 0, 0.05, late), (fan, "scale", 1, 0.05, late), (fan, "scale", 2, 0.05, late)]
    flow_keys += [(flow, "location", 2, 0.0, -1.0)]
comp.channel("fall", fall_keys)
comp.channel("flow", flow_keys)
comp.export(col, root, L.PLACE, "sand_streams", made="blender/components/canyon/sand_streams.py", source="own geometry; sand https://polyhaven.com/a/coast_sand_01", license="ours; texture CC0", credit="texture: Poly Haven",
            rig={"fall": "the streams let down from the lip (sand_streams_fall_N scaled along the drop) to 10.2 m, 8.8 m and 6.9 m, and their fans grow with them",
                 "flow": "each veil's grains slide down one metre, their own spacing; loops"},
            notes="hangs from the rim's lip (its origin); at rest nothing falls. The second and third streams' fans stand at the full drop, so at the end of `fall` those two streams have not yet reached them")
