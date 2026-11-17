// The film's clock: the cursor's clicks as sound. the director, 11-11 (assembly 18): "id think about the clikcing like a
// clock ticking so there should be a natural cadence. and it stats just clicking on tick and then ramps to tick and
// tock. it becomes part fo the music with reverbs and oscillation at times".
// Every sound here is one of the cursor's events in v3/times.ts (a click, a thing taken hold of, a thing let go), at the
// second the picture shows it, all of them on the song's grid.
//   the walk, to the study's drop (12.19 s): a tick for each click, nearly dry, and nothing else
//   from the drop: taking hold is a tick and letting go is a tock (lower, rounder); a little room on both
//   from the canyon: each tick and tock is answered once or twice on the grid's next points, from one side then the
//     other (the oscillation), in a longer room
//   the montage: every cut is a click, tick and tock by turns, the room opening up as it goes, and the last one rings out
//   a thing held (a drag) is a faint band of air while it is held
// Synthesized, so it is exact and quiet: a tick is three short damped partials and a 3 ms breath of noise.
//   bun tools/ticks.ts  ->  out/v3/stems/ticks.wav (48 kHz stereo)
import { mkdirSync, writeFileSync } from "fs";
import { GRID, LENGTH } from "../v3/plan";
import { ALL } from "../v3/times";

const SR = 48000, N = Math.ceil((LENGTH + 0.5) * SR);
const dry = [new Float32Array(N), new Float32Array(N)], room = [new Float32Array(N), new Float32Array(N)], hall = [new Float32Array(N), new Float32Array(N)];
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
type Voice = { partials: [number, number, number][]; noise: number };
const TICK: Voice = { partials: [[2140, 0.011, 1], [3320, 0.008, 0.55], [5150, 0.005, 0.3]], noise: 0.5 };
const TOCK: Voice = { partials: [[1270, 0.017, 1], [1930, 0.012, 0.5], [2880, 0.007, 0.22]], noise: 0.32 };
/** one strike into the buses: at `at` s, `gain` (linear), `pan` -1..1, sends to the room and the hall, `soft` 0..1 rounds it off (an answer) */
function strike(v: Voice, at: number, gain: number, pan: number, toRoom: number, toHall: number, soft = 0) {
  const i0 = Math.round(at * SR), len = Math.round(0.09 * SR), l = Math.cos(((pan + 1) * Math.PI) / 4), r = Math.sin(((pan + 1) * Math.PI) / 4);
  let lp = 0;
  for (let i = 0; i < len && i0 + i < N; i++) {
    const t = i / SR, attack = Math.min(1, t / (0.0004 + 0.003 * soft));
    let x = 0;
    for (const [f, tau, a] of v.partials) x += a * Math.sin(2 * Math.PI * f * (1 - 0.25 * soft) * t) * Math.exp(-t / (tau * (1 + soft)));
    x += v.noise * (1 - soft) * rnd() * Math.exp(-t / 0.0022);
    x *= attack * gain * 0.5;
    lp += (x - lp) * (1 - 0.72 * soft); x = lp;
    dry[0][i0 + i] += x * l; dry[1][i0 + i] += x * r;
    room[0][i0 + i] += x * l * toRoom; room[1][i0 + i] += x * r * toRoom;
    hall[0][i0 + i] += x * l * toHall; hall[1][i0 + i] += x * r * toHall;
  }
}
/** a thing held: a faint band of air from `a` to `b` */
function held(a: number, b: number, gain: number) {
  const i0 = Math.round(a * SR), i1 = Math.min(N, Math.round(b * SR));
  let y1 = 0, y2 = 0;
  for (let i = i0; i < i1; i++) {
    const k = (i - i0) / Math.max(1, i1 - i0), env = Math.sin(Math.PI * k) ** 0.7, f = 700 + 500 * k;
    const w = (2 * Math.PI * f) / SR, q = 0.06, x = rnd();
    y1 += w * (x - y1 - q * 16 * y2) * 0.5; y2 += w * y1;                      // a soft resonant band
    const s = y2 * env * gain * 0.02;
    dry[0][i] += s; dry[1][i] += s; room[0][i] += s * 0.4; room[1][i] += s * 0.4;
  }
}
// (11-11, "the clicking noise is really off beat": the grid is one steady tick now, v3/plan.ts; an answer falls on the
// clock's next tick and the one after, and a montage cut that isn't on a tick makes no sound)
const next = (t: number, steps: number) => { const i = GRID.findIndex((g) => g > t + 0.05); return GRID[Math.min(GRID.length - 1, i + steps - 1)]; };
const onTick = (t: number) => GRID.some((g) => Math.abs(g - t) < 0.035);

