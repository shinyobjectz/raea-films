// The score, written as MIDI: tonal for the harmony (chord tones, scales, transposition), @tonejs/midi to write a
// Type 1 .mid any DAW opens, and the same events as JSON the composition plays through raea/tone on the open sample
// libraries. Sound effects are a track of their own (the foley kit, channel 10), so the score is driven by them:
// paper, pencil, scissors, stamps and a typewriter keep the time with recorded CC0 percussion.
// Run: bun tools/compose.ts   (writes media/score/score.mid and parts/score.gen.json)
import { Chord, Note } from "tonal";
import { Midi } from "@tonejs/midi";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BOARD_LEAD, BPM, FPS, word } from "../parts/timeline";

const ROOT = path.resolve(import.meta.dir, "..");
const SPB = 60 / BPM; // seconds a beat (0.625)
const t = (bar: number, beat = 0) => (bar * 4 + beat) * SPB;
const w = (id: string, wd: string, nth = 0) => word(id, wd, nth) / FPS; // a word's time, in seconds
const SLIDE_LEAD = BOARD_LEAD / FPS; // the paper-slide starts as the next board does

// a small seeded random, so the humanising is the same every run
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const human = (s: number, ms = 9) => s + (rnd() - 0.5) * 2 * (ms / 1000);
const vel = (v: number, by = 0.06) => Math.max(0.05, Math.min(1, v + (rnd() - 0.5) * 2 * by));

type Ev = { t: number; n: string; d: number; v: number };
type Hit = { t: number; name: string; v: number; bus: "music" | "sfx" };
const TRACKS = ["celesta", "piano", "pizz", "bass", "marimba", "glock", "clarinet", "bassoon", "strings"] as const;
type Track = (typeof TRACKS)[number];
const score: Record<Track, Ev[]> = Object.fromEntries(TRACKS.map((k) => [k, []])) as unknown as Record<Track, Ev[]>;
const hits: Hit[] = [];

const note = (tr: Track, s: number, n: string, beats: number, v: number, exact = false) =>
  score[tr].push({ t: exact ? s : human(s), n: Note.simplify(n), d: beats * SPB, v: vel(v) });
const at = (tr: Track, bar: number, beat: number, n: string, beats: number, v: number) => note(tr, t(bar, beat), n, beats, v);
/** a chord's tones from its symbol, voiced upward from `low` */
const tones = (sym: string, low: string) => {
  const c = Chord.get(sym);
  if (c.empty) throw new Error(`unknown chord ${sym}`);
  const out: string[] = [];
  let floor = Note.midi(low)!;
  for (const pc of c.notes) {
    let m = Note.midi(pc + "0")!;
    while (m < floor) m += 12;
    out.push(Note.fromMidi(m));
    floor = m + 1;
  }
  return out;
};
const block = (tr: Track, bar: number, beat: number, ns: string[], beats: number, v: number, strum = 0) =>
  ns.forEach((n, i) => note(tr, t(bar, beat) + i * strum, n, beats, v * (1 - i * 0.04)));
const hit = (s: number, name: string, v: number, bus: Hit["bus"] = "music") => hits.push({ t: s, name, v: vel(v, 0.05), bus });
const grid = (bar: number, beat: number, name: string, v: number, bus: Hit["bus"] = "music") => hit(human(t(bar, beat), 5), name, v, bus);

// The theme: a rising question that settles (D major). Six notes, in beats from its start.
const THEME: [number, string, number][] = [[0, "A4", 1], [1, "D5", 0.5], [1.5, "E5", 0.5], [2, "F#5", 1.5], [3.5, "E5", 0.5], [4, "D5", 2]];
const theme = (tr: Track, bar: number, beat: number, v: number, up = 0) =>
  THEME.forEach(([b, n, d]) => note(tr, t(bar, beat + b), Note.transpose(n, up ? "8P" : "1P"), d, v));

