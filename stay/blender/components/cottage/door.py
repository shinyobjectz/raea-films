# cottage/door: the cottage's front door (blender/components/cottage/_lib.py). A Craftsman door in stained oak: three
# lights of amber glass across its top over a dentil shelf, three tall flat panels below between stiles and rails, an
# oil-rubbed bronze thumb-latch with a long plate and a deadbolt above it.
# It hangs as the rooms' doors do (blender/rooms.py, sets/rooms.ts DOOR): the origin is the hinge, the leaf closed
# along +x and centred on the hinge's line, and "open" swings it 105 degrees in, away from the lens. Its handle is
# where the cursor reaches for the knob (v3/walk.tsx knob(): 0.868 m along the leaf, 1.02 m up, 0.075 m out).
import os, sys, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "lib"))
sys.path.insert(0, HERE)
import comp, bpy, bmesh
import _lib as C

import _mats as M
# (a honey oak: the planks greyed, brightened and stained, so it holds its colour in the porch's shade)
OAK = comp.ph_texture("cottage_door_oak", "wood_table_001", tile=1.0, res="2k", tint=(1.0, 0.9, 0.78))
AMBER = comp.mat("cottage_door_glass", (0.62, 0.34, 0.1), rough=0.15, emit=(1.0, 0.52, 0.18), strength=2.0)
BRONZE = comp.mat("cottage_door_bronze", (0.16, 0.11, 0.075), rough=0.4, metal=1.0)

col, root = comp.fresh("cottage_door")
piv = comp.pivot(col, root, "door_leaf_pivot", (0, 0, 0))

GAP = 0.004
LW, LH, LT = C.DOOR_W - 2 * GAP, C.DOOR_H - 0.01, 0.045
X0, Z0 = GAP, 0.006
ST, TR, BR = 0.125, 0.12, 0.24                 # stiles, top rail, bottom rail
LIGHT_H = 0.40                                 # the lights' height
SHELF_Z = Z0 + LH - TR - LIGHT_H - 0.09        # the shelf's underside
MU = 0.05                                      # the muntins between the lights
PMU = 0.085                                    # the mullions between the panels
F = -LT / 2                                    # the outside face (toward -y, the lens)


def at(bm):
    return bm


parts = []
# the panels' field (thinner than the frame members, so the panels sit back in it): from the bottom rail to the shelf
# only, the lights above it are open to their glass
parts.append(comp.box((LW - 2 * ST + 0.02, LT - 0.024, SHELF_Z - (Z0 + BR) + 0.02), (X0 + LW / 2, 0.0, (Z0 + BR + SHELF_Z) / 2)))
# stiles and rails, full thickness
for cx, cz, w, h in ((X0 + ST / 2, Z0 + LH / 2, ST, LH), (X0 + LW - ST / 2, Z0 + LH / 2, ST, LH),
                     (X0 + LW / 2, Z0 + LH - TR / 2, LW - 2 * ST, TR), (X0 + LW / 2, Z0 + BR / 2, LW - 2 * ST, BR)):
    parts.append(comp.box((w, LT, h), (cx, 0.0, cz)))
# the lights' muntins and the rail under them (the shelf's back), full thickness
lz0, lz1 = Z0 + LH - TR - LIGHT_H, Z0 + LH - TR
iw = LW - 2 * ST
lw = (iw - 2 * MU) / 3
for k in (1, 2):
    x = X0 + ST + k * lw + (k - 0.5) * MU
    parts.append(comp.box((MU, LT, LIGHT_H), (x, 0.0, (lz0 + lz1) / 2)))
parts.append(comp.box((iw, LT, lz0 - SHELF_Z), (X0 + LW / 2, 0.0, (SHELF_Z + lz0) / 2)))
# the panels' mullions, full thickness, from the bottom rail up to the shelf
pz0, pz1 = Z0 + BR, SHELF_Z
pw = (iw - 2 * PMU) / 3
for k in (1, 2):
    x = X0 + ST + k * pw + (k - 0.5) * PMU
    parts.append(comp.box((PMU, LT, pz1 - pz0), (x, 0.0, (pz0 + pz1) / 2)))
