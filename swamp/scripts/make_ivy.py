#!/usr/bin/env python3
"""Ivy over the monitor, from scanned ivy leaves (ambientCG LeafSet029, CC0): woody stems that climb the bezel's left
side and run along its top, and the leaves on them in clusters that can come in one by one.
Writes assets/models/ivy/ivy.stems.gltf, ivy.cN.gltf and components/ivy-data.ts. Monitor-local metres."""
import base64, json, math, os, random, struct
import numpy as np
random.seed(11); R = random.random
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BW, BH, BD = 4.36, 2.61, 0.3
ZF = BD / 2
def nrm(v):
    v = np.array(v, float); return v / (np.linalg.norm(v) + 1e-9)

# ---- vines: lists of (point, surface normal)
vines = []
def walk(p, d, n, length, clamp, step=0.02, wander=0.5, grav=0.0):
    pts = []; p = np.array(p, float); d = nrm(d); n = nrm(n); t = 0; ph = R() * 6.28
    while t < length:
        pts.append((p.copy(), n.copy()))
        side = np.cross(n, d)
        d = nrm(d + side * wander * 0.22 * math.sin(ph + t * (7 + R() * 2)) + side * (R() - 0.5) * 0.7 + np.array([0, -grav, 0]))
        d = nrm(d - n * d.dot(n))
        q = p + d * step; p = clamp(q); t += step
        hit = np.abs(q - p) > 1e-9
        if hit.any(): d = nrm(np.where(hit, -d, d) + side * (R() - 0.5))  # turned back by the strip's edge
    return pts
def box(lo, hi):
    lo = np.array(lo, float); hi = np.array(hi, float)
    return lambda p: np.minimum(np.maximum(p, lo), hi)
X0 = -BW / 2
front_left = box([X0 + 0.015, -BH / 2, ZF], [X0 + 0.17, BH / 2 - 0.02, ZF])
front_top = box([X0 + 0.015, BH / 2 - 0.165, ZF], [BW / 2 - 0.02, BH / 2 - 0.02, ZF])
side_left = box([X0, -BH / 2, -0.13], [X0, BH / 2 - 0.03, 0.13])
top = box([X0 + 0.03, BH / 2, -0.13], [BW / 2 - 0.03, BH / 2, 0.13])
front_right = box([BW / 2 - 0.17, -BH / 2, ZF], [BW / 2 - 0.015, BH / 2, ZF])
front_bottom = box([X0 + 0.015, -BH / 2, ZF], [BW / 2, -BH / 2 + 0.16, ZF])
hangs = []
for i in range(15):  # up the front's left strip, then along the top strip
    x = X0 + 0.02 + R() * 0.14
    h = BH * (0.55 + 0.45 * R()) if i > 5 else BH
    v = walk([x, -BH / 2, ZF], [0, 1, 0], [0, 0, 1], h - 0.06, front_left)
    if h >= BH * 0.93:
        v += walk(v[-1][0] + np.array([0.02, 0, 0]), [1, 0.1, 0], [0, 0, 1], 0.4 + R() * R() * 3.0, front_top, wander=0.35)
    vines.append(v)
for i in range(10):  # up the left side face, then across the top face
    z = -0.1 + R() * 0.2
    v = walk([X0, -BH / 2, z], [0, 1, 0], [-1, 0, 0], BH - 0.05, side_left)
    run = walk([X0 + 0.04, BH / 2, v[-1][0][2]], [1, 0, 0.1], [0, 1, 0], 0.5 + R() * 3.2, top, wander=0.4)
    v += run; vines.append(v)
    for k in range(1 + int(R() * 3)):  # strands that hang over the front edge
        q = run[int(R() * (len(run) - 1))][0]
        ln = (0.1 + R() * 0.2) if q[0] < -0.9 else (0.06 + R() * 0.1)
        x = q[0]
        hangs.append(walk([x, BH / 2 - 0.01, ZF + 0.012], [0, -1, 0], [0, 0, 1], ln, box([x - 0.05, -9, ZF + 0.012], [x + 0.05, 9, ZF + 0.012]), wander=0.25, grav=0.3))
for i in range(4):  # a few starting up the right strip, and along the bottom from the left
    vines.append(walk([BW / 2 - 0.03 - R() * 0.13, -BH / 2, ZF], [0, 1, 0], [0, 0, 1], 0.3 + R() * 0.9, front_right))
