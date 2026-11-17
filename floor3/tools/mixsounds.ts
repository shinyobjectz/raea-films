// The mixer's sounds: the foley as clean mono (DC out, peak at 1), footsteps cut from the recorded walks, the
// electronics synthesized (a desk phone's ringer, a card reader's beeps, a tube's starter clicks, a clock), and the
// voice chains (a phone's speaker, a cassette, an answering machine, a pitch drop that keeps the words' timing).
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { Biquad, SR, TAU, chain, fade, loadMono, noise, peak, rng, writeWav } from "./dsp";
import { onsets } from "./sfxinfo";

const ROOT = new URL("../", import.meta.url).pathname;
const cache = new Map<string, Float32Array>();
/** a foley file (assets/sfx/NAME.wav) as mono, rumble and DC filtered out, peak 1 */
export function sfx(name: string): Float32Array {
  const have = cache.get(name);
  if (have) return have;
  const x = new Biquad().set("hp", 28, 0.707).run(loadMono(`${ROOT}assets/sfx/${name}.wav`));
  const p = peak(x) || 1;
  for (let i = 0; i < x.length; i++) x[i] /= p;
  cache.set(name, x);
  return x;
}
/** part of a sound, faded in and out */
export function cut(x: Float32Array, t0: number, len: number, fin = 0.003, fout = 0.06): Float32Array {
  const a = Math.max(0, Math.round(t0 * SR)), b = Math.min(x.length, a + Math.round(len * SR));
  const y = x.slice(a, b);
  fade(y, fin, Math.min(fout, len * 0.5));
  return y;
}
export function gainOf(x: Float32Array, g: number): Float32Array { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i] * g; return y; }
/** played at another speed (and so pitch) */
export function speed(x: Float32Array, r: number): Float32Array {
  const n = Math.floor(x.length / r), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = i * r, k = Math.floor(p), f = p - k; y[i] = (x[k] ?? 0) * (1 - f) + (x[k + 1] ?? 0) * f; }
  return y;
}
export function mixInto(dst: Float32Array, src: Float32Array, at: number, g = 1) { for (let i = 0; i < src.length && at + i < dst.length; i++) if (at + i >= 0) dst[at + i] += src[i] * g; }

/** single steps cut from recorded walks: each hit, from just before it, as long as a step rings; quiet ones dropped */
export function steps(names: string[], len: number, gap: number): Float32Array[] {
  const out: Float32Array[] = [];
  for (const n of names) {
    const x = sfx(n);
    for (const t of onsets(x, gap)) out.push(cut(x, t - 0.035, len, 0.004, len * 0.45));
  }
  const pk = out.map((s) => peak(s)), top = Math.max(...pk);
  return out.filter((_, i) => pk[i] > top * 0.3).map((s) => gainOf(s, 1 / peak(s)));
}

// ---- synthesized electronics ------------------------------------------------------------------------------------------
/** a desk phone's electronic ringer: two tones warbling 20 times a second through a small piezo, in a double ring
 * (0.4 s on, 0.2 off, 0.4 on, 2 off) from t = 0 for `dur` seconds, cut dead (with a 6 ms fade) at the end */
