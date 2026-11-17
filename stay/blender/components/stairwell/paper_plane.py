# stairwell/paper-plane: a paper dart folded from a printed A4 sheet, 28 cm long and 17 cm across, modelled by hand:
# the keel (the doubled fold under it, the finger grip), two wings each a part hinged on the centre crease with the
# folded-in nose layers lying on top, the print's grey lines on the paper. Its nose points to -y.
# Its origin is NOT the plane: it is the well's axis, with the plane 0.62 m out from it, banked into the turn with its
# nose down, so "spiral" can carry it round the well. Rig: "spiral" is one storey of the fall: once round the axis
# (clockwise from above) and 3.23 m down, and it loops (the Model's position drops a storey a loop); "flutter" lifts
# both wings 22 degrees about the crease; "wobble" rolls the plane 18 degrees about its own length.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("paper_plane")
paper = comp.mat("plane_paper", (0.93, 0.92, 0.88), rough=0.62)
ink = comp.mat("plane_print", (0.2, 0.2, 0.23), rough=0.7)
LEN, HALF, KEEL, TH = 0.28, 0.085, 0.032, 0.0006
orbit = comp.pivot(col, root, "paper_plane_orbit", (0, 0, 0))
body = comp.pivot(col, root, "paper_plane_body", (0.62, 0, 0), parent=orbit)
M = lambda n, bm, m, parent=body: comp.mesh(col, root, n, bm, m, parent=parent)


def sheet(pts, th=TH):
    """A flat paper facet through pts (in order), given both faces and a hair of thickness."""
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in pts]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    n = f.normal.copy()
    bmesh.ops.translate(bm, vec=n * th, verts=[v for v in r["geom"] if isinstance(v, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


X0 = 0.62
# the keel: two leaves pinched together below the crease, deepest a third back, cut up to nothing at the nose
keel = []
for s in (-1, 1):
    keel.append(sheet([(X0 + s * 0.0008, -LEN / 2, 0), (X0 + s * 0.0008, LEN / 2, 0), (X0 + s * 0.0025, LEN / 2, -KEEL), (X0 + s * 0.002, -LEN / 2 + 0.1, -KEEL)]))
M("paper_plane_keel", comp.merge(*keel), paper)
wings = []
for s, side in ((-1, "l"), (1, "r")):
    wp = comp.pivot(col, root, f"paper_plane_wing_{side}", (X0, 0, 0), parent=body)
    tip = [(X0, -LEN / 2, 0), (X0 + s * HALF, LEN / 2, 0), (X0, LEN / 2, 0)]
    parts = [sheet(tip if s > 0 else tip[::-1])]
    # the folded-in layers on top: the first fold's triangle and the second's strip, each a paper's thickness higher
    f1 = [(X0, -LEN / 2 + 0.004, 0.0008), (X0 + s * HALF * 0.7, LEN / 2 - 0.085, 0.0008), (X0, LEN / 2 - 0.085, 0.0008)]
    f2 = [(X0, -LEN / 2 + 0.01, 0.0016), (X0 + s * HALF * 0.36, -0.02, 0.0016), (X0, -0.02, 0.0016)]
    parts += [sheet(f1 if s > 0 else f1[::-1]), sheet(f2 if s > 0 else f2[::-1])]
    # a winglet turned up at the tip
    wl = [(X0 + s * HALF, LEN / 2, 0), (X0 + s * (HALF * 0.55), 0.015, 0), (X0 + s * (HALF * 0.55 + 0.004), 0.02, 0.012), (X0 + s * (HALF + 0.004), LEN / 2, 0.016)]
    parts.append(sheet(wl if s < 0 else wl[::-1]))
    w = M(f"paper_plane_wing_{side}_paper", comp.merge(*parts), paper, parent=wp)
    # the print: lines of text across the wing behind the folds
    lines = []
    for k in range(9):
        y = LEN / 2 - 0.012 - k * 0.0085
        x1 = HALF * (y + LEN / 2) / LEN - 0.012
        if x1 > 0.02:
            ln = min(x1 - 0.008, 0.05 if k % 4 == 3 else 0.075)
            lines.append(comp.box((ln, 0.0022, 0.0002), at=(X0 + s * (0.008 + ln / 2), y, 0.0002 if y > LEN / 2 - 0.085 else 0.0012)))
    M(f"paper_plane_wing_{side}_print", comp.merge(*lines), ink, parent=wp)
    wp.rotation_euler[1] = -s * math.radians(7)   # a little dihedral at rest
    wings.append((wp, s))
# the attitude in the turn: nose down 14 degrees, banked 24 degrees toward the axis (the plane flies toward -y at
# +x of the axis, so it goes round clockwise seen from above)
body.rotation_euler = (math.radians(-14), math.radians(-24), 0)
comp.bpy.context.view_layer.update()
L.clip("spiral", orbit, {("rotation_euler", 2): [(0, 0), (1, -2 * math.pi)], ("location", 2): [(0, 0), (1, -L.H)]})
comp.channel("flutter", [(wp, "rotation_euler", 1, wp.rotation_euler[1], wp.rotation_euler[1] - s * math.radians(22)) for wp, s in wings])
comp.channel("wobble", [(body, "rotation_euler", 1, body.rotation_euler[1], body.rotation_euler[1] + math.radians(18))])
comp.export(col, root, "stairwell", "paper_plane", made="blender/components/stairwell/paper_plane.py", source="own geometry (a paper dart folded from a printed sheet)", license="ours", credit="",
            rig={"position": "the Model's position is the well's axis at the height the plane starts from; the plane itself is 0.62 m out",
                 "spiral": "one storey of the fall: once round the well's axis, clockwise from above, and 3.23 m down; loops",
                 "flutter": "both wings lift 22 degrees about the centre crease",
                 "wobble": "the plane rolls 18 degrees about its own length"})
