"""Depth for a stock shot, made on this Mac with Depth Anything 3 (DA3-BASE, Apache 2.0, multi-view: depth that holds
still from frame to frame, and a camera per frame). the director on v1 (11-13): "for every stock footage we also have
something tracing the scene with da3 or moge and then interacts somehow with the physical objects".

Writes OUT_DIR/dNNNN.png, one 640x360 grey PNG a frame at 30 fps from START (inverse depth, near = white, 0..1 over
the whole shot, its edges snapped to the picture's), the layers of the heat pass's depth texture (thermal/heat.tsx),
and OUT_DIR/cams.json: each frame's camera (DA3's world-to-camera 3x4 and intrinsics at 1920x1080).

  uv run --python 3.11 $(cat tools/depth.deps) python3 -I tools/depth.py SRC.mp4 START SECONDS OUT_DIR
Frames go through DA3 in windows of 32 with 8 shared; each window's inverse depth is fitted (scale and shift) to the
one before on the frames they share, so the depth doesn't jump at a window's edge.
"""
import json, os, subprocess, sys, time
import numpy as np, torch, cv2
from depth_anything_3.api import DepthAnything3

src, start, secs, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
W, H, FPS, WIN, SHARE, RES = 960, 540, 30, 32, 8, 504  # decoded at half size: the layers are 640x360, and full HD frames held 15 GB (11-13)

raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(start), "-i", src, "-t", str(secs), "-vf", f"fps={FPS},scale={W}:{H}",
                      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
n = len(frames)
print(f"{n} frames from {src} at {start}s")

dev = "mps" if torch.backends.mps.is_available() else "cpu"
model = DepthAnything3.from_pretrained("depth-anything/DA3-BASE").to(dev)
small = list(frames)

inv = [None] * n
cams = [None] * n
t0 = time.time()
s = 0
while s < n:
    e = min(n, s + WIN)
    with torch.inference_mode():
        p = model.inference(small[s:e], process_res=RES)
    d = 1.0 / np.maximum(np.asarray(p.depth, np.float64), 1e-6)
    ext = np.asarray(p.extrinsics) if p.extrinsics is not None else None
    ixt = np.asarray(p.intrinsics) if p.intrinsics is not None else None
    if s > 0:
        # fit this window's inverse depth to the frames already done
        a = np.concatenate([d[k - s].ravel() for k in range(s, min(e, s + SHARE)) if inv[k] is not None])
        b = np.concatenate([inv[k].ravel() for k in range(s, min(e, s + SHARE)) if inv[k] is not None])
        A = np.stack([a, np.ones_like(a)], 1)
        scale, shift = np.linalg.lstsq(A, b, rcond=None)[0]
        d = d * scale + shift
    for k in range(s, e):
        if inv[k] is None or k >= s + SHARE // 2:  # the shared frames take the later window's second half
            inv[k] = d[k - s]
            if ext is not None:
                sx = 1920 / d.shape[2]
                sy = 1080 / d.shape[1]
                K = ixt[k - s].copy()
                K[0] *= sx
                K[1] *= sy
                cams[k] = {"ext": ext[k - s].tolist(), "K": K.tolist()}
    del p
    if dev == "mps":
        torch.mps.empty_cache()
    if e == n:
        break
    s = e - SHARE
print(f"depth in {time.time() - t0:.1f}s ({(time.time() - t0) / n:.3f}s a frame)")

def guided(I, p, r, eps):
    """He et al.'s guided filter (grey guide), from box filters: opencv-contrib's isn't importable beside the plain
    opencv a dependency installs"""
    box = lambda x: cv2.boxFilter(x, -1, (2 * r + 1, 2 * r + 1))
    mI, mp = box(I), box(p)
    a = (box(I * p) - mI * mp) / (box(I * I) - mI * mI + eps)
    b = mp - a * mI
    return box(a) * I + box(b)


allv = np.concatenate([x.ravel() for x in inv])
lo, hi = np.percentile(allv, 1), np.percentile(allv, 99.5)
os.makedirs(out, exist_ok=True)
DW, DH = 640, 360
for i, (f, x) in enumerate(zip(frames, inv)):
    g = np.clip((x - lo) / (hi - lo), 0, 1)
    g = cv2.resize(g.astype(np.float32), (DW, DH), interpolation=cv2.INTER_CUBIC)
    # snap the depth's edges to the picture's: a guided filter with the frame's luma as the guide
    guide = cv2.cvtColor(cv2.resize(f, (DW, DH), interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    g = guided(guide, g, 4, 1e-3)
    cv2.imwrite(os.path.join(out, f"d{i:04d}.png"), (np.clip(g, 0, 1) * 255).astype(np.uint8))
json.dump({"src": src, "start": start, "fps": FPS, "frames": n, "near_far_inv": [float(lo), float(hi)], "cams": cams}, open(os.path.join(out, "cams.json"), "w"))
print("wrote", n, "layers to", out)