export function ringer(dur: number, f1 = 960, f2 = 1260): Float32Array {
  const n = Math.round(dur * SR), y = new Float32Array(n);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, c = t % 3;
    const on = (c < 0.4 ? 1 : 0) || (c >= 0.6 && c < 1.0 ? 1 : 0);
    const edge = Math.min(1, Math.min(c, Math.abs(c - 0.6)) / 0.008, Math.abs(0.4 - c) / 0.008, Math.abs(1.0 - c) / 0.008);
    const env = on ? Math.min(1, edge) : 0;
    p1 += TAU * f1 / SR; p2 += TAU * f2 / SR;
    const s = 0.5 + 0.5 * Math.tanh(6 * Math.sin(TAU * 20 * t));
    const v = s * Math.sin(p1) + (1 - s) * Math.sin(p2);
    y[i] = env * Math.tanh(2.4 * v) * 0.8;
  }
  const z = chain(y, Biquad.hp(480), Biquad.peak(1150, 2, 5), Biquad.lp(4800));
  fade(z, 0.002, 0.006);
  return z;
}
export function beep(f: number, dur: number, att = 0.003, rel = 0.012): Float32Array {
  const n = Math.round(dur * SR), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; y[i] = Math.sin(TAU * f * t) * Math.min(1, t / att, (dur - t) / rel) * (0.8 + 0.2 * Math.sin(TAU * f * 3 * t)); }
  return chain(y, Biquad.hp(700), Biquad.lp(5000));
}
/** a fluorescent tube's starter: a hard little click with a ringing ballast buzz behind it */
export function starter(seed: number, bright = 1): Float32Array {
  const n = Math.round(0.07 * SR), w = noise(n, seed), y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    y[i] = w[i] * Math.exp(-t * 900) * 0.9 + Math.sin(TAU * 120 * t) * Math.sign(Math.sin(TAU * 120 * t)) * Math.exp(-t * 60) * 0.18 * bright + Math.sin(TAU * 3400 * t) * Math.exp(-t * 140) * 0.22;
  }
  return chain(y, Biquad.hp(180), Biquad.peak(2600, 3, 6));
}
/** a tube blowing out: a bright pop, glassy, with a low knock under it */
export function pop(seed: number): Float32Array {
  const n = Math.round(0.6 * SR), w = noise(n, seed), y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    y[i] = w[i] * Math.exp(-t * 70) * 0.8 + Math.sin(TAU * 70 * t) * Math.exp(-t * 18) * 0.7 + Math.sin(TAU * 4100 * t + 3 * Math.sin(TAU * 900 * t)) * Math.exp(-t * 9) * 0.06;
  }
  const z = chain(y, Biquad.hp(40), Biquad.lp(9000));
  fade(z, 0, 0.15);
  return z;
}
/** a mouse button: the switch's tick and the shell's knock */
export function mouseClick(up = false, seed = 1): Float32Array {
  const n = Math.round(0.03 * SR), w = noise(n, seed), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; y[i] = w[i] * Math.exp(-t * (up ? 2200 : 1500)) + Math.sin(TAU * (up ? 1500 : 1100) * t) * Math.exp(-t * 400) * 0.5; }
  const z = chain(y, Biquad.hp(600), Biquad.peak(3600, 2.5, 6), Biquad.lp(9000));
  return gainOf(z, (up ? 0.55 : 1) / (peak(z) || 1));
}
/** a wall clock's tick (a tock a little lower) */
export function tick(tock: boolean): Float32Array {
  const n = Math.round(0.05 * SR), w = noise(n, tock ? 4 : 3), y = new Float32Array(n);
  const f = tock ? 2300 : 2700;
  for (let i = 0; i < n; i++) { const t = i / SR; y[i] = w[i] * Math.exp(-t * 1200) * 0.6 + Math.sin(TAU * f * t) * Math.exp(-t * 260) * 0.5 + Math.sin(TAU * 840 * t) * Math.exp(-t * 120) * 0.2; }
  const z = chain(y, Biquad.hp(400));
  return gainOf(z, 1 / (peak(z) || 1));
}
/** a low body blow, felt more than heard */
export function thud(f = 46, dur = 1.6, seed = 1): Float32Array {
  const n = Math.round(dur * SR), y = new Float32Array(n), w = noise(n, seed);
  for (let i = 0; i < n; i++) { const t = i / SR, fr = f * (1 + 0.6 * Math.exp(-t * 12)); y[i] = Math.sin(TAU * fr * t) * Math.exp(-t * (3.2 / dur)) * Math.min(1, t / 0.004) + w[i] * Math.exp(-t * 40) * 0.08; }
  const z = chain(y, Biquad.lp(900));
  fade(z, 0, dur * 0.3);
  return z;
}
/** a bell-like FM tone (the lights' and the phone's notes in the score) */
export function bell(f: number, dur: number, ratio = 3.01, index = 1.2): Float32Array {
  const n = Math.round(dur * SR), y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.exp(-t * (4 / dur)) * Math.min(1, t / 0.006);
    y[i] = env * Math.sin(TAU * f * t + index * Math.exp(-t * (7 / dur)) * Math.sin(TAU * f * ratio * t)) + 0.25 * env * Math.sin(TAU * f * 2.002 * t) * Math.exp(-t * 2);
  }
  fade(y, 0, dur * 0.25);
  return y;
}
/** a falling noise scrape (the stinger's top) */
export function scrape(dur: number, seed: number): Float32Array {
  const n = Math.round(dur * SR), w = noise(n, seed), y = new Float32Array(n);
  const bp = new Biquad();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    if (i % 64 === 0) bp.set("bp", 5200 * Math.exp(-t * 2.2) + 300, 2.2);
    y[i] = bp.tick(w[i]) * Math.min(1, t / 0.01) * Math.exp(-t * (3 / dur));
  }
  fade(y, 0, dur * 0.25);
  return y;
}

