#!/usr/bin/env python3
"""Fetch the sampled instruments the score plays into assets/instruments/<name>/.

Only the articulations the score uses are fetched (a few hundred MB, not the whole libraries).
Run: python3 -I scripts/fetch_instruments.py     (stdlib only; a file already there is kept)

Sources (fetched 2026-11-16):
  vsco2-ce    Versilian Studios Chamber Orchestra 2 Community Edition, CC0 1.0
              https://github.com/sgossner/VSCO-2-CE
  salamander  Salamander Grand Piano V3 (Alexander Holm), CC BY 3.0
              https://github.com/sfzinstruments/SalamanderGrandPiano
"""
import json, os, sys, urllib.request, urllib.parse, concurrent.futures as cf

UA = "raea-asset-fetch/0.1"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "instruments")
DATE = "2026-11-16"

VSCO_DIRS = [
    "Strings/Violin Section/susVib", "Strings/Viola Section/susvib", "Strings/Cello Section/susvib",
    "Strings/Solo Contrabass/SusVib", "Strings/Cello Section/pizzT", "Strings/Viola Section/pizz",
    "Strings/Cello Section/spic", "Strings/Viola Section/spic",
    "Brass/F Horn/sus", "Strings/Harp", "Percussion/Timpani",
]
SAL_LAYERS = (1, 4, 7, 10)  # of 16; the score never plays louder than mezzo-forte


def get(url, binary=True):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def tree(repo):
    return json.loads(get("https://api.github.com/repos/%s/git/trees/master?recursive=1" % repo))["tree"]


def fetch(repo, path, dest, size):
    if os.path.exists(dest) and os.path.getsize(dest) == size:
        return 0
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    data = get("https://raw.githubusercontent.com/%s/master/%s" % (repo, urllib.parse.quote(path)))
    if len(data) != size:
        raise IOError("%s: got %d bytes, the tree says %d" % (path, len(data), size))
    with open(dest + ".part", "wb") as f:
        f.write(data)
    os.replace(dest + ".part", dest)
    return size


def run(repo, name, keep, extra, sidecar):
    out = os.path.join(ROOT, name)
    jobs = []
    for t in tree(repo):
        if t["type"] != "blob":
            continue
        p = t["path"]
        if p in extra or keep(p):
            jobs.append((repo, p, os.path.join(out, p), t["size"]))
    total = 0
    with cf.ThreadPoolExecutor(6) as ex:
        for i, n in enumerate(ex.map(lambda j: fetch(*j), jobs)):
            total += n
            if i % 25 == 0:
                print("%s %d/%d  %.0f MB fetched" % (name, i, len(jobs), total / 1e6), flush=True)
    with open(os.path.join(out, "SOURCE.txt"), "w") as f:
        f.write(sidecar)
    print("%s: %d files, %.0f MB new" % (name, len(jobs), total / 1e6), flush=True)


def main():
    run("sgossner/VSCO-2-CE", "vsco2-ce",
        lambda p: p.lower().endswith(".wav") and os.path.dirname(p) in VSCO_DIRS,
        ("LICENSE", "README.md", "Readme.txt"),
        "Versilian Studios Chamber Orchestra 2: Community Edition (VSCO-2 CE)\n"
        "Source: https://github.com/sgossner/VSCO-2-CE (raw WAV samples, master branch)\n"
        "Licence: CC0 1.0 Universal (public domain); see LICENSE here\n"
        "Fetched: %s\n"
        "Subset: only these folders: %s\n" % (DATE, "; ".join(VSCO_DIRS)))
    lay = tuple("v%d.flac" % v for v in SAL_LAYERS)
    run("sfzinstruments/SalamanderGrandPiano", "salamander",
        lambda p: p.startswith("Samples/") and p[8:9] in "ACDF" and p.endswith(lay)
        and not p.startswith(("Samples/harm", "Samples/rel", "Samples/pedal")),
        ("LICENSE", "README.md", "Salamander Grand Piano V3.sfz"),
        "Salamander Grand Piano V3 (Yamaha C5), by Alexander Holm\n"
        "Source: https://github.com/sfzinstruments/SalamanderGrandPiano (FLAC samples, master branch)\n"
        "Licence: CC BY 3.0 (credit: Alexander Holm, Salamander Grand Piano); see LICENSE here\n"
        "Fetched: %s\n"
        "Subset: velocity layers %s of 16, the note samples only (no release, harmonic or pedal samples)\n"
        % (DATE, ", ".join(map(str, SAL_LAYERS))))


if __name__ == "__main__":
    sys.exit(main())
