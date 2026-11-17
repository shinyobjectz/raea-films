// The sound engine's parts: wav in and out (through ffmpeg), filters, a binaural panner, small synths and a true-peak
// limiter. Everything is 48 kHz float.
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";

export const SR = 48000;
export const TAU = Math.PI * 2;

// ---- files -------------------------------------------------------------------------------------------------------------
/** any audio file as 48 kHz mono float */
export function loadMono(file: string): Float32Array {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}
/** stereo float planes as a 32-bit float WAV */
export function writeWav(file: string, l: Float32Array, r: Float32Array) {
  const n = l.length, data = Buffer.alloc(n * 8);
  for (let i = 0; i < n; i++) { data.writeFloatLE(l[i], i * 8); data.writeFloatLE(r[i], i * 8 + 4); }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 8, 28); h.writeUInt16LE(8, 32); h.writeUInt16LE(32, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([h, data]));
}
/** a stereo float WAV back as planes (as writeWav writes them, or ffmpeg's f32 output) */
export function readStereo(file: string): [Float32Array, Float32Array] {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 2 ** 31 });
  const f = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const n = f.length >> 1, l = new Float32Array(n), r = new Float32Array(n);
  for (let i = 0; i < n; i++) { l[i] = f[i * 2]; r[i] = f[i * 2 + 1]; }
  return [l, r];
}
void readFileSync;

// ---- small helpers -----------------------------------------------------------------------------------------------------
export const db = (d: number) => Math.pow(10, d / 20);
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const smooth = (v: number) => { const t = clamp(v, 0, 1); return t * t * (3 - 2 * t); };
export function rng(seed: number) {
  let r = seed >>> 0;
  return () => { r = (r + 0x6d2b79f5) >>> 0; let t = r; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const onePoleA = (fc: number) => 1 - Math.exp((-TAU * Math.min(fc, SR * 0.45)) / SR);

/** RMS over the loud part of a sound (for matching levels) */
export function rms(x: Float32Array): number {
  let s = 0, n = 0;
  for (let i = 0; i < x.length; i++) { s += x[i] * x[i]; n++; }
  return Math.sqrt(s / Math.max(1, n));
}
export function peak(x: Float32Array): number { let p = 0; for (let i = 0; i < x.length; i++) p = Math.max(p, Math.abs(x[i])); return p; }
export function scale(x: Float32Array, g: number): Float32Array { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i] * g; return y; }
/** trim leading and trailing silence (below `floor` of the peak), with short fades */
export function trim(x: Float32Array, floor = 0.02, pre = 0.004): Float32Array {
  const p = peak(x) * floor;
  let a = 0, b = x.length - 1;
  while (a < x.length && Math.abs(x[a]) < p) a++;
  while (b > a && Math.abs(x[b]) < p) b--;
  a = Math.max(0, a - Math.round(pre * SR));
  const y = x.slice(a, b + 1);
  fade(y, 0.002, 0.03);
  return y;
}
export function fade(x: Float32Array, fin: number, fout: number) {
  const a = Math.round(fin * SR), b = Math.round(fout * SR);
  for (let i = 0; i < a && i < x.length; i++) x[i] *= i / a;
  for (let i = 0; i < b && i < x.length; i++) x[x.length - 1 - i] *= i / b;
}
/** a sound played slower or faster (and so lower or higher) by linear resampling */
export function repitch(x: Float32Array, ratio: number): Float32Array {
  const n = Math.floor(x.length / ratio), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = i * ratio, k = Math.floor(p), f = p - k; y[i] = (x[k] ?? 0) * (1 - f) + (x[k + 1] ?? 0) * f; }
  return y;
}

