// The score, played: tools/compose.ts wrote it (parts/score.gen.json, and media/score/score.mid for a DAW) and
// tools/sounds.ts listed its samples (parts/sounds.gen.json). Here it becomes a Tone graph on raea's mixer: one
// Sampler per library instrument (FluidR3, VCSL, tonejs-instruments), one per sound effect with its takes on C4, D4,
// E4 so repeats round-robin, a room and a glue compressor on the music, and the music and effects ducked under the
// voice. Built at the top level, as Tone in a composition must be.
import { staticFile } from "raea";
import * as Tone from "raea/tone";
import score from "./score.gen.json";
import sounds from "./sounds.gen.json";

type Note = { t: number; n: string; d: number; v: number };
type Hit = { t: number; name: string; v: number; bus: "music" | "sfx" };
const S = score as unknown as { tracks: Record<string, Note[]>; hits: Hit[] };
const SOUNDS = sounds as unknown as { instruments: Record<string, Record<string, string>>; hits: Record<string, string[]> };

export const MUSIC_DB = 6;
export const SFX_DB = 4;

// ---- the buses -----------------------------------------------------------------------------------------------------
// the music: a glue compressor, then a limiter that keeps a stray peak off the master's ceiling
const musicCeiling = new Tone.Limiter(-6).connect(Tone.buses.music);
const glue = new Tone.Compressor({ threshold: -20, ratio: 2.2, attack: 0.03, release: 0.25 }).connect(musicCeiling);
const tone = new Tone.EQ3({ low: -1, mid: 0, high: 1.5, lowFrequency: 180, highFrequency: 4200 }).connect(glue);
const hall = new Tone.Reverb({ decay: 2.6, wet: 0.24, preDelay: 0.02 }).connect(tone);
const booth = new Tone.Reverb({ decay: 0.9, wet: 0.14 }).connect(tone); // the percussion's smaller room
// the foley: a fast compressor that rounds the transients (a stamp, a slap) and a limiter, then a room, not a hall
const sfxCeiling = new Tone.Limiter(-6).connect(Tone.buses.sfx);
const sfxComp = new Tone.Compressor({ threshold: -18, ratio: 4, attack: 0.003, release: 0.12 }).connect(sfxCeiling);
const desk = new Tone.Reverb({ decay: 0.6, wet: 0.1 }).connect(sfxComp);

// the bus levels set the balance; the master <Mix> sets the loudness (tools/mixcheck.sh measures the balance)
Tone.buses.music.volume.value = MUSIC_DB;
Tone.buses.sfx.volume.value = SFX_DB;
Tone.buses.voice.volume.value = 0;
Tone.buses.music.duck(Tone.buses.voice, { amount: -9, threshold: -42, attack: 0.06, release: 0.45 });
Tone.buses.sfx.duck(Tone.buses.voice, { amount: -3, threshold: -42, attack: 0.04, release: 0.3 });

// ---- the instruments -----------------------------------------------------------------------------------------------
// Each library was recorded at its own level (sample peaks: FluidR3 about -18 dBFS, VCSL marimba -33 and glockenspiel
// -26, the piano -12, tonejs-instruments -3 to -5); each volume brings its notes to about -10 dBFS at full velocity,
// then sets its part: the celesta leads, the strings sit under.
const VOICING: Record<string, { volume: number; release: number; room: "hall" | "booth" | "dry" }> = {
  celesta: { volume: 10, release: 1.4, room: "hall" },
  piano: { volume: 2, release: 1.2, room: "hall" },
  pizz: { volume: 6, release: 0.35, room: "booth" },
  bass: { volume: 9, release: 0.6, room: "dry" },
  marimba: { volume: 19, release: 0.6, room: "booth" },
  glock: { volume: 12, release: 1.6, room: "hall" },
  clarinet: { volume: -6, release: 0.5, room: "hall" },
  bassoon: { volume: -6, release: 0.3, room: "booth" },
  strings: { volume: 2, release: 1.8, room: "hall" },
};
const roomOf = (r: "hall" | "booth" | "dry") => (r === "hall" ? hall : r === "booth" ? booth : tone);

for (const [name, notes] of Object.entries(S.tracks)) {
  const v = VOICING[name];
  const map = SOUNDS.instruments[name];
  if (!v || !map) throw new Error(`score: no instrument for ${name}`);
  const urls: Record<string, string> = {};
  for (const [note, file] of Object.entries(map)) urls[note] = staticFile(file);
  const inst = new Tone.Sampler({ urls, release: v.release, volume: v.volume }).connect(roomOf(v.room));
  new Tone.Part(
    (time: number, e: Note) => inst.triggerAttackRelease(e.n, e.d, time, e.v),
    notes.map((e) => [Math.max(0, e.t), e] as [number, Note]),
  ).start(0);
}

// ---- the kit: the sound effects the score is made of -----------------------------------------------------------------
// One Sampler per bus holds every sound, as a drum kit is mapped: each sound gets three notes from 24 up, one per take,
// so repeats round-robin and each plays at its own pitch (raea's Tone graph takes 31 instruments and buses at most).
// every take is normalised to -1 dBFS (tools/sounds.ts); these set each sound's place in the kit, in dB
const KIT_VOLUME: Record<string, number> = {
  kick: -2, wood: -10, shaker: -16, cabasa: -14, key: -12, marktrees: -10, triangle: -12, fingercym: -10, handbell: -6, ratchet: -8,
  slitlo: -10, slithi: -12, pencil: -12, "pencil-circle": -6, slap: -4, slide: -8, snip: -6, stamp: 0, ding: -6, shutter: -4,
  "tape-rip": -6, "tape-pat": -10, knob: -6, pin: -6, lid: -4, lock: -4, copier: -6, string: -8,
};
const NAMES = Object.keys(SOUNDS.hits).sort();
const noteOf = (name: string, take: number) => 24 + NAMES.indexOf(name) * 3 + take;
const kitUrls: Record<string, string> = {};
for (const name of NAMES) SOUNDS.hits[name].forEach((file, i) => (kitUrls[String(noteOf(name, i))] = staticFile(file)));
const kitMusic = new Tone.Sampler({ urls: kitUrls, release: 0.8, volume: -4 }).connect(booth);
const kitSfx = new Tone.Sampler({ urls: kitUrls, release: 0.8, volume: -2 }).connect(desk);
const taken = new Map<string, number>();
const hits = [...S.hits].sort((a, b) => a.t - b.t).map((h) => {
  const takes = SOUNDS.hits[h.name]?.length;
  if (!takes) throw new Error(`score: no takes for ${h.name}`);
  const i = taken.get(h.name) ?? 0;
  taken.set(h.name, i + 1);
  const v = Math.min(1, h.v * Tone.dbToGain(KIT_VOLUME[h.name] ?? -8));
  return [Math.max(0, h.t), { note: Tone.mtof(noteOf(h.name, i % takes)), v, sfx: h.bus === "sfx" }] as [number, { note: number; v: number; sfx: boolean }];
});
new Tone.Part((time: number, e: { note: number; v: number; sfx: boolean }) => (e.sfx ? kitSfx : kitMusic).triggerAttackRelease(e.note, 2.5, time, e.v), hits).start(0);

Tone.getTransport().start();

export const SCORE_NOTES = Object.values(S.tracks).reduce((a, n) => a + n.length, 0);
export const SCORE_HITS = S.hits.length;
