// The tutorial's soundtrack, everything but the score (components/tut/score.ts): the narrator, the swamp, the foley and
// the end song, each placed in film seconds from components/tut/beats.json and components/tut/shots.ts, so a retiming
// moves them with the picture.
//
// Levels are set from measurements (ffmpeg ebur128, 11-16), against the narration's -17.7 LUFS (its takes compressed by
// tools/vo_comp.sh into assets/vo-comp/, so the master's gain doesn't drive its peaks into the limiter): the swamp's frogs
// and drips about 20 LU under it; a foley hit 8 to 14 LU under (a honk, Goose's own voice, about 6 under); the song where the narrator
// is quiet about level with him, and 12 dB under him where he speaks. Each source's measured loudness is in SRC, so a
// gain here reads as "this many LU under the voice". The master is one <Mix> at -14 LUFS (compositions/tutsound.tsx).
import { Audio, Sequence, staticFile } from "raea";
import { BEATS, KEY_DOWNS, PECKS, SONG, beat, fr, partsOf, said, word } from "./shots";

const VOICE = -17.7;
/** each take's integrated loudness (LUFS) */
const SRC: Record<string, number> = {
  peck: -19.6, key: -16.0, key_heavy: -16.4, clack: -18.4, whoomph: -18.3, snip: -29.0, ratchet: -23.2, slap: -19.7, plop: -21.5, frog: -15.3,
  honk_sigh: -5.7, honk_curious: -8.4, honk_offended: -7.3, honk_protest: -3.0, honk_proud: -3.9, honk_off: -11.2, power: -19.6, crt: -17.0,
  // v9's goose honks (tools/honks9.sh: Stable Audio Open, local; one call cut from each take, 11-16)
  honk9_offended: -10.5, honk9_yes: -11.7, honk9_off: -10.0,
  drip: -26.3, splash: -19.5, heron: -6.2, bed_a_hp: -12.6, bed_b_hp: -14.4, bed_d_hp: -14.4, bed_e_hp: -17.7, bed_f_hp: -15.4,
};
/** the gain that puts a take `under` LU below the narration */
const under = (name: string, lu: number) => +(VOICE - lu - SRC[name]).toFixed(1);

export type Cue = { id: string; t: number; src: string; gainDb: number | ((f: number) => number); bus: "voice" | "sfx" | "ambience" | "ui"; fadeIn?: number; fadeOut?: number; dur?: number; startFrom?: number };
const at = (id: string, s = 0) => +(beat(id).start + s).toFixed(3);
const fx = (name: string, t: number, lu: number, o: Partial<Cue> = {}): Cue => ({ id: `${name}@${t.toFixed(2)}`, t, src: `tut-sound/${name}.wav`, gainDb: under(name, lu), bus: "sfx", fadeIn: 0.004, ...o });
// a seeded wobble, so repeats (pecks, keys) don't sound copied
let seed = 7;
const wob = (db: number) => { seed = (seed * 16807) % 2147483647; return +(((seed / 2147483647) * 2 - 1) * db).toFixed(1); };

// ---- the moments the swamp's jokes sit on (v9's beats), which the sparse swamp keeps clear of
const CARDS = [at("04.01", word("04.01", "lands")), at("04.01", word("04.01", "First")), at("04.01", word("04.01", "stills") + 0.2), at("04.01", word("04.01", "cut")), at("04.02", 0.3)];
const CLACKS = [at("05.01", word("05.01", "planks") + 0.35), at("05.01", word("05.01", "planks") + 0.95)];
const FROGS_UP = [at("07.02", 2.75), at("07.02", 3.5)];
const PLOP = at("09.03", 5.3);
// each honk close on the line it answers, with the score's soft low note under the join (components/tut/score.ts): at
// +0.45 and +0.3 the sound fell to nothing between the line and the honk, and raea check heard dropouts (v9, 3:16, 4:56)
const HONK_OFFENDED = at("03.04", said("03.04") + 0.2), HONK_YES = at("04.04", said("04.04") + 0.12);
const HONKS9 = [HONK_OFFENDED, HONK_YES];

