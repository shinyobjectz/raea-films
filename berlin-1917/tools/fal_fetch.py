# fetch a finished fal queue request: fal_fetch.py ENDPOINT_BASE REQUEST_ID OUTDIR (waits on the status stream)
import sys, json, pathlib, urllib.request, runpy
src = open('tools/fal_run.py').read().split('spec = json.load')[0]
g = {}; exec(src, g)
base, rid, out = sys.argv[1], sys.argv[2], pathlib.Path(sys.argv[3]); out.mkdir(parents=True, exist_ok=True)
u = f"https://queue.fal.run/{base}/requests/{rid}"
with g['open_']("GET", u + "/status/stream", timeout=900) as f:
    for line in f:
        line = line.decode().strip()
        if line.startswith("data:"):
            s = json.loads(line[5:]); print("status", s.get("status"), flush=True)
            if s.get("status") not in ("IN_QUEUE", "IN_PROGRESS"): break
r = g['req']("GET", u)
(out / "response.json").write_text(json.dumps(r, indent=1))
v = r.get("video"); v and urllib.request.urlretrieve(v["url"], out / "vace.mp4")
print("done", out / "vace.mp4", flush=True)
