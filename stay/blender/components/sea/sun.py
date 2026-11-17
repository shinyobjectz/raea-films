# sea/sun: the setting sun's disc for the sea's horizon, modelled by hand, to stand 300 m out (inside the camera's far
# plane): a glowing disc 9 m across (1.7 degrees there, a sun through a long lens), and round it a soft halo of
# twenty-eight stacked thin glowing discs. Each is its own material (sun_disc, sun_halo). Its origin is the point on the horizon under the
# sun; the disc's centre rests on the horizon. Rig: "height" lifts the sun 95 m (to 17.5 degrees up at 300 m, the upper
# thirds line of the shot); the scene's own light (the DirectionalLight from the same direction) is the scene's.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib
from _lib import comp, bpy, bmesh, xf, T, R, S

col, root = comp.fresh("sun")
M = _lib.maker(col, root)
disc_m = comp.mat("sun_disc", (1.0, 0.75, 0.4), rough=1.0, emit=(1.0, 0.62, 0.22), strength=30000.0)
halo_m = comp.mat("sun_halo", (1.0, 0.5, 0.2), rough=1.0, emit=(1.0, 0.45, 0.14), strength=20.0, alpha=0.05)
p = comp.pivot(col, root, "sun_height", (0, 0, 0))
def disc(r, y, seg=96):
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, cap_tris=True, segments=seg, radius=r)
    xf(bm, R(90, "X"))
    xf(bm, T(0, y, 0))
    return bm
M("sun_disc", disc(4.5, 0.0), disc_m, parent=p, smooth=True)
# the halo: twenty-eight thin discs from 5 to 24 m, stacked, so the glow falls off softly with no ring showing
M("sun_halo", comp.merge(*[disc(5.0 + 19.0 * (i / 27) ** 1.5, 0.3 + 0.03 * i, seg=64) for i in range(28)]), halo_m, parent=p, smooth=True)
_lib.channel("height", [(p, "location", 2, 0.0, 95.0)])
comp.export(col, root, "sea", "sun", made="blender/components/sea/sun.py", source="own geometry", license="ours", credit="",
            rig={"height": "the disc rises 95 m from the horizon (0 = half set; 1 = 17.5 degrees up when it stands 300 m out)",
                 "glow": "in the scene: the materials sun_disc (opaque, traced: in the traced light's units, 30,000) and sun_halo (blended, drawn raster: 20)",
                 "light": "in the scene: the DirectionalLight that comes from where the disc is"},
            notes="Stand it 300 m from the camera, facing it (its face is toward -y, raea +z).")
