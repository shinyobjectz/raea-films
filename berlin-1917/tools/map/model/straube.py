# The Straube reader: a small U-Net that labels every pixel of a Straube plan tile (0.25 m) as open ground, private
# building, public building, water, green or rail. Trained on "Berlin um 1900", which was traced from the same plan.
# A model runtime, so Python (repo rule: scripts are bash, model runtimes may be Python).
#
#   train:  uv run --with torch==2.15.0 --with numpy --with pillow python straube.py train CACHE [STEPS]
#   infer:  uv run --with torch==2.15.0 --with numpy --with pillow python straube.py infer CACHE TILE [TILE ...]
#
# CACHE is cache/<slice>. Reads rasters/straube/*.png and train/*.png + train/index.json; writes model/straube.pt,
# model/log.json and pred/<tile>.png (class per pixel, same grid as the scan).
import json, math, os, random, sys, time
import numpy as np
import torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
CLASSES = ["none", "open", "building", "public", "water", "green", "rail"]
NC = len(CLASSES) - 1  # the model predicts classes 1..6 as 0..5; label 0 is ignored
dev = torch.device("mps" if torch.backends.mps.is_available() else "cpu")


def block(i, o):
    return nn.Sequential(nn.Conv2d(i, o, 3, padding=1, bias=False), nn.BatchNorm2d(o), nn.ReLU(inplace=True),
                         nn.Conv2d(o, o, 3, padding=1, bias=False), nn.BatchNorm2d(o), nn.ReLU(inplace=True))


class UNet(nn.Module):
    def __init__(self, ch=(32, 64, 128, 256)):
        super().__init__()
        self.down = nn.ModuleList()
        c = 3
        for o in ch:
            self.down.append(block(c, o))
            c = o
        self.mid = block(ch[-1], ch[-1] * 2)
        self.up = nn.ModuleList()
        self.dec = nn.ModuleList()
        c = ch[-1] * 2
        for o in reversed(ch):
            self.up.append(nn.ConvTranspose2d(c, o, 2, stride=2))
            self.dec.append(block(o * 2, o))
            c = o
        self.head = nn.Conv2d(ch[0], NC, 1)

    def forward(self, x):
        skips = []
        for d in self.down:
            x = d(x)
            skips.append(x)
            x = F.max_pool2d(x, 2)
        x = self.mid(x)
        for u, d, s in zip(self.up, self.dec, reversed(skips)):
            x = d(torch.cat([u(x), s], 1))
        return self.head(x)


def load_rgb(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.uint8)


def predict(model, img, win=512, pad=48):
    """Class per pixel for a whole tile: overlapping windows, keeping only each window's centre."""
    h, w, _ = img.shape
    x = torch.from_numpy(img).permute(2, 0, 1).float().div(255)
    x = F.pad(x[None], (pad, pad, pad, pad), mode="reflect")[0]
    out = np.zeros((h, w), dtype=np.uint8)
    step = win - 2 * pad
    model.eval()
    with torch.no_grad():
        for y0 in range(0, h, step):
            for x0 in range(0, w, step):
                y1, x1 = min(y0 + step, h), min(x0 + step, w)
                crop = x[:, y0:y1 + 2 * pad, x0:x1 + 2 * pad]
                ph, pw = crop.shape[1], crop.shape[2]
                ph2, pw2 = math.ceil(ph / 16) * 16, math.ceil(pw / 16) * 16
                crop = F.pad(crop[None], (0, pw2 - pw, 0, ph2 - ph), mode="reflect").to(dev)
                logits = model((crop - 0.5) / 0.25)
                cls = logits.argmax(1)[0, pad:pad + (y1 - y0), pad:pad + (x1 - x0)].cpu().numpy()
                out[y0:y1, x0:x1] = cls + 1
    return out


def scores(pred, lab):
    """IoU per class and pixel accuracy over labelled pixels."""
    m = lab > 0
    res = {}
    for c in range(1, len(CLASSES)):
        p, t = (pred == c) & m, (lab == c)
        u = (p | t).sum()
        res[CLASSES[c]] = round(float((p & t).sum() / u), 3) if u else None
    res["accuracy"] = round(float((pred[m] == lab[m]).mean()), 4)
    bp, bt = np.isin(pred, (2, 3)) & m, np.isin(lab, (2, 3))
    res["built_iou"] = round(float((bp & bt).sum() / (bp | bt).sum()), 3)
    return res


