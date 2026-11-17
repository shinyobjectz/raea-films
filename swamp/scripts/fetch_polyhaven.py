#!/usr/bin/env python3
"""Fetch CC0 assets from Poly Haven by id, with a licence sidecar beside each.
usage: fetch_polyhaven.py model ID[:RES] ...   -> assets/models/ID/ID.gltf (+ .bin, textures/)
       fetch_polyhaven.py texture ID[:RES] ... -> assets/textures/ID/{diff,nor_gl,arm}.jpg
       fetch_polyhaven.py hdri ID[:RES] ...    -> assets/hdri/ID.hdr
RES is 1k by default. Files already on disk at the listed size are kept."""
import json, os, sys, urllib.request
UA = {"User-Agent": "raea-asset-fetch/0.1"}
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120)
def save(url, path, size):
    if os.path.exists(path) and os.path.getsize(path) == size:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with get(url) as r, open(path + ".part", "wb") as f:
        while True:
            b = r.read(1 << 20)
            if not b: break
            f.write(b)
    os.replace(path + ".part", path)
    print("  got", os.path.relpath(path, ROOT), size, flush=True)
def sidecar(path, id):
    info = json.load(get(f"https://api.polyhaven.com/info/{id}"))
    json.dump({"source": f"https://polyhaven.com/a/{id}", "license": "CC0", "credit": "", "authors": list(info.get("authors", {}).keys())}, open(path + ".json", "w"), indent=1)
kind, ids = sys.argv[1], sys.argv[2:]
for spec in ids:
    id, _, res = spec.partition(":"); res = res or "1k"
    files = json.load(get(f"https://api.polyhaven.com/files/{id}"))
    print(id, res, flush=True)
    if kind == "model":
        g = files["gltf"][res]["gltf"]
        d = os.path.join(ROOT, "models", id)
        main = os.path.join(d, id + ".gltf")
        save(g["url"], main, g["size"])
        for rel, inc in g.get("include", {}).items():
            save(inc["url"], os.path.join(d, rel), inc["size"])
        sidecar(main, id)
    elif kind == "hdri":
        h = files["hdri"][res]["hdr"]
        main = os.path.join(ROOT, "hdri", id + ".hdr")
        save(h["url"], main, h["size"])
        sidecar(main, id)
    else:
        d = os.path.join(ROOT, "textures", id)
        for m, key in (("diff", "Diffuse"), ("nor_gl", "nor_gl"), ("arm", "arm"), ("disp", "Displacement")):
            ent = files.get(key) or files.get(m)
            if not ent or res not in ent: continue
            j = ent[res].get("jpg") or ent[res].get("png")
            ext = "jpg" if "jpg" in ent[res] else "png"
            save(j["url"], os.path.join(d, f"{m}.{ext}"), j["size"])
        sidecar(os.path.join(d, "diff.jpg"), id)
print("done")