// ── A. The eye (bars 0-3): celesta and pencil, a held chord under the first lines
theme("celesta", 0, 0, 0.55);
[["Dmaj9", 0], ["Bm11", 1], ["Gmaj7#11", 2], ["A13sus4", 3]].forEach(([c, b]) => {
  block("strings", b as number, 0, tones(c as string, "F#3").slice(0, 4), 4, 0.22);
  at("bass", b as number, 0, (c as string)[0] === "B" ? "B1" : (c as string)[0] + "2", 3.5, 0.5);
});
for (let bar = 1; bar < 4; bar++) for (const b of [1, 3]) grid(bar, b + 0.5, "pencil", 0.22);
for (let bar = 0; bar < 4; bar++) at("pizz", bar, 0, ["D3", "B2", "G2", "A2"][bar], 0.5, 0.5);
// the theme's answer, once line 02 has ended
[["F#5", 0], ["E5", 0.5], ["C#5", 1]].forEach(([n, b]) => at("celesta", 3, 2.5 + (b as number), n as string, 0.5, 0.45));
// the red pencil circles each fault as it's named
hit(w("02", "dark"), "pencil-circle", 0.7, "sfx");
hit(w("02", "hiss"), "pencil-circle", 0.65, "sfx");
hit(w("02", "soft"), "pencil-circle", 0.7, "sfx");

// ── B. The same notes (bars 4-7): a pizzicato ostinato, scissors on 2 and 4, and the notes slapping down
hit(t(4) - SLIDE_LEAD, "slide", 0.6, "sfx");
const B = ["Bm", "G", "D/F#", "A"];
B.forEach((c, i) => {
  const bar = 4 + i;
  const ch = tones(c.split("/")[0], "B2");
  const pat = [ch[0], ch[2], Note.transpose(ch[0], "8P"), ch[2], ch[1], ch[2], Note.transpose(ch[0], "8P"), ch[2]];
  pat.forEach((n, k) => at("pizz", bar, k * 0.5, n, 0.4, k % 2 ? 0.32 : 0.45));
  at("bass", bar, 0, (c.includes("/") ? "F#" : c[0]) + "2", 1.5, 0.55);
  at("bass", bar, 2, (c.includes("/") ? "F#" : c[0]) + "2", 1, 0.45);
  for (const b of [1, 3]) grid(bar, b, "snip", 0.42);
  for (let k = 0; k < 8; k++) if (k % 2) grid(bar, k * 0.5, "wood", 0.18);
  if (bar >= 6) for (let k = 0; k < 16; k++) grid(bar, k * 0.25, "shaker", k % 4 === 0 ? 0.2 : 0.12);
});
hit(w("03", "cut"), "snip", 0.75, "sfx");
// the notes land faster and faster: bar 6 on the beat, bar 7 on the eighths after line 04 ends
export const NOTE_SLAPS = [t(6, 0), t(6, 1.5), t(6, 2.5), t(6, 3.5), t(7, 0), t(7, 0.5), t(7, 1), t(7, 1.5), t(7, 2)];
NOTE_SLAPS.forEach((s, i) => hit(s, "slap", 0.5 + i * 0.03, "sfx"));
// "again and again": the bassoon says the same note
[0.5, 1.5, 2, 2.5, 3, 3.5].forEach((b) => at("bassoon", 7, b, "A2", 0.35, 0.5));

