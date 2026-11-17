#!/bin/bash
# A soft prop made by us: our drawing (tools/art.sh idol-NAME) -> Idol's Gaussian splat, run locally (the 8-bit MLX
# bundle behind mlx-serve, port 11399) -> a solid carved from the splat's own depth (sheet3d's splat_mesh.py) -> the
# game asset (blender/idolmesh.py: real height, budget, UVs, baked colour) at assets/models/f3/NAME.glb.
#   tools/idol.sh NAME HEIGHT_M [FACES] [TURN_DEG]       (needs the server: mlx-serve serve --model-dir
#                                                         ~/.cache/raea-idol/models --port 11399)
# The splat and the carve use the sheet3d venv (Idol's tooling is Python by nature).
set -euo pipefail
cd "$(dirname "$0")/.."
S=$PROJECTS/sheet3d; PY=$S/.venv/bin/python
n=$1; h=$2; faces=${3:-12000}; turn=${4:-0}
img=$(ls .cache/art/idol-$n/out.* | head -1)
d=.cache/idol/$n; mkdir -p "$d"
[ -s "$d/splat.glb" ] || "$PY" "$S/tools/idol_serve.py" "$img" "$d/splat.glb" --url http://127.0.0.1:11399 --steps 100 --gaussians 1048576 --geometry splat
# the splat's centres, colours and opacities, its largest extent made 1, so the carve's voxel grid stays near 200 a side
# (by height alone a flat thing like a folded cardigan spans a thousand voxels across and the carve takes 20 GB)
"$PY" - "$d" <<'PY'
import sys, json, numpy as np
d = sys.argv[1]; glb = open(f"{d}/splat.glb", "rb").read()
n = int.from_bytes(glb[12:16], "little"); doc = json.loads(glb[20:20 + n]); base = 20 + n + 8
T = {5126: np.float32, 5121: np.uint8, 5123: np.uint16}; K = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}
def read(i):
    a = doc["accessors"][i]; bv = doc["bufferViews"][a["bufferView"]]; dt, c = np.dtype(T[a["componentType"]]), K[a["type"]]
    st = bv.get("byteStride") or dt.itemsize * c
    raw = np.frombuffer(glb, np.uint8, a["count"] * st, base + bv.get("byteOffset", 0) + a.get("byteOffset", 0)).reshape(a["count"], st)
    x = raw[:, :dt.itemsize * c].copy().view(dt).reshape(a["count"], c).astype(np.float64)
    return x / np.iinfo(dt).max if a.get("normalized") else x
at = doc["meshes"][0]["primitives"][0]["attributes"]
P, C = read(at["POSITION"]), np.clip(read(at["COLOR_0"])[:, :3], 0, 1)
op = read(at["KHR_gaussian_splatting:OPACITY"])[:, 0]
s = op > 0.5
k = 1.0 / max(np.percentile(P[s, i], 99.8) - np.percentile(P[s, i], 0.2) for i in range(3))
np.savez(f"{d}/splat.npz", xyz=P * k, rgb=C, opacity=op)
print(f"{len(P)} gaussians, {s.sum()} opaque")
PY
"$PY" "$S/tools/splat_mesh.py" "$d/splat.npz" "$d/raw.glb" --voxel 0.005
raea blender run blender/idolmesh.py "$d/raw.glb" "$n" --h "$h" --faces "$faces" --turn "$turn"
