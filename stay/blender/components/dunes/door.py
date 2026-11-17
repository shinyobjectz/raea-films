# dunes/door: the dunes world's door (the director, 11-11: "dunes are also cool if we do the relaistic sand simulation like we
# did for the ui post"; "alos make sure that the door opening moves the sand with physics"). It lies buried in a dune but
# for the top of its lintel, and the cursor pulls it up out of the sand, which pours off it; then it pulls the leaf open
# on the canyon.
# An old door of a building the sand took long ago: a frame of dressed sandstone, its jambs laid in courses and worn
# round at every edge, a heavy lintel over them with a band of carved squares; in it a leaf of thick planks, the sun
# has taken most of their turquoise paint, held by two iron straps and long hinge straps ending in points, a grid of
# iron studs, and an iron ring on a round plate to pull it by; a stone sill.
# The origin is the sill's middle at the opening's foot, the door facing -y (toward the lens). The leaf opens toward us:
# rig "open", the leaf swinging out 100 degrees on its left side (so it ploughs the sand on our side of the door, and
# never goes behind the doorway's picture of the next world).
import os, sys, math, json, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh

OW, OH = 0.48, 2.1                  # the opening's half-width and height
JW, JD = 0.26, 0.4                  # the jambs' width and depth
LH_, LX = 0.36, 0.14                # the lintel's height and how far it runs past the jambs
LT = 0.07                           # the leaf's thickness
GAP = 0.006
HX, HY = -OW + GAP, -LT / 2 - 0.04  # the hinge's line: the leaf's front face at its left edge (set in from the jambs' front)
RING = (OW - 0.14, HY - 0.075, 1.02) # where the ring hangs, when it is pulled out toward us (its grip)
SILL = 0.08

rnd = random.Random(7)


def textured(name, asset, tint, tile, grey=True, rough=None):
    m = comp.ph_texture(name, asset, tile=tile, res="2k", tint=tint, grey=grey)
    if rough is not None:
        b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        for l in list(b.inputs["Roughness"].links):
            m.node_tree.links.remove(l)
        b.inputs["Roughness"].default_value = rough
    return m


STONE = textured("dunes_stone", "sandstone_cracks", (0.86, 0.66, 0.46), 1.1, rough=0.9)
PAINT = textured("dunes_paint", "weathered_planks", (0.36, 0.7, 0.68), 1.3, rough=0.82)
IRON = comp.mat("dunes_iron", (0.045, 0.035, 0.03), rough=0.72, metal=0.55)

col, root = comp.fresh("dunes_door")


def worn(bm, k=0.012):
    """every vertex nudged a little at random, so no edge of the stone is ruled straight"""
    for v in bm.verts:
        v.co.x += rnd.uniform(-k, k); v.co.y += rnd.uniform(-k, k); v.co.z += rnd.uniform(-k * 0.6, k * 0.6)
    return bm


def block(size, at):
    """a dressed block, cut a little into its faces so the wear has vertices to move"""
    bm = comp.box(size, at)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=2, use_grid_fill=True)
    return worn(bm, 0.008)


# ---- the frame: each jamb four courses of blocks, the lintel over them, the sill under the opening
stone = []
for s in (-1, 1):
    x = s * (OW + JW / 2)
    z = 0.0
    hs = [0.56, 0.5, 0.54, OH - 1.6]
    for i, h in enumerate(hs):
        w = JW + rnd.uniform(-0.015, 0.02)
        stone.append(block((w, JD + rnd.uniform(-0.02, 0.01), h - 0.008), (x + s * rnd.uniform(-0.006, 0.01), rnd.uniform(-0.008, 0.008), z + h / 2)))
        z += h
LW_ = 2 * (OW + JW + LX)
stone.append(block((LW_, JD + 0.04, LH_), (0, 0, OH + LH_ / 2)))
# the band of carved squares on the lintel's face: a sunk field and a row of squares, each a lozenge in a square
band = [comp.box((LW_ - 0.24, 0.012, 0.16), (0, -(JD + 0.04) / 2 + 0.004, OH + LH_ / 2))]
n = 9
for i in range(n):
    cx = (i - (n - 1) / 2) * (LW_ - 0.36) / (n - 1)
    band.append(comp.box((0.1, 0.02, 0.1), (cx, -(JD + 0.04) / 2 - 0.004, OH + LH_ / 2)))
    d = comp.box((0.055, 0.02, 0.055), (0, 0, 0))
    bmesh.ops.rotate(d, cent=(0, 0, 0), matrix=comp.R(45, "Y"), verts=d.verts)
    bmesh.ops.translate(d, vec=(cx, -(JD + 0.04) / 2 - 0.012, OH + LH_ / 2), verts=d.verts)
    band.append(d)
