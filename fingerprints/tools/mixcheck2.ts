// The v2 mix, measured: for each narration line the mix's loudness, the voice's own (a mono file reads 3.01 dB louder
// in a stereo mix) and the bed under it by power subtraction; and the bed in each gap between lines.
// Usage: bun tools/mixcheck2.ts [WAV]   (default out/fp2-raw.wav)
import { execFileSync } from "node:child_process";
import { LINES, LINE_AT, SECONDS, lineEnd } from "../v2/time";
const wav = process.argv[2] ?? "out/fp2-raw.wav";
const lufs = (file: string, from: number, dur: number): number => {
  const out = execFileSync("ffmpeg", ["-nostdin", "-hide_banner", "-ss", String(from), "-t", String(dur), "-i", file, "-af", "ebur128=framelog=quiet", "-f", "null", "-"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] as any }).toString();
  return NaN && out;
};
const measure = (file: string, from: number, dur: number): number => {
  try { execFileSync("ffmpeg", ["-nostdin", "-hide_banner", "-ss", String(from), "-t", String(dur), "-i", file, "-af", "ebur128=framelog=quiet", "-f", "null", "-"], { stdio: ["ignore", "ignore", "pipe"] }); } catch {}
  const r = Bun.spawnSync(["ffmpeg", "-nostdin", "-hide_banner", "-ss", String(from), "-t", String(dur), "-i", file, "-af", "ebur128=framelog=quiet", "-f", "null", "-"]);
  const m = /I:\s+(-?[\d.]+) LUFS/.exec(r.stderr.toString().split("Summary").pop() ?? "");
  return m ? Number(m[1]) : NaN;
};
void lufs;
console.log("line      mix   voice     bed    lead");
let prev = 0;
for (const l of LINES) {
  const a = LINE_AT[l.id], b = lineEnd(l.id);
  if (a - prev > 1.0) console.log(`  gap ${prev.toFixed(1).padStart(5)}-${a.toFixed(1).padStart(5)} s: bed ${measure(wav, prev, a - prev).toFixed(1)} LUFS`);
  const mix = measure(wav, a, b - a), voice = measure(`media/voice2/${l.id}.mix.wav`, 0, b - a) + 3.01;
  const bedP = Math.pow(10, mix / 10) - Math.pow(10, voice / 10);
  const bed = bedP > 1e-5 ? 10 * Math.log10(bedP) : -Infinity;
  console.log(`${l.id}     ${mix.toFixed(1).padStart(6)}  ${voice.toFixed(1).padStart(6)}  ${Number.isFinite(bed) ? bed.toFixed(1).padStart(6) : "  <-45"}  ${Number.isFinite(bed) ? (voice - bed).toFixed(1).padStart(6) : "   >25"}`);
  prev = b;
}
if (SECONDS - prev > 1) console.log(`  gap ${prev.toFixed(1).padStart(5)}-${SECONDS.toFixed(1).padStart(5)} s: bed ${measure(wav, prev, SECONDS - prev).toFixed(1)} LUFS`);
