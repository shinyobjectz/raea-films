// The thermal film's score: MIDI written here, played on TokenSynth instruments (thermal-instruments.tsx made the
// candidates, curate.py picked a seed per root into instruments.gen.json). No drones and no pads (the director, 11-13): every
// sound is a struck or plucked note. D minor at 90 BPM, two bars a chord: Dm, Bb, Gm, A. The sections follow the
// narration (time.ts): a bass pulse alone for the hook, cellos when Fingerprint is named, glassy plucks and a
// heartbeat kick while it learns, everything stripped to bass and piano while it explains what it stands on (v3: the
// models, 04a to 05),
// the full drive for the agent's fixes, and the piano's motif resolving on D for the title.
import * as Tone from "raea/tone";
import { staticFile } from "raea";
import picks from "./instruments.gen.json";
import { INSTRUMENTS, noteName } from "./instruments";
import { BAR, BEAT, BPM, SECONDS, START, ends, said } from "./time";

Tone.getTransport().bpm.value = BPM;
Tone.buses.music.duck(Tone.buses.voice, { amount: -8 });
Tone.buses.music.volume.value = -4;

/** a Sampler of one instrument, each root from its curated seed */
function inst(name: keyof typeof INSTRUMENTS, volume: number, out: Tone.ToneAudioNode, release = 0.8) {
  const i = INSTRUMENTS[name];
  const chosen = (picks as Record<string, Record<string, number>>)[i.timbre] ?? {};
  const urls: Record<string, string> = {};
  for (const [midi, seed] of Object.entries(chosen)) Object.assign(urls, Tone.tokensynth(i.timbre, [noteName(Number(midi))], { seconds: i.seconds, seed }));
  if (!Object.keys(urls).length) throw new Error(`no curated roots for ${name}`);
  return new Tone.Sampler({ urls, release, volume }).connect(out);
}

const room = new Tone.Reverb({ decay: 4.5, wet: 0.3 }).connect(Tone.buses.music);
const soft = new Tone.Filter({ frequency: 3200, type: "lowpass", rolloff: -24 }).connect(room);
const dry = new Tone.Filter({ frequency: 2600, type: "lowpass", rolloff: -12 }).connect(Tone.buses.music);

const bass = inst("bass", -6, dry, 0.25);
const cello = inst("cello", -11, soft, 0.3);
const pluck = inst("pluck", -19, soft, 0.6);
const piano = inst("piano", -9, room, 1.6);
const kick = new Tone.Player({ url: staticFile("sounds/vcsl-bass-drum-2/bassdrum_hit_f.wav"), volume: -13 }).connect(dry);

// two bars a chord: the bass's root, the cellos' three notes, the plucks' four
const CHORDS: { root: string; cello: string[]; pluck: string[] }[] = [
  { root: "D2", cello: ["D3", "F3", "A3"], pluck: ["D5", "F5", "A5", "C6"] },
  { root: "A#1", cello: ["D3", "F3", "A#3"], pluck: ["D5", "F5", "A#5", "C6"] },
  { root: "G1", cello: ["D3", "G3", "A#3"], pluck: ["D5", "G5", "A#5", "D6"] },
  { root: "A1", cello: ["C#3", "E3", "A3"], pluck: ["C#5", "E5", "A5", "E6"] },
];
const chord = (bar: number) => CHORDS[Math.floor(bar / 2) % 4];
const BARS = Math.ceil(SECONDS / BAR);
const barOf = (t: number) => Math.floor(t / BAR + 1e-6);

// sections, in bars, from the lines that open them
const UNDER = barOf(START["04a"]);
const LEARN = barOf(START["05"]);
const DRIVE = barOf(START["14"]);
const TEAM = barOf(START["17"]);
const CELLOS = barOf(START["03"]);
// the pulse runs to a beat before the title's "Fingerprint": one beat of air, then the hit
const STOP = said("18", "Fingerprint") - BEAT;

for (let bar = 0; bar < BARS; bar++) {
  const c = chord(bar);
  const t0 = bar * BAR;
  if (t0 >= STOP) break;
  // the pulse: eighths on the root, accent on each beat, an octave up on the and of four; in the section on the models, quarters
  const listen = bar >= UNDER && bar < LEARN;
  for (let k = 0; k < 8; k++) {
    if (listen && k % 2) continue;
    const at = t0 + (k * BEAT) / 2;
    if (at >= STOP) break;
    const up = k === 7 && !listen;
    bass.triggerAttackRelease(up ? c.root.replace(/\d$/, (o) => String(Number(o) + 1)) : c.root, BEAT * 0.4, at, k % 2 ? 0.55 : 0.8);
  }
  // cellos: quarter-note stabs from the naming, eighths while it learns and drives, back to quarters for the team
  if (bar >= CELLOS && !listen) {
    const eighths = bar >= LEARN && bar < TEAM;
    const n = eighths ? 8 : 4;
    for (let k = 0; k < n && t0 + (k * BEAT * 4) / n < STOP; k++) cello.triggerAttackRelease(c.cello[k % 3], BEAT * 0.3, t0 + (k * BEAT * 4) / n, k % (n / 4) ? 0.45 : 0.7);
  }
  // plucks: a sixteenth arpeggio up and back while it learns and drives
  if (bar >= LEARN && bar < TEAM) {
    const seq = [...c.pluck, ...c.pluck.slice(1, -1).reverse()];
    for (let k = 0; k < 16; k++) pluck.triggerAttackRelease(seq[k % seq.length], BEAT * 0.2, t0 + (k * BEAT) / 4, k % 4 ? 0.3 : 0.5);
  }
  // the heartbeat: lub-dub on one while it learns, a kick on every beat in the drive
  if (bar >= LEARN && bar < DRIVE) { kick.start(t0); kick.start(t0 + BEAT * 0.5); kick.start(t0 + BEAT * 2); kick.start(t0 + BEAT * 2.5); }
  if (bar >= DRIVE && bar < TEAM) for (let k = 0; k < 4; k++) kick.start(t0 + k * BEAT);
}

// the piano's motif: A, F, E, D, falling, in fragments where a section turns and whole at the end
const MOTIF = ["A4", "F4", "E4", "D4"];
const motif = (t: number, n = 4, vel = 0.5) => { for (let k = 0; k < n; k++) piano.triggerAttackRelease(MOTIF[k], BEAT * 1.5, t + k * BEAT, vel - k * 0.04); };
motif(ends("01") + 0.1, 2, 0.45); // after "Every editor has a touch."
motif(LEARN * BAR - BEAT * 2, 2, 0.4);
for (let bar = UNDER; bar < LEARN; bar += 2) motif(bar * BAR + BEAT * 2, bar === UNDER ? 4 : 2, 0.42);
motif(TEAM * BAR, 3, 0.45);
// the title: the whole motif from the first "Fingerprint", landing on D with the bass's low D under it
const title = said("18", "Fingerprint");
motif(title, 4, 0.55);
piano.triggerAttackRelease(["D3", "A3", "D4"], BAR * 2, title + BEAT * 4, 0.42);
bass.triggerAttackRelease("D1", BAR * 1.5, title + BEAT * 4, 0.7);

Tone.getTransport().start();