const DROP = 12.189, CANYON = 33.773, MONT = 68.486, SEA = 73.5;
let n = 0;
for (const e of ALL) {
  const at = e.at, mont = at >= MONT - 0.05 && at < SEA + 1;
  if (at < DROP - 0.05) {
    // just the tick
    // (the song has barely begun under the hallway: its one tick is as quiet as the song is there)
    if (e.kind !== "up") strike(TICK, at, at < 2.75 ? 0.3 : 0.65, 0, 0.1, 0);
  } else if (!mont) {
    const late = at >= CANYON, v = e.kind === "up" ? TOCK : TICK, pan = e.kind === "up" ? 0.18 : -0.18;
    // (a door's knob let go, a third of a second after its click, is not a tock of its own)
    const doorUp = e.kind === "up" && ALL.some((o) => o.kind === "down" && Math.abs(at - o.at - 0.32) < 0.005);
    if (doorUp) continue;
    strike(v, at, 0.85, pan, late ? 0.22 : 0.14, late ? 0.16 : 0.03);
    if (late && e.kind !== "up") { strike(v, next(at, 1), 0.26, -pan * 3.5, 0.3, 0.3, 0.5); strike(v, next(at, 2), 0.16, pan * 3.5, 0.3, 0.35, 0.7); }
  } else {
    // the montage: tick and tock by turns, the room opening as it goes
    if (!onTick(at)) continue;
    const k = (at - MONT) / (SEA - MONT), v = n % 2 ? TOCK : TICK, pan = (n % 2 ? 1 : -1) * (0.15 + 0.45 * k);
    strike(v, at, 0.75 + 0.2 * k, pan, 0.2 + 0.2 * k, 0.1 + 0.55 * k);
    n++;
  }
}
// the things held: a faint air under each drag
for (let i = 0; i < ALL.length; i++) if (ALL[i].kind === "down") { const up = ALL.slice(i + 1).find((o) => o.kind === "up" && o.id === ALL[i].id); if (up && up.at - ALL[i].at > 0.5) held(ALL[i].at, up.at, ALL[i].at > DROP ? 1 : 0.6); }
// the boat's three beats and the card: the clock runs on alone, far off, and its last tick rings out
for (const [t, g] of [[SEA, 0.5], [next(SEA, 1), 0.4], [next(SEA, 2), 0.32], [75.361, 0.55], [77.842, 0.4], [80.32, 0.4], [82.808, 0.7]] as const) strike(t < 75 ? TOCK : TICK, t, g, 0, 0.2, t > 82 ? 1.1 : 0.6, t < 75 ? 0.5 : 0.2);

/** a small reverb: four combs and two allpasses a side, the sides a little apart */
function reverb(inp: Float32Array[], combs: number[], fb: number, damp: number, spread: number): Float32Array[] {
  return inp.map((x, ch) => {
    const out = new Float32Array(N);
    for (const c0 of combs) {
      const d = Math.round((c0 + ch * spread) * SR), buf = new Float32Array(d); let p = 0, lp = 0;
      for (let i = 0; i < N; i++) { const y = buf[p]; lp = y * (1 - damp) + lp * damp; buf[p] = x[i] + lp * fb; out[i] += y; if (++p >= d) p = 0; }
    }
    for (const a0 of [0.0051, 0.0017]) {
      const d = Math.round((a0 + ch * 0.0003) * SR), buf = new Float32Array(d); let p = 0;
      for (let i = 0; i < N; i++) { const b = buf[p], y = -out[i] * 0.5 + b; buf[p] = out[i] + b * 0.5; out[i] = y; if (++p >= d) p = 0; }
    }
    return out;
  });
}
const wetRoom = reverb(room, [0.0297, 0.0371, 0.0411, 0.0437], 0.74, 0.35, 0.0011);
const wetHall = reverb(hall, [0.0531, 0.0613, 0.0707, 0.0797], 0.9, 0.3, 0.0019);
// the hall breathes: a slow swell on its tail (the oscillation), a little faster through the montage
const out = [0, 1].map((ch) => { const o = new Float32Array(N); for (let i = 0; i < N; i++) { const t = i / SR, rate = t > MONT ? 3.2 : 1.1, sw = 0.75 + 0.25 * Math.sin(2 * Math.PI * rate * t + ch * 1.6); o[i] = dry[ch][i] + 0.22 * wetRoom[ch][i] + 0.2 * sw * wetHall[ch][i]; } return o; });
let peak = 0; for (const o of out) for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(o[i]));
const frames = Math.round(LENGTH * SR), pcm = Buffer.alloc(44 + frames * 4);
pcm.write("RIFF", 0); pcm.writeUInt32LE(36 + frames * 4, 4); pcm.write("WAVEfmt ", 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write("data", 36); pcm.writeUInt32LE(frames * 4, 40);
for (let i = 0; i < frames; i++) for (let ch = 0; ch < 2; ch++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[ch][i])) * 32767), 44 + i * 4 + ch * 2);
mkdirSync(`${import.meta.dir}/../out/v3/stems`, { recursive: true });
writeFileSync(`${import.meta.dir}/../out/v3/stems/ticks.wav`, pcm);
console.log(`out/v3/stems/ticks.wav: ${ALL.length} events, peak ${(20 * Math.log10(peak)).toFixed(1)} dBFS`);