// ── C. The fingerprint (bars 8-13): the stamp on the downbeat, then the whole band, quietly under the voice
hit(t(8) - SLIDE_LEAD, "slide", 0.55, "sfx");
hit(t(8), "stamp", 0.95, "sfx");
grid(8, 0, "kick", 0.6);
hit(t(8), "marktrees", 0.35, "sfx");
// the label typed as the voice says "fingerprint" (11 keys, one a 16th)
for (let k = 0; k < 11; k++) hit(w("05", "fingerprint") + k * SPB * 0.25, "key", 0.45, "sfx");
hit(w("05", "fingerprint") + 11 * SPB * 0.25 + 0.05, "ding", 0.35, "sfx");
const C: [string, string][] = [["Dadd9", "D2"], ["Gmaj7", "G1"], ["Bm7", "B1"], ["Em9", "E2"], ["Gmaj7#11", "G1"], ["A7sus4", "A1"]];
C.forEach(([c, root], i) => {
  const bar = 8 + i;
  block("piano", bar, 0, tones(c, "D3"), 3.5, 0.32, 0.012);
  at("bass", bar, 0, root, 2, 0.6);
  at("bass", bar, 2.5, Note.transpose(root, "5P"), 1, 0.45);
  block("strings", bar, 0, tones(c, "A3").slice(0, 4), 4, i === 0 ? 0.3 : 0.24);
  if (i >= 1) {
    const ch = tones(c, "D4");
    [0, 1, 2, 3, 2, 1, 3, 2].forEach((k, j) => at("marimba", bar, j * 0.5, ch[k % ch.length], 0.5, j % 2 ? 0.22 : 0.3));
    for (let k = 0; k < 16; k++) grid(bar, k * 0.25, "cabasa", k % 4 === 2 ? 0.16 : 0.08);
    grid(bar, 0, "kick", 0.35);
    grid(bar, 2.5, "kick", 0.25);
  }
});
// what you already do lands as each is named
hit(w("06", "approve"), "stamp", 0.8, "sfx");
hit(w("06", "pick"), "shutter", 0.75, "sfx");
hit(w("06", "notes"), "slap", 0.6, "sfx");
hit(w("06", "checks"), "pencil", 0.6, "sfx");
hit(w("06", "right"), "triangle", 0.4, "sfx");
// the theme, whole, once the voice has finished (bar 12 beat 3 to the end of bar 13)
theme("celesta", 12, 3, 0.5);
theme("marimba", 12, 3, 0.35, 1);
at("glock", 13, 3, "A5", 1, 0.35);

// ── D. Your words (bars 14-17): piano and celesta, intimate; a pencil writes each word
hit(t(14) - SLIDE_LEAD, "slide", 0.5, "sfx");
const D: [string, string][] = [["Dmaj9", "D2"], ["Bm9", "B1"], ["Gmaj9", "G1"], ["A7sus4", "A1"]];
D.forEach(([c, root], i) => {
  const bar = 14 + i;
  at("bass", bar, 0, root, 3.5, 0.45);
  block("strings", bar, 0, tones(c, "F#3").slice(0, 4), 4, 0.2);
  const ch = tones(c, "A4");
  // single piano notes, off the grid, a motif in fragments
  [[0.5, ch[1]], [1.75, ch[3] ?? ch[2]], [3.25, ch[2]]].forEach(([b, n]) => at("piano", bar, b as number, n as string, 1.5, 0.3));
});
hit(w("07", "too", 0), "pencil", 0.55, "sfx");
hit(w("07", "hiss"), "pencil", 0.55, "sfx");
hit(w("07", "too", 1), "pencil", 0.55, "sfx");
note("celesta", w("07", "look"), "C#6", 1, 0.4);
note("celesta", w("07", "sound"), "E6", 1, 0.4);
hit(w("07", "look"), "string", 0.55, "sfx");
hit(w("07", "sound"), "string", 0.55, "sfx");
at("piano", 17, 3, "C#5", 1, 0.35);

