// The v2 score: an original waltz at 144 for accordion, nylon guitar, double bass, vibraphone, cello and a whistle,
// with the hand's foley on its cues. Written here as notes, then played by v2/score.tsx on raea's Tone.
// Sections of eight bars: A (D minor, the artist), B (its answer), M (the machine: a clockwork vamp), C (F major,
// Fingerprint). Usage: bun tools/compose2.ts   (writes v2/score.gen.json and media/score/fingerprint2.mid's notes list)
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CUE, NOTES, SLIP } from "../v2/act";
import { BAR, BARS, BEAT, SHOTS } from "../v2/time";

const ROOT = path.resolve(import.meta.dir, "..");
type Note = { t: number; n: string; d: number; v: number };
type Hit = { t: number; name: string; v: number; bus: "music" | "sfx" };
const tracks: Record<string, Note[]> = { acc: [], gtr: [], bass: [], vib: [], cello: [], whistle: [] };
const hits: Hit[] = [];
const at = (bar: number, beat = 0) => bar * BAR + beat * BEAT;
const put = (tr: string, bar: number, beat: number, n: string, beats: number, v: number) => tracks[tr].push({ t: at(bar, beat), n, d: beats * BEAT, v });
const hit = (t: number, name: string, v = 0.8, bus: "music" | "sfx" = "sfx") => hits.push({ t, name, v, bus });
const up = (n: string, oct: number) => n.replace(/(-?\d)$/, (o) => String(Number(o) + oct));

// ── the tunes: [beat, note, beats] a bar ─────────────────────────────────────────────────────────────────────
type Bar = [number, string, number][];
const A: Bar[] = [
  [[0, "A4", 1], [1, "D5", 1], [2, "F5", 1]],
  [[0, "E5", 2], [2, "D5", 1]],
  [[0, "D5", 1], [1, "G5", 1], [2, "A#5", 1]],
  [[0, "A5", 2], [2, "G5", 1]],
  [[0, "G5", 1], [1, "E5", 1], [2, "C#5", 1]],
  [[0, "E5", 1.5], [1.5, "D5", 0.5], [2, "C#5", 1]],
  [[0, "D5", 2.5]],
  [[1, "A4", 0.5], [1.5, "C#5", 0.5], [2, "E5", 0.5], [2.5, "G5", 0.5]],
];
const B: Bar[] = [
  [[0, "A#5", 1.5], [1.5, "A5", 0.5], [2, "G5", 1]],
  [[0, "D5", 2], [2, "G5", 1]],
  [[0, "A5", 1.5], [1.5, "G5", 0.5], [2, "F5", 1]],
  [[0, "D5", 2.5]],
  [[0, "E5", 1], [1, "G5", 1], [2, "A#5", 1]],
  [[0, "A5", 1], [1, "G5", 0.5], [1.5, "F5", 0.5], [2, "E5", 1]],
  [[0, "D5", 2], [2, "A4", 1]],
  [[0, "D5", 2.5]],
];
const C: Bar[] = [
  [[0, "C5", 1], [1, "F5", 1], [2, "A5", 1]],
  [[0, "C6", 2], [2, "A5", 1]],
  [[0, "A#5", 1], [1, "G5", 1], [2, "E5", 1]],
  [[0, "G5", 2], [2, "C5", 1]],
  [[0, "D5", 1], [1, "G5", 1], [2, "A#5", 1]],
  [[0, "A5", 1], [1, "G5", 1], [2, "E5", 1]],
  [[0, "F5", 2.5]],
  [[0, "E5", 1], [1, "C#5", 1], [2, "A4", 1]],
];
// harmony: the chord of each bar
const CH: Record<string, { root: string; fifth: string; chord: string[] }> = {
  Dm: { root: "D2", fifth: "A2", chord: ["F3", "A3", "D4"] },
  Gm: { root: "G2", fifth: "D3", chord: ["G3", "A#3", "D4"] },
  A7: { root: "A2", fifth: "E2", chord: ["G3", "C#4", "E4"] },
  Em: { root: "E2", fifth: "A#2", chord: ["E3", "G3", "A#3", "D4"] },
  F: { root: "F2", fifth: "C3", chord: ["F3", "A3", "C4"] },
  C7: { root: "C3", fifth: "G2", chord: ["E3", "A#3", "C4"] },
};
const HA = ["Dm", "Dm", "Gm", "Gm", "A7", "A7", "Dm", "A7"];
const HB = ["Gm", "Gm", "Dm", "Dm", "Em", "A7", "Dm", "Dm"];
const HC = ["F", "F", "C7", "C7", "Gm", "C7", "F", "A7"];
const HM = ["Dm", "Dm", "Dm", "Dm", "Dm", "Dm", "Dm", "A7"];