for i in range(3):
    vines.append(walk([X0 + 0.1, -BH / 2 + 0.03 + R() * 0.1, ZF], [1, 0, 0], [0, 0, 1], 0.4 + R() * 1.3, front_bottom, wander=0.3))
vines += hangs

# ---- mesh helpers
def tube(pts, r0, r1, sides=5):
    V, N, I = [], [], []
    n = len(pts)
    for i, (p, sn) in enumerate(pts):
        d = nrm(pts[min(i + 1, n - 1)][0] - pts[max(i - 1, 0)][0]); a = nrm(np.cross(d, sn)); b = np.cross(d, a)
        r = r0 + (r1 - r0) * i / max(1, n - 1); c = p + sn * (r + 0.001)
        for k in range(sides):
            th = 6.2832 * k / sides; o = a * math.cos(th) + b * math.sin(th)
            V.append(c + o * r); N.append(o)
    for i in range(n - 1):
        for k in range(sides):
            a0 = i * sides + k; a1 = i * sides + (k + 1) % sides; b0 = a0 + sides; b1 = a1 + sides
            I += [a0, a1, b0, a1, b1, b0]
    return np.array(V), np.array(N), np.array(I)
GU, GV = 5, 4
def leaf(base, T, S, Nl, size, cell):
    cx, cy = cell % 3, cell // 3
    V, UV = [], []
    for i in range(GU):
        for j in range(GV):
            u = i / (GU - 1); v = j / (GV - 1)
            h = 0.22 * abs(v - 0.5) - 0.3 * (u - 0.1) ** 2
            V.append(base + T * ((u - 0.1) * size) + S * ((v - 0.5) * size) + Nl * (h * size))
            UV.append([(cx + u) / 3, (cy + v) / 3])
    V = np.array(V); I = []
    for i in range(GU - 1):
        for j in range(GV - 1):
            a = i * GV + j; b = a + 1; c = a + GV; d = c + 1
            I += [a, c, b, b, c, d]
    Nn = np.zeros_like(V)
    for t in range(0, len(I), 3):
        a, b, c = I[t:t + 3]; fn = np.cross(V[b] - V[a], V[c] - V[a]); Nn[[a, b, c]] += fn
    Nn = np.array([nrm(x) for x in Nn])
    if Nn.sum(axis=0).dot(Nl) < 0: Nn = -Nn
    return V, Nn, np.array(UV), np.array(I)

def gltf(path, V, N, I, UV=None, mat=None):
    V = V.astype("<f4"); N = N.astype("<f4"); I = I.astype("<u4")
    blobs = [V.tobytes(), N.tobytes(), I.tobytes()] + ([UV.astype("<f4").tobytes()] if UV is not None else [])
    buf = b"".join(blobs); views = []; off = 0
    for b in blobs: views.append({"buffer": 0, "byteOffset": off, "byteLength": len(b)}); off += len(b)
    acc = [
        {"bufferView": 0, "componentType": 5126, "count": len(V), "type": "VEC3", "min": V.min(0).tolist(), "max": V.max(0).tolist()},
        {"bufferView": 1, "componentType": 5126, "count": len(N), "type": "VEC3"},
        {"bufferView": 2, "componentType": 5125, "count": len(I), "type": "SCALAR"},
    ]
    attrs = {"POSITION": 0, "NORMAL": 1}
    if UV is not None: acc.append({"bufferView": 3, "componentType": 5126, "count": len(UV), "type": "VEC2"}); attrs["TEXCOORD_0"] = 3
    g = {"asset": {"version": "2.0", "generator": "make_ivy.py"}, "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0}],
         "meshes": [{"primitives": [{"attributes": attrs, "indices": 2, "material": 0}]}], "materials": [mat], "accessors": acc, "bufferViews": views,
         "buffers": [{"byteLength": len(buf), "uri": "data:application/octet-stream;base64," + base64.b64encode(buf).decode()}]}
    if UV is not None:
        g["textures"] = [{"source": 0, "sampler": 0}]; g["images"] = [{"uri": "ivy_leaves.png"}]; g["samplers"] = [{"magFilter": 9729, "minFilter": 9987}]
    json.dump(g, open(path, "w"))