// ── E. The check (bars 18-23): a mechanism, typewriter keys for hats, a slit drum, the pizz bass walking
hit(t(18) - SLIDE_LEAD, "slide", 0.5, "sfx");
const E: [string, string][] = [["Bm7", "B1"], ["Gmaj7", "G1"], ["D", "D2"], ["A", "A1"], ["Bm7", "B1"], ["A7sus4", "A1"]];
E.forEach(([c, root], i) => {
  const bar = 18 + i;
  const walk = [root, Note.transpose(root, "5P"), Note.transpose(root, "8P"), Note.transpose(root, "5P")];
  walk.forEach((n, k) => at("pizz", bar, k, n, 0.6, 0.48));
  at("bass", bar, 0, root, 1.5, 0.5);
  block("strings", bar, 0, tones(c, "F#3").slice(0, 4), 4, 0.17);
  for (let k = 0; k < 16; k++) if (k % 2 === 1 || k % 8 === 6) grid(bar, k * 0.25, "key", k % 4 === 3 ? 0.2 : 0.12);
  grid(bar, 0, "slitlo", 0.4);
  grid(bar, 1.5, "slithi", 0.3);
  grid(bar, 2.75, "slitlo", 0.3);
  grid(bar, 3, "slithi", 0.25);
  if (i !== 4) [1, 3].forEach((b) => block("marimba", bar, b + 0.5, tones(c, "F#4").slice(0, 3), 0.4, 0.2));
});
// the strip advances under the lens: a ratchet at each stop
hit(t(18, 1), "ratchet", 0.4, "sfx");
hit(t(19, 1), "ratchet", 0.4, "sfx");
hit(w("08", "flagged"), "pin", 0.6, "sfx");
hit(w("08", "fixes"), "ding", 0.6, "sfx");
["D5", "F#5", "A5", "D6"].forEach((n, k) => note("glock", w("08", "fixes") + 0.15 + k * SPB * 0.5, n, 1, 0.42));
// the hiss: flagged, turned down and patched over, stamped, then really fixed
export const HISS = {
  flag: t(21, 0),
  knob: t(21, 1.5),
  patch: w("09", "hides"),
  stamp: w("09", "tell"),
  peel: t(23, 0.75),
  fixed: t(23, 2),
};
hit(HISS.flag, "pin", 0.55, "sfx");
hit(HISS.knob, "knob", 0.55, "sfx");
hit(HISS.patch - 0.25, "tape-rip", 0.5, "sfx");
hit(HISS.patch, "tape-pat", 0.6, "sfx");
hit(HISS.stamp, "stamp", 0.9, "sfx");
// the bassoon shrugs: still there
[["D3", 0], ["C#3", 0.5], ["C3", 1], ["B2", 1.5]].forEach(([n, b]) => note("bassoon", HISS.stamp + 0.1 + (b as number) * SPB, n as string, 0.45, 0.5));
hit(HISS.peel, "tape-rip", 0.6, "sfx");
hit(HISS.fixed, "handbell", 0.5, "sfx");
["A5", "D6", "F#6"].forEach((n, k) => note("glock", HISS.fixed + k * SPB * 0.5, n, 1.2, 0.4));

// ── F. Yours (bars 24-28): warm, the clarinet carries the theme between the lines
hit(t(24) - SLIDE_LEAD, "slide", 0.5, "sfx");
const F: [string, string][] = [["Gmaj7", "G1"], ["D/F#", "F#1"], ["Em7", "E2"], ["A7sus4", "A1"], ["Dmaj7", "D2"]];
F.forEach(([c, root], i) => {
  const bar = 24 + i;
  at("bass", bar, 0, root, 2, 0.5);
  at("bass", bar, 2, Note.transpose(root, "5P"), 2, 0.38);
  block("piano", bar, 0, tones(c.split("/")[0], "D3"), 3.5, 0.25, 0.015);
  block("strings", bar, 0, tones(c.split("/")[0], "A3").slice(0, 4), 4, 0.2);
  [1, 3].forEach((b) => grid(bar, b, "tape-pat", 0.16));
  for (let k = 0; k < 8; k++) grid(bar, k * 0.5, "shaker", k % 2 ? 0.08 : 0.12);
});
// the theme on clarinet in the gap between lines 10 and 11 (bar 25 beat 2.5), and its end after line 11
theme("clarinet", 25, 2.25, 0.42);
[["F#5", 0], ["A5", 0.5], ["E5", 1], ["D5", 2]].forEach(([n, b]) => at("clarinet", 28, 0.75 + (b as number), n as string, 1, 0.4));
hit(w("10", "computer"), "lid", 0.6, "sfx");
hit(w("10", "leaves"), "lock", 0.65, "sfx");
hit(w("11", "share"), "copier", 0.45, "sfx");
// three copies land, each with its own voice
export const COPIES = [w("11", "everyone"), w("11", "keeps"), w("11", "own")];
COPIES.forEach((s, i) => {
  hit(s, "slap", 0.5, "sfx");
  note(["celesta", "marimba", "glock"][i] as Track, s, ["F#5", "A5", "D6"][i], 1, 0.4);
});

