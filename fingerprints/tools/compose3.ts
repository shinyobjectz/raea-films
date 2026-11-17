// The v3 score: slow, bright and a little amused, at 96. A harmonium drone and bowed wine glasses for the empty
// space, a kalimba for the ticking of small decisions, a vibraphone for the tune, a double bass, a psaltery for
// sparkle, a cello under Fingerprint's entrance. It stops dead when the brain is touched. Written here as notes,
// played by v3/score.tsx on raea's Tone. Usage: bun tools/compose3.ts   (writes v3/score.gen.json)
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BAR, BARS, BEAT, CUE } from "../v3/time";

const ROOT = path.resolve(import.meta.dir, "..");
type Note = { t: number; n: string; d: number; v: number };
type Hit = { t: number; name: string; v: number; bus: "music" | "sfx" };
const tracks: Record<string, Note[]> = { drone: [], glass: [], kalimba: [], vib: [], bass: [], psaltery: [], cello: [] };
const hits: Hit[] = [];
const at = (bar: number, beat = 0) => bar * BAR + beat * BEAT;
const put = (tr: string, bar: number, beat: number, n: string, beats: number, v: number) => { const t = at(bar, beat); if (t >= SILENT[0] && t < SILENT[1]) return; tracks[tr].push({ t, n, d: beats * BEAT, v }); };
const hit = (t: number, name: string, v = 0.8, bus: "music" | "sfx" = "sfx") => hits.push({ t, name, v, bus });
// the brain is touched: the music stops with it, and comes back when it does
const SILENT: [number, number] = [CUE.pop - 0.05, CUE.fine + 0.3];

let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
// eight bars of harmony, two bars a chord: root, the chord's tones (for the kalimba and the tune), the pad's notes
const CH = [
  { root: "D2", tones: ["D4", "F4", "A4", "C5", "E5"], pad: ["D3", "A3", "F4"] },
  { root: "A#1", tones: ["D4", "F4", "A4", "A#4", "D5"], pad: ["A#2", "F3", "D4"] },
  { root: "F2", tones: ["C4", "F4", "A4", "C5", "E5"], pad: ["F3", "C4", "A4"] },
  { root: "C2", tones: ["C4", "E4", "G4", "A4", "D5"], pad: ["C3", "G3", "E4"] },
];
const chordOf = (bar: number) => CH[Math.floor((bar % 8) / 2)];
// what plays in each bar: [from bar, layers]
type Layers = { drone?: number; glass?: number; kalimba?: 0 | 1 | 2; vib?: boolean; bass?: 0 | 1 | 2; psaltery?: boolean; cello?: boolean; shaker?: boolean; wood?: boolean };
const B = (sec: number) => Math.round(sec / BAR); // the bar a cue falls nearest
const FORM: [number, Layers][] = [
  [0, { drone: 0.5, glass: 0.5 }],
  [B(CUE.hand), { drone: 0.5, glass: 0.4, kalimba: 1 }],
  [B(CUE.lightning), { drone: 0.4, kalimba: 2, bass: 1, shaker: true }],
  [B(CUE.taste), { drone: 0.4, glass: 0.3, kalimba: 1, bass: 1, vib: true, shaker: true }],
  [B(CUE.pattern - 1.5), { drone: 0.5, glass: 0.5, psaltery: true, bass: 1 }],
  [B(CUE.videos), { drone: 0.3, bass: 2, wood: true, kalimba: 1 }],
  [B(CUE.name - 1), { drone: 0.5, glass: 0.4, kalimba: 2, bass: 1, vib: true, cello: true, shaker: true, psaltery: true }],
  [B(CUE.hides - 1), { drone: 0.4, bass: 2, wood: true, kalimba: 1 }],
  [B(CUE.machine - 1), { drone: 0.6, glass: 0.6, psaltery: true }],
  [B(CUE.creativity - 0.5), { drone: 0.5, glass: 0.4, kalimba: 2, bass: 1, vib: true, cello: true, shaker: true }],
  [B(CUE.cat - 0.5), { drone: 0.4, kalimba: 1, bass: 1 }],
];
const layersAt = (bar: number) => { let l = FORM[0][1]; for (const [b, x] of FORM) if (bar >= b) l = x; return l; };
// the tune: a phrase of eight bars for the vibraphone, as [bar in phrase, beat, tone index, beats]
const TUNE: [number, number, number, number][] = [
  [0, 0, 2, 1.5], [0, 1.5, 3, 0.5], [0, 2, 4, 2], [1, 1, 3, 1], [1, 2, 2, 2],
  [2, 0, 1, 1.5], [2, 1.5, 2, 0.5], [2, 2, 4, 2], [3, 1, 2, 3],
  [4, 0, 3, 1.5], [4, 1.5, 2, 0.5], [4, 2, 1, 2], [5, 1, 2, 1], [5, 2, 4, 2],
  [6, 0, 4, 1], [6, 1, 3, 1], [6, 2, 2, 1], [6, 3, 1, 1], [7, 0, 0, 4],
];
const up = (n: string, o: number) => n.replace(/(-?\d)$/, (x) => String(Number(x) + o));