type Section = { from: number; kind: "A" | "B" | "C" | "M"; lead: "acc" | "both" | "whistle" | "none"; vib?: boolean; cello?: boolean; level: number };
const FORM: Section[] = [
  { from: 2, kind: "A", lead: "acc", level: 0.8 },
  { from: 10, kind: "B", lead: "acc", cello: true, level: 0.9 },
  { from: 18, kind: "A", lead: "acc", level: 0.85 },
  { from: 26, kind: "M", lead: "none", level: 0.7 },
  { from: 34, kind: "C", lead: "acc", vib: true, level: 1 },
  { from: 42, kind: "C", lead: "acc", vib: true, cello: true, level: 0.95 },
  { from: 50, kind: "B", lead: "acc", cello: true, level: 0.85 },
  { from: 58, kind: "A", lead: "acc", vib: true, level: 0.9 },
  { from: 66, kind: "C", lead: "both", vib: true, cello: true, level: 1 },
];
const TUNE = { A, B, C, M: [] as Bar[] };
const HARM = { A: HA, B: HB, C: HC, M: HM };

// the intro: bass and guitar set the waltz
for (let b = 0; b < 2; b++) {
  put("bass", b, 0, "D2", 1.6, 0.8);
  for (const q of [1, 2]) CH.Dm.chord.forEach((n) => put("gtr", b, q, n, 0.35, q === 1 ? 0.5 : 0.42));
}
for (const s of FORM) {
  for (let i = 0; i < 8; i++) {
    const bar = s.from + i;
    const h = CH[HARM[s.kind][i]];
    const stumble = bar === 16; // "badly": the band loses its place for a bar
    const swell = bar === 17; // "but with feeling": one held chord
    if (s.kind === "M") {
      // the machine: every beat alike, nothing sung
      for (let q = 0; q < 3; q++) {
        put("bass", bar, q, h.root, 0.45, 0.72);
        put("gtr", bar, q, "D3", 0.2, 0.42);
        put("gtr", bar, q + 0.5, "D3", 0.2, 0.3);
        hit(at(bar, q), "wood", 0.5, "music");
        hit(at(bar, q + 0.5), "wood", 0.3, "music");
      }
      continue;
    }
    if (swell) {
      put("bass", bar, 0, "A2", 3, 0.9);
      ["A3", "C#4", "E4", "G4"].forEach((n, k) => put("acc", bar, 0, n, 3, 0.62 + k * 0.04));
      ["E3", "A3"].forEach((n) => put("cello", bar, 0, n, 3, 0.8));
      ["G3", "C#4", "E4"].forEach((n) => { put("gtr", bar, 0, n, 0.4, 0.6); put("gtr", bar, 1.5, n, 0.4, 0.5); put("gtr", bar, 2.25, n, 0.4, 0.55); });
      hit(at(bar, 0), "marktrees", 0.6, "music");
      continue;
    }
    // bass on one, a step toward the next bar on three every other bar
    put("bass", bar, stumble ? 0.4 : 0, h.root, 1.4, 0.82 * s.level);
    if (i % 2 === 1 && !stumble) put("bass", bar, 2, h.fifth, 0.8, 0.6 * s.level);
    // guitar on two and three
    for (const q of [1, 2]) h.chord.forEach((n) => put("gtr", bar, stumble ? q + 0.3 * (q === 1 ? 1 : -0.5) : q, stumble ? up(n, 0).replace("D4", "D#4").replace("F3", "F#3") : n, 0.32, (q === 1 ? 0.5 : 0.42) * s.level));
    hit(at(bar, 1), "shaker", 0.32 * s.level, "music");
    hit(at(bar, 2), "shaker", 0.26 * s.level, "music");
    if (i === 7) hit(at(bar, 2.5), "cabasa", 0.4, "music");
    // the tune
    for (const [q, n, d] of TUNE[s.kind][i]) {
      const note = stumble ? n.replace("A", "G#").replace("D5", "C#5") : n;
      if (s.lead !== "whistle") put("acc", bar, stumble ? q + 0.18 : q, note, d * 0.96, (0.74 + (q === 0 ? 0.08 : 0)) * s.level);
      if (s.lead === "both") put("whistle", bar, q, up(n, 1), d * 0.9, 0.5);
      if (s.vib) put("vib", bar, q, up(n, 1), Math.max(d, 1.5), 0.42 * s.level);
    }
    if (s.cello) { put("cello", bar, 0, up(h.root, 1), 3, 0.5 * s.level); if (i % 4 === 3) put("cello", bar, 0, up(h.fifth, 1), 3, 0.4 * s.level); }
  }
}
// the tag: Dm, A7, Dm, and a last chord with the vibraphone rolled up it
const TAG = 74;
[["Dm", 0], ["A7", 1], ["Dm", 2]].forEach(([c, i]) => {
  const h = CH[c as string], bar = TAG + (i as number);
  put("bass", bar, 0, h.root, 1.4, 0.85);
  for (const q of [1, 2]) h.chord.forEach((n) => put("gtr", bar, q, n, 0.32, 0.5));
  hit(at(bar, 1), "shaker", 0.3, "music"); hit(at(bar, 2), "shaker", 0.25, "music");
});
[[0, "F5", 1], [1, "E5", 1], [2, "D5", 1]].forEach(([q, n, d]) => put("acc", TAG, q as number, n as string, d as number, 0.8));
[[0, "C#5", 1], [1, "E5", 1], [2, "A5", 1]].forEach(([q, n, d]) => put("acc", TAG + 1, q as number, n as string, d as number, 0.8));
put("acc", TAG + 2, 0, "D5", 2, 0.85); put("acc", TAG + 2, 0, "F5", 2, 0.7); put("acc", TAG + 2, 0, "A5", 2, 0.7);
["D4", "F4", "A4", "D5", "F5", "A5", "D6"].forEach((n, k) => put("vib", TAG + 2, k * 0.2, n, 5, 0.5));
put("bass", TAG + 3, 0, "D2", 2.5, 0.9);
["D3", "A3", "D4", "F4"].forEach((n) => put("gtr", TAG + 3, 0, n, 1.5, 0.6));
["D4", "F4", "A4"].forEach((n) => put("acc", TAG + 3, 0, n, 1.2, 0.8));
hit(at(TAG + 3, 0), "triangle", 0.7, "music");

