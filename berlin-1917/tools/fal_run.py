import json, sys, urllib.request, mimetypes, os, pathlib

def key():
    for l in open(os.path.expanduser("~/.raea/env")):
        l = l.strip()
        if l.startswith("FAL_KEY="):
            return l.split("=", 1)[1].strip().strip('"')

K = key()

def open_(method, url, body=None, raw=None, ctype="application/json", auth=True, timeout=120):
    h = {"Content-Type": ctype}
    if auth:
        h["Authorization"] = "Key " + K
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    return urllib.request.urlopen(urllib.request.Request(url, data=data, method=method, headers=h), timeout=timeout)

def req(*a, **k):
    with open_(*a, **k) as f:
        t = f.read()
        return json.loads(t) if t else {}

def upload(p):
    p = pathlib.Path(p)
    m = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    v = req("POST", "https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3",
            {"content_type": m, "file_name": p.name})
    req("PUT", v["upload_url"], raw=p.read_bytes(), ctype=m, auth=False)
    return v["file_url"]

spec = json.load(open(sys.argv[1]))
out = pathlib.Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
endpoint = spec.pop("endpoint")
for k in list(spec):
    if k.endswith("_files"):
        spec[k[:-6] + "_urls"] = [upload(x) for x in spec.pop(k)]
    elif k.endswith("_file"):
        spec[k[:-5] + "_url"] = upload(spec.pop(k))
print("submitting", endpoint, {k: v for k, v in spec.items() if k not in ("prompt", "negative_prompt")}, flush=True)
q = req("POST", f"https://queue.fal.run/{endpoint}", spec)
print("request", q.get("request_id"), flush=True)

# fal pushes status events on the stream until the request finishes
last, final = None, None
with open_("GET", q["status_url"] + "/stream", timeout=900) as f:
    for line in f:
        line = line.decode().strip()
        if not line.startswith("data:"):
            continue
        s = json.loads(line[5:])
        st = s.get("status")
        if st != last:
            print("status", st, s.get("queue_position", ""), flush=True)
            last = st
        if st not in ("IN_QUEUE", "IN_PROGRESS"):
            final = s
            break
if not final or final.get("status") != "COMPLETED":
    print("FAILED", final, flush=True)
    sys.exit(1)
r = req("GET", q["response_url"])
(out / "response.json").write_text(json.dumps(r, indent=1))
v = r.get("video"); v and urllib.request.urlretrieve(v["url"], out / "vace.mp4")
print("done", out / "vace.mp4", "seed", r.get("seed"), flush=True)
