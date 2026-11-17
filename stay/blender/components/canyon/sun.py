# canyon/sun: the sun's disc on its arc, modelled by hand: a glowing disc 2.4 m across carried 40 m from the pivot
# (3.4 degrees across from there: the circle the cut to the dryer's window lands on), in a faint corona. The arc
# rises from the +x side; turn the component (yaw) to put the sun where the shot wants it. Rig: "height" lowers the
# disc along its arc from 62 degrees to 6 (noon to golden hour: the agent's steps, a beat each). In the scene: the
# DirectionalLight aims from the disc at the pivot (parts/canyon.tsx canyonSun) and material sun_disc's glow goes
# from white to gold as it lowers.
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, bmesh, bpy

col, root = comp.fresh("sun")
disc_m = comp.mat("sun_disc", (1.0, 0.9, 0.7), rough=1.0, emit=(1.0, 0.86, 0.62), strength=float(os.environ.get("CANYON_SUN", "40000")))
corona_m = comp.mat("sun_corona", (1.0, 0.8, 0.5), rough=1.0, emit=(1.0, 0.7, 0.4), strength=2.0, alpha=0.18)
ARM = 40.0
arm = comp.pivot(col, root, "sun_arm", (0, 0, 0))
arm.rotation_euler[1] = math.radians(-62)
bpy.context.view_layer.update()
at = arm.matrix_world @ L.Vector((ARM, 0, 0))
b = bmesh.new()
bmesh.ops.create_uvsphere(b, u_segments=48, v_segments=24, radius=1.2)
bmesh.ops.translate(b, vec=at, verts=b.verts)
comp.mesh(col, root, "sun_disc", b, disc_m, parent=arm, smooth=True)
# the corona: a flat ring of three bands facing the pivot, behind the disc
c = bmesh.new()
bmesh.ops.create_circle(c, cap_ends=True, cap_tris=True, segments=64, radius=3.0)
bmesh.ops.rotate(c, verts=c.verts, cent=(0, 0, 0), matrix=L.Matrix.Rotation(math.radians(90), 3, "Y"))
bmesh.ops.translate(c, vec=(ARM + 1.3, 0, 0), verts=c.verts)
bmesh.ops.transform(c, matrix=arm.matrix_world, verts=c.verts)
comp.mesh(col, root, "sun_corona", c, corona_m, parent=arm)
comp.channel("height", [(arm, "rotation_euler", 1, math.radians(-62), math.radians(-6))])
comp.export(col, root, L.PLACE, "sun", made="blender/components/canyon/sun.py", source="own geometry", license="ours", credit="",
            rig={"height": "the disc lowers along its arc about the pivot (sun_arm), from 62 degrees up to 6",
                 "light": "in the scene: the DirectionalLight aims from the disc at the pivot; material sun_disc goes white to gold"})
