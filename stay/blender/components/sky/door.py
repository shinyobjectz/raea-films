# sky/door: the clouds world's door (the director, 11-11: "a door in the clouds of a hyper realistic sky clouds, birds etc").
# A door and its frame and nothing else, standing on the cloud tops: a four-panel door painted a deep blue, in a cased
# frame painted white with a little cornice over it, a brass knob and rose, on a worn oak threshold.
# The origin is the threshold's middle at the opening's foot, the door facing -y (toward the lens). The door opens
# toward us: rig "open", the leaf swinging out 100 degrees on its left side (as wreck/hatch's does, so the leaf never
# goes behind the doorway's picture of the next world).
import os, sys, math, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
import comp, bpy, bmesh

OW, OH = 0.45, 2.05                 # the opening's half-width and height
JW, JD = 0.09, 0.14                 # the jambs' width and depth
CW, CP = 0.085, 0.02                # the casing's width and how proud it stands of the jamb's faces
LT = 0.045                          # the leaf's thickness
GAP = 0.004
HX, HY = -OW + GAP, -LT / 2         # the hinge's line: the leaf's front face at its left edge
KNOB = (OW - 0.075, -LT / 2 - 0.068, 0.98)


def painted(name, asset, tint, tile, rough=None):
    m = comp.ph_texture(name, asset, tile=tile, res="2k", tint=tint, grey=True)
    if rough is not None:
        b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        for l in list(b.inputs["Roughness"].links):
            m.node_tree.links.remove(l)
        b.inputs["Roughness"].default_value = rough
    return m


BLUE = comp.mat("door_blue", (0.05, 0.2, 0.6), rough=0.3)                     # (gloss paint, smooth)
WHITE = comp.mat("door_white", (0.86, 0.84, 0.79), rough=0.45)
OAK = comp.ph_texture("door_oak", "weathered_planks", tile=1.2, res="2k", tint=(0.8, 0.72, 0.62))
BRASS = comp.mat("door_brass", (0.86, 0.64, 0.32), rough=0.24, metal=1.0)

col, root = comp.fresh("sky_door")

# ---- the frame: jambs and head, the casing round both faces, a cornice on the head
fr = [comp.box((JW, JD, OH + JW), (-(OW + JW / 2), 0, (OH + JW) / 2)), comp.box((JW, JD, OH + JW), (OW + JW / 2, 0, (OH + JW) / 2)),
      comp.box((2 * OW, JD, JW), (0, 0, OH + JW / 2))]
for s in (-1, 1):
    y = s * (JD / 2 + CP / 2)
    fr += [comp.box((CW, CP, OH + CW), (-(OW + CW / 2), y, (OH + CW) / 2)), comp.box((CW, CP, OH + CW), (OW + CW / 2, y, (OH + CW) / 2)),
           comp.box((2 * (OW + CW), CP, CW * 1.25), (0, y, OH + CW * 0.625))]
fr.append(comp.box((2 * (OW + CW) + 0.1, JD + 2 * CP + 0.07, 0.035), (0, 0, OH + CW * 1.25 + 0.0175)))       # the cornice's shelf
fr.append(comp.box((2 * (OW + CW) + 0.06, JD + 2 * CP + 0.035, 0.05), (0, 0, OH + CW * 1.25 + 0.06)))        # and its cap
o = comp.mesh(col, root, "door_frame", comp.merge(*fr), WHITE)
comp.bevel(o, 0.004, 2)
comp.uv_box(o, 1.0)
o = comp.mesh(col, root, "door_threshold", comp.box((2 * (OW + CW) + 0.04, JD + 2 * CP + 0.09, 0.05), (0, 0, -0.025)), OAK)
comp.bevel(o, 0.006, 2)
comp.uv_box(o, 1.0)

# ---- the leaf on its hinge: a slab, and on each face stiles, rails and a muntin standing round four raised panels
hinge = comp.pivot(col, root, "door_hinge", (HX, HY, 0.0))


def on_hinge(bm):
    """a part built in the hinge's frame, put where it stands (comp keeps a part's world place when it hangs it)"""
    bmesh.ops.translate(bm, vec=(HX, HY, 0.0), verts=bm.verts)
    return bm