for (let bar = 0; bar < BARS - 1; bar++) {
  const L = layersAt(bar), c = chordOf(bar);
  if (L.drone) { put("drone", bar, 0, c.pad[0], 4.2, L.drone * 0.7); put("drone", bar, 0, c.pad[1], 4.2, L.drone * 0.5); }
  if (L.glass) { put("glass", bar, 0, up(c.pad[2], 0), 4, L.glass * 0.8); if (bar % 2) put("glass", bar, 2, up(c.tones[3], 0), 2.4, L.glass * 0.6); }
  if (L.kalimba) {
    const step = L.kalimba === 2 ? 0.5 : 1;
    for (let q = 0; q < 4; q += step) {
      const i = Math.round(q / step);
      if (L.kalimba === 1 && rnd() < 0.18) continue; // it leaves a note out now and then, as a hand would
      const tone = c.tones[[0, 2, 1, 3, 2, 4, 1, 3][i % 8]];
      put("kalimba", bar, q, up(tone, L.kalimba === 2 && i % 4 === 3 ? 0 : -1), 0.9, (i % 2 ? 0.5 : 0.68) * (0.9 + rnd() * 0.2));
    }
  }
  if (L.bass) { put("bass", bar, 0, c.root, 1.6, 0.8); if (L.bass === 2) { put("bass", bar, 1.5, c.root, 0.4, 0.55); put("bass", bar, 2, up(c.root, 1), 0.8, 0.6); put("bass", bar, 3.5, c.root, 0.4, 0.5); } else if (bar % 2) put("bass", bar, 2.5, up(c.root, 1), 1, 0.55); }
  if (L.vib) for (const [b, q, i, d] of TUNE) if (b === bar % 8) put("vib", bar, q, up(chordOf(bar).tones[i], 1), Math.max(d, 1.5), 0.6);
  if (L.psaltery && bar % 2 === 0) [4, 2, 3, 1].forEach((i, k) => put("psaltery", bar, 2 + k * 0.25, up(c.tones[i], 1), 2, 0.45 - k * 0.05));
  if (L.cello) put("cello", bar, 0, up(c.root, 1), 4, 0.55);
  if (L.shaker) for (let q = 0; q < 4; q += 0.5) hit(at(bar, q), "shaker", q % 1 ? 0.2 : 0.32, "music");
  if (L.wood) for (let q = 0; q < 4; q += 0.5) hit(at(bar, q), "wood", q % 1 ? 0.28 : 0.45, "music");
}
// the last bar: one chord, let ring, and a single low note on "now"
["D3", "A3", "F4", "A4"].forEach((n) => put("drone", BARS - 1, 0, n, 4, 0.5));
["D5", "F5", "A5", "D6"].forEach((n, k) => put("vib", BARS - 2, 2 + k * 0.25, n, 5, 0.55));