# a small bead round each panel, on the outside face
for k in range(3):
    x0 = X0 + ST + k * (pw + PMU)
    for (cx, cz, w, h) in ((x0 + pw / 2, pz1 - 0.008, pw, 0.016), (x0 + pw / 2, pz0 + 0.008, pw, 0.016), (x0 + 0.008, (pz0 + pz1) / 2, 0.016, pz1 - pz0), (x0 + pw - 0.008, (pz0 + pz1) / 2, 0.016, pz1 - pz0)):
        parts.append(comp.box((w, 0.008, h), (cx, -LT / 2 + 0.012 + 0.004, cz)))
# the dentil shelf: a shelf standing out of the face, a row of dentils under it
parts.append(comp.box((iw + 0.03, 0.05, 0.03), (X0 + LW / 2, F - 0.025 + 0.004, SHELF_Z + 0.075)))   # the shelf, z +0.06..0.09
parts.append(comp.box((iw, 0.014, 0.05), (X0 + LW / 2, F - 0.007 + 0.002, SHELF_Z + 0.035)))          # the band behind the dentils
n = 15
for k in range(n):
    x = X0 + ST + (k + 0.5) * iw / n
    parts.append(comp.box((iw / n * 0.55, 0.034, 0.03), (x, F - 0.017 + 0.002, SHELF_Z + 0.045)))    # each dentil, z +0.03..0.06
leaf = comp.mesh(col, root, "door_leaf", comp.merge(*parts), OAK, parent=piv)
comp.bevel(leaf, 0.003, 2, angle=35)
comp.uv_box(leaf, 1.0)

# the glass, set back in the lights
gl = []
for k in range(3):
    x0 = X0 + ST + k * (lw + MU)
    gl.append(comp.box((lw, 0.006, LIGHT_H), (x0 + lw / 2, 0.0, (lz0 + lz1) / 2)))
comp.mesh(col, root, "door_glass", comp.merge(*gl), AMBER, parent=piv)

# hardware: the thumb-latch's long plate and its grip, the thumb piece, a deadbolt above; a plate on the inside too
hx = 0.868 - 0.0
hz = 1.02
hw = []
hw.append(comp.box((0.062, 0.008, 0.32), (hx, F - 0.004, hz + 0.02)))                        # the plate
hw.append(comp.box((0.024, 0.06, 0.03), (hx, F - 0.03, hz + 0.1)))                            # the grip's upper post
hw.append(comp.box((0.024, 0.06, 0.03), (hx, F - 0.03, hz - 0.07)))                           # its lower post
hw.append(comp.box((0.028, 0.02, 0.2), (hx, F - 0.06 + 0.005, hz + 0.015)))                   # the grip
hw.append(comp.box((0.02, 0.05, 0.012), (hx, F - 0.03, hz + 0.135)))                          # the thumb piece
hw.append(comp.cyl(0.028, 0.012, at=(hx, F - 0.006, hz + 0.3), seg=24, axis="Y"))
hw.append(comp.cyl(0.016, 0.012, at=(hx, F - 0.018, hz + 0.3), seg=20, axis="Y"))
hw.append(comp.box((0.062, 0.008, 0.26), (hx, -F + 0.004, hz)))                               # the inside plate
hw.append(comp.box((0.02, 0.05, 0.1), (hx, -F + 0.03, hz)))
comp.mesh(col, root, "door_hardware", comp.merge(*hw), BRONZE, parent=piv)

comp.channel("open", [(piv, "rotation_euler", 2, 0, math.radians(105))])

comp.export(col, root, "cottage", "door", made="blender/components/cottage/door.py",
            source="own geometry; Poly Haven's weathered_planks (CC0)", license="ours (texture CC0)", credit="Poly Haven (polyhaven.com)",
            rig={"open": "the leaf swings 105 degrees on its hinge, in, away from the lens (as the rooms' doors do)"},
            notes=json.dumps({"hinge_at": "the origin; the leaf closed along +x, centred on the hinge's line", "handle": [hx, F - 0.06, hz]}))
