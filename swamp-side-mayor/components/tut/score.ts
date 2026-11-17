// The tutorial's score (the director, 11-16: "finish the video with full VO, sound design and backing music. try to use
// non-default midi instruments"): no General MIDI. Every instrument is a recorded one from the open libraries in
// assets/sounds (VCSL, CC0, and tonejs-instruments; each folder's LICENCE.txt): a bassoon for Goose, a tenor recorder,
// kalimba, marimba and a strumstick for the app, a contrabass under it, and a guiro, woodblock and slit drum for the
// swamp's jokes. In F major, the key the end song is in (its chroma, 11-16), so the score hands over to it cleanly.
//
// Its shape: the cold open walks Goose in on a plucked bass and kalimba from the first frame, waddles him off on the
// bassoon and stops dead when the narrator does; each chapter after opens on
// a small sting (the slit drum and the Goose motif or an arpeggio) and sits on a sparse bed (a contrabass note every
// two bars, single notes off any grid), resting a second before the next chapter and wherever a joke wants silence;
// the score ends on a cadence after "Close enough." and the song takes over at 11.01. Times are film seconds,
// from components/tut/beats.json, so it follows every retiming.
import { staticFile } from "raea";
import * as Tone from "raea/tone";
import { BEATS, beat, said, word } from "./shots";

/** one beat of the end song's tempo (90.11 bpm), so the score breathes at the song's pace */
export const Q = 60 / 90.11;
const at = (id: string, s = 0) => beat(id).start + s;
const chapterStart = (ch: string) => BEATS.find((b) => b.chapter === ch)!.start;

// ---- the room: everything through a low-pass (the voice owns the presence range) and a short wooden reverb
const lp = new Tone.Filter({ type: "lowpass", frequency: 3000, rolloff: -24 });
const room = new Tone.Reverb({ decay: 3, wet: 0.22 });
lp.connect(room);
room.connect(Tone.buses.music);
Tone.buses.music.volume.value = -14;   // the score alone measured -43.9 LUFS at -19 (11-16); in the mix at -16 its gaps sat 19-20 dB under the narrator's loudest, so 2 dB more
Tone.buses.music.duck(Tone.buses.voice, { amount: -8, attack: 0.08, release: 0.9 });
Tone.buses.ambience.duck(Tone.buses.voice, { amount: -3, attack: 0.15, release: 1.2 });

const kit = (dir: string, files: Record<string, string>) => Object.fromEntries(Object.entries(files).map(([n, f]) => [n, staticFile(`sounds/${dir}/${f}`)]));
const bassoon = new Tone.Sampler({ urls: kit("bassoon", { G2: "G2.mp3", A2: "A2.mp3", C3: "C3.mp3", G3: "G3.mp3", A3: "A3.mp3" }), release: 0.2, volume: 0 }).connect(lp);
const bass = new Tone.Sampler({ urls: kit("contrabass", { "F#1": "Fs1.mp3", G1: "G1.mp3", "A#1": "As1.mp3", C2: "C2.mp3", D2: "D2.mp3", E2: "E2.mp3", "F#2": "Fs2.mp3", "G#2": "Gs2.mp3", A2: "A2.mp3" }), release: 1.4, volume: -6 }).connect(lp);
const recorder = new Tone.Sampler({ urls: kit("tenor-recorder", { G3: "G3.wav", A3: "A3.wav", B3: "B3.wav", C4: "C4.wav", D4: "D4.wav", E4: "E4.wav", "F#4": "Fs4.wav", G4: "G4.wav", A4: "A4.wav", B4: "B4.wav", C5: "C5.wav" }), release: 0.25, volume: -4 }).connect(lp);
const kalimba = new Tone.Sampler({ urls: kit("kalimba", { G3: "G3.wav", "C#4": "Cs4.wav", "D#4": "Ds4.wav" }), release: 1.5, volume: -4 }).connect(lp);
// the same kalimba louder, for the pointer gag in 01.01 where nothing else plays (at -4 it sat 20 dB under the narrator)
const kalimbaUp = new Tone.Sampler({ urls: kit("kalimba", { G3: "G3.wav", "C#4": "Cs4.wav", "D#4": "Ds4.wav" }), release: 1.5, volume: 4 }).connect(lp);
const marimba = new Tone.Sampler({ urls: kit("marimba", { C2: "C2.wav", G2: "G2.wav", B2: "B2.wav", F3: "F3.wav", C4: "C4.wav", G4: "G4.wav", B4: "B4.wav", F5: "F5.wav" }), release: 1.2, volume: -6 }).connect(lp);
const strum = new Tone.Sampler({ urls: kit("strumstick", { D2: "D2.wav", E2: "E2.wav", "F#2": "Fs2.wav", G2: "G2.wav", A2: "A2.wav", B2: "B2.wav", D3: "D3.wav" }), release: 1, volume: -6 }).connect(lp);
// one-shots: each take on a note of its own, played at that note
const guiro = new Tone.Sampler({ urls: kit("guiro", { C4: "guiro_short.wav", D4: "guiro_short2.wav", E4: "guiro_short3.wav", F4: "Guiro_Hit_rr1_Mid.wav", G4: "Guiro_Med_rr1_Mid.wav" }), release: 0.3, volume: -6 }).connect(lp);
const wood = new Tone.Sampler({ urls: kit("woodblock", { C4: "wood_click_pp_rr1.wav", D4: "wood_click_pp_rr2.wav", E4: "wood_click_mp.wav" }), release: 0.2, volume: -10 }).connect(lp);
const slit = new Tone.Sampler({ urls: kit("slit-drum", { C3: "LogDrumLo_MedM_v2_rr1_Sum.wav", C4: "LogDrumHi_MedM_v2_rr1_Sum.wav" }), release: 0.6, volume: -2 }).connect(lp);