stone.append(comp.merge(*band))
stone.append(block((2 * OW + 0.04, JD + 0.1, SILL), (0, -0.03, -SILL / 2)))
o = comp.mesh(col, root, "door_frame", comp.merge(*stone), STONE)
comp.bevel(o, 0.018, 3, angle=50)
comp.uv_box(o, 1.0)

# ---- the leaf on its hinge
hinge = comp.pivot(col, root, "door_hinge", (HX, HY, 0.0))


def on_hinge(bm):
    """a part built in the hinge's frame, put where it stands (comp keeps a part's world place when it hangs it)"""
    bmesh.ops.translate(bm, vec=(HX, HY, 0.0), verts=bm.verts)
    return bm


LW, LHt = 2 * OW - 2 * GAP, OH - GAP - 0.01
x0 = GAP
# six planks, each its own width, a hair apart, their feet worn uneven
planks, x = [], x0
widths = [0.17, 0.155, 0.16, 0.15, 0.165, 0.0]
widths[-1] = LW - sum(widths[:-1])
for i, w in enumerate(widths):
    foot = 0.01 + rnd.uniform(0.0, 0.025)
    b = comp.box((w - 0.006, LT, LHt - foot), (x + w / 2, LT / 2, foot + (LHt - foot) / 2))
    planks.append(worn(b, 0.002))
    x += w
o = comp.mesh(col, root, "door_leaf", on_hinge(comp.merge(*planks)), PAINT, parent=hinge)
comp.bevel(o, 0.006, 2, angle=30)
comp.uv_box(o, 1.0)

# ---- iron: two straps across, the hinge straps on the left running out to points, studs, the ring and its plate
fe = []
fy = -0.006                                           # (the leaf's front face, in the hinge's frame)
for zc in (0.42, 1.62):
    fe.append(comp.box((LW - 0.08, 0.008, 0.065), (x0 + LW / 2 + 0.02, fy, zc)))
    for k in range(9):
        fe.append(comp.cyl(0.011, 0.012, at=(x0 + 0.08 + k * (LW - 0.16) / 8, fy - 0.006, zc), seg=10, r2=0.006, axis="Y"))
for zc in (0.28, 1.9):
    # the hinge strap: from the knuckle out across the leaf, narrowing to a point
    bm = bmesh.new()
    pts = [(0.0, 0.05), (0.62, 0.042), (0.74, 0.0), (0.62, -0.042), (0.0, -0.05)]
    top = [bm.verts.new((x0 + px, fy - 0.004, zc + pz)) for px, pz in pts]
    bot = [bm.verts.new((x0 + px, fy + 0.004, zc + pz)) for px, pz in pts]
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    for i in range(len(pts)):
        j = (i + 1) % len(pts)
        bm.faces.new((top[i], top[j], bot[j], bot[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    fe.append(bm)
    fe.append(comp.cyl(0.02, 0.16, at=(0.0, LT / 2 - 0.01, zc - 0.08), seg=12))   # its knuckle
# studs: a grid of round heads between the straps
for zc in (0.78, 1.02, 1.26):
    for k in range(5):
        fe.append(comp.cyl(0.013, 0.014, at=(x0 + 0.17 + k * (LW - 0.34) / 4, fy - 0.007, zc), seg=10, r2=0.007, axis="Y"))
# the ring's plate and the ring (hanging down, at rest)
rx = RING[0] - HX
fe.append(comp.cyl(0.06, 0.012, at=(rx, fy - 0.006, RING[2] + 0.06), seg=24, axis="Y"))
fe.append(comp.cyl(0.016, 0.03, at=(rx, fy - 0.02, RING[2] + 0.06), seg=12, axis="Y"))
ring = [(rx + 0.055 * math.sin(a), fy - 0.035, RING[2] + 0.06 - 0.055 + 0.055 * math.cos(a) - 0.04) for a in [i * 2 * math.pi / 24 for i in range(25)]]
fe.append(comp.tube(ring, 0.009, res=3, sides=2))
o = comp.mesh(col, root, "door_iron", on_hinge(comp.merge(*fe)), IRON, parent=hinge, smooth=True)

comp.channel("open", [(hinge, "rotation_euler", 2, 0.0, -math.radians(100))])

comp.export(col, root, "dunes", "door", made="blender/components/dunes/door.py",
            source="own geometry; Poly Haven's sandstone_cracks and weathered_planks (CC0)", license="ours (textures CC0)", credit="Poly Haven (polyhaven.com)",
            rig={"open": "the leaf (door_hinge) swings out 100 degrees toward the lens on its left side"},
            notes=json.dumps({"hinge": [HX, HY, 0.0], "ring": [RING[0], RING[1], RING[2]], "opening": {"half_width": OW, "sill": 0.0, "top": OH},
                              "frame": {"half_width": OW + JW + LX, "jamb_out": OW + JW, "depth": JD, "lintel_top": OH + LH_, "front": -(JD + 0.04) / 2},
                              "leaf": {"width": LW, "thickness": LT}}))