out = os.path.join(root, "assets/models/ivy")
for f in os.listdir(out):
    if f.endswith(".gltf"): os.remove(os.path.join(out, f))
# stems
SV, SN, SI = [], [], []; base = 0
for v in vines:
    V, N, I = tube(v[::2] if len(v) > 4 else v, 0.0055 if len(v) > 40 else 0.003, 0.0018)
    SV.append(V); SN.append(N); SI.append(I + base); base += len(V)
gltf(os.path.join(out, "ivy.stems.gltf"), np.concatenate(SV), np.concatenate(SN), np.concatenate(SI),
     mat={"name": "ivy_stem", "pbrMetallicRoughness": {"baseColorFactor": [0.16, 0.12, 0.09, 1], "metallicFactor": 0, "roughnessFactor": 0.9}})
# leaves, in clusters along each vine
LEAF = {"name": "ivy_leaf", "doubleSided": True, "alphaMode": "MASK", "alphaCutoff": 0.5,
        "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "metallicFactor": 0, "roughnessFactor": 0.55}}
clusters = []; CH = 22; total = 0
for vi, v in enumerate(vines):
    along0 = 0.0 if vi < len(vines) - len(hangs) else 0.75  # hanging strands come last
    for c0 in range(0, len(v), CH):
        seg = v[c0:c0 + CH]
        if len(seg) < 3: continue
        centre = seg[len(seg) // 2][0] + seg[len(seg) // 2][1] * 0.006
        LV, LN, LU, LI = [], [], [], []; b = 0
        for i in range(0, len(seg)):
            if R() < 0.25: continue
            p, sn = seg[i]; d = nrm(seg[min(i + 1, len(seg) - 1)][0] - seg[max(i - 1, 0)][0])
            for sgn in ((1, -1) if R() < 0.55 else ((1,) if (c0 + i) % 4 < 2 else (-1,))):
                side = np.cross(sn, d) * sgn
                if abs(sn[1]) > 0.5:  # on the top: leaves lie out flat-ish, lifted
                    T = nrm(side * 0.9 + d * (R() - 0.5) + np.array([0, 0.25 + R() * 0.3, 0]))
                else:  # on a wall: they hang tip-down and stand off it
                    T = nrm(side * (0.2 + R() * 1.0) + np.array([0, -0.25 - R() * 0.8, 0]) + sn * (0.15 + R() * 0.5) + d * (R() - 0.5) * 1.4)
                Nl = nrm(sn + np.array([R() - 0.5, R() - 0.5, R() - 0.5]) * 0.5)
                S = nrm(np.cross(Nl, T)); Nl = np.cross(T, S)
                size = 0.035 + R() * R() * 0.075
                cell = int(R() * 7) if R() > 0.05 else 7 + int(R() * 2)
                V, N, UV, I = leaf(p + sn * (0.008 + R() * 0.02) + side * (0.005 + R() * 0.03) - centre, T, S, Nl, size, cell)
                LV.append(V); LN.append(N); LU.append(UV); LI.append(I + b); b += len(V); total += 1
        name = f"ivy.c{len(clusters)}.gltf"
        gltf(os.path.join(out, name), np.concatenate(LV), np.concatenate(LN), np.concatenate(LI), np.concatenate(LU), LEAF)
        h = (centre[1] + BH / 2) / BH
        clusters.append({"p": [round(float(x), 4) for x in centre], "at": round(min(0.62, along0 * 0.6 + 0.12 + 0.3 * h + 0.2 * (c0 / 400) + R() * 0.06), 3)})
ts = "// generated by scripts/make_ivy.py: where each cluster of ivy leaves sits on the monitor, and how far into the growth it comes in\n"
ts += "export const IVY: { p: [number, number, number]; at: number }[] = " + json.dumps(clusters) + ";\n"
open(os.path.join(root, "components/ivy-data.ts"), "w").write(ts)
json.dump({"source": "generated by scripts/make_ivy.py from ambientCG LeafSet029 leaf scans", "license": "CC0", "url": "https://ambientcg.com/a/LeafSet029"}, open(os.path.join(out, "ivy.json"), "w"))
print(len(vines), "vines", len(clusters), "clusters", total, "leaves")