def augment(img, lab, rng):
    k = rng.integers(4)
    img, lab = np.rot90(img, k), np.rot90(lab, k)
    if rng.random() < 0.5:
        img, lab = img[:, ::-1], lab[:, ::-1]
    x = img.astype(np.float32) / 255
    # Sheets differ in tint, fade and contrast: jitter each channel's gain and offset, and the contrast.
    x = x * rng.uniform(0.85, 1.15, 3) + rng.uniform(-0.08, 0.08, 3)
    m = x.mean()
    x = (x - m) * rng.uniform(0.75, 1.25) + m
    x += rng.normal(0, 0.02, x.shape)
    return np.clip(x, 0, 1), lab.copy()


def train(cache, steps):
    idx = json.load(open(f"{cache}/train/index.json"))
    tr = [t["tile"] for t in idx["tiles"] if t["split"] == "train"]
    ho = [t["tile"] for t in idx["tiles"] if t["split"] == "holdout"]
    data = {t: (load_rgb(f"{cache}/rasters/straube/{t}.png"), np.asarray(Image.open(f"{cache}/train/{t}.png"), dtype=np.uint8)) for t in tr + ho}
    # Class weights: rarer classes count more, softened by a square root.
    counts = np.bincount(np.concatenate([data[t][1].ravel() for t in tr]), minlength=len(CLASSES))[1:].astype(np.float64)
    wts = torch.tensor((counts.sum() / np.maximum(counts, 1)) ** 0.5, dtype=torch.float32)
    wts = (wts / wts.mean()).to(dev)
    print("class pixels", dict(zip(CLASSES[1:], counts.astype(int).tolist())), flush=True)
    model = UNet().to(dev)
    print(f"params {sum(p.numel() for p in model.parameters()) / 1e6:.2f}M on {dev}", flush=True)
    opt = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=2e-3, total_steps=steps, pct_start=0.1)
    rng = np.random.default_rng(7)
    S, B = 256, 12
    log = []
    t0 = time.time()
    for step in range(1, steps + 1):
        model.train()
        xs, ys = [], []
        while len(xs) < B:
            t = tr[rng.integers(len(tr))]
            img, lab = data[t]
            y, x = rng.integers(0, img.shape[0] - S), rng.integers(0, img.shape[1] - S)
            l = lab[y:y + S, x:x + S]
            if (l > 0).mean() < 0.3:
                continue
            a, b = augment(img[y:y + S, x:x + S], l, rng)
            xs.append(a.transpose(2, 0, 1))
            ys.append(b.astype(np.int64) - 1)  # 0 (no label) becomes -1, ignored
        xb = (torch.from_numpy(np.stack(xs)).float().to(dev) - 0.5) / 0.25
        yb = torch.from_numpy(np.stack(ys)).to(dev)
        loss = F.cross_entropy(model(xb), yb, weight=wts, ignore_index=-1)
        opt.zero_grad()
        loss.backward()
        opt.step()
        sched.step()
        if step % 100 == 0:
            print(f"step {step} loss {loss.item():.4f} {time.time() - t0:.0f}s", flush=True)
        if step % 1000 == 0 or step == steps:
            ev = {t: scores(predict(model, data[t][0]), data[t][1]) for t in ho}
            mean = {k: round(float(np.mean([e[k] for e in ev.values() if e[k] is not None])), 3) for k in ev[ho[0]]}
            print(f"holdout @ {step}: {json.dumps(mean)}", flush=True)
            log.append({"step": step, "loss": loss.item(), "holdout": ev, "holdout_mean": mean})
            os.makedirs(f"{cache}/model", exist_ok=True)
            torch.save(model.state_dict(), f"{cache}/model/straube.pt")
            json.dump(log, open(f"{cache}/model/log.json", "w"), indent=1)


def infer(cache, tiles):
    model = UNet().to(dev)
    model.load_state_dict(torch.load(f"{cache}/model/straube.pt", map_location=dev))
    os.makedirs(f"{cache}/pred", exist_ok=True)
    for t in tiles:
        pred = predict(model, load_rgb(f"{cache}/rasters/straube/{t}.png"))
        Image.fromarray(pred).save(f"{cache}/pred/{t}.png")
        print(f"{t}: " + " ".join(f"{CLASSES[c]}={(pred == c).mean() * 100:.1f}%" for c in range(1, len(CLASSES))), flush=True)


if __name__ == "__main__":
    torch.manual_seed(7)
    random.seed(7)
    mode, cache = sys.argv[1], sys.argv[2]
    if mode == "train":
        train(cache, int(sys.argv[3]) if len(sys.argv) > 3 else 4000)
    else:
        infer(cache, sys.argv[3:])
