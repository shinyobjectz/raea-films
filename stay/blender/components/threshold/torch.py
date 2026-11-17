# threshold/torch: a wall torch beside the door. A wrought-iron back plate nailed to the stone, an arm that sweeps out
# and up to a basket ring and a lower ring, and in them a torch: an ash haft 0.56 m long, leaning out from the wall,
# its head a wrap of pitch-soaked rag, charred. A wall item: its back at y 0, its front toward -y; the plate's middle
# is at the origin's height (z 0). The flame is not modelled: in the scene it is a shader at the head's top (the sidecar
# says where), with a warm light. No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

rnd = random.Random(3)
col, root = comp.fresh("torch")
IRON = comp.mat("threshold_iron", (0.035, 0.032, 0.03), rough=0.55, metal=0.85)
WOOD = comp.ph_texture("threshold_ash", "rough_wood", tile=0.6, res="1k", tint=(0.62, 0.48, 0.34))
PITCH = comp.mat("threshold_pitch", (0.03, 0.024, 0.02), rough=0.82)
RAG = comp.mat("threshold_rag", (0.11, 0.085, 0.06), rough=0.95)
M = lambda n, bm, m, smooth=True: comp.mesh(col, root, n, bm, m, smooth=smooth)

# the back plate: a long iron leaf with a rounded top and foot, and four nail heads
plate = comp.box((0.085, 0.012, 0.26), at=(0, -0.006, 0))
for z in (-0.11, 0.11):
    plate = comp.merge(plate, comp.cyl(0.0425, 0.012, at=(0, 0, z), seg=20, axis="Y"))
nails = [comp.cyl(0.009, 0.008, at=(0, -0.012, z), seg=10, r2=0.006, axis="Y") for z in (-0.115, -0.04, 0.04, 0.115)]
for i, n in enumerate(nails):
    xf(n, T(0, -0.008, 0))
M("torch_plate", comp.merge(plate, *nails), IRON, smooth=False)

# the torch's line: out from the wall at its foot, leaning out 16 degrees from upright, toward -y
LEAN = math.radians(16)
FOOT = Vector((0, -0.165, -0.2))
AXIS = Vector((0, -math.sin(LEAN), math.cos(LEAN)))
at = lambda s: FOOT + AXIS * s                     # a point s metres up the haft

# the arm: a square bar out from the plate, curling up under the basket, with a scroll at its end
arm = comp.tube([(0, -0.012, -0.06), (0, -0.07, -0.075), (0, -0.13, -0.05), tuple(at(0.13) + Vector((0, 0.012, 0))), tuple(at(0.2) + Vector((0, 0.028, 0)))], 0.008, res=10, sides=2)
scroll = comp.tube([(0, -0.012, -0.12), (0, -0.06, -0.15), (0, -0.11, -0.17), tuple(at(0.02) + Vector((0, 0.03, 0))), tuple(at(0.05) + Vector((0, 0.03, 0)))], 0.006, res=10, sides=2)
M("torch_arm", comp.merge(arm, scroll), IRON)

# the rings that hold it: a lower collar, and the basket ring higher up with four short tines rising from it
def ring_at(s, r, rr):
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, radius=r, segments=24)
    o = comp.tube([(r * math.cos(a), r * math.sin(a), 0) for a in [k * 2 * math.pi / 16 for k in range(17)]], rr, res=4, sides=2)
    q = AXIS.to_track_quat("Z", "Y").to_matrix().to_4x4()
    xf(o, q)
    xf(o, T(*at(s)))
    bm.free()
    return o
rings = [ring_at(0.12, 0.033, 0.005), ring_at(0.3, 0.038, 0.006)]
tines = []
for k in range(4):
    a = k * math.pi / 2 + math.pi / 4
    base = at(0.3) + Vector((0.038 * math.cos(a), 0.038 * math.sin(a) * math.cos(LEAN), 0))
    tip = base + AXIS * 0.07 + Vector((0.016 * math.cos(a), 0.016 * math.sin(a), 0))
    tines.append(comp.tube([tuple(base), tuple(base + AXIS * 0.04), tuple(tip)], 0.004, res=6, sides=2))
M("torch_rings", comp.merge(*rings, *tines), IRON)

# the haft: ash, a little thicker at the head, from s 0 to 0.42 where the rag starts
haft = comp.cyl(0.022, 0.46, seg=16, r2=0.027)
q = AXIS.to_track_quat("Z", "Y").to_matrix().to_4x4()
xf(haft, q)
xf(haft, T(*FOOT))
o = M("torch_haft", haft, WOOD)
L.finish(o, 0.5)

# the head: a bulb of rag wound round the haft's end, soaked in pitch: lumpy, with the winding's ridges round it
HEAD0, HEAD1 = 0.4, 0.55
prof = [(0.024, 0.0), (0.036, 0.015), (0.045, 0.045), (0.047, 0.085), (0.042, 0.12), (0.03, 0.143), (0.0, 0.15)]
bm = bmesh.new()
segs = 20
rows = []
for r, h in prof:
    rows.append([bm.verts.new((r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs), h)) for k in range(segs)])
for a, b in zip(rows, rows[1:]):
    for k in range(segs):
        bm.faces.new([a[k], a[(k + 1) % segs], b[(k + 1) % segs], b[k]])
bm.faces.new(list(reversed(rows[0])))
bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=2, use_grid_fill=True)
for v in bm.verts:
    p = v.co
    ang = math.atan2(p.y, p.x)
    wind = 0.004 * math.sin(p.z * 95 + ang * 1.0)                           # the wraps' ridges, wound on a slant
    lump = 0.0035 * math.sin(ang * 5 + p.z * 40) * math.sin(ang * 3 - p.z * 23)
    rr = math.hypot(p.x, p.y)
    if rr > 1e-4:
        k = (rr + wind + lump) / rr
        v.co.x *= k
        v.co.y *= k
xf(bm, q)
xf(bm, T(*at(HEAD0)))
M("torch_head", bm, PITCH)
# a loose end of rag hanging from the wrap's foot
tail = comp.tube([tuple(at(HEAD0 + 0.01) + Vector((0.04, 0, 0))), tuple(at(HEAD0 - 0.03) + Vector((0.05, -0.01, 0))), tuple(at(HEAD0 - 0.07) + Vector((0.047, -0.02, 0)))], 0.006, res=6, sides=2)
M("torch_rag", tail, RAG)

flame = at(HEAD0 + 0.15)
print("flame base", tuple(round(c, 4) for c in flame))
comp.export(col, root, "threshold", "torch", made="blender/components/threshold/torch.py",
            source="own geometry; ash: https://polyhaven.com/a/rough_wood", license="CC0", credit="Poly Haven (texture)",
            rig={"flame": "in the scene: a flame shader standing on the head's top, and a warm flickering light there"},
            notes=f"the head's top (where the flame stands), in raea's frame (x, y, z): ({flame.x:.4f}, {flame.z:.4f}, {-flame.y:.4f}); the torch leans out 16 degrees")
