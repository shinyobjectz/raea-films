#!/usr/bin/env python3
"""clipgate: every clip a film uses must match the master before it goes in.

  python3 tools/clipgate.py out/rebuilt/berlin-rebuilt-v5.manifest.json   # the clips a render used
  python3 tools/clipgate.py assets/rebuilt/shots5/*.mp4                   # or files, before cutting them in

Checks each clip against the film's master (1920x1080, 24 fps):
  size      exactly 1920x1080
  fps       24/1, constant (r_frame_rate == avg_frame_rate)
  codec     h264 / hevc / prores, 8- or 10-bit 4:2:0 or better
  bitrate   at least 6 Mb/s (Kling 1080p comes in at 7-35)
  detail    real 1080p detail, not an upscale: the clip is shrunk to 1280x720 and blown back up; if that loses
            almost nothing (PSNR over UPSCALE_DB), the clip never had more than 720p in it
  dupes     under 8% repeated frames (a 30->24 or 12->24 conversion shows as repeats; a locked-off camera
            can trip it too, so a dupes failure on a still shot is read, not believed)
Exit 1 if any clip fails. Media paths in a manifest (/media/...) resolve to compositions/media -> assets.
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W, H, FPS = 1920, 1080, "24/1"
MIN_KBPS = 6000
UPSCALE_DB = 44.0
MAX_DUPES = 0.08
CODECS = {"h264", "hevc", "prores"}
# our own renders that are flat by design (wireframe, grey shell): rendered natively at 1080p, so the detail test, which
# can't tell flat from soft, is skipped for them by name; everything else about them is still checked
FLAT_CG = {"build-room.mp4"}


def ff(*a):
    return subprocess.run(a, capture_output=True, text=True)


def clips(args):
    out = []
    for a in args:
        p = Path(a)
        if p.suffix == ".json":
            s = p.read_text()
            for m in sorted(set(re.findall(r"/media/[\w/.-]+\.(?:mp4|mov)", s))):
                out.append(ROOT / "compositions" / m.lstrip("/"))
        else:
            out.append(p)
    return out


def probe(p):
    r = ff("ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
           "stream=width,height,r_frame_rate,avg_frame_rate,codec_name,pix_fmt,bit_rate:format=duration,bit_rate",
           "-of", "json", str(p))
    d = json.loads(r.stdout or "{}")
    s = (d.get("streams") or [{}])[0]
    f = d.get("format", {})
    return s, float(f.get("duration") or 0), int(s.get("bit_rate") or f.get("bit_rate") or 0)


def detail_db(p, dur):
    # PSNR of the clip against itself shrunk to 720p and blown back up, over 2 s from its middle
    ss = max(0.0, dur / 2 - 1)
    r = ff("ffmpeg", "-v", "info", "-ss", f"{ss:.2f}", "-t", "2", "-i", str(p), "-filter_complex",
           f"[0:v]split[a][b];[b]scale=1280:720:flags=area,scale={W}:{H}:flags=bicubic[c];[a][c]psnr", "-f", "null", "-")
    m = re.search(r"average:([\d.]+|inf)", r.stderr)
    return float("inf") if m and m.group(1) == "inf" else float(m.group(1)) if m else None


def dupes(p, dur):
    ss = max(0.0, dur / 2 - 1.5)
    r = ff("ffmpeg", "-v", "info", "-ss", f"{ss:.2f}", "-t", "3", "-i", str(p), "-vf", "mpdecimate=hi=200:lo=64:frac=0.33,showinfo", "-f", "null", "-")
    kept = len(re.findall(r"\bn:\s*\d+", r.stderr))
    total = round(min(3.0, dur) * 24)
    return max(0.0, 1 - kept / total) if total else 0.0


def main():
    paths = clips(sys.argv[1:])
    if not paths:
        print(__doc__)
        return 2
    bad = 0
    for p in paths:
        if not p.exists():
            print(f"FAIL  {p}: missing")
            bad += 1
            continue
        s, dur, bps = probe(p)
        why = []
        if (s.get("width"), s.get("height")) != (W, H):
            why.append(f"size {s.get('width')}x{s.get('height')}")
        if s.get("r_frame_rate") != FPS or s.get("avg_frame_rate") != FPS:
            why.append(f"fps {s.get('r_frame_rate')} avg {s.get('avg_frame_rate')}")
        if s.get("codec_name") not in CODECS:
            why.append(f"codec {s.get('codec_name')}")
        if not re.match(r"yuv4(20|22|44)p(10le)?$", s.get("pix_fmt", "")):
            why.append(f"pix_fmt {s.get('pix_fmt')}")
        kbps = bps // 1000
        if kbps < MIN_KBPS:
            why.append(f"bitrate {kbps}k")
        db = detail_db(p, dur) if (s.get("width"), s.get("height")) == (W, H) else None
        if db is not None and db > UPSCALE_DB and p.name not in FLAT_CG:
            why.append(f"upscaled (720p round trip {db:.1f} dB)")
        dp = dupes(p, dur)
        if dp > MAX_DUPES:
            why.append(f"{dp:.0%} repeated frames")
        rel = p.relative_to(ROOT) if p.is_relative_to(ROOT) else p
        dbs = f"{db:.1f}dB" if db is not None else "-"
        print(f"{'FAIL' if why else 'ok  '}  {str(rel):58s} {dur:5.2f}s {kbps:6d}k detail {dbs:7s} dupes {dp:4.0%}  {'; '.join(why)}")
        bad += bool(why)
    print(f"clipgate: {len(paths) - bad} of {len(paths)} clips match the master{'' if not bad else f', {bad} fail'}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
