# nave/door: the choir screen's door (blender/components/nave/_plan.py): a pointed leaf of oak boards stained the red of
# old cathedral doors, hung on the screen's back face and a little larger than the opening it closes, covered in black
# wrought iron: three hinge straps from its hinged edge, and from each, pairs of scrolls curling up and down, studded with
# nail heads; a ring pull on a rosette where the cursor takes it.
# Its origin is the hinge, at the leaf's front face (toward -y, the lens) and its hinged edge; the leaf runs along +x.
# "open" swings it 100 degrees in (toward +y, away from the lens), into the chancel behind the screen.
import os, sys, math, json, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _plan as P
from _plan import comp, bpy, bmesh, T, R, S, xf, CL, Vector

random.seed(11)
col, root = comp.fresh("nave_door")
OAK = comp.ph_texture("nave_door_oak", "rough_wood", tile=1.0, res="1k", tint=(0.7, 0.27, 0.17), grey=True)
IRON = comp.mat("nave_door_iron", (0.035, 0.033, 0.032), rough=0.55, metal=0.75)
piv = comp.pivot(col, root, "door_pivot", (0, 0, 0))
M = lambda n, bm, m, smooth=False: comp.mesh(col, root, n, bm, m, parent=piv, smooth=smooth)

HW, ZS, Z0, LT = P.LEAF_HW, P.ZS, 0.006, P.LEAF_T
CX = HW                                                         # the leaf's middle, from the hinge
BOARDS = 8
FACE = 0.045                                                    # the boards' depth; the ledged back behind them


def top(x):
    """The leaf's top edge over x (from the hinge)."""
    u = abs(x - CX)
    return ZS + math.sqrt(max(0.0, 4 * HW * HW - (u + HW) ** 2))


def board(xa, xb, n=6):
    pts = [(xa, Z0), (xb, Z0)]
    for i in range(n + 1):
        x = xb + (xa - xb) * i / n
        pts.append((x, top(x)))
    return pts


# ---- the boards, a hair apart, on a ledged back -------------------------------------------------------------------------
bw = 2 * HW / BOARDS
boards = [P.plate_at([board(i * bw + 0.002, (i + 1) * bw - 0.002)], 0.0, FACE) for i in range(BOARDS)]
leaf = M("door_boards", comp.merge(*boards), OAK)
comp.bevel(leaf, 0.004, 2, angle=40)
# (the grain runs up the boards; each board its own stretch of the planks)
me = leaf.data
uv = me.uv_layers.new(name="UVMap") if not me.uv_layers else me.uv_layers.active
offs = [random.random() * 3 for _ in range(BOARDS)]
for poly in me.polygons:
    k = min(BOARDS - 1, max(0, int(poly.center.x / bw)))
    for li in poly.loop_indices:
        v = me.vertices[me.loops[li].vertex_index].co
        uv.data[li].uv = ((v.x + v.y) * 1.1 + offs[k], v.z * 0.5 + 0.37 * k)
M("door_back", P.plate_at([P.lancet(CX, HW, Z0, ZS, 16)], FACE, LT), OAK)

# ---- the ironwork ------------------------------------------------------------------------------------------------------
FY = -0.006                                                     # the iron's middle, on the boards' face
iron = []


def bar(pts, r=0.0085):
    """A wrought bar through (x, z) points on the face, flattened against it."""
    t = comp.tube([(x, 0.0, z) for x, z in pts], r, res=3, sides=2)
    return xf(xf(t, S(1, 0.6, 1)), T(0, FY, 0))


def spiral(cx, cz, r0, r1, a0, turns, sense, n=44):
    return [(cx + r0 * (r1 / r0) ** (i / n) * math.cos(a0 + sense * 2 * math.pi * turns * i / n), cz + r0 * (r1 / r0) ** (i / n) * math.sin(a0 + sense * 2 * math.pi * turns * i / n)) for i in range(n + 1)]