// ---- filters -----------------------------------------------------------------------------------------------------------
export class Biquad {
  b0 = 1; b1 = 0; b2 = 0; a1 = 0; a2 = 0; z1 = 0; z2 = 0;
  static lp(fc: number, q = 0.707) { return new Biquad().set("lp", fc, q); }
  static hp(fc: number, q = 0.707) { return new Biquad().set("hp", fc, q); }
  static bp(fc: number, q = 1) { return new Biquad().set("bp", fc, q); }
  static peak(fc: number, q: number, gainDb: number) { return new Biquad().set("peak", fc, q, gainDb); }
  static shelfHi(fc: number, gainDb: number) { return new Biquad().set("hs", fc, 0.707, gainDb); }
  set(type: string, fc: number, q: number, gainDb = 0): this {
    const w = (TAU * Math.min(fc, SR * 0.45)) / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q), A = Math.pow(10, gainDb / 40);
    let b0 = 1, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;
    if (type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
    else if (type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
    else if (type === "bp") { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
    else if (type === "peak") { b0 = 1 + al * A; b1 = -2 * c; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * c; a2 = 1 - al / A; }
    else if (type === "hs") {
      const sq = 2 * Math.sqrt(A) * al;
      b0 = A * ((A + 1) + (A - 1) * c + sq); b1 = -2 * A * ((A - 1) + (A + 1) * c); b2 = A * ((A + 1) + (A - 1) * c - sq);
      a0 = (A + 1) - (A - 1) * c + sq; a1 = 2 * ((A - 1) - (A + 1) * c); a2 = (A + 1) - (A - 1) * c - sq;
    }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
    return this;
  }
  tick(x: number): number {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
  run(x: Float32Array): Float32Array { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = this.tick(x[i]); return y; }
}
export function chain(x: Float32Array, ...fs: Biquad[]): Float32Array { let y = x; for (const f of fs) y = f.run(y); return y; }

// ---- the binaural panner -------------------------------------------------------------------------------------------------
/** where a source sits from the listener's head: its parameters for one block */
export interface Place { gl: number; gr: number; dl: number; dr: number; al: number; ar: number }
const HEAD = 0.0875, C = 343;
/** a source at `rel` (x right, y up, z ahead, metres, from the head) heard through walls by `occl` (0 clear, 1 blocked) */
export function place(rel: [number, number, number], occl = 0, gain = 1): Place {
  const [x, y, z] = rel;
  const d = Math.max(0.25, Math.hypot(x, y, z));
  const lat = clamp(x / d, -1, 1); // -1 hard left, +1 hard right
  const th = Math.asin(Math.abs(lat));
  const itd = (HEAD / C) * (th + Math.sin(th)) * SR; // samples
  const behind = z < 0 ? clamp(-z / d, 0, 1) : 0;
  // distance: inverse distance from 1 m, gentler close in; air takes the top off far away
  const g = gain * Math.min(1.6, 1 / Math.max(0.62, d)) * (1 - 0.65 * occl);
  const near = 1 + 0.18 * Math.abs(lat), far = 1 - 0.42 * Math.abs(lat);
  const air = 19000 / (1 + d / 14);
  const shadow = 19000 * (1 - Math.abs(lat)) + 1600 * Math.abs(lat);
  const back = 19000 * (1 - behind) + 6500 * behind;
  // through a wall: the top goes first and fast (exponential in the cutoff: one wall leaves about 1.8 kHz)
  const occ = 19000 * Math.pow(650 / 19000, clamp(occl, 0, 1));
  const fNear = Math.min(air, back, occ), fFar = Math.min(air, back, occ, shadow);
  const gb = 1 - 0.18 * behind;
  const left = lat < 0;
  return {
    gl: g * gb * (left ? near : far), gr: g * gb * (left ? far : near),
    dl: left ? 0 : itd, dr: left ? itd : 0,
    al: onePoleA(left ? fNear : fFar), ar: onePoleA(left ? fFar : fNear),
  };
}
export class Panner {
  private buf = new Float32Array(128);
  private w = 0;
  private l1 = 0; private l2 = 0; private r1 = 0; private r2 = 0;
  private last: Place | null = null;
  /** mono `x` (one block) into L and R at offset `at`, the place moving from the last block's to `p` */
  run(x: Float32Array, p: Place, L: Float32Array, R: Float32Array, at: number) {
    const a = this.last ?? p, n = x.length;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      this.buf[this.w & 127] = x[i];
      const dl = a.dl + (p.dl - a.dl) * t, dr = a.dr + (p.dr - a.dr) * t;
      const sl = this.tap(dl), sr = this.tap(dr);
      const al = a.al + (p.al - a.al) * t, ar = a.ar + (p.ar - a.ar) * t;
      this.l1 += al * (sl - this.l1); this.l2 += al * (this.l1 - this.l2);
      this.r1 += ar * (sr - this.r1); this.r2 += ar * (this.r1 - this.r2);
      const k = at + i;
      if (k >= 0 && k < L.length) {
        L[k] += this.l2 * (a.gl + (p.gl - a.gl) * t);
        R[k] += this.r2 * (a.gr + (p.gr - a.gr) * t);
      }
      this.w++;
    }
    this.last = p;
  }
  /** the line read `d` samples back (fractional, linear) */
  private tap(d: number): number {
    const p = this.w - d, k = Math.floor(p), f = p - k;
    return this.buf[k & 127] * (1 - f) + this.buf[(k + 1) & 127] * f;
  }
  /** decay out (no input) for a few blocks so filters and delays empty */
  get idle() { return Math.abs(this.l2) + Math.abs(this.r2) < 1e-6; }
}

// ---- synths ----------------------------------------------------------------------------------------------------------------
/** a bell-like FM ping (a tube's ring, a glass tone): carrier f, decaying over `dur` */
export function ping(f: number, dur: number, ratio = 2.76, index = 1.4): Float32Array {
  const n = Math.round(dur * SR), y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.exp(-t * (4.5 / dur)) * Math.min(1, t * 400);
    const ienv = index * Math.exp(-t * (9 / dur));
    y[i] = env * Math.sin(TAU * f * t + ienv * Math.sin(TAU * f * ratio * t));
  }
  return y;
}
export function sine(f: number, dur: number, att = 0.004, rel = 0.02): Float32Array {
  const n = Math.round(dur * SR), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; y[i] = Math.sin(TAU * f * t) * Math.min(1, t / att, (dur - t) / rel); }
  return y;
}
/** white noise, seeded */
export function noise(n: number, seed = 1): Float32Array { const r = rng(seed), y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = r() * 2 - 1; return y; }
/** pink-ish noise (Paul Kellet's filter) */
export function pink(n: number, seed = 1): Float32Array {
  const r = rng(seed), y = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = r() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
    y[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
  }
  return y;
}

