# cottage/_mats: what the cottage's components share of their materials.
import os
import bpy


def brightened(m, mean):
    """the material's colour image (greyed by comp.ph_texture), scaled so its mean (as stored, sRGB) is `mean`. The
    planks' own grey is dark: a stain tinted over it went near black in the film's light. The tint over it is then the
    stain's own colour."""
    import numpy as np
    t = next(n for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and n.image.colorspace_settings.name == "sRGB")
    src = bpy.path.abspath(t.image.filepath_raw)
    out = os.path.splitext(src)[0] + f"_mean{int(mean * 100)}.png"
    if not os.path.isfile(out):
        im = bpy.data.images.load(src)
        px = np.empty(im.size[0] * im.size[1] * 4, dtype=np.float32)
        im.pixels.foreach_get(px)
        px = px.reshape(-1, 4)
        k = mean / max(1e-3, float(px[:, :3].mean()))
        px[:, :3] = np.clip(px[:, :3] * k, 0, 1)
        im.pixels.foreach_set(px.ravel())
        im.filepath_raw = out
        im.file_format = "PNG"
        im.save()
        bpy.data.images.remove(im)
    t.image = bpy.data.images.load(out, check_existing=True)
    t.image.colorspace_settings.name = "sRGB"
    return m