// the machine has the taste of a boiled potato: the accordion sags
["F3", "E3", "D#3", "D3"].forEach((n, k) => tracks.acc.push({ t: CUE.potato - 0.35 + k * 0.3, n, d: 0.34, v: 0.6 }));
// Fingerprint: a bell on the name, both times
hit(CUE.name + 0.05, "triangle", 0.8, "music"); hit(CUE.name + 0.05, "fingercym", 0.6, "music");
hit(CUE.end + 0.05, "fingercym", 0.6, "music");

// ── the hand's foley ─────────────────────────────────────────────────────────────────────────────────────────
const S = Object.fromEntries(SHOTS.map((s) => [s[0], s[1] as number]));
for (const t of [0.62, 1.87, 3.12, CUE.jealous - 0.55, CUE.jealous + 0.35]) hit(t + 0.1, "drum", 0.6);
hit(S.draw + 0.55, "pencil-circle", 0.75); hit(S.draw + 2.4, "pencil-circle", 0.6);
hit(S.paint + 0.8, "brush", 0.85);
for (let b = 0; b < 5; b++) hit(S.conduct + b * BAR + 0.02, "whoosh", b >= 3 ? 0.6 : 0.4);
NOTES.forEach((n) => hit(n.from, "pencil", 0.7));
for (const t of [CUE.every + 1.0, CUE.same + 0.1, CUE.same + 0.75]) hit(t, "tap", 0.6);
hit(CUE.fast - 0.2, "ratchet", 0.4); hit(CUE.potato - 0.1, "whoosh", 0.6);
hit(S.print + 0.65, "dab", 0.7); hit(CUE.name - 0.1, "dab", 0.55); hit(CUE.name + 0.8, "stamp", 0.5);
hit(CUE.approve + 0.1, "ding", 0.6);
hit(CUE.pick + 0.12, "tap", 0.8); hit(SLIP.t0 + 0.05, "slide", 0.7);
hit(CUE.hotel - 0.6, "whoosh", 0.4);
hit(CUE.finds + 0.5, "pin", 0.6); hit(CUE.hate + 0.1, "pin", 0.6); hit(CUE.fixed + 0.1, "ding", 0.6); hit(CUE.tell + 0.1, "pin", 0.7);
hit(S.cover + 0.4, "slide", 0.5); hit(CUE.leaves - 0.7, "tape-pat", 0.7); hit(CUE.never + 0.3, "tape-pat", 0.6);
hit(S.work + 0.9, "pencil", 0.7);

