# Setup (not kept on disk): uv venv V --python 3.11; uv pip install --python V/bin/python torch transformers soundfile numpy scipy
#   V/bin/python -I tools/listen/listen.py media/foley tools/listen/labels.json
# Machine listening for the foley: each scene's clip against a line saying what should be heard and against every
# other scene's line (CLAP, laion/clap-htsat-unfused, zero-shot). Prints each clip's own-line rank and its best match.
import sys, json, numpy as np, soundfile as sf, torch
from scipy.signal import resample_poly
from transformers import ClapModel, ClapProcessor
folder, labels = sys.argv[1], json.load(open(sys.argv[2]))
model = ClapModel.from_pretrained("laion/clap-htsat-unfused").eval(); proc = ClapProcessor.from_pretrained("laion/clap-htsat-unfused")
ids = list(labels)
def emb(x):
    return x if isinstance(x, torch.Tensor) else x.pooler_output
with torch.no_grad():
    t = emb(model.get_text_features(**proc(text=[labels[i] for i in ids], return_tensors="pt", padding=True)))
    t = t / t.norm(dim=-1, keepdim=True)
    for i in ids:
        a, sr = sf.read(f"{folder}/{i}.wav", always_2d=True); a = a.mean(axis=1)
        if sr != 48000: a = resample_poly(a, 48000, sr)
        e = emb(model.get_audio_features(**proc(audio=a.astype(np.float32), sampling_rate=48000, return_tensors="pt")))
        e = e / e.norm(dim=-1, keepdim=True)
        s = (e @ t.T)[0].numpy(); order = np.argsort(-s); rank = int(np.where(order == ids.index(i))[0][0]) + 1
        print(f"{i:11s} own line {s[ids.index(i)]:.3f} rank {rank:2d} of {len(ids)}   best: {ids[order[0]]} {s[order[0]]:.3f}, then {ids[order[1]]} {s[order[1]]:.3f}", flush=True)