type Ev = { n: string | string[]; d: number; v: number };
const lists = new Map<Tone.Sampler, [number, Ev][]>();
function play(inst: Tone.Sampler, t: number, n: string | string[], d: number, v = 0.7) {
  if (!lists.has(inst)) lists.set(inst, []);
  lists.get(inst)!.push([+t.toFixed(3), { n, d, v }]);
}
/** a phrase in beats from `t0`: [beat, note, beats long, velocity?] */
function phrase(inst: Tone.Sampler, t0: number, notes: [number, string | string[], number, number?][], q = Q) {
  for (const [b, n, d, v] of notes) play(inst, t0 + b * q, n, d * q * 0.95, v ?? 0.7);
}
// a seeded random, so a render is the same every time
let seed = 0x5eed;
const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };

// ---- Goose's motif: a pompous little march, C F FG A G E F
const MOTIF: [number, string, number][] = [[0, "C3", 0.5], [0.5, "F3", 0.5], [1, "F3", 0.25], [1.25, "G3", 0.25], [1.5, "A3", 0.5], [2, "G3", 0.5], [2.5, "E3", 0.5], [3, "F3", 0.9]];

// ---- 00.01-00.02: music from the first frame (the director, 11-16: "we should already hear music"). Goose walks in to a
// plucked walking bass and the kalimba, the woodblock on his steps, building as he nears the keyboard; a marimba climb
// as his wings open on the star's pose, the slit drum on the pose, the recorder holding under "from start to finish";
// then a breath before the motif waddles him off (00.03)
{
  const w0 = 0.12, wEnd = at("00.02") - 0.15;
  const WALK = ["F1", "A1", "C2", "A1", "A#1", "D2", "C2", "A1"], KAL = ["C4", "A3", "F4", "C4", "A#3", "D4", "C4", "G3"];
  for (let b = 0; w0 + b * Q < wEnd; b++) {
    const t = w0 + b * Q, up = Math.min(1, b / 6);
    // (at 0.5 the first cut sat 25 dB under the narrator in his breaths, too quiet to read as music: about 4 dB up)
    play(bass, t, WALK[b % WALK.length], 0.5, 0.78 + 0.17 * up);
    play(wood, t + 0.5 * Q, b % 2 ? "D4" : "C4", 0.1, 0.5 + 0.15 * up);
    play(kalimba, t + 0.5 * Q, b % 2 ? KAL[(b >> 1) % KAL.length] : KAL[((b >> 1) + 3) % KAL.length], 0.9, (b % 2 ? 0.7 : 0.5) + 0.25 * up);
  }
  const s0 = at("00.02", 0.18);   // his wings open: the star's crouch, then up
  phrase(marimba, s0, [[0, "F3", 0.25, 0.6], [0.25, "A3", 0.25, 0.66], [0.5, "C4", 0.25, 0.72], [0.75, "F4", 1, 0.82]]);
  play(slit, s0 + 0.75 * Q, "C4", 0.5, 0.7); play(bass, s0 + 0.75 * Q, "F1", 2.6, 0.62);
  play(recorder, s0 + 1.75 * Q, "C4", 1.4, 0.45); play(recorder, s0 + 1.75 * Q + 1.45, "F4", 1.6, 0.5);
}

