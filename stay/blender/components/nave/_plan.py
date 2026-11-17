# nave/_plan: the choir screen's plan, shared by its pieces (screen.py, door.py) and read by the scene (v3/nave.tsx reads
# the sidecars' notes). The screen stands across the cathedral's nave at a pier line (sets/cathedral.tsx PIERS), between
# the piers' shafts, its door on the nave's middle line.
# Blender's frame: z up, x across the nave, the screen's front toward -y (the lens: raea +z). The origin is on the floor
# at the middle of the door's opening, on the screen's middle plane (raea [0, 0, -RZ]).
import os, sys, math, importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "lib"))
import comp, bpy, bmesh
from comp import T, R, S, xf
from mathutils import Vector

# the cathedral's own shapes and materials (blender/components/cathedral/_lib.py, read only), as CL
_spec = importlib.util.spec_from_file_location("cathedral_lib", os.path.join(HERE, "..", "cathedral", "_lib.py"))
CL = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(CL)

SQ3 = math.sqrt(3.0)
FRONT, BACK = -0.31, 0.31          # the screen's faces
XE = 2.55                          # its ends, buried in the piers' shafts (their faces at 2.375)
PLINTH = 0.32                      # the plinth's top
HW, ZS = 0.62, 1.80                # the door's opening: half its width, and its arch's springing (an equilateral arch)
APEX = ZS + HW * SQ3               # 2.874
ORDER = 0.09                       # each order of the doorway's mouldings steps out this much, and back this deep
NORD = 3                           # three orders outside the opening
HOOD = HW + ORDER * NORD + 0.07    # the hood mould over the doorway
FRIEZE = (3.55, 3.85)              # the band of quatrefoils
CORNICE = (3.85, 4.03)             # the cornice, whose top is the candles' ledge
LEDGE_OUT = 0.14                   # how far the ledge stands out from the face
PARAPET = (4.03, 4.50)
COPING = (4.50, 4.56)
GABLE = (0.95, 4.03, 5.00)         # over the door: half its base, its base, its apex
PIN_X, PIN_W = 1.0, 0.2            # the pinnacles beside the door
PIN_TOP, SPIRE = 4.60, 5.15
LANCETS = [1.46, 2.04]             # the blind lancets each side (their middles' |x|)
LAN_HW, LAN_Z0, LAN_ZS = 0.23, 0.55, 2.45
# the ledge's candles (x each side), the dish's top, the candle's height, and the wick's tip
LEDGE_X = [1.30, 1.62, 1.94, 2.26]
LEDGE_Y = FRONT - LEDGE_OUT / 2
# the door: hung on the screen's back face, a little larger than the opening it closes, swinging in (away from the lens)
LEAF_HW = HW + 0.04
LEAF_T = 0.07
HINGE = (-LEAF_HW, BACK, 0.0)
OPEN_DEG = 100
RING = (LEAF_HW + 0.36, -0.06, 1.05)   # the ring's grip, from the hinge (along the leaf, out of its face, up)


def arch_path(hw, zs, n=16, at=0.0):
    """An equilateral pointed arch from its left springing over its apex to its right springing: (x, z) points."""
    rad, c = 2 * hw, hw
    top = math.sqrt(rad * rad - c * c)
    a_end = math.atan2(top, c)
    left = [(at + c - rad * math.cos(a_end * i / n), zs + rad * math.sin(a_end * i / n)) for i in range(n + 1)]
    right = [(at - c + rad * math.cos(a_end * (1 - i / n)), zs + rad * math.sin(a_end * (1 - i / n))) for i in range(1, n + 1)]
    return left + right


def notched(x0, z0, x1, z1, hw, zs, n=16):
    """A rectangle with a pointed doorway cut up into it from its bottom edge, as one outline."""
    return [(x0, z0), (-hw, z0)] + arch_path(hw, zs, n) + [(hw, z0), (x1, z0), (x1, z1), (x0, z1)]


