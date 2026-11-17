#!/usr/bin/env python3
"""Fetch freesound candidates listed in a TSV (key, user, id) into a download folder.

For each row: read the sound's page, record its licence, description and tags, and only
if the licence is CC0 download the public high-quality preview (Ogg Vorbis). Writes
meta.jsonl next to the downloads. Usage: sfx_fetch.py candidates.tsv out_dir
"""
import concurrent.futures
import html
import json
import os
import re
import subprocess
import sys
import threading
import urllib.parse

UA = "raea-asset-fetch/0.1"
CC0 = "creativecommons.org/publicdomain/zero/1.0"


def curl(url, out=None):
    cmd = ["curl", "-sL", "--max-time", "100", "-A", UA, url]
    if out:
        # The CDN is slow; the first 2.5 MB (about 100 s of Ogg) is more than any cut needs.
        cmd += ["-r", "0-2499999", "-o", out]
    r = subprocess.run(cmd, capture_output=True)
    return r.returncode, r.stdout.decode("utf-8", "replace")


def main(tsv, out_dir):
    done = set()
    meta_path = os.path.join(out_dir, "meta.jsonl")
    if os.path.exists(meta_path):
        done = {json.loads(l)["key"] for l in open(meta_path) if l.strip()}
    rows = [l.rstrip("\n").split("\t") for l in open(tsv) if l.strip()]
    rows = [r for r in rows if r[0] not in done]
    lock = threading.Lock()
    with open(meta_path, "a") as meta:
        def one(row):
            key, user, sid = row
            url = f"https://freesound.org/people/{urllib.parse.quote(user)}/sounds/{sid}/"
            rc, p = curl(url)
            lic = sorted(set(re.findall(r"https?://creativecommons\.org/[a-z]+/[a-z0-9\-]+/[0-9.]+", p)))
            title = re.search(r"<title>(.*?)</title>", p, re.S)
            title = html.unescape(title.group(1)).strip() if title else ""
            title = re.sub(r"^Freesound - ", "", title)
            desc = re.search(r'id="soundDescriptionSection"[^>]*>(.*?)</div>', p, re.S)
            desc = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", desc.group(1)))).strip() if desc else ""
            tags = sorted(set(re.findall(r'/browse/tags/([^/"]+)/', p)))
            prev = re.search(r"https://cdn\.freesound\.org/previews/\d+/%s_\d+-hq\.ogg" % sid, p)
            if not prev:
                m = re.search(r"https://cdn\.freesound\.org/previews/\d+/%s_\d+-" % sid, p)
                prev_url = m.group(0) + "hq.ogg" if m else ""
            else:
                prev_url = prev.group(0)
            ok = len(lic) == 1 and CC0 in lic[0] and bool(prev_url)
            fname = ""
            if ok:
                fname = f"{key}.fs{sid}.ogg"
                rc, _ = curl(prev_url, os.path.join(out_dir, fname))
                ok = rc == 0
            rec = dict(key=key, source="freesound", id=sid, author=user, title=title, page=url,
                       licence=lic, preview=prev_url, file=fname, ok=ok, tags=tags, desc=desc[:500])
            with lock:
                meta.write(json.dumps(rec) + "\n")
                meta.flush()
            print(f"{'OK ' if ok else 'SKIP'} {key:<10} {lic} {title[:60]}", flush=True)

        with concurrent.futures.ThreadPoolExecutor(4) as pool:
            list(pool.map(one, rows))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