// ---- 01.01: raea's window opens out of the Dock: two notes up
{
  const t = at("01.01", word("01.01", "Open") + 0.65);
  play(kalimbaUp, t, "C4", 1, 0.6); play(kalimbaUp, t + 0.32, "G4", 1.4, 0.65);
}
// ---- 02.01: each AI lit as it's named, a note up the kalimba
(["Claude", "ChatGPT", "Gemini", "Kimi"] as const).forEach((n, k) => play(kalimbaUp, at("02.01", word("02.01", n)), ["C4", "E4", "G4", "C5"][k], 1.2, 0.5 + 0.04 * k));

// ---- the chapters' beds: a held contrabass, a soft pulse on every beat, and a few single notes
const CHORDS: Record<string, { root: string; tones: string[] }> = {
  F: { root: "F1", tones: ["F", "A", "C"] }, Dm: { root: "D2", tones: ["D", "F", "A"] }, Bb: { root: "A#1", tones: ["A#", "D", "F"] },
  C: { root: "C2", tones: ["C", "E", "G"] }, Gm: { root: "G1", tones: ["G", "A#", "D"] }, Am: { root: "A1", tones: ["A", "C", "E"] },
};
const PROG: Record<string, string[]> = {
  "01": ["F", "Dm", "Bb", "C"], "02": ["Bb", "C", "F", "F"], "03": ["F", "Am", "Bb", "C"], "04": ["Dm", "Bb", "F", "C"], "05": ["F", "Dm", "Gm", "C"],
  "06": ["Bb", "F", "C", "F"], "07": ["F", "Am", "Dm", "C"], "08": ["Dm", "Bb", "F", "C"], "09": ["Bb", "C", "Am", "Dm"], "10": ["F", "Bb", "C", "F"],
};
// each chapter's voice for its single notes, and its sting
const LEAD: Record<string, Tone.Sampler> = { "01": kalimba, "02": marimba, "03": strum, "04": kalimba, "05": marimba, "06": strum, "07": kalimba, "08": marimba, "09": strum, "10": kalimba };
// each lead's range, as MIDI notes (within a few semitones of its samples)
const RANGE: Map<Tone.Sampler, [number, number]> = new Map([[kalimba, [55, 70]], [marimba, [60, 81]], [strum, [50, 62]]]);
const PC: Record<string, number> = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
const NAMES = Object.keys(PC);
const nameOf = (m: number) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
/** a chord's tones within a range, as MIDI notes */
const within = (tones: string[], [lo, hi]: [number, number]) => { const out: number[] = []; for (let m = lo; m <= hi; m++) if (tones.some((t) => PC[t] === m % 12)) out.push(m); return out; };
/** a chord climbing from its root in octave 4, then the root again an octave up */
const climb = (tones: string[]) => { let m = 60 + PC[tones[0]]; const out = [m]; for (const t of tones.slice(1)) { m += ((PC[t] - m) % 12 + 12) % 12 || 12; out.push(m); } out.push(out[0] + 12); return out.map(nameOf); };
// where the bed rests (v9): the desktop (01.01), the held beat on "/goal honk" and Goose's honk back (03.04), "With me so
// far?" and its honk (04.04), the reviews (09.03), and the end of 10 (the slap, "Close enough.", the cadence)
const REST: [number, number][] = [[at("01.01"), at("01.02")], [at("03.04", said("03.04", 1) + 0.2), at("03.05")], [at("04.04") - 0.1, at("04.05", 0.4)], [at("09.03") - 0.1, at("10.01")], [at("10.04") - 0.2, 999]];
const resting = (t: number) => REST.some(([a, b]) => t >= a && t < b);
const restAfter = (t: number) => Math.min(...REST.filter(([a]) => a > t).map(([a]) => a), 999);

