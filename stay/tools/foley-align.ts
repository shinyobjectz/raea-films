// Where each foley take's hits land against the picture's events, to pick the take that lines up (the director, 11-12: "more
// hunyan foley across the board ... then seeing where they line up").
// The events are what the picture does that makes a sound: the cursor's clicks, grabs and lets-go (v3/times.ts TICKS,
// the rooms' doors among them), every cut into a new shot inside the clip, and the glade's drop letting go. A take's hits
// are its onsets: the rise of its loudness in 10 ms steps (dB over the last 60 ms), peaks at least 6 dB up and 80 ms
// apart. Each event is matched to the nearest hit within 0.25 s; its miss is that distance, or 0.25 s with no hit.
// A take scores its mean miss (lower lines up better).
//   bun tools/foley-align.ts              every clip's takes (media/foley/lock/ID.wav is take 0, takes/ID-N.wav the rest)
//   bun tools/foley-align.ts pick         ... and lays each clip's best take as media/foley/lock/ID.wav (the one it
//                                         replaces kept as takes/ID-0.wav); STALE=id,id leaves take 0 out of those
//                                         clips (made from a picture that has changed since)
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { resolved } from "../v3/foley-cuts";
import { shot } from "../v3/plan";
import { TICKS } from "../v3/times";

const RATE = 16000, HOP = 160, WIN = 6, SEARCH = 0.25;
const stale = new Set((process.env.STALE ?? "").split(",").filter(Boolean));

async function hits(file: string): Promise<{ t: number; db: number }[]> {
  const p = Bun.spawn(["ffmpeg", "-nostdin", "-v", "error", "-i", file, "-ac", "1", "-ar", String(RATE), "-f", "f32le", "-"], { stdout: "pipe" });
  const buf = new Float32Array(await new Response(p.stdout).arrayBuffer());
  const db: number[] = [];
  for (let i = 0; i + HOP <= buf.length; i += HOP) {
    let s = 0;
    for (let j = i; j < i + HOP; j++) s += buf[j] * buf[j];
    db.push(10 * Math.log10(s / HOP + 1e-10));
  }
  const rise = db.map((d, i) => d - Math.min(...db.slice(Math.max(0, i - WIN), i + 1)));
  const out: { t: number; db: number }[] = [];
  for (let i = 1; i < rise.length - 1; i++) {
    if (rise[i] < 6 || rise[i] < rise[i - 1] || rise[i] < rise[i + 1] || db[i] < -50) continue;
    const t = (i * HOP) / RATE;
    if (out.length && t - out[out.length - 1].t < 0.08) { if (rise[i] > out[out.length - 1].db) out[out.length - 1] = { t, db: rise[i] }; continue; }
    out.push({ t, db: rise[i] });
  }
  return out;
}

type Ev = { t: number; what: string };
function events(c: ReturnType<typeof resolved>[number]): Ev[] {
  const ev: Ev[] = [];
  c.shots.forEach((id, i) => {
    const s = shot(id);
    if (i > 0) ev.push({ t: s.f0 / 30, what: `cut to ${id}` });
    for (const k of TICKS[id] ?? []) ev.push({ t: s.from + k.t, what: `${id} ${k.kind}` });
    if (id === "fern") ev.push({ t: s.from + 1.15, what: "the drop lets go" });
  });
  return ev.filter((e) => e.t >= c.f0 / 30 && e.t < c.f1 / 30).sort((a, b) => a.t - b.t);
}

const pick = process.argv[2] === "pick";
mkdirSync("media/foley/takes", { recursive: true });
const report: string[] = [];
for (const c of resolved()) {
  const ev = events(c);
  const takes: { n: number; file: string }[] = [];
  if (existsSync(`media/foley/lock/${c.id}.wav`) && !stale.has(c.id)) takes.push({ n: 0, file: `media/foley/lock/${c.id}.wav` });
  for (let n = 1; n <= 9; n++) if (existsSync(`media/foley/takes/${c.id}-${n}.wav`)) takes.push({ n, file: `media/foley/takes/${c.id}-${n}.wav` });
  if (!takes.length) { report.push(`${c.id}: no takes`); continue; }
  const scored = [];
  for (const tk of takes) {
    const h = (await hits(tk.file)).map((x) => ({ ...x, t: x.t + c.at }));   // (the wav starts at the clip's `at`, song seconds)
    const miss = ev.map((e) => { const d = Math.min(SEARCH, ...h.map((x) => Math.abs(x.t - e.t))); return d; });
    const score = ev.length ? miss.reduce((a, b) => a + b, 0) / ev.length : 0;
    scored.push({ ...tk, score, miss, hits: h.length });
  }
  scored.sort((a, b) => a.score - b.score || a.n - b.n);
  const best = scored[0];
  report.push(`${c.id.padEnd(11)} ${ev.length} events  ` + scored.map((s) => `take ${s.n}: ${(s.score * 1000).toFixed(0)} ms (${s.hits} hits)`).join("  ") + `  -> take ${best.n}`);
  for (const [i, e] of ev.entries()) report.push(`    ${e.t.toFixed(2)} s  ${e.what.padEnd(22)} ${scored.map((s) => (s.miss[i] >= SEARCH ? "  --  " : `${(s.miss[i] * 1000).toFixed(0).padStart(4)}ms`)).join(" ")}`);
  if (pick && best.n !== 0) {
    const lock = `media/foley/lock/${c.id}.wav`;
    if (existsSync(lock) && !existsSync(`media/foley/takes/${c.id}-0.wav`)) copyFileSync(lock, `media/foley/takes/${c.id}-0.wav`);
    copyFileSync(best.file, lock);
  }
}
console.log(report.join("\n"));
if (pick) console.log("\nlaid each clip's best take as media/foley/lock/ID.wav; bash tools/foley-mix.sh next");