for (const k of Object.keys(tracks)) tracks[k].sort((a, b) => a.t - b.t);
hits.sort((a, b) => a.t - b.t);

// the samples each instrument and hit plays
const M = path.join(ROOT, "media");
const files = (dir: string) => readdirSync(path.join(M, dir)).filter((f) => /\.(wav|mp3)$/.test(f)).sort();
const PITCHED: Record<string, string> = { acc: "sounds/fluid-accordion", gtr: "sounds/fluid-acoustic_guitar_nylon", bass: "sounds/tonejs-instruments-contrabass", vib: "sounds/vcsl-vibraphone", cello: "sounds/tonejs-instruments-cello", whistle: "sounds/fluid-whistle" };
const instruments: Record<string, Record<string, string>> = {};
for (const [name, dir] of Object.entries(PITCHED)) {
  instruments[name] = {};
  for (const f of files(dir)) {
    const m = /^([A-G])(s|#|b)?(-?\d)\./.exec(f);
    if (m) instruments[name][`${m[1]}${m[2] === "s" || m[2] === "#" ? "#" : m[2] ?? ""}${m[3]}`] = `${dir}/${f}`;
  }
}
const kit: Record<string, string[]> = {};
for (const dir of ["kit", "kit2"]) for (const f of files(dir)) { const name = f.replace(/-\d+\.wav$/, ""); (kit[name] ??= []).push(`${dir}/${f}`); }
const used = [...new Set(hits.map((h) => h.name))];
for (const u of used) if (!kit[u]) throw new Error(`compose2: no takes for ${u}`);

writeFileSync(path.join(ROOT, "v2/score.gen.json"), JSON.stringify({ bpm: 144, bars: BARS, tracks, hits, instruments, kit: Object.fromEntries(used.map((u) => [u, kit[u]])) }));
console.log(Object.entries(tracks).map(([k, v]) => `${k} ${v.length}`).join(", "), "| hits", hits.length, "| ends", Math.max(...Object.values(tracks).flat().map((n) => n.t + n.d)).toFixed(1));