// ---- the narrator: every line, on the voice bus (the score and the swamp duck under it)
const VO: Cue[] = BEATS.flatMap((b) => b.lines.map((l, i) => ({ id: `vo-${b.id}-${i + 1}`, t: +(b.start + l.at).toFixed(3), src: l.file.replace(/^(vo\d*)\//, "$1-comp/"), gainDb: 0, bus: "voice" as const, fadeIn: 0.012, fadeOut: 0.03 })));

// ---- the swamp: no bed. The field-recorded beds ran under the whole film and read as white noise (the director, 11-16: "this
// hissing in the background the white noise is terrible"), so the swamp is now only what's in it: a frog or a drip now
// and then, in the swamp's own shots (never over the app), quiet (about 20 LU under the narrator), never within 1.5 s of
// a joke's own frog or drip, and none under the end song.
const SPARSE: Cue[] = (() => {
  const out: Cue[] = [];
  let r = 11;
  const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  const jokes = [...CARDS, ...CLACKS, ...FROGS_UP, PLOP, ...HONKS9];
  for (const b of BEATS) for (const p of partsOf(b)) {
    if (!("eye" in p.part) || p.seconds < 2.4) continue;
    const s0 = b.start + p.start, s1 = s0 + p.seconds;
    for (let t = s0 + 0.5 + rnd() * 1.5; t < s1 - 1.3; t += 5 + rnd() * 5) {
      if (t > SONG.at - 1 || jokes.some((j) => Math.abs(j - t) < 1.5)) continue;
      const frog = rnd() < 0.6;
      out.push(fx(frog ? "frog" : "drip", +t.toFixed(2), frog ? 21 + rnd() * 3 : 15 + rnd() * 3, { bus: "ambience", fadeOut: 0.08 }));
    }
  }
  return out;
})();

// ---- Goose: honks, each in a gap in the narration, 1 to 3 LU under it. v9 (the director on v8, a note: "a honk that
// sounds like a goose"): goose calls, not the old synthetic honks
const HONKS: Cue[] = [
  fx("honk9_offended", HONK_OFFENDED, 2, { fadeOut: 0.08 }),   // "'Honk' is not a condition." HONK, offended, at the lens
  fx("honk9_yes", HONK_YES, 2, { fadeOut: 0.06 }),             // "With me so far?" HONK: yes
  fx("honk9_off", at("11.02", 1.5), 8, { fadeOut: 0.2 }),      // on the end card, one honk, off
];

// ---- the glass and the keyboard: a beak's tick on every click, a key's clack on every key, typing where the app types
// (typing 13 LU under the narration: at 9 each clack's transient reached his peaks, 11-16)
const TYPING: [number, number, number][] = [   // [from, to, every] in film seconds
  [at("03.01", word("03.01", "name") - 0.4), at("03.01", word("03.01", "and") + 0.05), 0.15],   // the project's name ("give it a name")
  [at("03.02", word("03.02", "Then") - 0.1), at("03.02", word("03.02", "way") - 0.15), (word("03.02", "way") - word("03.02", "Then") + 0.1) / 7],   // stomped key by key: a hop a key (shots.ts TYPED)
  [at("03.02", word("03.02", "way")), at("03.02", word("03.02", "person") - 0.15), 0.12],          // the box filling, on the app
  [at("03.04", word("03.04", "slash") + 0.1), at("03.04", word("03.04", "goal") + 0.35), 0.15],   // "/goal "
  [at("03.04", said("03.04", 1) - 0.45), at("03.04", said("03.04", 1) + 0.2), 0.15],              // "honk"
  [at("03.05", word("03.05", "every") - 0.35), at("03.05", said("03.05") - 0.25), 0.11],   // "/goal every shot has me in it"
  [at("05.02", word("05.02", "wing") + 0.3), at("05.02", word("05.02", "said") - 0.15), 0.12],    // the note
  [at("07.04", word("07.04", "describe") + 0.2), at("07.04", word("07.04", "decide") - 0.25), 0.13],   // the controller's sentence
];
const KEYS: Cue[] = [
  ...KEY_DOWNS.map((k) => fx("key", k.at, 9, { gainDb: under("key", 9) + wob(1.5) })),
  ...TYPING.flatMap(([a, b, every]) => { const out: Cue[] = []; for (let t = a; t <= b; t += every) out.push(fx("key", +(t + wob(0.03)).toFixed(3), 13, { gainDb: under("key", 13) + wob(2) })); return out; }),
  ...[0, 0.2, 0.4].map((s) => fx("key", +(at("03.05", 0.05) + s).toFixed(3), 11)),       // Delete, Delete, Delete (v10: on the app, no stomp, a note
  fx("key_heavy", at("03.05", said("03.05") - 0.1), 11),                                    // the goal set
];
// every click on the app, and the click on raea in the Dock (01.01)
const PECK: Cue[] = [...PECKS, at("01.01", word("01.01", "Open") - 0.05)].map((t) => fx("peck", t, 12, { gainDb: under("peck", 12) + wob(1.5) }));

// ---- the rest of the swamp's jokes, from the script's cues
const FOLEY: Cue[] = [
  fx("power", at("00.01", 0.1), 8),                                            // the glass powers on
  ...CARDS.map((t) => fx("drip", t, 12)),                                      // a card lands in the feed (04.01, 04.02)
  ...CLACKS.map((t, i) => fx("clack", t, 9 + i)),                              // the plank wings, flapped
  fx("whoomph", at("05.06", said("05.06") + 1.2), 8),                          // planks to feathers, and the flap
  fx("ratchet", at("07.02", 0.4), 10, { dur: 1.1, fadeOut: 0.2 }),             // the Loudness knob, twisted to the top
  ...FROGS_UP.map((t, i) => fx("frog", t, 5 + i)),                             // the frogs get louder
  fx("ratchet", at("07.03", word("07.03", "minus") - 0.5), 13, { dur: 0.7, fadeOut: 0.2 }),   // and back down
  fx("heron", at("09.03", 0.0), 9, { dur: 0.55, fadeOut: 0.15 }),              // the heron's note: its croak's attack, before "The heron had notes."
  fx("plop", PLOP, 8),                                                         // the frog's verdict
  // v10: no slap: the footprint is gone with the Fingerprint page a note
];

// ---- the end song: the music video's own soundtrack, from 11.01 to the end, level with the narrator where he's quiet
// and 12 dB under him where he speaks; it fades out under the end card. On the ui bus: nothing ducks it but this.
const SONG_DB = VOICE - 0.8 - -13.8;   // its measured -13.8 LUFS brought just under the voice
const SPEAKS: [number, number][] = BEATS.filter((b) => b.chapter === "11").flatMap((b) => b.lines.map((l) => [b.start + l.at, b.start + l.at + l.seconds] as [number, number]));
function songDb(t: number) {
  let d = 0;
  for (const [a, b] of SPEAKS) {
    const inn = Math.min(1, Math.max(0, (t - (a - 0.25)) / 0.25)), out = Math.min(1, Math.max(0, ((b + 0.35) - t) / 0.35));
    d = Math.min(d, -12 * Math.min(inn, out));
  }
  return SONG_DB + d;
}
// its sound from assets/tut-song/goose-v5-song.wav: the same video's audio with its hissy top taken down (the song
// itself carries noise above 8 kHz, which the fingerprint heard as "hiss and static noise over everything", 11-16):
//   ffmpeg -i out/goose-v5.mp4 -vn -af "highshelf=f=8000:g=-8:t=s:w=0.7,lowpass=f=14000:p=2" -ar 48000 assets/tut-song/goose-v5-song.wav
const SONG_CUE: Cue = { id: "song", t: SONG.at, src: "tut-song/goose-v5-song.wav", startFrom: SONG.from, dur: SONG.cut - SONG.at, gainDb: (f: number) => songDb(SONG.at + f / 30), bus: "ui", fadeIn: 1.2, fadeOut: 1.6 };

export const CUES: Cue[] = [...VO, ...SPARSE, ...HONKS, ...KEYS, ...PECK, ...FOLEY, SONG_CUE].sort((a, b) => a.t - b.t);

/** every sound, in time order (the engine keys a sound's stretch by its place in the tree) */
export function Soundtrack({ only }: { only?: Cue["bus"] } = {}) {
  return (
    <>
      {CUES.filter((c) => !only || c.bus === only).map((c) => (
        <Sequence key={c.id} name={c.id} from={fr(c.t)} durationInFrames={c.dur ? Math.max(1, fr(c.dur)) : undefined} layout="none">
          <Audio src={staticFile(c.src)} gainDb={c.gainDb} bus={c.bus} fadeIn={c.fadeIn} fadeOut={c.fadeOut} startFrom={c.startFrom != null ? fr(c.startFrom) : undefined} />
        </Sequence>
      ))}
    </>
  );
}