LW, LH = 2 * OW - 2 * GAP, OH - GAP - 0.006
x0 = GAP                                             # (the leaf's left edge, in the hinge's frame, x right from it)
parts = [comp.box((LW, LT - 0.03, LH), (x0 + LW / 2, LT / 2, 0.006 + LH / 2))]
ST, TR, LR, BR, MU = 0.115, 0.115, 0.17, 0.23, 0.1
LRZ = 0.95                                           # the lock rail's middle
z0, z1 = 0.006, 0.006 + LH
for fy in (0.004, LT - 0.004):
    members = [((x0 + ST / 2, z0 + LH / 2), (ST, LH)), ((x0 + LW - ST / 2, z0 + LH / 2), (ST, LH)),
               ((x0 + LW / 2, z1 - TR / 2), (LW - 2 * ST, TR)), ((x0 + LW / 2, LRZ), (LW - 2 * ST, LR)), ((x0 + LW / 2, z0 + BR / 2), (LW - 2 * ST, BR)),
               ((x0 + LW / 2, (LRZ + LR / 2 + z1 - TR) / 2), (MU, z1 - TR - LRZ - LR / 2)), ((x0 + LW / 2, (z0 + BR + LRZ - LR / 2) / 2), (MU, LRZ - LR / 2 - z0 - BR))]
    for (cx, cz), (w, h) in members:
        parts.append(comp.box((w, 0.008, h), (cx, fy, cz)))
    pw = (LW - 2 * ST - MU) / 2
    for (za, zb) in ((LRZ + LR / 2, z1 - TR), (z0 + BR, LRZ - LR / 2)):
        for side in (-1, 1):
            cx = x0 + LW / 2 + side * (MU / 2 + pw / 2)
            parts.append(comp.box((pw - 0.05, 0.004, zb - za - 0.05), (cx, fy + (0.006 if fy < LT / 2 else -0.006), (za + zb) / 2)))   # the field, sunk 8 mm
o = comp.mesh(col, root, "door_leaf", on_hinge(comp.merge(*parts)), BLUE, parent=hinge)
comp.bevel(o, 0.003, 2, angle=30)
comp.uv_box(o, 1.0)

# ---- brass: the knob and its rose on both faces, a keyhole plate, three hinges' knuckles
kx = KNOB[0] - HX
br = []
for s in (-1, 1):
    fy = LT / 2 + s * (LT / 2 + 0.002)
    br.append(comp.cyl(0.03, 0.008, at=(kx, fy + s * 0.004, KNOB[2]), seg=24, axis="Y"))                          # the rose
    br.append(comp.cyl(0.009, 0.05, at=(kx, fy + s * 0.03, KNOB[2]), seg=12, axis="Y"))                           # the neck
    k = bmesh.new()
    bmesh.ops.create_uvsphere(k, u_segments=20, v_segments=12, radius=0.028)
    bmesh.ops.scale(k, vec=(1.0, 0.82, 1.0), verts=k.verts)
    bmesh.ops.translate(k, vec=(kx, fy + s * 0.066, KNOB[2]), verts=k.verts)
    br.append(k)
    br.append(comp.box((0.032, 0.004, 0.075), (kx, fy + s * 0.002, KNOB[2] - 0.085)))                           # the keyhole's plate
o = comp.mesh(col, root, "door_brass", on_hinge(comp.merge(*br)), BRASS, parent=hinge, smooth=True)
kn = [comp.cyl(0.011, 0.1, at=(0.0, -0.004, z), seg=12) for z in (0.22, 1.02, 1.82)]
o = comp.mesh(col, root, "door_knuckles", on_hinge(comp.merge(*kn)), BRASS, parent=hinge, smooth=True)

comp.channel("open", [(hinge, "rotation_euler", 2, 0.0, -math.radians(100))])

comp.export(col, root, "sky", "door", made="blender/components/sky/door.py",
            source="own geometry; Poly Haven's weathered_planks (CC0) on its threshold", license="ours (textures CC0)", credit="Poly Haven (polyhaven.com)",
            rig={"open": "the leaf (door_hinge) swings out 100 degrees toward the lens on its left side"},
            notes=json.dumps({"hinge": [HX, HY, 0.0], "knob": list(KNOB), "opening": {"half_width": OW, "sill": 0.0, "top": OH}, "face_y": -(JD / 2 + CP)}))
