// The film's sound under the song: each place's room tone, the rain, the sea, the cursor's clicks and the keys of what
// is typed, placed on the plan's own times and written as a stem of its own (so the levels can be measured against the
// song: the director, v7-8, "the sound eeffecst and ambience are too strong").   bun tools/sound.ts
//   -> out/v2/stems/effects.wav (the effects alone), out/v2/stems/song.wav (the song as mixed), out/v2/sound.wav (both)
// Levels are set from each sound's own measured level, to a number of dB under the song's (rooms 22, the rain and the
// sea 18, clicks and keys 20, the car 15): the bars the effects film measured for the same note.
import { SHOTS, FPS } from "../v2/plan";
import { BEATS, T0 } from "../v2/office.shots";

const SR = 48000, DIR = `${import.meta.dir}/..`;
const LEN = Math.round((SHOTS[SHOTS.length - 1].f1 / FPS) * SR);
const read = (file: string): Float32Array => {
  const r = Bun.spawnSync(["ffmpeg", "-v", "error", "-i", `${DIR}/${file}`, "-f", "f32le", "-ac", "1", "-ar", String(SR), "-"], { maxBuffer: 1 << 30 });
  if (r.exitCode !== 0) throw new Error(`${file}: ${r.stderr.toString()}`);
  return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.byteLength));
};
const db = (x: Float32Array) => { let s = 0; for (const v of x) s += v * v; return 10 * Math.log10(s / Math.max(1, x.length) + 1e-12); };
const song = read("media/music/stay.wav");
const SONG_GAIN = 10 ** (1.4 / 20);
const songDb = db(song) + 1.4;
const out = new Float32Array(LEN);
const cache = new Map<string, Float32Array>();
const sound = (name: string) => cache.get(name) ?? (cache.set(name, read(`media/sfx/${name}.wav`)), cache.get(name)!);

/** a sound laid from `at` seconds for `len` seconds (looped if it is shorter), `under` dB below the song, faded in and out */
function lay(name: string, at: number, len: number, under: number, fade = 0.4) {
  const src = sound(name), gain = 10 ** ((songDb - under - db(src)) / 20);
  const n = Math.round(len * SR), o = Math.round(at * SR), f = Math.round(Math.min(fade, len / 2) * SR);
  for (let i = 0; i < n && o + i < LEN; i++) {
    const env = Math.min(1, i / Math.max(1, f), (n - i) / Math.max(1, f));
    // a loop is crossed over itself for the last 0.3 s of each pass, so its join isn't heard
    out[o + i] += src[i % src.length] * gain * env;
  }
}
/** a short sound once (a click, a key): its first `len` seconds, `under` dB below the song measured on that part */
function hit(name: string, at: number, under: number, len = 0.25) {
  const src = sound(name).subarray(0, Math.round(len * SR)), gain = 10 ** ((songDb - under - db(src)) / 20), o = Math.round(at * SR);
  for (let i = 0; i < src.length && o + i < LEN; i++) out[o + i] += src[i] * gain * Math.min(1, (src.length - i) / (0.03 * SR));
}
const keys = (text: string, from: number, every = 0.045, under = 24) => { for (let i = 0; i < text.length; i++) if (text[i] !== " ") hit("key-1", from + i * every, under + (i % 3), 0.09); };

const at = (id: string) => { const s = SHOTS.find((x) => x.id === id); if (!s) throw new Error(id); return { t: s.f0 / FPS, len: (s.f1 - s.f0) / FPS }; };
const o = (T: number) => T0 + T;                                                        // the office take's clock on the film's

// the prompts and the notes: a key a letter
keys("a boring office", 0.5);
keys("a nicer office", o(BEATS.nicer));
keys("a new way to be creative", o(BEATS.creative));
const NOTES: [string, string, number, number][] = [   // shot, text, open, sent (seconds into the shot)
  ["06-app", "later in the day.", 1.5, 3.0], ["08-laundromat", "slower. let it float.", 1.9, 3.1], ["10-bedroom-2", "rain on the glass.", 0.5, 1.6],
  ["11-road", "soak the road.", 3.75, 4.6], ["12-garage", "headlights on.", 1.5, 2.5], ["28-sea", "that's the one. stay.", 1.2, 3.0],
];
for (const [id, text, open, sent] of NOTES) { const s = at(id); hit("click-1", s.t + open, 20); keys(text, s.t + open + 0.35, Math.min(0.055, (sent - open - 0.7) / text.length)); hit("click-1", s.t + sent, 22); }
for (const n of [BEATS.note, BEATS.note2]) { hit("click-1", o(n.open), 20); hit("click-1", o(n.sent), 22); }
keys("let the morning in.", o(BEATS.note.open) + 0.35, 0.055);
keys("somewhere worth staying.", o(BEATS.note2.open) + 0.35, 0.055);
// what the cursor picks up and puts down
for (const t of [o(BEATS.chair[0]), o(BEATS.chair[1]), at("08-laundromat").t + 0.35, at("08-laundromat").t + 1.5, at("09-bedroom").t + 1.5, at("09-bedroom").t + 2.7, at("07-canyon").t + 0.3, at("07-canyon").t + 1.15, at("12-garage").t + 0.3, at("12-garage").t + 1.4]) hit("click-1", t, 21);