// ---- the true-peak limiter -----------------------------------------------------------------------------------------------
/** a look-ahead limiter on a stereo pair, holding inter-sample peaks (4x oversampled estimate) under `ceilDb` */
/** a smooth stereo-linked compressor (peak envelope, soft knee), in place: levels a bus before its limiter. Returns the
 * most gain it took and how long it took over 3 dB */
export function glue(L: Float32Array, R: Float32Array, thrDb: number, ratio: number, att: number, rel: number, kneeDb = 6): { maxGrDb: number; msOver3dB: number } {
  const aa = 1 - Math.exp(-1 / (att * SR)), ar = 1 - Math.exp(-1 / (rel * SR)), slope = 1 - 1 / ratio;
  let env = 0, max = 0, over3 = 0;
  for (let i = 0; i < L.length; i++) {
    const x = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    env += (x > env ? aa : ar) * (x - env);
    const over = 20 * Math.log10(env + 1e-9) - thrDb;
    const gr = over >= kneeDb / 2 ? slope * over : over > -kneeDb / 2 ? slope * (over + kneeDb / 2) ** 2 / (2 * kneeDb) : 0;
    if (gr > 0) { const g = Math.pow(10, -gr / 20); L[i] *= g; R[i] *= g; if (gr > max) max = gr; if (gr > 3) over3++; }
  }
  return { maxGrDb: max, msOver3dB: Math.round(over3 / SR * 1000) };
}
/** a look-ahead true-peak limiter, in place. With `fold`, the mono fold-down a single speaker plays (0.707 of each
 * channel, as ffmpeg and most devices sum it) is held under the ceiling too, so centred sound never clips in mono */
export function limit(L: Float32Array, R: Float32Array, ceilDb: number, look = 0.004, release = 0.12, fold = false): { minGainDb: number; at: number; msOver1dB: number; msOver3dB: number; regions: { t: number; db: number }[] } {
  const n = L.length, ceil = db(ceilDb), la = Math.round(look * SR);
  // the true peak near each sample: the samples and three cubic in-betweens
  const tp = new Float32Array(n);
  const est = (x: Float32Array, i: number) => {
    const a = x[Math.max(0, i - 1)], b = x[i], c = x[Math.min(n - 1, i + 1)], d = x[Math.min(n - 1, i + 2)];
    let m = Math.abs(b);
    for (const t of [0.25, 0.5, 0.75]) {
      const v = b + 0.5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)));
      m = Math.max(m, Math.abs(v));
    }
    return m;
  };
  for (let i = 0; i < n; i++) tp[i] = Math.max(est(L, i), est(R, i));
  if (fold) {
    const M = new Float32Array(n);
    for (let i = 0; i < n; i++) M[i] = Math.SQRT1_2 * (L[i] + R[i]);
    for (let i = 0; i < n; i++) tp[i] = Math.max(tp[i], est(M, i));
  }
  // the gain each sample needs, held over the look-ahead window, then smoothed: instant down, slow up
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) need[i] = tp[i] > ceil ? ceil / tp[i] : 1;
  // a running minimum over the window ahead (deque)
  const gmin = new Float32Array(n);
  const q: number[] = [];
  let head = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (q.length > head && need[q[q.length - 1]] >= need[i]) q.pop();
    q.push(i);
    while (q[head] > i + la) head++;
    gmin[i] = need[q[head]];
  }
  // a ramp into each reduction: the held minimum averaged over the look-ahead behind it, so the gain is down by the
  // peak and never steps; then a slow release
  const box = new Float32Array(n);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += gmin[i];
    if (i >= la) acc -= gmin[i - la];
    box[i] = Math.min(gmin[i], acc / Math.min(i + 1, la));
  }
  const rel = Math.exp(-1 / (release * SR));
  let g = 1, gmn = 1, at = 0, o1 = 0, o3 = 0;
  const regions: { t: number; db: number }[] = [];
  let rmin = 1;
  for (let i = 0; i < n; i++) {
    const want = box[i];
    g = want < g ? want : want + (g - want) * rel;
    L[i] *= g; R[i] *= g;
    if (g < gmn) { gmn = g; at = i / SR; }
    if (g < db(-1)) o1++;
    if (g < db(-3)) o3++;
    rmin = Math.min(rmin, g);
    if (i % (SR / 2) === SR / 2 - 1) { if (rmin < db(-1)) regions.push({ t: +((i + 1) / SR - 0.5).toFixed(1), db: +(20 * Math.log10(rmin)).toFixed(1) }); rmin = 1; }
  }
  return { minGainDb: +(20 * Math.log10(gmn)).toFixed(2), at: +at.toFixed(2), msOver1dB: Math.round((o1 / SR) * 1000), msOver3dB: Math.round((o3 / SR) * 1000), regions };
}