const CHAPTERS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
CHAPTERS.forEach((ch, i) => {
  const s = chapterStart(ch), e = i + 1 < CHAPTERS.length ? chapterStart(CHAPTERS[i + 1]) : at("11.01");
  const prog = PROG[ch], lead = LEAD[ch], range = RANGE.get(lead)!;
  // the sting: the slit drum, and the motif's head on the recorder (odd chapters) or the chord climbing the marimba
  if (ch !== "01") {
    play(slit, s, "C3", 0.5, 0.6);
    const c = CHORDS[prog[0]];
    if (i % 2) phrase(recorder, s + 0.05, [[0, "C4", 0.5, 0.55], [0.5, "F4", 0.5, 0.6], [1, "A4", 0.5, 0.6], [1.5, "F4", 1, 0.55]]);
    else phrase(marimba, s + 0.05, climb(c.tones).map((n, k) => [k * 0.5, n, 1.5, 0.5 - k * 0.02] as [number, string, number, number]));
  }
  // the bed: a contrabass note every two bars, and two or three single notes a chord, off any grid
  const bedFrom = ch === "01" ? at("01.02") : s + 2.2, bedTo = e - 0.9;
  for (let k = 0, t = s; t < bedTo; k++, t += 8 * Q) {
    const c = CHORDS[prog[k % prog.length]];
    if (t >= bedFrom - 0.01 || k > 0) {
      const from = Math.max(t, bedFrom);
      if (!resting(from) && bedTo - from > 1.2) play(bass, from, c.root, Math.min(7 * Q, bedTo - from, restAfter(from) - from - 0.2), 0.45);
    }
    // the pulse: the chord broken softly on every beat (root, fifth, third, fifth), so the music never drops out under
    // the narration now that no swamp bed fills its gaps (the director, 11-16); on the kalimba, or the marimba where the
    // kalimba leads
    const pulse = lead === kalimba ? marimba : kalimba, pr = RANGE.get(pulse)!, ms0 = within(c.tones, pr);
    const root = ms0.find((m) => m % 12 === PC[c.tones[0]])!, third = ms0.find((m) => m > root && m % 12 === PC[c.tones[1]]) ?? root, fifth = ms0.find((m) => m > root && m % 12 === PC[c.tones[2]]) ?? root;
    for (let q = 0; q < 8; q++) {
      const tq = t + q * Q;
      if (tq < bedFrom || tq > bedTo - 0.5 || resting(tq) || restAfter(tq) - tq < 0.6) continue;
      play(pulse, tq, nameOf([root, fifth, third, fifth][q % 4]), 0.8, q % 4 === 0 ? 0.34 : 0.24);
    }
    const n = 2 + (rnd() < 0.4 ? 1 : 0);
    for (let j = 0; j < n; j++) {
      const tt = t + (j + 0.2 + rnd() * 0.6) * (8 * Q / n);
      if (tt < bedFrom || tt > bedTo - 0.4 || resting(tt)) continue;
      const ms = within(c.tones, range);
      play(lead, tt, nameOf(ms[Math.floor(rnd() * ms.length)]), 1.5, 0.35 + rnd() * 0.15);
    }
  }
});

// ---- the jokes and the moments the music marks
// 03.04: "'Honk' is not a condition.": one low bassoon note under the honk back
play(bassoon, at("03.04", said("03.04") + 0.25), "F2", 0.5, 0.6);
// under the joins of the two rests' lines and Goose's honks back, a soft low note from just before the line ends into
// the honk, so the rest is a held breath, never the sound gone (raea check: dropouts at 3:16 and 4:56)
play(bass, at("03.04", said("03.04") - 0.35), "F1", 1.0, 0.22);
play(bass, at("04.04", said("04.04") - 0.3), "C2", 0.7, 0.2);
// 05.06: the planks pop into feathers and he flaps, up the marimba
["F3", "A3", "C4", "F4", "A4", "C5", "F5"].forEach((n, k) => play(marimba, at("05.06", said("05.06") + 1.15) + k * 0.055, n, 1.2, 0.35 + k * 0.03));
// 07.02: the frogs get louder, on the guiro
[2.7, 3.0, 3.25, 3.55, 3.8].forEach((s, k) => play(guiro, at("07.02", s), ["C4", "D4", "E4", "D4", "G4"][k], 0.4, 0.55 + k * 0.05));
// 09.03: the deer's approval (two notes up), the frog's leap (a guiro scrape), and "Reviews were mixed." (a bassoon bwomp)
play(kalimba, at("09.03", 2.35), "F4", 1.2, 0.5); play(kalimba, at("09.03", 2.55), "A4", 1.4, 0.55);
play(guiro, at("09.03", 4.55), "G4", 0.5, 0.5);
phrase(bassoon, at("09.03", said("09.03") + 0.1), [[0, "A2", 0.45, 0.6], [0.5, "G#2", 0.9, 0.55]]);
// 10.04, after "Close enough.": the score's last chord, rung out before the song
{
  const t = at("10.04", 1.55);
  play(bass, t, "F1", 1.6, 0.55); play(bassoon, t, "F2", 1.0, 0.6);
  ["F3", "A3", "C4", "F4"].forEach((n, k) => play(marimba, t + k * 0.04, n, 1.6, 0.45));
  play(slit, t, "C3", 0.5, 0.5);
}

for (const [inst, evs] of lists) new Tone.Part((time: number, e: Ev) => inst.triggerAttackRelease(e.n, e.d, time, e.v), evs.sort((a, b) => a[0] - b[0])).start(0);
Tone.getTransport().start();

/** how many notes each instrument plays (for the render's log) */
export const SCORE_NOTES = [...lists.values()].reduce((a, l) => a + l.length, 0);
