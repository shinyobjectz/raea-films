# sea/headland: the headland on the horizon, 300 m long and 31 m high at its point: its sea cliffs are Poly Haven's
# coastal_cliff_02 (CC0, a photoscan by Rob Tuytel) cut to a twentieth of its faces and stood three times its size,
# three lengths of it turned round the point; over them a turfed cap modelled by hand (a noise-worn dome falling away
# inland, Poly Haven's aerial_grass_rock on it) and a skirt of fallen rock at the foot. It faces the sea (-y, raea
# +z); its origin is the still-water level under the middle of its seaward face. The lighthouse stands on LIGHT, the
# flat of the cap behind the point: 57.6 m to the right, 18 m back, 28.5 m up (raea 57.6, 28.5, -18). No rig.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Vector, Matrix
col, root = comp.fresh("headland")
M = _lib.maker(col, root)
parts, credit = _lib.bring(col, root, "coastal_cliff_02", "headland_cliff", res="1k")
c = list(parts.values())[0]
_lib.decimate(c, 0.045)
_lib.apply_all(c)
lo, hi = comp.box_of(c)
base = T(-(lo.x + hi.x) / 2, -hi.y, -lo.z - 0.9) @ c.matrix_world     # its back at y 0, its foot just under the water
K = 3.0
q = K / 5.0
W = (hi.x - lo.x) * K
SEG = [(T(-W * 0.55, 6 * q, 0) @ R(8, "Z"), 0.86), (T(W * 0.28, 0, 0) @ R(-4, "Z"), 1.0), (T(W * 0.98, 16 * q, 0) @ R(-34, "Z"), 1.04)]
for i, (m, tall) in enumerate(SEG):
    _lib.copy_of(col, root, c, f"headland_cliff_{i + 1}", m @ S(K, K, K * tall) @ base)
bpy.data.objects.remove(c, do_unlink=True)
TOP = (hi.z - lo.z) * K
LIGHT = (96.0 * q, 30.0 * q, 47.5 * q)
# the cap: a grid over the top, its seaward edge tucked just under the cliffs' brow, falling away inland and to the left
grass = comp.ph_texture("headland_turf", "aerial_grass_rock", tile=30.0, res="1k")
NX, NY = 90, 44
X0, X1, Y0, Y1 = -W * 1.15, W * 1.25, 4.0 * q, 190.0 * q
cap = bmesh.new()
rows = []
for j in range(NY + 1):
    y = Y0 + (Y1 - Y0) * j / NY
    row = []
    for i in range(NX + 1):
        x = X0 + (X1 - X0) * i / NX
        # the brow follows the three cliffs: highest at the point (right), lower to the left
        along = (x - X0) / (X1 - X0)
        brow = TOP * (0.74 + 0.3 * min(1.0, along * 1.25)) - 3.0 * q
        inland = (y - Y0) / (Y1 - Y0)
        z = brow + q * (7.0 * math.sin(min(1.0, inland * 2.2) * math.pi * 0.6) - 30.0 * max(0.0, inland - 0.35) ** 1.5 - 60.0 * max(0.0, along - 0.86) ** 1.3 * (0.4 + inland))
        z += 2.0 * _lib.fbm((x, y, 0.0), 4, 30.0)
        d = math.hypot(x - LIGHT[0], y - LIGHT[1])
        k = max(0.0, min(1.0, (d - 14.0) / 10.0))
        z = LIGHT[2] * (1 - k) + z * k                       # a flat for the lighthouse and its yard
        row.append(cap.verts.new((x, y, z)))
    rows.append(row)
for j in range(NY):
    for i in range(NX):
        cap.faces.new([rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]])
# a skirt down the back and the ends so the cap reads solid from any side
edge = [rows[0][i] for i in range(NX + 1)] + [rows[j][NX] for j in range(1, NY + 1)] + [rows[NY][i] for i in range(NX - 1, -1, -1)] + [rows[j][0] for j in range(NY - 1, 0, -1)]
edge = [v.co.copy() for v in edge]
co = M("headland_cap", cap, grass, smooth=True)
comp.uv_box(co, 1.0)
rock = comp.ph_texture("headland_rock", "seaside_rock", tile=12.0, res="1k")
skirt = bmesh.new()
cx_, cy_ = (X0 + X1) / 2, (Y0 + Y1) / 2
ROWS = 7
def down(v, t):
    """a point t of the way from the cap's edge down a broken slope to the water: the front stays under the cliffs,
    the ends and the back run out"""
    d = Vector((v.x - cx_, (v.y - cy_) * 2.2, 0))
    d = d.normalized() if d.length > 0 else d
    out = 0.0 if v.y < Y0 + 1 else 1.1 * (v.z + 1.0)
    bump = math.sin(math.pi * t) * (v.z + 1.0) * 0.28 * _lib.fbm((v.x * 1.0, v.y * 1.0, t * 40.0), 4, 22.0)
    reach = out * (t ** 0.8) * (1 + 0.3 * _lib.fbm((v.x, v.y, 7.0), 3, 25.0)) + bump
    return (v.x + d.x * reach, v.y + d.y / 2.2 * reach, v.z + (-1.0 - v.z) * t + 0.5 * bump)
rings = [[skirt.verts.new(down(v, k / ROWS)) for v in edge] for k in range(ROWS + 1)]
for k in range(ROWS):
    for i in range(len(edge)):
        j = (i + 1) % len(edge)
        skirt.faces.new([rings[k][i], rings[k + 1][i], rings[k + 1][j], rings[k][j]])
bmesh.ops.recalc_face_normals(skirt, faces=skirt.faces)
so = M("headland_back", skirt, rock, smooth=True)
comp.uv_box(so, 1.0)
random.seed(3)
falls = []
for i in range(80):
    x = random.uniform(-W * 0.95, W * 1.2)
    r = random.uniform(1.0, 3.6)
    falls.append(_lib.lump(_lib.ico(r, at=(x, -random.uniform(0.5, 6.0), random.uniform(-0.8, 0.6) * r * 0.5), sub=2, scale=(1.3, 1.0, 0.7)), r * 0.35, r * 0.9, 3, seed=i))
fo = M("headland_falls", comp.merge(*falls), rock, smooth=False)
comp.uv_box(fo, 1.0)
comp.export(col, root, "sea", "headland", made="blender/components/sea/headland.py", source="https://polyhaven.com/a/coastal_cliff_02 (decimated to 5%, three times its size); cap, back and fallen rock our own; textures https://polyhaven.com/a/aerial_grass_rock, /seaside_rock", license="CC0; ours", credit=credit + "; Poly Haven (aerial_grass_rock, seaside_rock)",
            notes="The lighthouse stands at raea (57.6, 28.5, -18) from its origin. The cliffs are a scan three times its size: for the horizon (150 m or more out), not for close work.")