// ── G. The end (bars 29-31): the theme with everyone, the print stamped as a signature, a held D6/9
hit(t(29) - SLIDE_LEAD, "slide", 0.5, "sfx");
theme("celesta", 29, 0, 0.45);
theme("pizz", 29, 0, 0.4);
at("bass", 29, 0, "G1", 4, 0.5);
block("strings", 29, 0, tones("Gmaj9", "B3").slice(0, 4), 4, 0.22);
block("piano", 29, 0, tones("Gmaj9", "D3"), 4, 0.25, 0.02);
hit(w("12", "fingerprint"), "stamp", 0.95, "sfx");
grid(30, 0, "kick", 0.4);
at("bass", 30, 0, "A1", 4, 0.5);
block("strings", 30, 0, tones("A7sus4", "C#4").slice(0, 4), 4, 0.22);
block("piano", 31, 0, ["D3", "A3", "E4", "F#4", "B4"], 4, 0.32, 0.03);
block("strings", 31, 0, ["D4", "F#4", "A4", "B4"], 4, 0.26);
at("bass", 31, 0, "D2", 4, 0.55);
["A5", "D6", "F#6", "A6"].forEach((n, k) => at("glock", 31, k * 0.5, n, 2, 0.32));
grid(31, 0, "fingercym", 0.4, "sfx");
hit(t(31, 0.25), "marktrees", 0.3, "sfx");

// ── write it: JSON for the composition, a Type 1 MIDI for any DAW (foley on channel 10, mapped by name)
for (const k of TRACKS) score[k].sort((a, b) => a.t - b.t);
hits.sort((a, b) => a.t - b.t);
const KIT = [...new Set(hits.map((h) => h.name))].sort();
const KIT_NOTE = Object.fromEntries(KIT.map((n, i) => [n, 35 + i]));
writeFileSync(path.join(ROOT, "parts/score.gen.json"), JSON.stringify({ bpm: BPM, tracks: score, hits, kit: KIT_NOTE }, null, 0));

const midi = new Midi();
midi.header.setTempo(BPM);
midi.header.name = "Fingerprint";
const GM: Record<Track, number> = { celesta: 8, piano: 0, pizz: 45, bass: 32, marimba: 12, glock: 9, clarinet: 71, bassoon: 70, strings: 48 };
TRACKS.forEach((k, ch) => {
  const tr = midi.addTrack();
  tr.name = k;
  tr.channel = ch >= 9 ? ch + 1 : ch;
  tr.instrument.number = GM[k];
  for (const e of score[k]) tr.addNote({ name: e.n, time: Math.max(0, e.t), duration: e.d, velocity: e.v });
});
const kit = midi.addTrack();
kit.name = "foley kit (" + KIT.map((n) => `${KIT_NOTE[n]} ${n}`).join(", ") + ")";
kit.channel = 9;
for (const h of hits) kit.addNote({ midi: KIT_NOTE[h.name], time: Math.max(0, h.t), duration: 0.1, velocity: h.v });
mkdirSync(path.join(ROOT, "media/score"), { recursive: true });
writeFileSync(path.join(ROOT, "media/score/score.mid"), Buffer.from(midi.toArray()));
const count = TRACKS.map((k) => `${k} ${score[k].length}`).join(", ");
console.log(`score: ${count}; foley and percussion ${hits.length} hits on ${KIT.length} sounds (${KIT.join(" ")})`);
