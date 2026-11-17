// The v2 score, played: tools/compose2.ts wrote the notes (v2/score.gen.json); here they become a Tone graph on raea's
// mixer. Six sampled instruments, each with its own treatment (the accordion through a chorus for a musette's
// shimmer, the vibraphone through a tremolo and a dotted echo, the whistle through a ping-pong echo), two rooms, a
// glue compressor, a tilt of EQ and a limiter on the music; the foley through its own compressor and limiter; both
// ducked under the voice. Built at the top level, as Tone in a composition must be.
import { staticFile } from "raea";
import * as Tone from "raea/tone";
import score from "./score.gen.json";

type Note = { t: number; n: string; d: number; v: number };
type Hit = { t: number; name: string; v: number; bus: "music" | "sfx" };
const S = score as unknown as { tracks: Record<string, Note[]>; hits: Hit[]; instruments: Record<string, Record<string, string>>; kit: Record<string, string[]> };

export const MUSIC_DB = 5;
export const SFX_DB = 2;

const musicCeiling = new Tone.Limiter(-6).connect(Tone.buses.music);
const glue = new Tone.Compressor({ threshold: -20, ratio: 2.4, attack: 0.02, release: 0.22 }).connect(musicCeiling);
const tilt = new Tone.EQ3({ low: 1.5, mid: -1, high: 1, lowFrequency: 160, highFrequency: 3800 }).connect(glue);
const hall = new Tone.Reverb({ decay: 2.2, wet: 0.22, preDelay: 0.015 }).connect(tilt);
const room = new Tone.Reverb({ decay: 0.8, wet: 0.14 }).connect(tilt);
const musette = new Tone.Chorus({ frequency: 2.6, delayTime: 3.2, depth: 0.5, wet: 0.45 }).connect(hall);
const shimmer = new Tone.Tremolo({ frequency: 5.2, depth: 0.35, wet: 0.7 }).connect(hall);
const echo = new Tone.FeedbackDelay({ delayTime: 0.3125, feedback: 0.28, wet: 0.22 }).connect(shimmer);
const pong = new Tone.PingPongDelay({ delayTime: 0.2083, feedback: 0.22, wet: 0.2 }).connect(hall);
const sfxCeiling = new Tone.Limiter(-6).connect(Tone.buses.sfx);
const sfxComp = new Tone.Compressor({ threshold: -18, ratio: 4, attack: 0.003, release: 0.12 }).connect(sfxCeiling);
const desk = new Tone.Reverb({ decay: 0.5, wet: 0.1 }).connect(sfxComp);

Tone.buses.music.volume.value = MUSIC_DB;
Tone.buses.sfx.volume.value = SFX_DB;
Tone.buses.voice.volume.value = 0;
Tone.buses.music.duck(Tone.buses.voice, { amount: -9, threshold: -42, attack: 0.05, release: 0.4 });
Tone.buses.sfx.duck(Tone.buses.voice, { amount: -3, threshold: -42, attack: 0.04, release: 0.3 });

// each library's level (sample peaks: FluidR3 about -18 dBFS, the vibraphone -36, tonejs-instruments -3) brought to
// about -10 dBFS, then set for its part
const VOICING: Record<string, { volume: number; release: number; to: Tone.ToneAudioNode }> = {
  acc: { volume: 9, release: 0.25, to: musette },
  gtr: { volume: 7, release: 0.35, to: room },
  bass: { volume: -3, release: 0.5, to: tilt },
  vib: { volume: 20, release: 2.2, to: echo },
  cello: { volume: -13, release: 0.9, to: hall },
  whistle: { volume: 1, release: 0.3, to: pong },
};
for (const [name, notes] of Object.entries(S.tracks)) {
  const v = VOICING[name];
  if (!v) throw new Error(`score: no voicing for ${name}`);
  const urls: Record<string, string> = {};
  for (const [note, file] of Object.entries(S.instruments[name])) urls[note] = staticFile(file);
  const inst = new Tone.Sampler({ urls, release: v.release, volume: v.volume }).connect(v.to);
  new Tone.Part((time: number, e: Note) => inst.triggerAttackRelease(e.n, e.d, time, e.v), notes.map((e) => [Math.max(0, e.t), e] as [number, Note])).start(0);
}

// the kit: one Sampler a bus holds every hit, three notes a sound (its takes), from note 24 up
const KIT_VOLUME: Record<string, number> = { shaker: -15, cabasa: -14, wood: -13, triangle: -12, fingercym: -11, marktrees: -10, drum: -6, "pencil-circle": -7, pencil: -10, brush: -5, whoosh: -9, tap: -7, ratchet: -12, dab: -7, stamp: -6, ding: -9, slide: -9, pin: -9, "tape-pat": -7 };
const NAMES = Object.keys(S.kit).sort();
const noteOf = (name: string, take: number) => 24 + NAMES.indexOf(name) * 3 + take;
const kitUrls: Record<string, string> = {};
for (const name of NAMES) S.kit[name].slice(0, 3).forEach((file, i) => (kitUrls[String(noteOf(name, i))] = staticFile(file)));
const kitMusic = new Tone.Sampler({ urls: kitUrls, release: 0.8, volume: -4 }).connect(room);
const kitSfx = new Tone.Sampler({ urls: kitUrls, release: 0.8, volume: -2 }).connect(desk);
const taken = new Map<string, number>();
const hits = [...S.hits].sort((a, b) => a.t - b.t).map((h) => {
  const takes = Math.min(3, S.kit[h.name].length);
  const i = taken.get(h.name) ?? 0;
  taken.set(h.name, i + 1);
  const v = Math.min(1, h.v * Tone.dbToGain(KIT_VOLUME[h.name] ?? -9));
  return [Math.max(0, h.t), { note: Tone.mtof(noteOf(h.name, i % takes)), v, sfx: h.bus === "sfx" }] as [number, { note: number; v: number; sfx: boolean }];
});
new Tone.Part((time: number, e: { note: number; v: number; sfx: boolean }) => (e.sfx ? kitSfx : kitMusic).triggerAttackRelease(e.note, 2.5, time, e.v), hits).start(0);

Tone.getTransport().start();
