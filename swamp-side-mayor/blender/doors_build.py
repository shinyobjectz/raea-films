# blender/doors_build.py: the tutorial's four doors (tutorial.script.ts, 02, 08, 09, 10), in the ruins' own stone and
# weathering (blender/ruins_build.py, whose helpers this reads): a doorway of two uprights and a lintel, the lintel's
# front kept flat and clean for a painted word (CONNECTIONS, LIBRARIES, PUBLISH, SETTINGS, laid on by the film).
# Four takes, each worn a little differently, so the row doesn't read as one stone copied.
#   ruin-door-K.glb   K = 0..3; the opening is 1.5 m wide and 2.1 m high, the lintel's face 2.7 x 0.55 m at y = -0.33
# usage: raea blender run blender/doors_build.py OUT_DIR
import bpy, sys, math, random, os
out = sys.argv[-1]
# the ruins' helpers (box, cut, weather, export, taper), without running its builds: read it up to its first build
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "ruins_build.py")).read()
head = src[: src.index("# standing stones")]
head = head.replace("out, goosep = sys.argv[-2:]", "out = sys.argv[-1]; goosep = None")
exec(compile(head, "ruins_build.py (helpers)", "exec"))

W, H = 1.5, 2.1            # the opening
POST = (0.55, 0.5)         # an upright's width and depth
LINTEL = (W + 2 * POST[0] + 0.1, 0.55, 0.55)
for k in range(4):
    reset(); rng = random.Random(40 + k)
    a = box((POST[0], POST[1], H + 0.3), (-(W + POST[0]) / 2, 0, (H + 0.3) / 2 - 0.3))
    b = box((POST[0], POST[1], H + 0.3), ((W + POST[0]) / 2, 0, (H + 0.3) / 2 - 0.3))
    taper(a, 0.06 + 0.03 * rng.random()); taper(b, 0.06 + 0.03 * rng.random())
    tilt = (rng.random() - 0.5) * 0.04
    l = box(LINTEL, (0.03 * (rng.random() - 0.5), 0, H + LINTEL[2] / 2), (0, tilt, 0))
    o = join([a, b, l])
    # one corner of the lintel's top broken away, a different one each, never across the face's middle
    side = 1 if k % 2 else -1
    cut(o, (side * (LINTEL[0] / 2 + 2.6), 0, H + LINTEL[2] + 2.75), (0, side * (0.5 + 0.2 * rng.random()), 0))
    o = weather(o, voxel=0.045, erode=0.05, seed=40 + k)
    # keep the lintel's front plain stone (no moss) where the word is painted: its face looks toward -y
    me = o.data; ca = me.color_attributes["Col"]
    for i, v in enumerate(me.vertices):
        if v.normal.y < -0.6 and H + 0.06 < v.co.z < H + LINTEL[2] - 0.06 and abs(v.co.x) < LINTEL[0] / 2 - 0.15:
            ca.data[i].color = (*STONE, 1)
    export(f"ruin-door-{k}", o)
