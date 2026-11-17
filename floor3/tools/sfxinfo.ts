// What each foley file holds, to check it before it goes in the mix: length, peak, how many samples sit at full scale
// (a clipped source stays distorted however far it's turned down), loudness, brightness and how many hits it has.
//   bun tools/sfxinfo.ts [assets/sfx/*.wav]
import { readdirSync } from "node:fs";
import { SR, loadMono, peak, Biquad } from "./dsp";

const dir = new URL("../assets/sfx/", import.meta.url).pathname;
const files = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(dir).filter((f) => f.endsWith(".wav")).map((f) => dir + f);

/** hits: peaks of a 25 ms envelope that rise 9 dB over the 120 ms before them, at least 180 ms apart */
export function onsets(x: Float32Array, minGap = 0.18, riseDb = 9): number[] {
  const hop = 240, n = Math.floor(x.length / hop), env = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < hop; j++) s += x[i * hop + j] ** 2; env[i] = Math.sqrt(s / hop); }
  const pk = Math.max(...env), out: number[] = [];
  const back = Math.round(0.12 * SR / hop);
  for (let i = 1; i < n - 1; i++) {
    if (env[i] < pk * 0.12 || env[i] < env[i - 1] || env[i] < env[i + 1]) continue;
    let lo = Infinity; for (let j = Math.max(0, i - back); j < i; j++) lo = Math.min(lo, env[j]);
    if (20 * Math.log10(env[i] / Math.max(lo, 1e-9)) < riseDb) continue;
    const t = i * hop / SR;
    if (out.length && t - out[out.length - 1] < minGap) continue;
    out.push(t);
  }
  return out;
}

if (import.meta.main) for (const f of files) {
  const x = loadMono(f);
  const p = peak(x);
  let full = 0; for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) >= 0.999) full++;
  let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  const rmsDb = 10 * Math.log10(s / x.length + 1e-12);
  const hi = new Biquad().set("hp", 2500, 0.707).run(x);
  let sh = 0; for (let i = 0; i < hi.length; i++) sh += hi[i] * hi[i];
  const name = f.split("/").pop()!;
  console.log(`${name.padEnd(28)} ${(x.length / SR).toFixed(2).padStart(5)} s  peak ${(20 * Math.log10(p)).toFixed(1).padStart(6)} dB  full ${String(full).padStart(4)}  rms ${rmsDb.toFixed(1).padStart(6)}  hi ${(10 * Math.log10(sh / Math.max(s, 1e-12))).toFixed(1).padStart(6)}  hits ${onsets(x).map((t) => t.toFixed(2)).join(" ")}`);
}