def scrolls(x, z, up, r0=0.085, stem=0.045):
    """A pair of scrolls from a strap's edge at (x, z): a stem, then one curling left and one right; `up` +1 or -1."""
    zt = z + up * (stem + r0)
    out = [bar([(x, z), (x, z + up * stem * 0.5), (x, zt)])]
    for sx in (-1, 1):
        # (from the stem's top it leaves sideways and rolls over, in toward its own middle)
        a0 = math.pi if sx > 0 else 0.0
        sense = -1 if sx * up > 0 else 1
        pts = spiral(x + sx * r0, zt, r0, 0.014, a0, 1.45, sense)
        out.append(bar([(x, zt - up * 0.02)] + pts))
    # (a boss where the pair parts)
    out.append(stud(x, zt, 0.016))
    return out


def stud(x, z, r=0.011):
    """A domed nail head on the face."""
    return xf(xf(CL.lathe([(0.0, 0.0), (r, 0.0), (r * 0.8, r * 0.55), (0.0, r * 0.8)], seg=10), R(90, "X")), T(x, FY - 0.004, z))


def halfw(z):
    """How far the leaf reaches either side of its middle at height z."""
    return HW if z <= ZS else math.sqrt(max(0.0, 4 * HW * HW - (z - ZS) ** 2)) - HW


STRAPS = [0.40, 1.28, 2.16]
for zs in STRAPS:
    # (it runs across the leaf as far as the leaf reaches at its height, short of the edge)
    xe = CX + halfw(zs + 0.09) - 0.08
    iron.append(xf(comp.box((xe + 0.02, 0.012, 0.056)), T((xe + 0.02) / 2 - 0.02, FY, zs)))
    # (its end splits in two small curls)
    for up in (1, -1):
        iron.append(bar([(xe - 0.02, zs + up * 0.012)] + spiral(xe + 0.02, zs + up * 0.045, 0.035, 0.008, -up * math.pi / 2, 1.1, up)))
    # nail heads along it
    x = 0.06
    while x < xe - 0.04:
        iron.append(stud(x, zs))
        x += 0.095
    # the hinge's knuckle on the hinged edge
    iron.append(comp.cyl(0.024, 0.14, at=(0.0, 0.0, zs - 0.07), seg=16))
RING_AT = (P.RING[0], P.RING[2])
for zs, up, xs in ((0.40, 1, (0.3, 0.72, 1.1)), (0.40, -1, (0.3, 0.72, 1.1)), (1.28, 1, (0.3, 0.72, 1.1)), (1.28, -1, (0.3, 0.72)),
                   (2.16, -1, (0.3, 0.72, 1.1)), (2.16, 1, (0.45, 0.87))):
    for x in xs:
        iron += scrolls(x, zs + up * 0.028, up, r0=0.075 if zs == 2.16 and up > 0 else 0.085)
door_iron = M("door_iron", comp.merge(*iron), IRON, smooth=True)

# ---- the ring pull on its rosette --------------------------------------------------------------------------------------
rx, rz = RING_AT
pull = [xf(xf(CL.lathe([(0.0, 0.0), (0.072, 0.0), (0.07, 0.006), (0.05, 0.012), (0.024, 0.02), (0.016, 0.034), (0.0, 0.036)], seg=24), R(90, "X")), T(rx, FY + 0.006, rz + 0.07))]
for k in range(8):
    a = k * math.pi / 4
    pull.append(xf(xf(comp.box((0.022, 0.006, 0.05)), R(math.degrees(a), "Y")), T(rx + 0.055 * math.sin(a), FY - 0.006, rz + 0.07 + 0.055 * math.cos(a))))
ring = CL.torus(0.065, 0.011, seg=48, sides=10)
pull.append(xf(xf(ring, R(-12, "X")), T(rx, FY - 0.03, rz)))
M("door_ring", comp.merge(*pull), IRON, smooth=True)

comp.channel("open", [(piv, "rotation_euler", 2, 0, math.radians(P.OPEN_DEG))])
comp.export(col, root, "nave", "door", made="blender/components/nave/door.py",
            source="own geometry; Poly Haven's rough_wood (CC0)", license="ours (texture CC0)", credit="Poly Haven (polyhaven.com)",
            rig={"open": f"the leaf swings {P.OPEN_DEG} degrees on its hinge, in, away from the lens, into the chancel"},
            notes=json.dumps({"hinge": "the origin: the leaf's hinged edge at its front face; in the screen's frame at " + json.dumps([P.HINGE[0], P.HINGE[1], 0]),
                              "ring": list(P.RING), "open_deg": P.OPEN_DEG, "half_width": HW, "spring": ZS}))
