# stairwell/skylight: the lantern over the well, modelled by hand: the top storey's plaster ceiling (a ring out to
# the wall with a moulded curb round a 1.7 m radius eye), a steel upstand, and a twelve-sided glazed cone on T-bar
# ribs to a boss at its top, a ring purlin half way, twelve lower panes and twelve upper. Three lower panes are
# top-hung vents on stays. The glass is frosted and moonlit: its own material (skylight_glass) glows a dim cold
# blue, which is the night's light down the well. Origin: the well's axis at the ceiling's underside (it rises above).
# Rig: "vent" opens the three vents 32 degrees outward on their top edges.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
import comp, bmesh
from comp import T, R, S, xf
from mathutils import Vector

col, root = comp.fresh("skylight")
plaster = comp.ph_texture("skylight_plaster", "painted_plaster_wall", tile=2.4, res="1k")
steel = comp.mat("skylight_steel", (0.1, 0.12, 0.13), rough=0.45, metal=1.0)
glass = comp.mat("skylight_glass", (0.5, 0.6, 0.7), rough=0.35, emit=(0.45, 0.6, 1.0), strength=1200.0)
M = lambda n, bm, m, parent=None, smooth=False: comp.mesh(col, root, n, bm, m, parent=parent, smooth=smooth)
RE, UP, TOPZ, NP = 1.7, 0.55, 1.55, 12
c = M("skylight_ceiling", L.arc_block(RE, L.R_WALL + 0.3, 0, 360, 0.0, 0.25, seg=72), plaster)
comp.uv_box(c, 1.0)
curb = comp.merge(L.arc_block(RE - 0.05, RE + 0.12, 0, 360, -0.03, 0.0, seg=72), L.arc_block(RE - 0.025, RE + 0.07, 0, 360, -0.055, -0.03, seg=72), L.arc_block(RE - 0.06, RE, 0, 360, 0.0, UP, seg=72))
cu = M("skylight_curb", curb, steel)
comp.bevel(cu, 0.006, 2)
Z0 = UP
MIDR, MIDZ = RE * 0.5, Z0 + (TOPZ - Z0) * 0.5
ribs = []
for k in range(NP):
    a = 360.0 * k / NP
    p0, p1 = L.pol(RE - 0.03, a, Z0), L.pol(0.06, a, TOPZ)
    ribs.append(comp.tube([tuple(p0), tuple((p0 + p1) / 2), tuple(p1)], 0.016, res=2, sides=2))
    # the ring purlin and the eaves ring, straight from rib to rib
    for r, z in ((MIDR, MIDZ), (RE - 0.03, Z0)):
        q0, q1 = L.pol(r, a, z), L.pol(r, a + 360.0 / NP, z)
        ribs.append(comp.tube([tuple(q0), tuple((q0 + q1) / 2), tuple(q1)], 0.013, res=2, sides=2))
ribs.append(comp.cyl(0.11, 0.07, at=(0, 0, TOPZ - 0.03), seg=24, r2=0.05))
ribs.append(L.sphere(0.05, at=(0, 0, TOPZ + 0.07), u=12, v=8))
M("skylight_ribs", comp.merge(*ribs), steel, smooth=True)


def pane(pts):
    bm = bmesh.new()
    f = bm.faces.new([bm.verts.new(p) for p in pts])
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=f.normal * 0.006, verts=[v for v in r["geom"] if isinstance(v, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


fixed, vents = [], []
for k in range(NP):
    a0, a1 = 360.0 * k / NP + 0.6, 360.0 * (k + 1) / NP - 0.6
    upper = [L.pol(MIDR, a0, MIDZ), L.pol(MIDR, a1, MIDZ), L.pol(0.1, (a0 + a1) / 2, TOPZ - 0.02)]
    lower = [L.pol(RE - 0.04, a0, Z0 + 0.01), L.pol(RE - 0.04, a1, Z0 + 0.01), L.pol(MIDR, a1, MIDZ), L.pol(MIDR, a0, MIDZ)]
    fixed.append(pane(upper))
    if k in (1, 5, 9):
        hinge_at = (L.pol(MIDR, a0, MIDZ) + L.pol(MIDR, a1, MIDZ)) / 2
        vp = comp.pivot(col, root, f"skylight_vent_{len(vents) + 1}", tuple(hinge_at))
        vp.rotation_euler[2] = math.radians((a0 + a1) / 2 + 90)   # its local x runs along the hinge
        comp.bpy.context.view_layer.update()
        M(f"skylight_vent_{len(vents) + 1}_pane", pane(lower), glass, parent=vp)
        fr = []
        for i in range(4):
            q0, q1 = lower[i], lower[(i + 1) % 4]
            fr.append(comp.tube([tuple(q0), tuple((q0 + q1) / 2), tuple(q1)], 0.011, res=2, sides=2))
        M(f"skylight_vent_{len(vents) + 1}_frame", comp.merge(*fr), steel, parent=vp, smooth=True)
        vents.append(vp)
    else:
        fixed.append(pane(lower))
M("skylight_panes", comp.merge(*fixed), glass)
comp.channel("vent", [(vp, "rotation_euler", 0, 0, math.radians(32)) for vp in vents])
comp.export(col, root, "stairwell", "skylight", made="blender/components/stairwell/skylight.py", source="own geometry (a glazed lantern on a plaster ceiling); texture: https://polyhaven.com/a/painted_plaster_wall", license="ours; texture CC0", credit="Poly Haven (painted_plaster_wall)",
            rig={"vent": "three lower panes open 32 degrees outward on their top edges",
                 "moon": "in the scene: the material skylight_glass's glow is the night's light down the well, a key per state"},
            notes="origin: the well's axis at the ceiling's underside, 3.23 m over the top landing")