// ── what the narrator sets off ───────────────────────────────────────────────────────────────────────────────
hit(CUE.hand - 0.6, "swell", 0.7);
hit(CUE.pop, "pop", 1.0);
hit(CUE.fine + 0.3, "swell", 0.5);
hit(CUE.this - 0.3, "marktrees", 0.5);
hit(CUE.looping - 0.4, "swell", 0.5);
hit(CUE.blue + 0.05, "ratchet", 0.5);
hit(CUE.vase + 0.05, "ratchet", 0.5);
hit(CUE.thatOne, "fingercym", 0.7); hit(CUE.know + 0.1, "handbell", 0.5); hit(CUE.thatOne - 0.3, "swell", 0.5);
hit(CUE.pattern - 1.2, "marktrees", 0.6);
hit(CUE.videos - 1.4, "shutter", 0.6);
hit(CUE.ai - 0.3, "swell", 0.5);
hit(CUE.dark - 0.2, "pin", 0.7); hit(CUE.hiss - 0.1, "pin", 0.7);
hit(CUE.name - 0.4, "swell", 0.8); hit(CUE.name + 0.1, "triangle", 0.8);
for (const t of [CUE.approve, CUE.pick, CUE.leave]) hit(t + 0.15, "ding", 0.6);
hit(CUE.fixed, "ding", 0.7); hit(CUE.fixed + 0.25, "ding", 0.6);
hit(CUE.there + 0.05, "handbell", 0.8); hit(CUE.there + 0.05, "pin", 0.8);
hit(CUE.machine - 0.5, "swell", 0.5); hit(CUE.leaves + 0.2, "lock", 0.7);
hit(CUE.cat - 1.2, "swell", 0.5); hit(CUE.consulted + 0.75, "meow", 0.8);
hit(CUE.end + 0.05, "triangle", 0.7); hit(CUE.end + 0.05, "fingercym", 0.6);

for (const k of Object.keys(tracks)) tracks[k].sort((a, b) => a.t - b.t);
hits.sort((a, b) => a.t - b.t);
const M = path.join(ROOT, "media");
const files = (dir: string) => readdirSync(path.join(M, dir)).filter((f) => /\.(wav|mp3)$/.test(f)).sort();
const PITCHED: Record<string, string> = { drone: "sounds/tonejs-instruments-harmonium", glass: "sounds/vcsl-wine-glasses", kalimba: "sounds/vcsl-kalimba-kenya", vib: "sounds/vcsl-vibraphone", bass: "sounds/tonejs-instruments-contrabass", psaltery: "sounds/vcsl-psaltery-bowed-and-plucked", cello: "sounds/tonejs-instruments-cello" };
const instruments: Record<string, Record<string, string>> = {};
for (const [name, dir] of Object.entries(PITCHED)) {
  instruments[name] = {};
  for (const f of files(dir)) { const m = /^([A-G])(s|#|b)?(-?\d)\./.exec(f); if (m) instruments[name][`${m[1]}${m[2] === "s" || m[2] === "#" ? "#" : m[2] ?? ""}${m[3]}`] = `${dir}/${f}`; }
}
const kit: Record<string, string[]> = {};
for (const dir of ["kit", "kit2"]) for (const f of files(dir)) { const name = f.replace(/-\d+\.wav$/, ""); (kit[name] ??= []).push(`${dir}/${f}`); }
const used = [...new Set(hits.map((h) => h.name))];
for (const u of used) if (!kit[u]) throw new Error(`compose3: no takes for ${u}`);
writeFileSync(path.join(ROOT, "v3/score.gen.json"), JSON.stringify({ bpm: 96, bars: BARS, tracks, hits, instruments, kit: Object.fromEntries(used.map((u) => [u, kit[u]])) }));
console.log(Object.entries(tracks).map(([k, v]) => `${k} ${v.length}`).join(", "), "| hits", hits.length);
