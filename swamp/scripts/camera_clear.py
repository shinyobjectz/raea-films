#!/usr/bin/env python3
"""Every scanned prop on the ground (components/world.tsx ROCKS) against every shot's camera path (components/take.ts
SHOTS2, the shots whose camera is written as numbers): the nearest the lens comes to any vertex of each prop's scanned
mesh, turned and scaled as placed. A lens within 0.25 m of a prop's surface is reported (the near plane cuts it, or
it fills the frame as a dark blur).

  /tmp/ivyenv/bin/python -I scripts/camera_clear.py
"""
import json, math, os, re
import numpy as np

PROJ = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
src = open(os.path.join(PROJ, "components", "world.tsx")).read()
rocks = re.findall(r'\{ src: m\("([a-z0-9_]+)"(?:, (\d+))?\), p: \[([^\]]+)\], r: \[([^\]]+)\], s: ([^}]+?) \}', src)
take = open(os.path.join(PROJ, "components", "take.ts")).read()
num = r"\[(-?[\d.]+), (-?[\d.]+), (-?[\d.]+)\]"
shots = re.findall(r'\{ id: "([^"]+)", from: (\d+), to: (\d+), p0: ' + num + ", p1: " + num, take)


def bounds(path):
    g = json.load(open(path))
    lo, hi = np.full(3, 1e9), np.full(3, -1e9)
    for mesh in g["meshes"]:
        for pr in mesh["primitives"]:
            a = g["accessors"][pr["attributes"]["POSITION"]]
            lo, hi = np.minimum(lo, a["min"]), np.maximum(hi, a["max"])
    return lo, hi


def node_matrix(n):
    if "matrix" in n:
        return np.array(n["matrix"], float).reshape(4, 4).T
    t = np.array(n.get("translation", [0, 0, 0]), float)
    x, y, z, w = n.get("rotation", [0, 0, 0, 1])
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4)
    M[:3, :3] = R * np.array(n.get("scale", [1, 1, 1]), float)
    M[:3, 3] = t
    return M


def verts(path):
    """every vertex of the file's scene, through its node transforms"""
    g = json.load(open(path))
    cache = {}

    def mesh_verts(mi):
        if mi not in cache:
            out = []
            for pr in g["meshes"][mi]["primitives"]:
                a = g["accessors"][pr["attributes"]["POSITION"]]
                bv = g["bufferViews"][a["bufferView"]]
                raw = open(os.path.join(os.path.dirname(path), g["buffers"][bv["buffer"]]["uri"]), "rb").read()
                off = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
                out.append(np.frombuffer(raw, dtype=np.float32, count=a["count"] * 3, offset=off).reshape(-1, 3).astype(np.float64))
            cache[mi] = np.concatenate(out)
        return cache[mi]

    out = []

    def walk(ni, M):
        n = g["nodes"][ni]
        M = M @ node_matrix(n)
        if "mesh" in n:
            v = mesh_verts(n["mesh"])
            out.append(v @ M[:3, :3].T + M[:3, 3])
        for c in n.get("children", []):
            walk(c, M)

    for ni in g["scenes"][g.get("scene", 0)]["nodes"]:
        walk(ni, np.eye(4))
    return np.concatenate(out)


def rot(rx, ry, rz):
    # XYZ Euler as Quat.fromEuler("XYZ"): R = Rx Ry Rz
    cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Rx @ Ry @ Rz


props = []
for i, (mid, part, p, r, s) in enumerate(rocks):
    path = os.path.join(PROJ, "assets", "models", mid, f"{mid}.{part or 'cut'}.gltf")
    v = verts(path)
    s = s.strip()
    sc = np.array(json.loads(s)) if s.startswith("[") else np.full(3, float(s))
    P, R = np.array([float(x) for x in p.split(",")]), rot(*[float(x) for x in r.split(",")])
    props.append((f"ground-{i} {mid}", (R @ (v * sc).T).T + P))

bad = 0
for sid, a, b, *xyz in shots:
    p0, p1 = np.array(xyz[:3], float), np.array(xyz[3:], float)
    cams = p0 + (p1 - p0) * np.linspace(0, 1, 41)[:, None]
    for name, W in props:
        best, at = 9e9, 0.0
        for k, c in enumerate(cams):
            d = float(np.sqrt(((W - c) ** 2).sum(1).min()))
            if d < best:
                best, at = d, k / 40
        if best < 0.25:
            bad += 1
            print(f"{sid}: the lens comes within {best:.2f} m of {name}'s surface, {at:.0%} through the shot")
print(f"{len(shots)} shots against {len(props)} props: {bad} too close")
