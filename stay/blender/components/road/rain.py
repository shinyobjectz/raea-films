# road/rain: a block of falling rain, 12 m across, 10 m deep and 8 m high, to stand over the camera and the road:
# 2,600 streaks a layer (two crossed slivers each, 3-7 mm wide and 25-60 cm long: a 1/60 s shutter's worth of a 9 m/s
# fall, leaning 7 degrees on the wind), two layers stacked, and 90 splash crowns where drops land. Rig: "fall" drops
# the block one layer's height, so the upper layer lands exactly where the lower was: it loops; "splash" throws the
# crowns up and out.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bmesh, bpy, T, R, S, xf, Vector

col, root = comp.fresh("rain")
M = _lib.meshers(col, root)
streak = comp.mat("rain_streak", (0.72, 0.78, 0.86), rough=0.25, alpha=0.34, emit=(0.6, 0.66, 0.75), strength=0.25)
crown = comp.mat("rain_splash", (0.75, 0.8, 0.88), rough=0.2, alpha=0.45)
WX, WY, H = 12.0, 10.0, 8.0
rnd = random.Random(5)
lean = Vector((math.sin(math.radians(7)), math.sin(math.radians(2)), -1)).normalized()
fall = comp.pivot(col, root, "rain_fall", (0, 0, 0))
drops = [(rnd.uniform(-WX / 2, WX / 2), rnd.uniform(-WY / 2, WY / 2), rnd.uniform(0, H), rnd.uniform(0.25, 0.6), rnd.uniform(0.0015, 0.0035), rnd.uniform(0, math.pi)) for _ in range(2600)]
for layer in range(2):
    bm = bmesh.new()
    for x, y, z, ln, hw, a in drops:
        top = Vector((x, y, z + layer * H))
        for da in (0, math.pi / 2):
            side = Vector((math.cos(a + da), math.sin(a + da), 0)) * hw
            p = [top - side, top + side, top + side + lean * ln, top - side + lean * ln]
            bm.faces.new([bm.verts.new(q) for q in p])
    M(f"rain_layer_{layer + 1}", bm, streak, parent=fall)
# splash crowns on the ground: a low ring of slivers thrown up and out from each landing
sp = comp.pivot(col, root, "rain_splash", (0, 0, 0))
sb = bmesh.new()
for i in range(90):
    x, y = rnd.uniform(-WX / 2, WX / 2), rnd.uniform(-WY / 2, WY / 2)
    for j in range(7):
        a = 2 * math.pi * j / 7 + rnd.random()
        d = Vector((math.cos(a), math.sin(a), 0))
        base = Vector((x, y, 0.004)) + d * 0.012
        tip = base + d * rnd.uniform(0.02, 0.05) + Vector((0, 0, rnd.uniform(0.02, 0.055)))
        side = Vector((-d.y, d.x, 0)) * 0.0022
        sb.faces.new([sb.verts.new(q) for q in (base - side, base + side, tip + side * 0.3, tip - side * 0.3)])
M("rain_splashes", sb, crown, parent=sp)
_lib.channel("fall", [(fall, "location", 2, 0.0, -H)])
_lib.channel("splash", [(sp, "scale", 2, 0.05, 1.0)])
_lib.done(col, root, "rain", source="own geometry", license="ours", credit="",
          rig={"fall": "the block drops 8 m, one layer's height, so it loops: about 0.9 s a loop is a real fall",
               "splash": "the splash crowns on the ground rise from flat to full height; loop it fast"},
          notes="Centred on its origin at ground level. The lower layer ends under the ground at the clip's end; stand it where the ground hides that. Streak material rain_streak (the scene can brighten it in the headlights).")
