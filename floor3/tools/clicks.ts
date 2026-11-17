// Finds clicks in a mix: a sample-to-sample jump in the top octaves far above what's around it, in a stretch that's
// otherwise quiet up there (where a click is heard). Prints each with its time, so it can be traced to its cue.
//   bun tools/clicks.ts out/floor3-mix.wav
import { Biquad, SR, readStereo } from "./dsp";
const [l, r] = readStereo(process.argv[2] ?? new URL("../out/floor3-mix.wav", import.meta.url).pathname);
const out: string[] = [];
for (const [name, x] of [["L", l], ["R", r]] as const) {
  const y = new Biquad().set("hp", 7000, 0.707).run(new Biquad().set("hp", 7000, 0.707).run(x));
  const win = 960; // 20 ms
  let lastT = -1;
  for (let i = win; i < y.length - win; i += 48) {
    let pk = 0, pi = i; for (let j = i; j < i + 48; j++) if (Math.abs(y[j]) > pk) { pk = Math.abs(y[j]); pi = j; }
    let s = 0; for (let j = i - win; j < i - 48; j++) s += y[j] * y[j];
    const ctx = Math.sqrt(s / (win - 48));
    if (pk > 0.004 && pk > 14 * ctx) { const t = pi / SR; if (t - lastT > 0.05) out.push(`${name} ${t.toFixed(3)}s  peak ${(20 * Math.log10(pk)).toFixed(1)} dB  ${(20 * Math.log10(pk / (ctx + 1e-9))).toFixed(0)} dB over`); lastT = t; }
  }
}
// a click inside a placed sound is (almost always) that sound's own transient; one outside every placed sound came from
// something continuous, and that's a fault
let spans: [number, number][] = [];
try { spans = JSON.parse(require("node:fs").readFileSync(new URL("../.cache/mix/spans.json", import.meta.url).pathname, "utf8")); } catch {}
const inSpan = (t: number) => spans.some(([a, b]) => t >= a - 0.003 && t <= b + 0.05);
const loose = out.filter((o) => !inSpan(+o.split(" ")[1].replace("s", "")));
console.log(out.length, "candidates,", loose.length, "outside every placed sound");
for (const o of loose.slice(0, 60)) console.log(o);
