// The v3 score, played: tools/compose3.ts wrote the notes (v3/score.gen.json); here they are a Tone graph on raea's
// mixer. Seven sampled instruments, each treated: the kalimba through a ping-pong echo, the vibraphone through a
// tremolo and a dotted echo, the wine glasses and psaltery through a chorus into a long hall, the harmonium through
// a slow auto-filter; a glue compressor, a tilt of EQ and a limiter on the music; the effects through their own
// compressor and limiter; both ducked under the voice. Built at the top level, as Tone in a composition must be.
import { staticFile } from "raea";
import * as Tone from "raea/tone";
import score from "./score.gen.json";

type Note = { t: number; n: string; d: number; v: number };
type Hit = { t: number; name: string; v: number; bus: "music" | "sfx" };
const S = score as unknown as { tracks: Record<string, Note[]>; hits: Hit[]; instruments: Record<string, Record<string, string>>; kit: Record<string, string[]> };

export const MUSIC_DB = 3;
export const SFX_DB = 2;
const musicCeiling = new Tone.Limiter(-9).connect(Tone.buses.music);
const glue = new Tone.Compressor({ threshold: -20, ratio: 2.4, attack: 0.02, release: 0.25 }).connect(musicCeiling);
const tilt = new Tone.EQ3({ low: 1, mid: -1, high: 1.5, lowFrequency: 170, highFrequency: 4000 }).connect(glue);
const hall = new Tone.Reverb({ decay: 3.4, wet: 0.3, preDelay: 0.02 }).connect(tilt);
const room = new Tone.Reverb({ decay: 1.0, wet: 0.15 }).connect(tilt);
const halo = new Tone.Chorus({ frequency: 0.8, delayTime: 4, depth: 0.6, wet: 0.5 }).connect(hall);
const shimmer = new Tone.Tremolo({ frequency: 4.4, depth: 0.3, wet: 0.7 }).connect(hall);
const echo = new Tone.FeedbackDelay({ delayTime: 0.46875, feedback: 0.3, wet: 0.24 }).connect(shimmer);
const pong = new Tone.PingPongDelay({ delayTime: 0.3125, feedback: 0.3, wet: 0.26 }).connect(room);
const breath = new Tone.AutoFilter({ frequency: 0.12, depth: 0.5, baseFrequency: 500, octaves: 2.2, wet: 0.8 }).connect(hall);
const sfxCeiling = new Tone.Limiter(-9).connect(Tone.buses.sfx);
const sfxComp = new Tone.Compressor({ threshold: -18, ratio: 4, attack: 0.003, release: 0.12 }).connect(sfxCeiling);
const space = new Tone.Reverb({ decay: 1.8, wet: 0.22 }).connect(sfxComp);

Tone.buses.music.volume.value = MUSIC_DB;
Tone.buses.sfx.volume.value = SFX_DB;
Tone.buses.voice.volume.value = 0;
Tone.buses.music.duck(Tone.buses.voice, { amount: -8, threshold: -42, attack: 0.05, release: 0.45 });
Tone.buses.sfx.duck(Tone.buses.voice, { amount: -3, threshold: -42, attack: 0.04, release: 0.3 });

// each library's level brought to about -10 dBFS (sample peaks: the kalimba and psaltery -13, the wine glasses -35,
// the vibraphone -36, tonejs-instruments -3), then set for its part
const VOICING: Record<string, { volume: number; release: number; to: Tone.ToneAudioNode }> = {
  drone: { volume: 0, release: 1.5, to: breath },
  glass: { volume: 30, release: 2.5, to: halo },
  kalimba: { volume: 2, release: 1.2, to: pong },
  vib: { volume: 22, release: 2.4, to: echo },
  bass: { volume: -6, release: 0.6, to: tilt },
  psaltery: { volume: -2, release: 2.0, to: halo },
  cello: { volume: -14, release: 1.2, to: hall },
};
for (const [name, notes] of Object.entries(S.tracks)) {
  const v = VOICING[name];
  if (!v) throw new Error(`score: no voicing for ${name}`);
  const urls: Record<string, string> = {};
  for (const [note, file] of Object.entries(S.instruments[name])) urls[note] = staticFile(file);
  const inst = new Tone.Sampler({ urls, release: v.release, volume: v.volume }).connect(v.to);
  new Tone.Part((time: number, e: Note) => inst.triggerAttackRelease(e.n, e.d, time, e.v), notes.map((e) => [Math.max(0, e.t), e] as [number, Note])).start(0);
}

const KIT_VOLUME: Record<string, number> = { shaker: -17, wood: -15, triangle: -12, fingercym: -11, marktrees: -9, swell: -7, pop: -3, ratchet: -12, shutter: -8, pin: -9, ding: -9, handbell: -8, lock: -7, meow: -5 };
const NAMES = Object.keys(S.kit).sort();
const noteOf = (name: string, take: number) => 24 + NAMES.indexOf(name) * 3 + take;
const kitUrls: Record<string, string> = {};
for (const name of NAMES) S.kit[name].slice(0, 3).forEach((file, i) => (kitUrls[String(noteOf(name, i))] = staticFile(file)));
const kitMusic = new Tone.Sampler({ urls: kitUrls, release: 0.8, volume: -4 }).connect(room);
const kitSfx = new Tone.Sampler({ urls: kitUrls, release: 1.2, volume: -2 }).connect(space);
const taken = new Map<string, number>();
const hits = [...S.hits].sort((a, b) => a.t - b.t).map((h) => {
  const takes = Math.min(3, S.kit[h.name].length);
  const i = taken.get(h.name) ?? 0;
  taken.set(h.name, i + 1);
  const v = Math.min(1, h.v * Tone.dbToGain(KIT_VOLUME[h.name] ?? -9));
  return [Math.max(0, h.t), { note: Tone.mtof(noteOf(h.name, i % takes)), v, sfx: h.bus === "sfx" }] as [number, { note: number; v: number; sfx: boolean }];
});
new Tone.Part((time: number, e: { note: number; v: number; sfx: boolean }) => (e.sfx ? kitSfx : kitMusic).triggerAttackRelease(e.note, 3, time, e.v), hits).start(0);

Tone.getTransport().start();