// ---- voices -------------------------------------------------------------------------------------------------------------
export const voice = (id: string) => loadMono(`${ROOT}assets/voice/${id}.wav`);
/** RMS over the speech (frames within 30 dB of the loudest), to set every line to the same level */
export function speechRms(x: Float32Array): number {
  const hop = 480, rs: number[] = [];
  for (let i = 0; i + hop <= x.length; i += hop) { let s = 0; for (let j = 0; j < hop; j++) s += x[i + j] ** 2; rs.push(s / hop); }
  const top = Math.max(...rs), keep = rs.filter((r) => r > top * 1e-3);
  return Math.sqrt(keep.reduce((a, b) => a + b, 0) / Math.max(1, keep.length));
}
export function level(x: Float32Array, rmsDb: number): Float32Array { return gainOf(x, Math.pow(10, rmsDb / 20) / (speechRms(x) || 1)); }
/** a dialogue compressor: an RMS follower, `ratio` above `thrDb` (relative to the line's speech level), soft knee */
export function compress(x: Float32Array, thrDb = -6, ratio = 3, att = 0.006, rel = 0.14): Float32Array {
  const ref = speechRms(x) || 1, thr = 20 * Math.log10(ref) + thrDb;
  const aa = 1 - Math.exp(-1 / (att * SR)), ar = 1 - Math.exp(-1 / (rel * SR)), aRms = 1 - Math.exp(-1 / (0.01 * SR));
  const y = new Float32Array(x.length);
  let ms = 0, g = 0;
  for (let i = 0; i < x.length; i++) {
    ms += (x[i] * x[i] - ms) * aRms;
    const lv = 10 * Math.log10(ms + 1e-12), over = lv - thr;
    const knee = 6, red = over <= -knee / 2 ? 0 : over >= knee / 2 ? over * (1 - 1 / ratio) : ((over + knee / 2) ** 2 / (2 * knee)) * (1 - 1 / ratio);
    g += (red - g) * (red > g ? aa : ar);
    y[i] = x[i] * Math.pow(10, -g / 20);
  }
  return y;
}
const sat = (x: Float32Array, drive: number) => { const y = new Float32Array(x.length), p = peak(x) || 1, k = Math.tanh(drive); for (let i = 0; i < x.length; i++) y[i] = Math.tanh((x[i] / p) * drive) / k * p; return y; };
function hiss(n: number, seed: number, lo: number, hi: number, g: number): Float32Array { return gainOf(chain(noise(n, seed), Biquad.hp(lo), Biquad.lp(hi)), g); }

/** a voicemail played on a desk phone's speaker: the line's band, the little speaker's honk, a breath of line noise */
export function phoneVoice(x: Float32Array): Float32Array {
  const y = sat(chain(x, Biquad.hp(330), Biquad.hp(330), Biquad.lp(3300), Biquad.lp(3300), Biquad.peak(1700, 1.2, 5), Biquad.peak(850, 1.5, 2)), 1.7);
  const out = new Float32Array(y.length + Math.round(0.25 * SR));
  mixInto(out, y, 0);
  const h = hiss(out.length, 41, 500, 3000, 0.004);
  for (let i = 0; i < out.length; i++) out[i] += h[i];
  fade(out, 0.004, 0.05);
  return out;
}
/** a cassette on a small recorder: wow and flutter, the tape's band and hiss, a little saturation, its speaker */
export function tapeVoice(x: Float32Array, pre = 0.55, post = 0.6): Float32Array {
  const lead = Math.round(pre * SR), n = x.length + lead + Math.round(post * SR);
  const src = new Float32Array(n); src.set(x, lead);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const d = (0.006 + 0.0011 * Math.sin(TAU * 0.55 * t) + 0.00012 * Math.sin(TAU * 6.3 * t) + 0.00005 * Math.sin(TAU * 13.7 * t)) * SR;
    const p = i - d, k = Math.floor(p), f = p - k;
    y[i] = k >= 0 && k + 1 < n ? src[k] * (1 - f) + src[k + 1] * f : 0;
  }
  const z = sat(chain(y, Biquad.hp(150), Biquad.lp(6200), Biquad.peak(2400, 1.2, 3), Biquad.hp(230), Biquad.lp(5600)), 1.4);
  const h = hiss(n, 43, 2500, 9000, 0.006), hum = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; hum[i] = 0.0035 * (Math.sin(TAU * 50 * t) + 0.4 * Math.sin(TAU * 150 * t)) * (1 + 0.2 * Math.sin(TAU * 1.1 * t)); }
  for (let i = 0; i < n; i++) z[i] += h[i] + hum[i];
  fade(z, 0.03, 0.04);
  return z;
}
/** a call coming through an answering machine's speaker as it screens it: narrow, cheap, gritty, with line crackle */
export function machineVoice(x: Float32Array): Float32Array {
  const y = sat(chain(x, Biquad.hp(290), Biquad.hp(290), Biquad.lp(3500), Biquad.lp(3500), Biquad.peak(1250, 1.3, 5)), 2.4);
  const n = y.length, r = rng(77), crack = new Float32Array(n);
  for (let i = 0; i < n; i++) if (r() < 0.00025) { const a = (r() - 0.5) * 0.08; for (let j = 0; j < 40 && i + j < n; j++) crack[i + j] += a * Math.exp(-j / 6); }
  const h = hiss(n, 45, 400, 3600, 0.005);
  for (let i = 0; i < n; i++) y[i] += h[i] + crack[i];
  return y;
}
/** the voice moved down `semis` semitones without changing its timing (so its captions still hold) */
export function pitchDown(x: Float32Array, semis: number, tmp: string): Float32Array {
  mkdirSync(tmp, { recursive: true });
  const r = Math.pow(2, -semis / 12);
  writeWav(`${tmp}/pd-in.wav`, x, x);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `${tmp}/pd-in.wav`, "-af", `pan=mono|c0=c0,asetrate=${Math.round(SR * r)},aresample=${SR},atempo=${(1 / r).toFixed(6)}`, "-c:a", "pcm_f32le", `${tmp}/pd-out.wav`]);
  const y = loadMono(`${tmp}/pd-out.wav`);
  return y.length > x.length ? y.slice(0, x.length) : y;
}
