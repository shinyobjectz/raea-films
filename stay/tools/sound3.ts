// v3's sound under the song. The idea follows the picture's: a drawing is silent, and a place has its sound from the
// moment it turns real. The cursor's clicks mark what it takes, puts down and touches. Everything is well under the
// song (the director, v7-8: "the sound eeffecst and ambience are too strong"): rooms 22 dB under, rain and sea 18, clicks 20,
// the car 15, measured on each sound's own level, and brought down further wherever the song itself drops away.
//   bun tools/sound3.ts  ->  out/v3/stems/effects.wav (mono), out/v3/stems/song.wav
// (tools/v3.sh mixes the effects under the song's own stereo file.)
import { SHOTS, FPS, LENGTH, shot } from "../v3/plan";

const SR = 48000, DIR = `${import.meta.dir}/..`, LEN = Math.round(LENGTH * SR);
const read = (file: string): Float32Array => {
  const r = Bun.spawnSync(["ffmpeg", "-v", "error", "-i", `${DIR}/${file}`, "-f", "f32le", "-ac", "1", "-ar", String(SR), "-"], { maxBuffer: 1 << 30 });
  if (r.exitCode !== 0) throw new Error(`${file}: ${r.stderr.toString()}`);
  return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.byteLength));
};
const db = (x: Float32Array, a = 0, b = x.length, g = 1) => { let s = 0; for (let i = a; i < b; i++) s += (x[i] ?? 0) * g * (x[i] ?? 0) * g; return 10 * Math.log10(s / Math.max(1, b - a) + 1e-12); };
const song = read("media/music/stay.wav"), SONG_GAIN = 10 ** (1.4 / 20), songDb = db(song) + 1.4;
const out = new Float32Array(LEN), cache = new Map<string, Float32Array>();
const sound = (name: string) => cache.get(name) ?? (cache.set(name, read(`media/sfx/${name}.wav`)), cache.get(name)!);
/** a sound from `at` for `len` seconds (looped), `under` dB below the song, faded in over `fade` and out over 0.4 s */
function lay(name: string, at: number, len: number, under: number, fade = 0.4) {
  const src = sound(name), gain = 10 ** ((songDb - under - db(src)) / 20), n = Math.round(len * SR), o = Math.round(at * SR), fi = Math.round(fade * SR), fo = Math.round(Math.min(0.4, len / 2) * SR);
  for (let i = 0; i < n && o + i < LEN; i++) out[o + i] += src[i % src.length] * gain * Math.min(1, i / Math.max(1, fi), (n - i) / Math.max(1, fo));
}
/** a click: the first 0.25 s of click-1 */
function click(at: number, under = 20) {
  const src = sound("click-1").subarray(0, Math.round(0.25 * SR)), gain = 10 ** ((songDb - under - db(src)) / 20), o = Math.round(at * SR);
  for (let i = 0; i < src.length && o + i < LEN; i++) out[o + i] += src[i] * gain * Math.min(1, (src.length - i) / (0.03 * SR));
}
const at = (id: string) => shot(id).from, len = (id: string) => shot(id).seconds;

// the office: silent as a drawing; the cursor's rests tick; on the drop a click, and the lit room hums as it spreads
for (const t of [4.6, 7.1, 9.3]) click(t, 26);
click(12.189);
lay("tubeon-1", 12.189, 2.5, 20, 0.05);
lay("hum-1", 12.3, 20.4 - 12.3, 22, 2.2);
click(15.006, 21); click(17.4, 22); click(18.361, 21);
lay("powerdown-1", 18.86, 2, 18, 0.05);
lay("office-1", 19.2, at("office-back") - 19.2, 22, 1.5);
lay("whoosh-1", at("office-back") - 0.2, 2, 19, 0.1);
lay("office-1", at("office-back") + 0.6, 33.0 - at("office-back") - 0.6, 22, 2.2);       // the finished room as it arrives
click(at("office-back") + 3.1, 21); click(at("office-back") + 4.7, 22); click(33.0);
// the canyon: silent lines, a rest on the tumbleweed, the click on the drop, then the slot's wind
click(at("canyon") + 1.6, 26); click(38.618);
lay("riser-1", 38.618 - 2.0, 2.0, 18, 0.8);
lay("canyon-1", 38.7, at("laundromat") - 38.7, 20, 1.6);
click(38.618 + 1.3, 21); click(38.618 + 2.5, 22);
// the laundromat: the cart taken and put down; from there the room
click(at("laundromat") + 0.55, 21); click(at("laundromat") + 2.0, 22);
lay("hum-1", at("laundromat") + 2.05, len("laundromat") - 2.05, 22, 1.2);
// the bedroom: the room follows the line across the frame; the window: rain from when the blinds are up
click(at("bedroom") + 0.5, 21);
lay("forest-1", at("bedroom") + 0.6, len("bedroom") - 0.6, 24, 1.8);
click(at("window") + 0.9, 21);
lay("rain-1", at("window") + 1.3, len("window") - 1.3, 18, 1.0);
// the road: rain on the car's roof behind the wiper's wipe, then outside, the car through water
click(at("seat") + 0.5);
lay("rainroad-1", at("seat") + 0.5, len("seat") + len("road") - 0.5, 16, 1.4);
lay("carby-1", at("road") + 0.4, 2.7, 15, 0.3);
lay("splash-1", at("road") + 1.3, 1.8, 16, 0.05);
// the garage: the cone, then the click on the car, and the deck's air with its lamps
click(at("garage") + 0.6, 21); click(at("garage") + 1.9, 22); click(at("garage") + 3.0);
lay("garage-1", at("garage") + 3.0, len("garage") - 3.0, 20, 1.0);
// the montage is the song alone; then the sea
lay("sea-1", at("sea"), len("sea") + 1.6, 18, 1.2);

// where the song itself drops away, a shot's effects are brought down to 14 dB under it
for (const sh of SHOTS) {
  const i0 = Math.round((sh.f0 / FPS) * SR), i1 = Math.round((sh.f1 / FPS) * SR), gap = db(song, i0, i1, SONG_GAIN) - db(out, i0, i1);
  if (db(song, i0, i1) < -50 || gap >= 14) continue;
  const g = 10 ** (-(14 - gap) / 20), r = Math.round(0.06 * SR);
  for (let i = i0; i < i1; i++) out[i] *= 1 + (g - 1) * Math.min(1, (i - i0) / r, (i1 - i) / r);
}
const write = (name: string, a: Float32Array) => {
  const p = Bun.spawnSync(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", String(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", `${DIR}/out/v3/${name}`], { stdin: new Uint8Array(a.buffer) });
  if (p.exitCode !== 0) throw new Error(p.stderr.toString());
};
Bun.spawnSync(["mkdir", "-p", `${DIR}/out/v3/stems`]);
const songOut = new Float32Array(LEN);
for (let i = 0; i < LEN; i++) songOut[i] = (song[i] ?? 0) * SONG_GAIN;
write("stems/effects.wav", out); write("stems/song.wav", songOut);
console.log(`effects ${(songDb - db(out)).toFixed(1)} dB under the song over the whole film`);
