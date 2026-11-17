#!/usr/bin/env python3
"""Single leaves for the burst in 25-crack (v5, note 9), from the same scanned ivy leaves as the monitor's ivy (ambientCG
LeafSet029, CC0, assets/textures/LeafSet029), tinted lighter: one leaf a file, each a cell of
the 3x3 sheet, a metre long (scaled to its size where it's placed), centred, its tip along +x, its face up (+y), curled
a little across and along as a fallen leaf is. Writes assets/models/leafburst/leaf.cN.gltf and their sheet, leaves.png.

  /tmp/ivyenv/bin/python -I scripts/make_leafburst.py
"""
import base64
import json
import os

import numpy as np

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
out = os.path.join(root, "assets", "models", "leafburst")
os.makedirs(out, exist_ok=True)
# the sheet: LeafSet029's scans (grey, with their veins and blemishes) tinted as torn living leaves, lighter than the
# monitor's ivy (tinted for leaves in shade, they read as black flakes against the pit's light): greens from deep to
# yellow, the last two cells (the broken leaves) dry brown. Linear albedo about 0.08-0.2, as fresh leaves are
from PIL import Image  # noqa: E402

LS = os.path.join(root, "assets", "textures", "LeafSet029")
col = np.asarray(Image.open(os.path.join(LS, "LeafSet029_2K-JPG_Color.jpg")).convert("L").resize((1024, 1024), Image.LANCZOS), float) / 255
alpha = np.asarray(Image.open(os.path.join(LS, "LeafSet029_2K-JPG_Opacity.jpg")).convert("L").resize((1024, 1024), Image.LANCZOS), np.uint8)
TINTS = [(0.36, 0.5, 0.16), (0.3, 0.46, 0.14), (0.42, 0.52, 0.17), (0.33, 0.44, 0.12), (0.46, 0.55, 0.2), (0.28, 0.4, 0.13), (0.4, 0.48, 0.15), (0.5, 0.38, 0.2), (0.44, 0.34, 0.18)]
rgb = np.zeros((1024, 1024, 3))
for c, t in enumerate(TINTS):
    cx, cy = c % 3, c // 3
    sl = (slice(cy * 341, (cy + 1) * 341 + (1 if cy == 2 else 0)), slice(cx * 341, (cx + 1) * 341 + (1 if cx == 2 else 0)))
    cell, a = col[sl], alpha[sl] > 127
    m = cell[a].mean() if a.any() else 0.5
    rgb[sl] = np.clip(np.array(t)[None, None, :] * (cell / m)[..., None], 0, 1)
Image.fromarray(np.dstack([(rgb * 255).round().astype(np.uint8), alpha]), "RGBA").save(os.path.join(out, "leaves.png"))

GU, GV = 7, 5


def leaf(cell, curl, cup):
    """make_ivy.py's leaf, finer, centred: the cell's picture on a sheet curled `curl` along and cupped `cup` across"""
    cx, cy = cell % 3, cell // 3
    V, UV = [], []
    for i in range(GU):
        for j in range(GV):
            u = i / (GU - 1)
            v = j / (GV - 1)
            h = cup * (v - 0.5) ** 2 - curl * (u - 0.4) ** 2
            V.append([u - 0.5, h, v - 0.5])
            UV.append([(cx + u) / 3, (cy + v) / 3])
    V = np.array(V)
    I = []
    for i in range(GU - 1):
        for j in range(GV - 1):
            a = i * GV + j
            b, c = a + 1, a + GV
            d = c + 1
            # wound so the front face is the face (+y) the normals point out of: a double-sided material flips the
            # normal on the back face by its winding, and with the two disagreeing every leaf faced away from whoever
            # looked at it and rendered black
            I += [a, b, c, b, d, c]
    N = np.zeros_like(V)
    for t in range(0, len(I), 3):
        a, b, c = I[t:t + 3]
        N[[a, b, c]] += np.cross(V[b] - V[a], V[c] - V[a])
    N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-9
    assert N[:, 1].min() > 0, "the leaf's normals should all face up, with its winding"
    return V, N, np.array(UV), np.array(I)


def gltf(path, V, N, I, UV):
    V = V.astype("<f4"); N = N.astype("<f4"); I = I.astype("<u4"); UV = UV.astype("<f4")
    blobs = [V.tobytes(), N.tobytes(), I.tobytes(), UV.tobytes()]
    buf = b"".join(blobs)
    views, off = [], 0
    for b in blobs:
        views.append({"buffer": 0, "byteOffset": off, "byteLength": len(b)})
        off += len(b)
    acc = [
        {"bufferView": 0, "componentType": 5126, "count": len(V), "type": "VEC3", "min": V.min(0).tolist(), "max": V.max(0).tolist()},
        {"bufferView": 1, "componentType": 5126, "count": len(N), "type": "VEC3"},
        {"bufferView": 2, "componentType": 5125, "count": len(I), "type": "SCALAR"},
        {"bufferView": 3, "componentType": 5126, "count": len(UV), "type": "VEC2"},
    ]
    mat = {"name": "leaf", "doubleSided": True, "alphaMode": "MASK", "alphaCutoff": 0.5,
           "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "metallicFactor": 0, "roughnessFactor": 0.6}}
    g = {"asset": {"version": "2.0", "generator": "make_leafburst.py"}, "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0}],
         "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1, "TEXCOORD_0": 3}, "indices": 2, "material": 0}]}],
         "materials": [mat], "accessors": acc, "bufferViews": views,
         "textures": [{"source": 0, "sampler": 0}], "images": [{"uri": "leaves.png"}], "samplers": [{"magFilter": 9729, "minFilter": 9987}],
         "buffers": [{"byteLength": len(buf), "uri": "data:application/octet-stream;base64," + base64.b64encode(buf).decode()}]}
    json.dump(g, open(path, "w"))


rng = np.random.default_rng(29)
for c in range(9):
    V, N, UV, I = leaf(c, 0.12 + 0.18 * rng.random(), 0.15 + 0.2 * rng.random())
    gltf(os.path.join(out, f"leaf.c{c}.gltf"), V, N, I, UV)
json.dump({"source": "generated by scripts/make_leafburst.py from ambientCG LeafSet029 leaf scans", "license": "CC0", "url": "https://ambientcg.com/a/LeafSet029"}, open(os.path.join(out, "leafburst.json"), "w"))
print("9 leaves in", out)