def lancet(cx, hw, z0, zs, n=10):
    """A closed pointed-headed opening."""
    return [(cx - hw, z0), (cx + hw, z0)] + list(reversed(arch_path(hw, zs, n, at=cx)))


def foil(cx, cz, r, lobes=4, depth=0.36, n=96, turn=0.0):
    """A foiled opening (a quatrefoil, a trefoil): round lobes meeting in sharp cusps."""
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        k = abs(math.cos(lobes * (a - turn) / 2)) ** 0.5
        rr = r * (1 - depth + depth * k)
        pts.append((cx + rr * math.cos(a), cz + rr * math.sin(a)))
    return pts


def plate_at(loops, y0, y1):
    """CL.plate between y0 (its front) and y1 (its back)."""
    return xf(CL.plate(loops, y1 - y0), T(0, y1, 0))


def prism_x(profile, x0, x1):
    """A (y, z) outline drawn out along x from x0 to x1."""
    bm = bmesh.new()
    a = [bm.verts.new((x0, y, z)) for y, z in profile]
    b = [bm.verts.new((x1, y, z)) for y, z in profile]
    n = len(profile)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(a)))
    bm.faces.new(b)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def pyramid(cx, cy, z0, z1, w):
    """A square spirelet."""
    bm = bmesh.new()
    h = w / 2
    base = [bm.verts.new((cx + sx * h, cy + sy * h, z0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    top = bm.verts.new((cx, cy, z1))
    for i in range(4):
        bm.faces.new((base[i], base[(i + 1) % 4], top))
    bm.faces.new(list(reversed(base)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def crocket(p, out, up, s=1.0):
    """A crocket: a small leaf curling out from an edge at p, away along `out`, its tip rolled back up along `up`."""
    p, out, up = Vector(p), Vector(out).normalized(), Vector(up).normalized()
    pts = [p, p + out * 0.04 * s + up * 0.012 * s, p + out * 0.07 * s + up * 0.045 * s, p + out * 0.055 * s + up * 0.075 * s, p + out * 0.03 * s + up * 0.07 * s]
    return comp.tube([tuple(q) for q in pts], 0.016 * s, res=4, sides=2)


def finial(x, y, z, h=0.3, r=0.05):
    """A turned finial: a stem, a bud of four leaves round it, and a knob."""
    parts = [CL.lathe([(0, 0), (r * 0.55, 0), (r * 0.5, h * 0.25), (r * 0.9, h * 0.42), (r * 1.0, h * 0.55), (r * 0.6, h * 0.72), (r * 0.35, h * 0.8), (r * 0.5, h * 0.88), (r * 0.3, h * 0.97), (0, h)], seg=16)]
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        d = Vector((math.cos(a), math.sin(a), 0))
        base = Vector((0, 0, h * 0.3))
        parts.append(comp.tube([tuple(base + d * r * 0.4), tuple(base + d * r * 1.5 + Vector((0, 0, h * 0.12))), tuple(base + d * r * 1.7 + Vector((0, 0, h * 0.28))), tuple(base + d * r * 1.2 + Vector((0, 0, h * 0.34)))], r * 0.28, res=4, sides=2))
    return xf(comp.merge(*parts), T(x, y, z))


def materials():
    """The screen's stone: the cathedral's ashlar, and a finer stone for what is carved."""
    ashlar = CL.stone("nave_ashlar", tile=2.4, res="1k")
    # (a limestone's own pale grey-gold, not the cathedral's tint at full: under the candles that read as plaster)
    dressed = comp.ph_texture("nave_dressed", "beige_wall_001", tile=1.4, res="1k", tint=(0.68, 0.61, 0.5), grey=True)
    return ashlar, dressed


def wax():
    """Old ivory church wax, warmer than the cathedral's (CL.wax_mat read as white plastic under its own flame)."""
    return comp.mat("nave_wax", (0.82, 0.71, 0.52), rough=0.38)