// the office: the fittings' hum from the first picture until they are put out, then the room with the morning in it
lay("tubeon-1", T0, 2.5, 20, 0.05);
lay("hum-1", T0, o(BEATS.tubesOut[1]) - T0, 22, 0.6);
lay("powerdown-1", o(BEATS.tubesOut[0]), 2, 18, 0.05);
lay("office-1", o(BEATS.tubesOut[0]), at("06-app").t - o(BEATS.tubesOut[0]), 22, 1.2);
lay("whoosh-1", at("05-office-4").t - 0.25, 2, 18, 0.1);                                 // the reverse
lay("riser-1", at("07-canyon").t - 2.0, 2.0, 17, 0.6);                                   // into the viewer
// the places
lay("canyon-1", at("07-canyon").t, at("07-canyon").len, 20);
lay("hum-1", at("08-laundromat").t, at("08-laundromat").len, 22);
lay("forest-1", at("09-bedroom").t, at("09-bedroom").len, 24);
lay("rain-1", at("10-bedroom-2").t + 1.7, at("10-bedroom-2").len - 1.7, 18, 0.8);
lay("rainroad-1", at("11-road").t, at("11-road").len, 16, 0.3);
lay("carby-1", at("11-road").t + 3.5, 3, 15, 0.2);
lay("splash-1", at("11-road").t + 4.6, 1.9, 16, 0.05);
lay("garage-1", at("12-garage").t, at("12-garage").len, 20);
lay("sea-1", at("28-sea").t, at("28-sea").len + 1.5, 18, 1.2);

// where the song itself drops away (its stops), the same sounds would stand too near it: a shot whose effects are
// within 14 dB of the song there is brought down to 14 under, the change eased over 60 ms at its ends
const lvl = (x: Float32Array, i0: number, i1: number, g = 1) => { let q = 0; for (let i = i0; i < i1; i++) q += (x[i] ?? 0) * g * (x[i] ?? 0) * g; return 10 * Math.log10(q / Math.max(1, i1 - i0) + 1e-12); };
for (const sh of SHOTS) {
  const i0 = Math.round((sh.f0 / FPS) * SR), i1 = Math.round((sh.f1 / FPS) * SR);
  const gap = lvl(song, i0, i1, SONG_GAIN) - lvl(out, i0, i1);
  if (lvl(song, i0, i1) < -50 || gap >= 14) continue;
  const g = 10 ** (-(14 - gap) / 20), r = Math.round(0.06 * SR);
  for (let i = i0; i < i1; i++) { const e = Math.min(1, (i - i0) / r, (i1 - i) / r); out[i] *= 1 + (g - 1) * e; }
}

const write = (name: string, a: Float32Array, b?: Float32Array) => {
  const st = new Float32Array(LEN);
  for (let i = 0; i < LEN; i++) st[i] = a[i] + (b ? b[i] ?? 0 : 0);
  const p = Bun.spawnSync(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", String(SR), "-ac", "1", "-i", "-", "-ac", "2", "-c:a", "pcm_s24le", `${DIR}/out/v2/${name}`], { stdin: new Uint8Array(st.buffer) });
  if (p.exitCode !== 0) throw new Error(p.stderr.toString());
};
const songOut = new Float32Array(LEN);
for (let i = 0; i < LEN; i++) songOut[i] = (song[i] ?? 0) * SONG_GAIN;
write("stems/effects.wav", out);
write("stems/song.wav", songOut);
write("sound.wav", songOut, out);
console.log(`song ${songDb.toFixed(1)} dB, effects ${db(out).toFixed(1)} dB over the whole film (${(songDb - db(out)).toFixed(1)} dB under)`);
