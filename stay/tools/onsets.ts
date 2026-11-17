// The song's audible hits, for the cursor's clicks to land on. the director, 11-11 (assembly 22): "the clicking noise is really
// off beat". The song has no steady pulse (its onsets don't repeat at one period: 98 to 115 BPM by the 15 seconds), and
// raea song's map gives 83 "beats" at uneven gaps; the grid the clicks were snapped to filled those gaps with evenly
// spaced points and half-points where nothing sounds. This finds what does sound: every onset of the song (spectral
// flux over a 23 ms window, a peak well above the half second around it, hits at least 110 ms apart), with its strength.
//   bun tools/onsets.ts  ->  parts/onsets.gen.ts
import { writeFileSync } from "fs";
const SR = 22050, N = 1024, HOP = 221;                                        // 10 ms hop
const p = Bun.spawnSync(["ffmpeg", "-v", "error", "-i", `${import.meta.dir}/../media/music/stay.wav`, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { stdout: "pipe" });
const x = new Float32Array(p.stdout.buffer, p.stdout.byteOffset, Math.floor(p.stdout.byteLength / 4));
const win = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
function mags(at: number): Float32Array {
  const re = new Float32Array(N), im = new Float32Array(N);
  for (let i = 0; i < N; i++) re[i] = (x[at + i] ?? 0) * win[i];
  for (let i = 1, j = 0; i < N; i++) { let bit = N >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { const t = re[i]; re[i] = re[j]; re[j] = t; } }
  for (let len = 2; len <= N; len <<= 1) { const a = (-2 * Math.PI) / len; for (let i = 0; i < N; i += len) for (let k = 0; k < len / 2; k++) { const c = Math.cos(a * k), s = Math.sin(a * k), ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * c - im[i + k + len / 2] * s, vi = re[i + k + len / 2] * s + im[i + k + len / 2] * c; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; } }
  const m = new Float32Array(N / 2); for (let i = 0; i < N / 2; i++) m[i] = Math.log1p(40 * Math.hypot(re[i], im[i])); return m;
}
const frames = Math.floor((x.length - N) / HOP), flux = new Float32Array(frames);
let prev = mags(0);
for (let f = 1; f < frames; f++) { const m = mags(f * HOP); let s = 0; for (let i = 1; i < N / 2; i++) s += Math.max(0, m[i] - prev[i]); flux[f] = s; prev = m; }
const FR = SR / HOP, R = Math.round(0.25 * FR), out: { t: number; s: number }[] = [];
for (let f = 3; f < frames - 3; f++) {
  if (!(flux[f] > flux[f - 1] && flux[f] >= flux[f + 1] && flux[f] > flux[f - 2] && flux[f] >= flux[f + 2])) continue;
  const lo = Math.max(0, f - R), hi = Math.min(frames, f + R); const seg = Array.from(flux.subarray(lo, hi)).sort((a, b) => a - b), med = seg[seg.length >> 1], mean = seg.reduce((a, b) => a + b, 0) / seg.length;
  if (flux[f] < med * 1.25 + mean * 0.2) continue;
  const t = (f * HOP + N / 2 - HOP) / SR;                                     // (the middle of the window the rise was seen in)
  if (out.length && t - out[out.length - 1].t < 0.11) { if (flux[f] > out[out.length - 1].s) out[out.length - 1] = { t, s: flux[f] }; continue; }
  out.push({ t, s: flux[f] });
}
const top = Math.max(...out.map((o) => o.s));
const rows = out.map((o) => [Number(o.t.toFixed(3)), Number((o.s / top).toFixed(3))]);
writeFileSync(`${import.meta.dir}/../parts/onsets.gen.ts`, `// Written by tools/onsets.ts from media/music/stay.wav: don't edit. Each of the song's audible hits: [seconds, strength 0..1].\nexport const ONSETS: [number, number][] = ${JSON.stringify(rows)};\n`);
console.log(rows.length, "onsets;", rows.filter((r) => r[1] > 0.35).length, "strong (over 0.35);", "longest gap between strong ones", Math.max(...rows.filter((r) => r[1] > 0.35).map((r, i, a) => (i ? r[0] - a[i - 1][0] : 0))).toFixed(2), "s");
