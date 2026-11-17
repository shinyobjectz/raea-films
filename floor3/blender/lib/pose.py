# Posing the MakeHuman body (psx people/pavel) by where its limbs point. This export's skeleton is flat (no bone has a
# parent, every bone's tail points straight up), so a limb's direction is read from its child joint and the hierarchy a
# turn carries is written out here.
import bpy
from mathutils import Vector, Matrix

PARENT = {"spine_01": "pelvis", "spine_02": "spine_01", "spine_03": "spine_02", "neck_01": "spine_03", "head": "neck_01"}
for _s in ("l", "r"):
    PARENT.update({f"clavicle_{_s}": "spine_03", f"upperarm_{_s}": f"clavicle_{_s}", f"lowerarm_{_s}": f"upperarm_{_s}", f"hand_{_s}": f"lowerarm_{_s}",
                   f"thigh_{_s}": "pelvis", f"calf_{_s}": f"thigh_{_s}", f"foot_{_s}": f"calf_{_s}", f"ball_{_s}": f"foot_{_s}"})
    for _f in ("thumb", "index", "middle", "ring", "pinky"):
        PARENT[f"{_f}_01_{_s}"] = f"hand_{_s}"
        PARENT[f"{_f}_02_{_s}"] = f"{_f}_01_{_s}"
        PARENT[f"{_f}_03_{_s}"] = f"{_f}_02_{_s}"

def below(name):
    """a bone and every bone it carries"""
    out = [name]
    for c, p in PARENT.items():
        if p == name:
            out += below(c)
    return out

def limb(arm, pb, child):
    """the bone's limb as it now points, in armature space: toward its child joint (or its rest up, for a tip)"""
    if child:
        return (arm.pose.bones[child].head - pb.head).normalized()
    rest = pb.bone.matrix_local.to_3x3().inverted() @ Vector((0, 0, 1))
    return (pb.matrix.to_3x3() @ rest).normalized()

def turn_about(arm, name, q):
    """turn a bone and all it carries by world rotation q about its head"""
    bpy.context.view_layer.update()
    h = arm.pose.bones[name].head.copy()
    m = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h)
    mats = {n: arm.pose.bones[n].matrix.copy() for n in below(name) if n in arm.pose.bones}
    for n, mm in mats.items():
        arm.pose.bones[n].matrix = m @ mm
        bpy.context.view_layer.update()

def aim(arm, name, child, want):
    """turn pose bone `name`, and all it carries, about its head so its limb points along `want` (Blender world: z up,
    the body faces -y)"""
    bpy.context.view_layer.update()
    pb = arm.pose.bones[name]
    w = (arm.matrix_world.to_3x3().inverted() @ Vector(want)).normalized()
    turn_about(arm, name, limb(arm, pb, child).rotation_difference(w))
