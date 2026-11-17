# garage/security-camera: a CCTV camera in its weather housing on a wall bracket (Poly Haven's security_camera_01,
# CC0), 0.55 m long, the bracket's plate at y 0 and its lens toward -y. A wall item. Rig: its aim is the Model's turn
# in the scene (the asset is one mesh).
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _lib as L
from _lib import comp, T, R, S, xf, bpy, bmesh, Vector

col, root, parts, credit = comp.ph_component("garage", "security_camera", "security_camera_01", res="1k", origin="back")
L.look(col, "security-camera", lens=50)
comp.export(col, root, "garage", "security_camera", made="blender/components/garage/security_camera.py", source="https://polyhaven.com/a/security_camera_01", license="CC0", credit=credit,
            rig={"aim": "in the scene: the Model's own turn (the asset is one mesh)"})
