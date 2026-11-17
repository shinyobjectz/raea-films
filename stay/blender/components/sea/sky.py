# sea/sky: the sunset sky as a dome 350 m in radius, its picture Poly Haven's the_sky_is_on_fire (CC0, the film's own
# sunset panorama) tone-mapped to a JPEG and glowing: the half of the panorama that is sky over open sea (the other
# half is a promenade and buildings) wraps the front, sun dead ahead (Blender +y, raea -z), and mirrors round the back.
# The dome runs from 6 degrees under the horizon to the zenith; the sea's surface meets it at the horizon. Its origin
# is the dome's centre at sea level. Rig: "turn" is the scene's (the Model's yaw: where the sun's glow sits);
# "glow" is the scene's too: the material sky_glow.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S, Matrix
import numpy as np

col, root = comp.fresh("sky")
M = _lib.maker(col, root)
files = comp.api("files/the_sky_is_on_fire")
f = files["hdri"]["4k"]["hdr"]
hdr = comp.fetch(f["url"], os.path.join(comp.CACHE, "polyhaven", "hdri", os.path.basename(f["url"])))
jpg = _lib.SKY_JPG
if not os.path.isfile(jpg):
    os.makedirs(_lib.SRC, exist_ok=True)
    im = bpy.data.images.load(hdr)
    w, h = im.size
    px = np.empty(w * h * 4, dtype=np.float32)
    im.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    # the sky half only: u 0.475 .. 0.945 (open sea and sky), from the horizon's row less 8 degrees up
    u0, u1 = int(0.475 * w), int(0.945 * w)
    v0 = int((0.5 - 8 / 180) * h)
    c = px[v0:, u0:u1, :3] * 0.62
    c = c * (1 + c / 9.0) / (1 + c)            # a soft shoulder, the sun's core kept bright
    c = np.clip(c, 0, 1) ** (1 / 2.2)             # to display; saved as sRGB
    out = np.ones((c.shape[0], c.shape[1], 4), dtype=np.float32)
    out[..., :3] = c
    o = bpy.data.images.new("sky_jpg", c.shape[1], c.shape[0])
    o.colorspace_settings.name = "sRGB"
    # pixels are scene-linear in Blender: store linear values so the saved file is the display picture
    lin = out.copy()
    lin[..., :3] = lin[..., :3] ** 2.2
    o.pixels.foreach_set(lin.ravel())
    o.filepath_raw = jpg
    o.file_format = "JPEG"
    o.save()
    bpy.data.images.remove(im)
glow = _lib.glow_tex("sky_glow", jpg, strength=2100.0)

RAD, LOW = 350.0, -8.0
bm = bmesh.new()
uvl = bm.loops.layers.uv.new("UVMap")
NA, NE = 96, 28
rows = []
for j in range(NE + 1):
    e = math.radians(LOW + (90 - LOW) * j / NE)
    rows.append([bm.verts.new((RAD * math.cos(e) * math.sin(a), RAD * math.cos(e) * math.cos(a), RAD * math.sin(e))) for a in (2 * math.pi * i / NA for i in range(NA))])
def uv(i, j):
    az = (i / NA) * 360.0
    return _lib.sky_uv(az if az <= 180 else az - 360, LOW + (90 - LOW) * j / NE)
for j in range(NE):
    for i in range(NA):
        a, b, c, d = rows[j][i], rows[j][(i + 1) % NA], rows[j + 1][(i + 1) % NA], rows[j + 1][i]
        f = bm.faces.new((a, d, c, b))           # facing inward
        for l, (ii, jj) in zip(f.loops, ((i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j))):
            l[uvl].uv = uv(ii, jj)
dome = M("sky_dome", bm, glow, smooth=True)
# a shape key that moves nothing to speak of: Solari leaves a morphed mesh out of its rays, so the dome is drawn as a
# backdrop and neither stops the scene's sun (a traced dome shadows everything under it) nor lights anything
dome.shape_key_add(name="Basis")
k = dome.shape_key_add(name="still")
k.data[0].co.z += 0.001
comp.export(col, root, "sea", "sky", made="blender/components/sea/sky.py",
            source="own dome; picture: https://polyhaven.com/a/the_sky_is_on_fire (its sea-facing half, tone-mapped)", license="ours; picture CC0", credit="Poly Haven (the_sky_is_on_fire: Greg Zaal, Rico Cilliers)",
            rig={"turn": "in the scene: the Model's yaw; the sun's glow is dead ahead (raea -z) at yaw 0", "glow": "in the scene: the material sky_glow's glow (2,100 at the stand's exposure: opaque, so in the camera's exposed units like a traced glow, though it is not traced), a key per state"},
            notes="The dome carries a shape key so Solari does not trace it: it is a backdrop only (opaque, so blended things such as the sun's halo draw over it; made blended it painted over them), and the scene's light is the scene's (a DirectionalLight, an Environment). 350 m radius: keep the camera's far plane past it (the stand's is 400 m). The picture's sun sits about 3 degrees over the horizon.")
